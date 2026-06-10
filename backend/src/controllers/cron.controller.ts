import { Request, Response } from "express";
import { TaskStatus, RoleId, Priority, ApplianceStatus } from "@prisma/client";
import prisma from "../lib/prisma";

const getTodayInIST = (): Date => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
};

const getWeekStartIST = (): Date => {
  const ist = getTodayInIST();
  const day = ist.getUTCDay();
  const diff = ist.getUTCDate() - day;
  const start = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), diff, 0, 0, 0, 0));
  return new Date(start.getTime() - 5.5 * 60 * 60 * 1000);
};

const getNextSundayIST = (): Date => {
  const ist = getTodayInIST();
  const daysUntilSunday = 7 - ist.getUTCDay();
  const nextSun = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday), 23, 59, 59, 999));
  return new Date(nextSun.getTime() - 5.5 * 60 * 60 * 1000);
};

export const generateWeeklyApplianceTasks = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all active appliances
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

    console.log(`Generating weekly verification tasks for ${appliances.length} appliances...`);
    let tasksCreated = 0;

    // Calculate deadline (next Sunday at 23:59:59 IST, if today is Sunday, make it next Sunday)
    const nextSunday = getNextSundayIST();

    // Fetch RM or Branch Manager user to act as fallback creator
    let fallbackCreator = await prisma.user.findFirst({ where: { role: RoleId.rm } });
    if (!fallbackCreator) {
      fallbackCreator = await prisma.user.findFirst({ where: { role: RoleId.branchManager } });
    }
    if (!fallbackCreator) {
      fallbackCreator = await prisma.user.findFirst();
    }

    if (!fallbackCreator) {
      console.warn("No fallback creator found (no users exist in database). Skipping task generation.");
      return res.status(400).json({ message: "No users exist in database to assign as creator" });
    }
    const fallbackCreatorId = fallbackCreator.id;

    // Fetch already generated tasks for this week to prevent duplicates (IST week)
    const currentWeekStart = getWeekStartIST();

    const existingTasks = await prisma.task.findMany({
      where: {
        applianceId: { not: null },
        createdAt: { gte: currentWeekStart }
      },
      select: { applianceId: true }
    });
    const existingApplianceIds = new Set(existingTasks.map(t => t.applianceId));

    const tasksToCreate = [];

    for (const app of appliances) {
      if (existingApplianceIds.has(app.id)) {
        continue;
      }

      // Find the LC of this branch
      const lc = app.branch.users[0]; // Gets first LC assigned to branch
      const lcId = lc ? lc.id : null;

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
        notes: `Weekly appliance operation check. Upload photo showing it is working fine. Serial: ${app.serial}`,
        applianceId: app.id
      });
    }

    if (tasksToCreate.length > 0) {
      await prisma.task.createMany({
        data: tasksToCreate
      });
      tasksCreated = tasksToCreate.length;
    }

    // Update branch applianceRisk counts
    const branches = await prisma.branch.findMany({
      include: {
        appliances: {
          where: { status: { not: ApplianceStatus.Operational } }
        }
      }
    });

    for (const b of branches) {
      await prisma.branch.update({
        where: { id: b.id },
        data: { applianceRisk: b.appliances.length }
      }).catch((err) => console.error("Failed to update branch applianceRisk:", err));
    }

    return res.status(200).json({
      message: `Weekly appliance tasks generated successfully`,
      tasksCreated,
      totalAppliancesProcessed: appliances.length,
    });
  } catch (error: any) {
    console.error("Weekly appliance task generator error: ", error);
    return res.status(500).json({ 
      message: "Server error generating weekly appliance tasks", 
      error: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred" 
    });
  }
};
