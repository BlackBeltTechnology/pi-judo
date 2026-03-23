import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Registry } from "../state/registry.js";

export function registerStatusCommand(pi: ExtensionAPI, registry: Registry): void {
  pi.registerCommand("judo:status", {
    description: "Show all JUDO changes status",
    handler: async (_args, ctx) => {
      const changes = registry.listChanges();
      const lock = registry.getApplyLock();

      const lines: string[] = ["JUDO Changes:"];
      for (const [id, entry] of Object.entries(changes)) {
        lines.push(`  ${id}: ${entry.phase}/${entry.status} - ${entry.description} (${entry.files.length} files, ${entry.mutations} mutations)`);
      }
      if (lock) lines.push(`\nApply lock: ${lock.change_id} (session: ${lock.session_id})`);
      if (Object.keys(changes).length === 0) lines.push("  No changes. Use /flow to create one.");

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}
