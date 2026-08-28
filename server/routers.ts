import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { addAsset, addScene, createExport, createTimelineClip, getLatestExport, getProject, listProjects, listTimelineClips, reorderScenes, updateScene, updateSceneImage, updateTimelineClip, createProject } from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  projects: router({
    list: protectedProcedure.query(({ ctx }) => listProjects(ctx.user.id)),
    create: protectedProcedure.input(z.object({ title: z.string().min(1), description: z.string().optional() })).mutation(({ ctx, input }) => createProject(ctx.user.id, input.title, input.description)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => getProject(ctx.user.id, input.id)),
    addScene: protectedProcedure.input(z.object({ projectId: z.number(), title: z.string(), durationSeconds: z.number().min(1), narration: z.string().optional(), visualText: z.string().optional(), transition: z.string().optional() })).mutation(async ({ ctx, input }) => { const project = await getProject(ctx.user.id, input.projectId); if (!project) throw new Error("المشروع غير متاح للمستخدم الحالي"); return addScene(input.projectId, input); }),
    updateScene: protectedProcedure.input(z.object({ projectId: z.number(), sceneId: z.number(), title: z.string().optional(), durationSeconds: z.number().min(1).optional(), narration: z.string().optional(), visualText: z.string().optional(), transition: z.string().optional() })).mutation(async ({ ctx, input }) => { const project = await getProject(ctx.user.id, input.projectId); if (!project || !project.scenes.some(scene => scene.id === input.sceneId)) throw new Error("المشهد غير متاح للمستخدم الحالي"); return updateScene(input.projectId, input.sceneId, input); }),
    reorderScenes: protectedProcedure.input(z.object({ projectId: z.number(), sceneIds: z.array(z.number()).min(1).max(200) })).mutation(async ({ ctx, input }) => { const project = await getProject(ctx.user.id, input.projectId); if (!project || project.scenes.length !== input.sceneIds.length || input.sceneIds.some(id => !project.scenes.some(scene => scene.id === id))) throw new Error("ترتيب المشاهد غير صالح"); await reorderScenes(input.projectId, input.sceneIds); return { success: true as const }; }),
    generateScript: protectedProcedure.input(z.object({ projectId: z.number(), prompt: z.string().min(10), tone: z.string().default("سينمائي") })).mutation(async ({ input }) => {
      const response = await invokeLLM({ messages: [{ role: "system", content: "أنت كاتب سيناريو عربي محترف. أعد JSON فقط يضم title و logline و scenes، وكل مشهد يحوي title و durationSeconds و narration و visualText و visualPrompt و transition. اجعل مجموع المدة مناسباً لفيلم طويل حتى 90 دقيقة." }, { role: "user", content: `الوصف: ${input.prompt}\nالنبرة: ${input.tone}` }], response_format: { type: "json_schema", json_schema: { name: "video_script", strict: true, schema: { type: "object", properties: { title: { type: "string" }, logline: { type: "string" }, scenes: { type: "array", items: { type: "object", properties: { title: { type: "string" }, durationSeconds: { type: "integer" }, narration: { type: "string" }, visualText: { type: "string" }, visualPrompt: { type: "string" }, transition: { type: "string" } }, required: ["title", "durationSeconds", "narration", "visualText", "visualPrompt", "transition"], additionalProperties: false } } }, required: ["title", "logline", "scenes"], additionalProperties: false } } } });
      return JSON.parse(String(response.choices?.[0]?.message?.content ?? "{}"));
    }),
    generateImage: protectedProcedure.input(z.object({ projectId: z.number(), sceneId: z.number().optional(), prompt: z.string().min(4) })).mutation(async ({ ctx, input }) => { const project = await getProject(ctx.user.id, input.projectId); if (!project) throw new Error("المشروع غير متاح للمستخدم الحالي"); const generated = await generateImage({ prompt: input.prompt, quality: "medium" }); if (input.sceneId && generated.url) await updateSceneImage(input.projectId, input.sceneId, generated.url); return generated; }),
    uploadAsset: protectedProcedure.input(z.object({ projectId: z.number(), sceneId: z.number().optional(), name: z.string().min(1), mimeType: z.string().min(1), dataBase64: z.string().min(20) })).mutation(async ({ ctx, input }) => {
      const project = await getProject(ctx.user.id, input.projectId); if (!project) throw new Error("المشروع غير متاح للمستخدم الحالي"); if (input.sceneId && !project.scenes.some(scene => scene.id === input.sceneId)) throw new Error("المشهد غير متاح للمستخدم الحالي");
      const kind = input.mimeType.startsWith("image/") ? "image" : input.mimeType.startsWith("video/") ? "video" : input.mimeType.startsWith("audio/") ? "audio" : "other";
      const safeName = input.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const buffer = Buffer.from(input.dataBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (buffer.byteLength > 50 * 1024 * 1024) throw new Error("الملف أكبر من الحد المسموح 50MB");
      const stored = await storagePut(`${ctx.user.id}-projects/${input.projectId}/${Date.now()}-${safeName}`, buffer, input.mimeType);
      const assetId = await addAsset(ctx.user.id, input.projectId, { sceneId: input.sceneId, name: input.name, mimeType: input.mimeType, kind, storageKey: stored.key, url: stored.url });
      return { assetId, url: stored.url };
    }),
    requestExport: protectedProcedure.input(z.object({ projectId: z.number(), quality: z.enum(["720p HD", "1080p HD", "4K UHD"]), format: z.enum(["MP4", "MOV", "WebM"]) })).mutation(async ({ ctx, input }) => { const project = await getProject(ctx.user.id, input.projectId); if (!project) throw new Error("المشروع غير متاح للمستخدم الحالي"); return createExport(ctx.user.id, input.projectId, input.quality, input.format); }),
    latestExport: protectedProcedure.input(z.object({ projectId: z.number() })).query(({ ctx, input }) => getLatestExport(ctx.user.id, input.projectId)),
    timelineClips: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => { const project = await getProject(ctx.user.id, input.projectId); if (!project) throw new Error("المشروع غير متاح للمستخدم الحالي"); return listTimelineClips(ctx.user.id, input.projectId); }),
    createTimelineClip: protectedProcedure.input(z.object({ projectId: z.number(), track: z.enum(["voice", "music"]), name: z.string().min(1), startSeconds: z.number().min(0).default(0), durationSeconds: z.number().min(1).default(30), volume: z.number().min(0).max(100).default(80), muted: z.boolean().default(false), assetUrl: z.string().optional() })).mutation(async ({ ctx, input }) => { const project = await getProject(ctx.user.id, input.projectId); if (!project) throw new Error("المشروع غير متاح للمستخدم الحالي"); return createTimelineClip(ctx.user.id, input.projectId, input); }),
    updateTimelineClip: protectedProcedure.input(z.object({ projectId: z.number(), clipId: z.number(), startSeconds: z.number().min(0).optional(), durationSeconds: z.number().min(1).optional(), volume: z.number().min(0).max(100).optional(), muted: z.boolean().optional() })).mutation(async ({ ctx, input }) => { const project = await getProject(ctx.user.id, input.projectId); if (!project) throw new Error("المشروع غير متاح للمستخدم الحالي"); await updateTimelineClip(ctx.user.id, input.projectId, input.clipId, input); return { success: true as const }; }),
  }),
});
export type AppRouter = typeof appRouter;
