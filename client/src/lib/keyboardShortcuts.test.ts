import { describe, expect, it } from "vitest";
import { isTextEditingTarget, shouldToggleMute } from "./keyboardShortcuts";

describe("timeline keyboard shortcuts", () => {
  it("toggles mute only for a selected clip and the M key", () => {
    expect(shouldToggleMute("m", 101, null)).toBe(true);
    expect(shouldToggleMute("M", 102, null)).toBe(true);
    expect(shouldToggleMute("x", 101, null)).toBe(false);
    expect(shouldToggleMute("m", null, null)).toBe(false);
  });

  it("ignores editable controls", () => {
    const input = { tagName: "INPUT", isContentEditable: false } as HTMLElement;
    const textarea = { tagName: "TEXTAREA", isContentEditable: false } as HTMLElement;
    const editor = { tagName: "DIV", isContentEditable: true } as HTMLElement;
    expect(isTextEditingTarget(input)).toBe(true);
    expect(isTextEditingTarget(textarea)).toBe(true);
    expect(isTextEditingTarget(editor)).toBe(true);
    expect(shouldToggleMute("m", 101, input)).toBe(false);
  });
});
