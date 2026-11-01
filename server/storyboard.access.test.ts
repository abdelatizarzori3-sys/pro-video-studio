import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getProject: vi.fn() };
});

vi.mock("./entitlements", () => ({
  getStoryboardExportAccess: vi.fn(),
  requireStoryboardExportAccess: vi.fn(),
}));

import { getProject } from "./db";
import { requireStoryboardExportAccess } from "./entitlements";
import { appRouter } from "./routers";

const project = {
  project: { id: 7, title: "خطة الفيلم", description: null, aspectRatio: "16:9" },
  scenes: [{ id: 1, sceneIndex: 1, title: "المشهد الأول", durationSeconds: 12, narration: "نص المشهد", visualText: "عنوان", transition: "Dissolve" }],
  assets: [{ url: "https://private.example/never-export" }],
};

function authenticatedContext(): TrpcContext {
  return {
    user: { id: 42, openId: "test-user", name: "Test", email: null, loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Storyboard export access boundary", () => {
  it("rejects a free user before generating downloadable data", async () => {
    vi.mocked(getProject).mockResolvedValue(project as never);
    vi.mocked(requireStoryboardExportAccess).mockRejectedValue(new TRPCError({ code: "FORBIDDEN", message: "يتطلب اشتراك برو نشطاً" }));
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.projects.exportStoryboard({ projectId: 7, format: "json" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("exports JSON for a project owned by a Pro user and omits asset links", async () => {
    vi.mocked(getProject).mockResolvedValue(project as never);
    vi.mocked(requireStoryboardExportAccess).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.projects.exportStoryboard({ projectId: 7, format: "json" });
    expect(result.mimeType).toBe("application/json;charset=utf-8");
    expect(result.content).toContain("المشهد الأول");
    expect(result.content).not.toContain("private.example");
  });

  it("validates the project identifier before the feature can run", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.projects.exportStoryboard({ projectId: 0, format: "print" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
