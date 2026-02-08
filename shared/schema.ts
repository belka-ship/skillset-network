import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(0),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(),
  reward: integer("reward").notNull(),
  description: text("description"),
});

export const uploads = pgTable("uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("validating"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
