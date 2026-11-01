export const MAX_STORYBOARD_SCENES = 200;
export const MAX_STORYBOARD_TEXT_LENGTH = 20_000;
const MAX_STORYBOARD_DURATION_SECONDS = 24 * 60 * 60;

export type StoryboardProjectSource = {
  id: number;
  title: string;
  description: string | null;
  aspectRatio: string;
};

export type StoryboardSceneSource = {
  id: number;
  sceneIndex: number;
  title: string;
  durationSeconds: number;
  narration: string | null;
  visualText: string | null;
  transition: string;
};

export type StoryboardDocument = {
  schema: "pro-video-studio.storyboard/v1";
  exportedAt: string;
  project: {
    id: number;
    title: string;
    description: string | null;
    aspectRatio: string;
    sceneCount: number;
    totalDurationSeconds: number;
  };
  scenes: Array<{
    order: number;
    title: string;
    durationSeconds: number;
    narration: string | null;
    visualText: string | null;
    transition: string;
  }>;
};

export class StoryboardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoryboardValidationError";
  }
}

function normalizeText(value: string | null | undefined, field: string, required = false): string | null {
  if (value === null || value === undefined) {
    if (required) throw new StoryboardValidationError(`${field} مطلوب للتصدير.`);
    return null;
  }

  if (typeof value !== "string") throw new StoryboardValidationError(`${field} غير صالح للتصدير.`);
  const normalized = value.replace(/\r\n?/g, "\n");
  if (normalized.length > MAX_STORYBOARD_TEXT_LENGTH) throw new StoryboardValidationError(`${field} يتجاوز الحد المسموح للتصدير.`);
  if (required && !normalized.trim()) throw new StoryboardValidationError(`${field} مطلوب للتصدير.`);
  return normalized;
}

function requirePositiveInteger(value: number, field: string, maximum = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isInteger(value) || value < 1 || value > maximum) throw new StoryboardValidationError(`${field} غير صالح للتصدير.`);
  return value;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export function buildStoryboardDocument(
  source: { project: StoryboardProjectSource; scenes: StoryboardSceneSource[] },
  exportedAt = new Date(),
): StoryboardDocument {
  if (Number.isNaN(exportedAt.getTime())) throw new StoryboardValidationError("وقت التصدير غير صالح.");
  if (!Array.isArray(source.scenes) || source.scenes.length === 0) throw new StoryboardValidationError("أضف مشهداً واحداً على الأقل قبل تصدير Storyboard.");
  if (source.scenes.length > MAX_STORYBOARD_SCENES) throw new StoryboardValidationError(`لا يمكن تصدير أكثر من ${MAX_STORYBOARD_SCENES} مشهد في ملف واحد.`);

  const projectId = requirePositiveInteger(source.project.id, "معرف المشروع");
  const title = normalizeText(source.project.title, "عنوان المشروع", true)!;
  const description = normalizeText(source.project.description, "وصف المشروع");
  const aspectRatio = normalizeText(source.project.aspectRatio, "نسبة الأبعاد", true)!;
  const orderedScenes = [...source.scenes].sort((left, right) => left.sceneIndex - right.sceneIndex || left.id - right.id);
  const usedIndexes = new Set<number>();
  let totalDurationSeconds = 0;

  const scenes = orderedScenes.map(scene => {
    requirePositiveInteger(scene.id, "معرف المشهد");
    const sourceOrder = requirePositiveInteger(scene.sceneIndex, "ترتيب المشهد", MAX_STORYBOARD_SCENES);
    if (usedIndexes.has(sourceOrder)) throw new StoryboardValidationError("ترتيب المشاهد يحتوي على تكرار ولا يمكن تصديره بأمان.");
    usedIndexes.add(sourceOrder);

    const durationSeconds = requirePositiveInteger(scene.durationSeconds, "مدة المشهد", MAX_STORYBOARD_DURATION_SECONDS);
    totalDurationSeconds += durationSeconds;
    if (totalDurationSeconds > MAX_STORYBOARD_DURATION_SECONDS) throw new StoryboardValidationError("إجمالي مدة الـ Storyboard يتجاوز الحد المسموح للتصدير.");

    return {
      order: sourceOrder,
      title: normalizeText(scene.title, "عنوان المشهد", true)!,
      durationSeconds,
      narration: normalizeText(scene.narration, "نص المشهد"),
      visualText: normalizeText(scene.visualText, "النص البصري"),
      transition: normalizeText(scene.transition, "الانتقال", true)!,
    };
  });

  return {
    schema: "pro-video-studio.storyboard/v1",
    exportedAt: exportedAt.toISOString(),
    project: { id: projectId, title, description, aspectRatio, sceneCount: scenes.length, totalDurationSeconds },
    scenes,
  };
}

export function serializeStoryboardJson(document: StoryboardDocument): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

function textBlock(value: string | null): string {
  return value ? escapeHtml(value) : "<span class=\"empty\">—</span>";
}

export function renderStoryboardPrintReport(document: StoryboardDocument): string {
  const title = escapeHtml(document.project.title);
  const description = textBlock(document.project.description);
  const aspectRatio = escapeHtml(document.project.aspectRatio);
  const exportTime = escapeHtml(document.exportedAt);
  const sceneRows = document.scenes.map(scene => `
    <article class="scene">
      <header><span class="scene-order">${scene.order}</span><div><h2>${escapeHtml(scene.title)}</h2><p class="duration">${formatDuration(scene.durationSeconds)} · ${scene.durationSeconds} ثانية · ${escapeHtml(scene.transition)}</p></div></header>
      <section><h3>نص المشهد</h3><p>${textBlock(scene.narration)}</p></section>
      <section><h3>النص البصري</h3><p>${textBlock(scene.visualText)}</p></section>
    </article>`).join("\n");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Storyboard — ${title}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    :root { color: #172033; background: #f7fbfc; font-family: Tahoma, Arial, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; background: #f7fbfc; line-height: 1.75; }
    main { max-width: 820px; margin: 0 auto; }
    .report-header { border-bottom: 3px solid #0891b2; padding-bottom: 18px; margin-bottom: 20px; }
    .eyebrow, h3 { color: #0e7490; font-size: 12px; font-weight: 700; letter-spacing: .04em; margin: 0; }
    h1 { font-size: 28px; margin: 4px 0 8px; }
    h2 { font-size: 18px; margin: 0; }
    h3 { margin-bottom: 4px; }
    p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .meta { color: #526076; font-size: 13px; }
    .project-description { margin-top: 12px; }
    .scene { break-inside: avoid; page-break-inside: avoid; border: 1px solid #dbe5e8; border-radius: 12px; background: #fff; padding: 18px; margin: 14px 0; }
    .scene header { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
    .scene-order { display: inline-grid; place-items: center; flex: 0 0 30px; width: 30px; height: 30px; border-radius: 50%; color: #fff; background: #0891b2; font-weight: 700; }
    .duration { color: #64748b; font-size: 13px; }
    .scene section + section { border-top: 1px solid #e6eef0; margin-top: 12px; padding-top: 12px; }
    .empty { color: #94a3b8; }
    footer { margin-top: 20px; color: #64748b; font-size: 11px; }
    @media print { body { padding: 0; background: #fff; } .scene { border-color: #cbd5e1; } }
  </style>
</head>
<body>
  <main>
    <header class="report-header">
      <p class="eyebrow">تقرير Storyboard قابل للطباعة</p>
      <h1>${title}</h1>
      <p class="meta">${document.project.sceneCount} مشهد · المدة الإجمالية ${formatDuration(document.project.totalDurationSeconds)} · نسبة الأبعاد ${aspectRatio}</p>
      <p class="project-description">${description}</p>
    </header>
    ${sceneRows}
    <footer>تم إنشاء التقرير في ${exportTime} (UTC). لا يتضمن هذا الملف وسائط المشروع أو روابط الأصول أو ملف فيديو.</footer>
  </main>
</body>
</html>
`;
}
