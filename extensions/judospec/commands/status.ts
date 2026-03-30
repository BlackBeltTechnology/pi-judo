import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { discoverChanges, type ChangeInfo } from "../state/discovery.js";

export function registerStatusCommand(pi: ExtensionAPI, cwd: string): void {
  pi.registerCommand("judo:status", {
    description: "Show JUDO project and change status",
    handler: async (_args, ctx) => {
      const changes = discoverChanges(cwd);

      const lines: string[] = [];

      if (changes.length === 0) {
        lines.push("No active changes in judospec/changes/.");
        lines.push("Run /judo:research to start a new change.");
      } else {
        lines.push(`${changes.length} change(s):\n`);
        for (const c of changes) {
          const artifacts = [
            c.hasResearch ? "✓ research" : "○ research",
            c.hasDesign ? "✓ design" : "○ design",
            c.hasProposal ? "✓ proposal" : "○ proposal",
            c.hasTasks ? "✓ tasks" : "○ tasks",
            c.hasApplyExec ? "✓ apply-exec" : "○ apply-exec",
            c.hasVerification ? "✓ verified" : "○ verified",
          ].join("  ");
          lines.push(`  ${c.name}  [${c.phase}]`);
          lines.push(`    ${artifacts}`);
        }
      }

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}
