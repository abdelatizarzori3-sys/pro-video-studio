import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, exportJobs, projectAssets, users, videoProjects, videoScenes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  values.lastSignedIn ??= new Date(); if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }
export async function listProjects(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(videoProjects).where(eq(videoProjects.userId, userId)).orderBy(desc(videoProjects.updatedAt)); }
export async function createProject(userId: number, title: string, description?: string) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(videoProjects).values({ userId, title, description, durationSeconds: 5400 }); const id = Number(result[0].insertId); await db.insert(videoScenes).values({ projectId: id, sceneIndex: 1, title: "المشهد الافتتاحي", durationSeconds: 18, narration: "ابدأ بقصة واضحة تمهّد لفكرة الفيلم.", visualText: "عنوان الفيلم" }); return id; }
export async function getProject(userId: number, projectId: number) { const db = await getDb(); if (!db) return null; const projects = await db.select().from(videoProjects).where(and(eq(videoProjects.id, projectId), eq(videoProjects.userId, userId))).limit(1); if (!projects[0]) return null; const scenes = await db.select().from(videoScenes).where(eq(videoScenes.projectId, projectId)).orderBy(videoScenes.sceneIndex); const assets = await db.select().from(projectAssets).where(and(eq(projectAssets.projectId, projectId), eq(projectAssets.userId, userId))).orderBy(desc(projectAssets.createdAt)); return { project: projects[0], scenes, assets }; }
export async function addScene(projectId: number, input: { title: string; durationSeconds: number; narration?: string; visualText?: string; transition?: string }) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const rows = await db.select().from(videoScenes).where(eq(videoScenes.projectId, projectId)).orderBy(desc(videoScenes.sceneIndex)).limit(1); const nextIndex = (rows[0]?.sceneIndex ?? 0) + 1; await db.insert(videoScenes).values({ projectId, sceneIndex: nextIndex, ...input }); return nextIndex; }
export async function createExport(userId: number, projectId: number, quality: string, format: string) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(exportJobs).values({ userId, projectId, quality, format, status: "queued", progress: 0 }); return Number(result[0].insertId); }
export async function addAsset(userId: number, projectId: number, input: { name: string; storageKey: string; url: string; mimeType: string; kind: "image" | "video" | "audio" | "other"; sceneId?: number }) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(projectAssets).values({ userId, projectId, ...input }); return Number(result[0].insertId); }
