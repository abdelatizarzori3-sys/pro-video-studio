import { describe, expect, it } from "vitest";
import { StoryboardValidationError, buildStoryboardDocument, renderStoryboardPrintReport, serializeStoryboardJson } from "./storyboard";

const exportedAt = new Date("2026-10-31T08:00:00.000Z");
const source = {
  project: { id: 7, title: "رحلة المدينة", description: "وصف\r\nقصير", aspectRatio: "16:9" },
  scenes: [
    { id: 20, sceneIndex: 2, title: "الخاتمة", durationSeconds: 30, narration: "النهاية", visualText: "أثر باقٍ", transition: "Fade" },
    { id: 10, sceneIndex: 1, title: "البداية", durationSeconds: 15, narration: "مقدمة", visualText: "مدينة جديدة", transition: "Dissolve" },
  ],
};

describe("Storyboard export", () => {
  it("serializes only ordered storyboard text and durations", () => {
    const document = buildStoryboardDocument(source, exportedAt);
    const parsed = JSON.parse(serializeStoryboardJson(document));

    expect(parsed).toEqual({
      schema: "pro-video-studio.storyboard/v1",
      exportedAt: "2026-10-31T08:00:00.000Z",
      project: { id: 7, title: "رحلة المدينة", description: "وصف\nقصير", aspectRatio: "16:9", sceneCount: 2, totalDurationSeconds: 45 },
      scenes: [
        { order: 1, title: "البداية", durationSeconds: 15, narration: "مقدمة", visualText: "مدينة جديدة", transition: "Dissolve" },
        { order: 2, title: "الخاتمة", durationSeconds: 30, narration: "النهاية", visualText: "أثر باقٍ", transition: "Fade" },
      ],
    });
    expect(JSON.stringify(parsed)).not.toContain("imageUrl");
    expect(JSON.stringify(parsed)).not.toContain("assetUrl");
  });

  it("escapes user-controlled text in the printable report", () => {
    const document = buildStoryboardDocument({
      ...source,
      project: { ...source.project, title: "<img src=x onerror=alert(1)>" },
      scenes: [{ ...source.scenes[0], title: "<script>alert(1)</script>" }],
    }, exportedAt);
    const report = renderStoryboardPrintReport(document);

    expect(report).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(report).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(report).not.toContain("<img src=x onerror=alert(1)>");
    expect(report).not.toContain("<script>alert(1)</script>");
    expect(report).toContain("لا يتضمن هذا الملف وسائط المشروع أو روابط الأصول أو ملف فيديو.");
  });

  it("rejects invalid durations and duplicate scene order", () => {
    expect(() => buildStoryboardDocument({ ...source, scenes: [{ ...source.scenes[0], durationSeconds: 0 }] }, exportedAt)).toThrow(StoryboardValidationError);
    expect(() => buildStoryboardDocument({ ...source, scenes: [{ ...source.scenes[0], sceneIndex: 1 }, { ...source.scenes[1], sceneIndex: 1 }] }, exportedAt)).toThrow("ترتيب المشاهد يحتوي على تكرار");
  });
});
