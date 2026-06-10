import { Response } from "express";
import { RoleId } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../lib/prisma";

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = req.user;
    if (!userContext) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { branchId, role } = req.query;
    const filters: any = {};

    if (userContext.role === RoleId.lc) {
      // LCs can only see their own branch's users
      filters.branchId = userContext.branchId || "";
    } else if (userContext.role === RoleId.branchManager) {
      // BMs see users in their scope
      if (branchId) {
        if (userContext.branchScope.includes(String(branchId))) {
          filters.branchId = String(branchId);
        } else {
          return res.status(403).json({ message: "Forbidden: branch out of scope" });
        }
      } else {
        filters.branchId = { in: userContext.branchScope };
      }
    } else if (userContext.role === RoleId.rm) {
      if (branchId) {
        filters.branchId = String(branchId);
      }
    }

    if (role) {
      filters.role = role as RoleId;
    }

    const users = await prisma.user.findMany({
      where: filters,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        phone: true,
        shift: true,
        status: true,
        rating: true,
        attendancePct: true,
        tasksClosed: true,
        proofRate: true,
        escalations: true,
        managerId: true,
        branchId: true,
        branchScope: true,
        lastCheckIn: true,
        skills: true,
        deviceId: true,
        joinDate: true,
      }
    });

    return res.status(200).json(users);
  } catch (error: any) {
    console.error("Get users error: ", error);
    return res.status(500).json({ 
      message: "Server error listing users", 
      error: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred" 
    });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = req.user;
    if (!userContext || userContext.role === RoleId.lc) {
      return res.status(403).json({ message: "Forbidden: Only managers can create users" });
    }

    const { name, role, position, branchId, phone, shift, skills } = req.body;
    if (!name || !role || !position) {
      return res.status(400).json({ message: "Name, role, and position are required" });
    }

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({ message: "Skills must be a valid array of strings" });
    }

    // Default password hash
    const passwordHash = await bcrypt.hash("123456789", 10);
    const email = name.toLowerCase().replace(/\s+/g, "") + "@gmail.com";

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role: role as RoleId,
          position,
          branchId: branchId || null,
          phone: phone || "Pending",
          shift: shift || "09:00 - 18:00",
          skills: skills || [],
          managerId: userContext.id,
        }
      });

      // Update branch staff counts
      if (branchId) {
        await tx.branch.update({
          where: { id: branchId },
          data: {
            staffCount: { increment: 1 },
            workerCount: { increment: 1 },
          }
        });
      }

      return user;
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        position: newUser.position,
      }
    });
  } catch (error: any) {
    console.error("Create user error: ", error);
    return res.status(500).json({ 
      message: "Server error creating user", 
      error: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred" 
    });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = req.user;
    if (!userContext) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { name, phone, shift, skills, expoPushToken, status } = req.body;

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({ message: "Skills must be a valid array of strings" });
    }

    // Check permissions: users can edit themselves; BAMs/RMs can edit their subordinates
    if (userContext.role === RoleId.lc && userContext.id !== id) {
      return res.status(403).json({ message: "Forbidden: You cannot modify other users" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        shift: shift || undefined,
        skills: skills || undefined,
        expoPushToken: expoPushToken !== undefined ? expoPushToken : undefined,
        status: status || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        phone: true,
        shift: true,
        status: true,
        expoPushToken: true,
      }
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Update user error: ", error);
    return res.status(500).json({ 
      message: "Server error updating profile", 
      error: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred" 
    });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userContext = req.user;
    if (!userContext || userContext.role !== RoleId.rm) {
      return res.status(403).json({ message: "Forbidden: Only Regional Managers can deactivate users" });
    }

    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status === "Inactive") {
      return res.status(409).json({ message: "User is already deactivated" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { status: "Inactive" } });

      // Decrement branch staff counts
      if (user.branchId) {
        await tx.branch.update({
          where: { id: user.branchId },
          data: {
            staffCount: { decrement: 1 },
            workerCount: { decrement: 1 },
          }
        });
      }
    });

    return res.status(200).json({ message: "User deactivated successfully" });
  } catch (error: any) {
    console.error("Delete user error: ", error);
    return res.status(500).json({ 
      message: "Server error deactivating user", 
      error: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred" 
    });
  }
};
