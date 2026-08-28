import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { normalizeTimelineVolume } from "./db";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("projects access", () => {
  it("requires an authenticated user to list projects", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.projects.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to reorder scenes", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.projects.reorderScenes({ projectId: 1, sceneIds: [1, 2] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to update clip volume", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.projects.updateTimelineClip({ projectId: 1, clipId: 101, volume: 45 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("normalizes clip volume to the 0-100 range", () => {
    expect(normalizeTimelineVolume(-20)).toBe(0);
    expect(normalizeTimelineVolume(42.6)).toBe(43);
    expect(normalizeTimelineVolume(140)).toBe(100);
  });
});
