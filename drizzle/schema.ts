import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  durationSeconds: int("durationSeconds").default(5400).notNull(),
  status: mysqlEnum("status", ["draft", "scripting", "editing", "rendering", "ready"]).default("draft").notNull(),
  aspectRatio: varchar("aspectRatio", { length: 16 }).default("16:9").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const videoScenes = mysqlTable("video_scenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sceneIndex: int("sceneIndex").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  durationSeconds: int("durationSeconds").default(12).notNull(),
  narration: text("narration"),
  visualText: text("visualText"),
  imageUrl: text("imageUrl"),
  transition: varchar("transition", { length: 64 }).default("Dissolve").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projectAssets = mysqlTable("project_assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  sceneId: int("sceneId"),
  name: varchar("name", { length: 255 }).notNull(),
  storageKey: text("storageKey").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  kind: mysqlEnum("kind", ["image", "video", "audio", "other"]).default("other").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const exportJobs = mysqlTable("export_jobs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  quality: varchar("quality", { length: 32 }).default("1080p HD").notNull(),
  format: varchar("format", { length: 16 }).default("MP4").notNull(),
  status: mysqlEnum("status", ["queued", "preparing", "rendering", "complete", "failed"]).default("queued").notNull(),
  progress: int("progress").default(0).notNull(),
  outputUrl: text("outputUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type VideoProject = typeof videoProjects.$inferSelect;
export type VideoScene = typeof videoScenes.$inferSelect;
export type ProjectAsset = typeof projectAssets.$inferSelect;
export type ExportJob = typeof exportJobs.$inferSelect;
