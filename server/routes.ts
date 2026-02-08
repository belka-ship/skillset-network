import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertUploadSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { sendContactEmail } from "./resend";

const SALT_ROUNDS = 10;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await storage.createUser({ username, password: hashedPassword });

      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Login failed after registration" });
        }
        res.json({ id: user.id, username: user.username, balance: user.balance });
      });
    } catch (error) {
      console.error("Register error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({ id: user.id, username: user.username, balance: user.balance });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser((req.user as any).id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ id: user.id, username: user.username, balance: user.balance });
  });

  // Task Routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const allTasks = await storage.getAllTasks();
      res.json(allTasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Upload Routes
  app.post("/api/uploads", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { taskId } = insertUploadSchema.omit({ userId: true }).parse(req.body);
      const userId = (req.user as any).id;

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const alreadyApproved = await storage.hasUserCompletedTask(userId, taskId);
      if (alreadyApproved) {
        return res.status(400).json({ error: "Task already completed" });
      }

      const hasPendingUpload = await storage.hasUserPendingUpload(userId, taskId);
      if (hasPendingUpload) {
        return res.status(400).json({ error: "You have a pending upload for this task" });
      }

      const upload = await storage.createUpload({ userId, taskId });
      res.json({ upload, reward: 0, newBalance: 0 });
    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/uploads/:uploadId/validate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { uploadId } = req.params;

      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      const task = await storage.getTask(upload.taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      await storage.updateUploadStatus(uploadId, "approved");

      const user = await storage.getUser(upload.userId);
      if (user) {
        const newBalance = user.balance + task.reward;
        await storage.updateUserBalance(upload.userId, newBalance);
        res.json({ status: "approved", reward: task.reward, newBalance });
      } else {
        res.status(500).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Validate error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/uploads/:uploadId/cancel", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { uploadId } = req.params;
      const userId = (req.user as any).id;

      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.updateUploadStatus(uploadId, "cancelled");
      res.json({ status: "cancelled" });
    } catch (error) {
      console.error("Cancel error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/uploads/:uploadId/reject", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { uploadId } = req.params;

      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      await storage.updateUploadStatus(uploadId, "rejected");
      res.json({ status: "rejected" });
    } catch (error) {
      console.error("Reject error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/uploads/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const userUploads = await storage.getUserUploads(userId);
      res.json(userUploads);
    } catch (error) {
      console.error("Get uploads error:", error);
      res.status(500).json({ error: "Failed to fetch uploads" });
    }
  });

  app.get("/api/admin/uploads", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const allUploads = await storage.getAllUploadsWithDetails();
      res.json(allUploads);
    } catch (error) {
      console.error("Get all uploads error:", error);
      res.status(500).json({ error: "Failed to fetch uploads" });
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Get upload URL error:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/uploads/:uploadId/file", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { uploadId } = req.params;
      const { objectPath } = req.body;

      if (!objectPath) {
        return res.status(400).json({ error: "objectPath is required" });
      }

      if (!objectPath.startsWith("/objects/")) {
        return res.status(400).json({ error: "Invalid object path format" });
      }

      await storage.updateUploadFileUrl(uploadId, objectPath);

      res.json({ objectPath });
    } catch (error) {
      console.error("Update upload file error:", error);
      res.status(500).json({ error: "Failed to update upload file" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const contactFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    company: z.string().optional(),
    email: z.string().email("Valid email is required"),
    enquiryType: z.string().min(1, "Enquiry type is required"),
    message: z.string().min(1, "Message is required"),
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const data = contactFormSchema.parse(req.body);
      await sendContactEmail(data);
      res.json({ success: true, message: "Your message has been sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Validation error" });
      }
      res.status(500).json({ error: "Failed to send message. Please try again later." });
    }
  });

  const SKILL_TOKEN_ADDRESS = "BcyA4CctAFW6EkXDBxMTJjbbNSoHwFWdW4vBGXEzGqqA";
  
  app.get("/api/skill-price", async (req, res) => {
    try {
      const response = await fetch(
        `https://api.orca.so/v2/solana/tokens/${SKILL_TOKEN_ADDRESS}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch token data from Orca");
      }
      
      const data = await response.json();
      const price = data?.data?.priceUsdc ?? null;
      
      res.json({ price });
    } catch (error) {
      console.error("Error fetching SKILL price:", error);
      res.status(500).json({ error: "Failed to fetch price", price: null });
    }
  });

  return httpServer;
}
