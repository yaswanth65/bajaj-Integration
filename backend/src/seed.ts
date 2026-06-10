import { RoleId, Priority, TaskStatus, ComplaintStatus, ApprovalStatus, ApplianceStatus, VisitStatus, AttStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import prisma from "./lib/prisma";

// Helper to clean location names for matching
function cleanLocationName(loc: string): string {
  if (!loc) return "";
  return loc.toString().trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/ - additional$/, "")
    .replace(/ additional$/, "")
    .replace(/ additional 4th floor$/, "")
    .replace(/ addtiional ground floor$/, "")
    .replace(/ csb$/, "")
    .replace(/ rtc$/, "")
    .replace(/ af$/, "")
    .replace(/ gh \d$/, "")
    .replace(/ co ext$/, "")
    .replace(/ premises$/, "")
    .trim();
}

// Custom fuzzy matching between Excel location names and DB branches
function findBestBranch(excelLoc: string, dbBranches: { id: string; name: string }[]): string | null {
  const rawExcel = excelLoc.trim().toLowerCase();
  
  // Explicit spelling fixes for known discrepancies
  const locationFixes: Record<string, string> = {
    "padderu": "paderu",
    "govindpur": "gobindpur",
    "amravati": "amaravati",
    "ganavaravam": "gannavaram",
    "s.kota": "s kota",
    "s-kota": "s kota"
  };
  
  let targetExcel = locationFixes[rawExcel] || rawExcel;

  // 1. First, check for exact match against raw branch names (case-insensitive)
  for (const b of dbBranches) {
    const rawBranchName = b.name.trim().toLowerCase();
    if (rawBranchName === targetExcel) return b.id;
  }

  // 2. Exact match using a simple clean (just lowercase and whitespace normalization, no suffix stripping)
  const simpleClean = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  for (const b of dbBranches) {
    if (simpleClean(b.name) === simpleClean(targetExcel)) return b.id;
  }

  // 3. Clean names using original cleanLocationName (suffix stripping)
  let cleanExcel = cleanLocationName(targetExcel);
  // Check exact cleaned match
  for (const b of dbBranches) {
    if (cleanLocationName(b.name) === cleanExcel) return b.id;
  }
  
  // 4. Substring / Prefix match
  for (const b of dbBranches) {
    const cleanDb = cleanLocationName(b.name);
    if (cleanDb.startsWith(cleanExcel) || cleanExcel.startsWith(cleanDb)) {
      return b.id;
    }
  }

  // 5. Close prefix match (first 5 characters)
  for (const b of dbBranches) {
    const cleanDb = cleanLocationName(b.name);
    if (cleanDb.slice(0, 5) === cleanExcel.slice(0, 5)) {
      return b.id;
    }
  }
  
  return null;
}

// Convert Excel dates to JS Date
function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    // Excel numeric date
    return new Date((val - 25569) * 86400 * 1000);
  }
  const str = String(val).trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

async function main() {
  console.log("Starting database seeding...");
  
  // 1. Clear database
  console.log("Clearing existing data...");
  await prisma.weeklyTaskPlanItem.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.task.deleteMany();
  await prisma.appliance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 2. Hash default password
  const passwordHash = await bcrypt.hash("123456789", 10);

  // 3. Load JSON files via relative paths
  const mobileAppDir = path.join(process.cwd(), "..", "mobile-app");
  const hierarchyPath = path.join(mobileAppDir, "hierarchy_output.json");
  const branchLcTeamPath = path.join(mobileAppDir, "branch_lc_team.json");

  if (!fs.existsSync(hierarchyPath) || !fs.existsSync(branchLcTeamPath)) {
    throw new Error(`JSON files not found in ${mobileAppDir}`);
  }

  const hierarchyData = JSON.parse(fs.readFileSync(hierarchyPath, "utf-8"));
  const branchLcTeamData = JSON.parse(fs.readFileSync(branchLcTeamPath, "utf-8"));

  // 4. Seed Regional Manager (RM)
  console.log("Seeding Regional Manager...");
  const rmData = hierarchyData[0]; // Ravi Nemalikanti
  const rmEmail = rmData.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com";
  
  const regionalManager = await prisma.user.create({
    data: {
      name: rmData.name,
      email: rmEmail,
      password: passwordHash,
      role: RoleId.rm,
      position: "Regional Manager",
      phone: "+91 9999999999",
      shift: "09:00 - 18:00",
      status: "Present",
      skills: ["Regional SOP", "Leadership contract"],
      deviceId: "GEO-RM-5101",
    }
  });

  // Keep track of created users & branches
  const bamsMap = new Map<string, string>(); // name -> userId
  const branchesMap = new Map<string, string>(); // name -> branchId
  const branchesListForMatching: { id: string; name: string }[] = [];

  // 5. Seed Branches & Managers (BAM, AA)
  console.log("Seeding Branches and Managers...");
  let branchCount = 0;

  for (const bamData of rmData.branch_admin_managers) {
    const bamEmail = bamData.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com";
    
    // Create BAM
    const bamUser = await prisma.user.create({
      data: {
        name: bamData.name,
        email: bamEmail,
        password: passwordHash,
        role: RoleId.branchManager,
        position: "Branch Admin Manager (BAM)",
        phone: "+91 8888888888",
        shift: "09:00 - 18:00",
        status: "Present",
        managerId: regionalManager.id,
        skills: ["Asset Management", "SLA Monitoring"],
      }
    });
    bamsMap.set(bamData.name, bamUser.id);

    // Create Admin Assistants (AA) for this BAM
    const aaIds: string[] = [];
    for (const aaData of bamData.admin_assistants) {
      const aaEmail = aaData.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com";
      const aaUser = await prisma.user.create({
        data: {
          name: aaData.name,
          email: aaEmail,
          password: passwordHash,
          role: RoleId.branchManager,
          position: "Admin Assistant (AA)",
          phone: "+91 7777777777",
          shift: "09:00 - 18:00",
          status: "Present",
          managerId: bamUser.id,
          skills: ["Operations", "Verification Support"],
        }
      });
      aaIds.push(aaUser.id);
    }

    // Create Branches under this BAM
    const createdBranchIds: string[] = [];
    for (const branchName of bamData.branches) {
      branchCount++;
      const branchCode = `BR${branchCount.toString().padStart(3, "0")}`;

      // Fix spelling typos in branch names & trim trailing spaces
      const normalizedBranchName = branchName
        .replace(/addtiional/i, "Additional")
        .replace(/\s+/g, " ")
        .trim();

      const branch = await prisma.branch.create({
        data: {
          code: branchCode,
          name: normalizedBranchName,
          city: "Pending", 
          address: `${normalizedBranchName} branch premises`,
          phone: "+91 6666666666",
          email: `${normalizedBranchName.toLowerCase().replace(/[^a-z0-9]/g, "")}@bajaj.com`,
          geoRadius: 180.0,
          shiftWindow: "07:00 - 15:00",
          health: 100.0,
          performance: 100.0,
          todayAttendance: 100.0,
          monthlyBudget: 50000.0,
          usedBudget: 0.0,
          openIssues: 0,
          criticalAlerts: 0,
          applianceRisk: 0,
          auditScore: 90.0,
          lastVisit: "Not visited",
          nextVisit: "Pending",
          revenueIndex: 1.0,
          customerFootfall: 50 + Math.floor(Math.random() * 200),
          sla: 100.0,
        }
      });

      // Keep mapping from raw branchName (for JSON/Excel lookups) to DB branch ID
      branchesMap.set(branchName, branch.id);
      branchesListForMatching.push({ id: branch.id, name: normalizedBranchName });
      createdBranchIds.push(branch.id);
    }

    // Update BAM & AAs with branchScope
    await prisma.user.update({
      where: { id: bamUser.id },
      data: { branchScope: createdBranchIds }
    });

    for (const aaId of aaIds) {
      await prisma.user.update({
        where: { id: aaId },
        data: { branchScope: createdBranchIds }
      });
    }
  }

  // 6. Seed LCs & Match branches from branch_lc_team.json
  console.log("Seeding Local Coordinators (LCs) from branch_lc_team.json...");
  for (const item of branchLcTeamData) {
    const bamName = item.branch_admin_manager;
    const bamUserId = bamsMap.get(bamName);

    for (const [branchName, branchDetails] of Object.entries(item.branches)) {
      const dbBranchId = branchesMap.get(branchName);
      if (!dbBranchId) {
        console.log(`Warning: Branch ${branchName} in branch_lc_team.json not found in seeded branches.`);
        continue;
      }

      let lcName = (branchDetails as any).lc;
      let lcRole = RoleId.lc;
      let lcPosition = "Local Coordinator (LC)";

      // If no dedicated LC name, promote the first Admin Assistant/team member to act as the LC (unstaffed branches)
      if (!lcName) {
        const team = (branchDetails as any).team || [];
        const fallbackMember = team.find((t: any) => 
          t.role.includes("Admin Assistant") || 
          t.role.includes("Admin Manager") || 
          t.role.includes("Admin")
        ) || team[0];

        if (fallbackMember) {
          lcName = fallbackMember.name;
          lcRole = RoleId.lc; // Promote
          lcPosition = `${fallbackMember.role} (Acting LC)`;
          console.log(`Promoting ${lcName} (${fallbackMember.role}) to acting LC for branch "${branchName}"`);
        }
      }

      if (lcName) {
        // Name normalization: trim trailing digits, spaces, dots, and proper title case
        let normalizedName = lcName.trim().replace(/\d+$/, "");
        normalizedName = normalizedName.replace(/\s+/g, " ");
        normalizedName = normalizedName.replace(/\./g, " ");
        normalizedName = normalizedName.trim();
        normalizedName = normalizedName.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

        const lcEmail = normalizedName.toLowerCase().replace(/\s+/g, "") + "@gmail.com";

        // Find or create LC. If already created in Step 5 (e.g. as AA), update their branch scope and role instead of duplication.
        let lcUser = await prisma.user.findUnique({ where: { email: lcEmail } });
        if (!lcUser) {
          lcUser = await prisma.user.create({
            data: {
              name: normalizedName,
              email: lcEmail,
              password: passwordHash,
              role: lcRole,
              position: lcPosition,
              phone: "+91 5555555555",
              shift: "07:00 - 15:00",
              status: "Present",
              managerId: bamUserId || null,
              branchId: dbBranchId,
              skills: ["Branch Checklist", "Daily Inspections"],
              deviceId: `DEV-LC-${Math.floor(Math.random() * 9000 + 1000)}`,
            }
          });
        } else {
          // If already exists, associate branchId, but retain BAM role if it's the actual BAM user Nikhil Joshi
          const updatedRole = (lcUser.role === RoleId.branchManager && lcUser.position.includes("Branch Admin Manager")) ? RoleId.branchManager : lcRole;
          const updatedPosition = (lcUser.role === RoleId.branchManager && lcUser.position.includes("Branch Admin Manager")) ? lcUser.position : lcPosition;
          
          await prisma.user.update({
            where: { id: lcUser.id },
            data: { 
              branchId: dbBranchId,
              role: updatedRole,
              position: updatedPosition
            }
          });
        }
      }
    }
  }

  // 7. Parse Excel sheets & seed Appliances
  console.log("Seeding Appliances from Excel files...");
  const excelFiles = [
    { name: "AC and UPS FY 26-27 - Facilites Apps.xlsx", sheet: "UPS AMC Details", category: "UPS" },
    { name: "HVAC  AMC Data FY 26-27 Facilities Team.xlsx", sheet: "Sheet1", category: "AC" },
    { name: "INVERTER FY 26-27 facility Team.xlsx", sheet: "SW3", category: "Inverter" },
    { name: "INVERTER FY 26-27 facility Team.xlsx", sheet: "Sheet1", category: "UPS" } 
  ];

  let applianceCount = 0;
  const updatedBranchAddresses = new Set<string>();

  for (const config of excelFiles) {
    const filePath = path.join(mobileAppDir, config.name);
    if (!fs.existsSync(filePath)) {
      console.log(`Warning: Excel file not found: ${filePath}`);
      continue;
    }

    console.log(`Processing file: ${config.name}, sheet: ${config.sheet}...`);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[config.sheet];
    if (!worksheet) {
      console.log(`Warning: Sheet ${config.sheet} not found in ${config.name}`);
      continue;
    }

    // Convert to row arrays
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (rows.length < 2) continue;

    // Find header index
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const row = rows[r];
      if (row.some(val => String(val).toLowerCase().includes("location") || String(val).toLowerCase().includes("make (oem)"))) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      console.log(`Could not find header row for sheet ${config.sheet}. Skipping.`);
      continue;
    }

    const headers = rows[headerRowIdx].map(h => String(h || "").trim());
    console.log(`Found headers at row ${headerRowIdx}: ${headers.slice(0, 10).join(", ")}...`);

    // Helper to find column index by name matches
    const getColIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
    };

    const idxLocation = getColIndex(["location"]);
    const idxMake = getColIndex(["make (oem)", "make", "brand"]);
    const idxModel = getColIndex(["model number", "model"]);
    const idxSerial = getColIndex(["serial number", "serial", "asset code", "code"]); // Fallback to asset code
    const idxDesc = getColIndex(["asset description", "asset description as per far", "asset description (as per far)", "equipment"]);
    const idxAmcVendor = getColIndex(["amc vendor", "amc  vendor 26-27", "service provideder", "amc type"]);
    const idxAddress = getColIndex(["address"]);
    const idxState = getColIndex(["state"]);
    const idxInstallDate = getColIndex(["installation date", "installation date", "install date"]);
    const idxWarrantyEnd = getColIndex(["warranty end date", "warranty expiry", "warranty"]);

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rawLocation = idxLocation !== -1 ? String(row[idxLocation] || "").trim() : "";
      if (!rawLocation) continue;

      // Find the matched branch
      const matchedBranchId = findBestBranch(rawLocation, branchesListForMatching);
      if (!matchedBranchId) {
        continue;
      }

      applianceCount++;

      const brand = idxMake !== -1 && row[idxMake] ? String(row[idxMake]).trim() : "Generic";
      let model = idxModel !== -1 && row[idxModel] ? String(row[idxModel]).trim() : "MOD-MOCK";
      const serial = idxSerial !== -1 && row[idxSerial] ? String(row[idxSerial]).trim() : `SN-MOCK-${applianceCount}`;
      const desc = idxDesc !== -1 && row[idxDesc] ? String(row[idxDesc]).trim() : `${config.category} Asset`;
      const vendor = idxAmcVendor !== -1 && row[idxAmcVendor] ? String(row[idxAmcVendor]).trim() : "Local AMC Vendor";
      
      // Extract model from description if missing
      if (model === "MOD-MOCK" && desc !== `${config.category} Asset`) {
        const match = desc.match(/(\d+(\.\d+)?\s*(TR|KVA|KV|HP|Ton|W|kW))/i);
        if (match) {
          model = match[1];
        }
      }

      // Dynamic Category Detection based on description keywords
      let category = config.category;
      const lowerDesc = desc.toLowerCase();
      if (lowerDesc.includes("inverter")) {
        category = "Inverter";
      } else if (lowerDesc.includes("ups")) {
        category = "UPS";
      } else if (lowerDesc.includes("ac") || lowerDesc.includes("hvac") || lowerDesc.includes("air cond") || lowerDesc.includes("split")) {
        category = "AC";
      }

      const installDate = idxInstallDate !== -1 ? parseExcelDate(row[idxInstallDate]) : null;
      const warrantyEnd = idxWarrantyEnd !== -1 ? parseExcelDate(row[idxWarrantyEnd]) : null;

      const address = idxAddress !== -1 && row[idxAddress] ? String(row[idxAddress]).trim() : null;
      const stateVal = idxState !== -1 && row[idxState] ? String(row[idxState]).trim() : null;

      // Update Branch address once per branch
      if ((address || stateVal) && !updatedBranchAddresses.has(matchedBranchId)) {
        await prisma.branch.update({
          where: { id: matchedBranchId },
          data: {
            address: address || undefined,
            city: stateVal || undefined,
          }
        }).catch((err) => console.error(`Failed to update branch address for ${matchedBranchId}:`, err));
        updatedBranchAddresses.add(matchedBranchId);
      }

      // Create Appliance in DB
      try {
        await prisma.appliance.upsert({
          where: { serial: serial },
          update: {
            healthScore: 80 + Math.floor(Math.random() * 20),
            status: ApplianceStatus.Operational
          },
          create: {
            branchId: matchedBranchId,
            name: desc,
            category: category,
            zone: "Branch premises",
            brand: brand,
            model: model,
            serial: serial,
            healthScore: 80 + Math.floor(Math.random() * 20),
            status: ApplianceStatus.Operational,
            purchaseDate: installDate,
            nextService: warrantyEnd,
            amcVendor: vendor,
            approvalStatus: "Approved",
          }
        });
      } catch (err: any) {
        console.log(`Skipping duplicate or error for appliance serial ${serial}: ${err.message}`);
      }
    }
  }

  // 8. Generate some mock metadata for testing
  console.log("Generating dummy complaints and approvals for testing...");
  const firstBranch = branchesListForMatching[0];
  const firstLC = await prisma.user.findFirst({ where: { role: RoleId.lc, branchId: firstBranch.id } });
  
  if (firstBranch && firstLC) {
    // Seed 1 Complaint
    await prisma.complaint.create({
      data: {
        title: "UPS battery backup dropping",
        branchId: firstBranch.id,
        type: "Electrical",
        priority: Priority.High,
        status: ComplaintStatus.Pending,
        reportedById: firstLC.id,
        assignedVendor: "Not assigned",
        estimatedCost: 15000,
        impact: "Battery backup is low",
        description: "Branch UPS backups are dropping fast when mains power is cut. Needs battery health check.",
        escalationStage: "LC",
        timeline: ["10:00 - LC submitted"]
      }
    });

    // Seed 1 Approval
    await prisma.approval.create({
      data: {
        title: "Emergency UPS Fan replacement cost",
        kind: "Expense",
        branchId: firstBranch.id,
        amount: 3200,
        requestedById: firstLC.id,
        status: ApprovalStatus.Pending,
        stage: "Branch Manager",
        priority: Priority.Medium,
        age: "1 hr ago",
        note: "Replace exhaust fan inside server room UPS cabinet to prevent overheating."
      }
    });
  }

  // 9. Generate weekly verification tasks for seeded appliances
  console.log("Generating weekly verification tasks for appliances...");
  const appliances = await prisma.appliance.findMany({
    include: {
      branch: {
        include: {
          users: {
            where: { role: RoleId.lc }
          }
        }
      }
    }
  });

  const nextSunday = new Date();
  const daysUntilSunday = (7 - nextSunday.getDay()) % 7;
  nextSunday.setDate(nextSunday.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  nextSunday.setHours(23, 59, 59, 999);

  const rmUser = await prisma.user.findFirst({ where: { role: RoleId.rm } });
  const fallbackCreatorId = rmUser ? rmUser.id : "";

  const tasksToCreate = [];
  for (const app of appliances) {
    const lc = app.branch.users[0];
    const lcId = lc ? lc.id : null;
    
    // Skip if there is no LC and no creator fallback
    if (!lcId && !fallbackCreatorId) continue;

    tasksToCreate.push({
      title: `Verify ${app.name} - ${app.category} (${app.brand})`,
      branchId: app.branchId,
      audience: RoleId.lc,
      schedule: "Weekly",
      priority: Priority.High,
      zone: app.zone || "Branch premises",
      deadline: nextSunday,
      assignedToId: lcId,
      assignedById: lcId || fallbackCreatorId,
      status: TaskStatus.Pending,
      checklistTotal: 1,
      proofRequired: true,
      proofLabel: "Working fine photo proof",
      notes: `Weekly appliance check. Upload photo showing it is working fine. Serial: ${app.serial}`,
      applianceId: app.id
    });
  }

  if (tasksToCreate.length > 0) {
    await prisma.task.createMany({
      data: tasksToCreate
    });
    console.log(`Generated ${tasksToCreate.length} weekly appliance verification tasks.`);
  }

  // 10. Seed 3 months of historical attendance logs for LCs
  console.log("Seeding 3 months of historical attendance logs for LCs...");
  const lcs = await prisma.user.findMany({
    where: { role: RoleId.lc }
  });

  const attendanceToCreate: any[] = [];
  const weeklyTaskItemsToCreate: any[] = [];
  const generatedTasksList: any[] = [];

  const todayDate = new Date();
  
  const getLocalDateString = (d: Date): string => {
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
    const formatter = new Intl.DateTimeFormat("en-CA", options);
    return formatter.format(d);
  };
  
  for (const lc of lcs) {
    // Generate logs for the last 90 days, excluding today (June 9th) to allow LC punch-in
    for (let dayOffset = 90; dayOffset >= 1; dayOffset--) {
      const logDate = new Date(todayDate.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      // Skip Sundays (standard rest day)
      if (logDate.getDay() === 0) continue;

      const dateStr = getLocalDateString(logDate);
      const isMonday = logDate.getDay() === 1;

      // Determine status with probability distributions
      const rand = Math.random();
      let status: AttStatus = AttStatus.Present;
      let checkIn = "07:12";
      
      if (rand < 0.05) {
        status = AttStatus.Absent;
        checkIn = "Not marked";
      } else if (rand < 0.15) {
        status = AttStatus.Late;
        const hour = 7;
        const minute = 35 + Math.floor(Math.random() * 25); // late check in between 07:35 and 07:59 (fixed)
        checkIn = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      } else {
        // present (early check-in)
        const hour = 7;
        const minute = Math.floor(Math.random() * 15); // present check-in between 07:00 and 07:15
        checkIn = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      }

      const attendanceId = `att-log-${lc.id}-${dateStr}`;

      attendanceToCreate.push({
        id: attendanceId,
        userId: lc.id,
        date: dateStr,
        status: status,
        checkIn: checkIn,
        checkOut: status === AttStatus.Present || status === AttStatus.Late ? "15:15" : null,
        location: status === AttStatus.Absent ? "Not marked" : "Inside geo fence",
        proof: status === AttStatus.Absent ? "No verification" : "Geo + selfie verified",
        deviation: "No",
        latitude: null,
        longitude: null,
      });

      // Seed weekly plans on Mondays
      if (isMonday && status !== AttStatus.Absent) {
        const plans = [
          { desc: `Weekly cleaning & filters check at ${lc.name.split(" ")[0]} branch`, est: 3.5 },
          { desc: "Verify active UPS backups and complete security inspection logs", est: 4.5 },
          { desc: "Audit generator diesel levels and test emergency triggers", est: 2.0 }
        ];

        plans.forEach((plan, pIdx) => {
          const planItemId = `plan-item-${lc.id}-${dateStr}-${pIdx}`;
          weeklyTaskItemsToCreate.push({
            id: planItemId,
            attendanceId: attendanceId,
            description: plan.desc,
            estimatedHours: plan.est
          });

          // Daily tasks for LC users are de-seeded/removed per user request.
          // We no longer push pending daily tasks to the task board here.
        });
      }
    }
  }

  if (attendanceToCreate.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < attendanceToCreate.length; i += chunkSize) {
      const chunk = attendanceToCreate.slice(i, i + chunkSize);
      await prisma.attendanceLog.createMany({
        data: chunk,
        skipDuplicates: true
      });
    }
    console.log(`Seeded ${attendanceToCreate.length} attendance logs for LCs.`);
  }

  if (weeklyTaskItemsToCreate.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < weeklyTaskItemsToCreate.length; i += chunkSize) {
      const chunk = weeklyTaskItemsToCreate.slice(i, i + chunkSize);
      await prisma.weeklyTaskPlanItem.createMany({
        data: chunk,
        skipDuplicates: true
      });
    }
    console.log(`Seeded ${weeklyTaskItemsToCreate.length} weekly task planner items.`);
  }

  // Seeding historical weekly tasks individually in parallel chunks of 50 to preserve custom createdAt timestamps
  if (generatedTasksList.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < generatedTasksList.length; i += chunkSize) {
      const chunk = generatedTasksList.slice(i, i + chunkSize);
      await Promise.all(chunk.map(task => prisma.task.create({ data: task })));
    }
    console.log(`Auto-generated ${generatedTasksList.length} checklist tasks matching LC weekly planners.`);
  }

  console.log(`Database seeding completed! Created ${branchCount} branches, ${applianceCount} appliances.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
