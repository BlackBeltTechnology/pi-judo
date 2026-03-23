// ---------------------------------------------------------------------------
// Save/Discard Gate -- TUI Overlay
//
// Presents a two-button overlay when the JUDO CLI server has dirty (unsaved)
// model state. The user must choose to save or discard before proceeding.
//
// Task 4.4
// ---------------------------------------------------------------------------

import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import { Container, type SelectItem, SelectList, Spacer, Text } from "@mariozechner/pi-tui";

/** The user's decision at the save/discard gate. */
export type SaveDiscardChoice = "save" | "discard";

/**
 * Shows a save/discard overlay when the model has unsaved changes.
 *
 * Displays a two-option selection dialog. After the user picks an option,
 * a brief notification confirms the choice:
 * - "Save"    -> green "Model saved" notification
 * - "Discard" -> red   "Model discarded" notification
 *
 * @param ctx - Extension context (provides `ctx.ui.custom()` and `ctx.ui.notify()`)
 * @returns The user's choice: `"save"` or `"discard"`
 */
export async function showSaveDiscardGate(ctx: any): Promise<SaveDiscardChoice> {
  const items: SelectItem[] = [
    { value: "save", label: "Save", description: "Persist all pending model mutations" },
    { value: "discard", label: "Discard", description: "Revert to last saved state" },
  ];

  const choice = await ctx.ui.custom<SaveDiscardChoice>((tui: any, theme: any, _kb: any, done: (value: SaveDiscardChoice) => void) => {
    const container = new Container();

    // Top border
    container.addChild(new DynamicBorder((s: string) => theme.fg("warning", s)));

    // Prompt
    container.addChild(new Text(theme.fg("warning", theme.bold("Model has unsaved changes. Save or discard?")), 1, 0));
    container.addChild(new Spacer(1));

    // Selection list
    const selectList = new SelectList(items, items.length, {
      selectedPrefix: (t: string) => theme.fg("accent", t),
      selectedText: (t: string) => theme.fg("accent", t),
      description: (t: string) => theme.fg("muted", t),
      scrollInfo: (t: string) => theme.fg("dim", t),
      noMatch: (t: string) => theme.fg("warning", t),
    });
    selectList.onSelect = (item: SelectItem) => done(item.value as SaveDiscardChoice);
    // No cancel handler -- the user must make a choice
    container.addChild(selectList);

    // Help text
    container.addChild(new Spacer(1));
    container.addChild(new Text(theme.fg("dim", "up/down navigate  enter select"), 1, 0));

    // Bottom border
    container.addChild(new DynamicBorder((s: string) => theme.fg("warning", s)));

    return {
      render: (w: number) => container.render(w),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => {
        selectList.handleInput(data);
        tui.requestRender();
      },
    };
  }, { overlay: true });

  // Brief verdict notification
  if (choice === "save") {
    ctx.ui.notify("\u2713 Model saved", "success");
  } else {
    ctx.ui.notify("\u2717 Model discarded", "error");
  }

  return choice;
}
