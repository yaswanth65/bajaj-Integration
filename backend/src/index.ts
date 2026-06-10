import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import mainRouter from "./routes";
import { securityHeaders } from "./middlewares/security.middleware";
import prisma from "./lib/prisma";

dotenv.config();

// Assert JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not defined!");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(securityHeaders);
app.use(cors());
app.use(express.json());

// Main API routes
app.use("/api", mainRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log("Express server closed.");
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("Force shutting down due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
