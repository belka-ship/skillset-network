import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { users, tasks, uploads, type User, type InsertUser, type Task, type InsertTask, type Upload, type InsertUpload } from "@shared/schema";

// Configure WebSocket for serverless
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

export interface UploadWithDetails {
  id: string;
  uploadedAt: Date;
  username: string;
  taskTitle: string;
  fileUrl: string | null;
  status: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: number): Promise<void>;
  
  getAllTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUserUploads(userId: string): Promise<Upload[]>;
  hasUserCompletedTask(userId: string, taskId: string): Promise<boolean>;
  hasUserPendingUpload(userId: string, taskId: string): Promise<boolean>;
  getAllUploadsWithDetails(): Promise<UploadWithDetails[]>;
  updateUploadFileUrl(uploadId: string, fileUrl: string): Promise<void>;
  updateUploadStatus(uploadId: string, status: string): Promise<void>;
  getUpload(uploadId: string): Promise<Upload | undefined>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    await db.update(users)
      .set({ balance: amount })
      .where(eq(users.id, userId));
  }

  async getAllTasks(): Promise<Task[]> {
    return db.select().from(tasks);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(insertTask).returning();
    return result[0];
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const result = await db.insert(uploads).values(insertUpload).returning();
    return result[0];
  }

  async getUserUploads(userId: string): Promise<Upload[]> {
    return db.select().from(uploads)
      .where(eq(uploads.userId, userId))
      .orderBy(desc(uploads.uploadedAt));
  }

  async hasUserCompletedTask(userId: string, taskId: string): Promise<boolean> {
    const result = await db.select().from(uploads)
      .where(and(eq(uploads.userId, userId), eq(uploads.taskId, taskId), eq(uploads.status, "approved")))
      .limit(1);
    return result.length > 0;
  }

  async hasUserPendingUpload(userId: string, taskId: string): Promise<boolean> {
    const result = await db.select().from(uploads)
      .where(and(eq(uploads.userId, userId), eq(uploads.taskId, taskId), eq(uploads.status, "validating")))
      .limit(1);
    return result.length > 0;
  }

  async getAllUploadsWithDetails(): Promise<UploadWithDetails[]> {
    const result = await db.select({
      id: uploads.id,
      uploadedAt: uploads.uploadedAt,
      username: users.username,
      taskTitle: tasks.title,
      fileUrl: uploads.fileUrl,
      status: uploads.status,
    })
      .from(uploads)
      .innerJoin(users, eq(uploads.userId, users.id))
      .innerJoin(tasks, eq(uploads.taskId, tasks.id))
      .orderBy(desc(uploads.uploadedAt));
    return result;
  }

  async updateUploadFileUrl(uploadId: string, fileUrl: string): Promise<void> {
    await db.update(uploads)
      .set({ fileUrl })
      .where(eq(uploads.id, uploadId));
  }

  async updateUploadStatus(uploadId: string, status: string): Promise<void> {
    await db.update(uploads)
      .set({ status })
      .where(eq(uploads.id, uploadId));
  }

  async getUpload(uploadId: string): Promise<Upload | undefined> {
    const result = await db.select().from(uploads).where(eq(uploads.id, uploadId)).limit(1);
    return result[0];
  }
}

export const storage = new DbStorage();
