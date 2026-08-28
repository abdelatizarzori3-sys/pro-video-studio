export function isTextEditingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
}

export function shouldToggleMute(key: string, selectedClipId: number | null, target: EventTarget | null) {
  return key.toLowerCase() === "m" && selectedClipId !== null && !isTextEditingTarget(target);
}

export function shouldTogglePreview(key: string, target: EventTarget | null) {
  return key === " " && !isTextEditingTarget(target);
}
