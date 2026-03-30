import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { mkdirSync, readFileSync, writeFileSync, globSync } from "node:fs";
import { join } from "node:path";

export async function runOnboardingFlow(
  choice: string,
  pi: ExtensionAPI,
  ctx: any,
  cwd: string
): Promise<void> {
  if (choice === "Explore the project") {
    pi.events?.emit("flow:run", { flowName: "judo:research", ctx: ctx.ui });
  } else if (choice === "Provide specs/files") {
    await provideFiles(ctx, cwd);
  } else if (choice === "Both (provide then explore)") {
    await provideFiles(ctx, cwd);
    pi.events?.emit("flow:run", { flowName: "judo:research", ctx: ctx.ui });
  }
  // "Skip for now" — do nothing
}

async function provideFiles(ctx: any, cwd: string): Promise<void> {
  const input = await ctx.ui.editor("Enter file paths or glob patterns (one per line):", "");
  if (!input?.trim()) return;

  const lines = input.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  const summaries: string[] = [];

  for (const line of lines) {
    try {
      const matches = globSync(join(cwd, line));
      for (const filePath of matches) {
        try {
          const content = readFileSync(filePath, "utf-8");
          summaries.push(`## ${filePath}\n\n\`\`\`\n${content}\n\`\`\``);
        } catch { /* skip unreadable files */ }
      }
    } catch { /* skip invalid patterns */ }
  }

  if (summaries.length > 0) {
    const researchDir = join(cwd, "judospec", "research");
    mkdirSync(researchDir, { recursive: true });
    writeFileSync(join(researchDir, "provided.md"), summaries.join("\n\n"), "utf-8");
    ctx.ui.notify(`${summaries.length} file(s) saved to judospec/research/provided.md`, "info");
  }
}
