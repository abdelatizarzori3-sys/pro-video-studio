import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
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
});
