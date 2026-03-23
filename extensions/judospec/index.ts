import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, globSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { createModelProtectionGuard } from "./guards.js";
import { createModelCliTool, getMutationCount } from "./tools/model-cli.js";
import { Registry } from "./state/registry.js";
import { ServerManager } from "./server/lifecycle.js";
import { setupFooter } from "./footer.js";

import { SessionFileTracker } from "./file-tracker.js";
import { registerStatusCommand } from "./commands/status.js";
import { runOnboardingFlow } from "./onboarding.js";


// Card metric renderers
import { ModelCard } from "./cards/model-card.js";
import { ResearcherCard } from "./cards/researcher-card.js";
import { DeveloperCard } from "./cards/developer-card.js";
import { WriterCard } from "./cards/writer-card.js";
import { ChainCard } from "./cards/chain-card.js";
import { TesterCard } from "./cards/tester-card.js";
import { VerifierCard } from "./cards/verifier-card.js";

export default function activate(pi: ExtensionAPI) {
  const cwd = process.cwd();

  // Register judo's agents and flows directories with pi-flows
  const __filename = fileURLToPath(import.meta.url);
  const judoPkgRoot = join(dirname(__filename), "..", "..");
  pi.events?.emit("flow:register-agents-dir", { dir: join(judoPkgRoot, "agents") });
  pi.events?.emit("flow:register-flows-dir", { dir: join(judoPkgRoot, "flows") });
  pi.events?.emit("flow:register-skills-dir", { dir: join(judoPkgRoot, "skills") });

  // Prerequisite check — must have model/*.model files
  let judoEnabled = false;
  try {
    const models = globSync(join(cwd, "model", "*.model"));
    judoEnabled = models.length > 0;
  } catch {}

  // ---------------------------------------------------------------------------
  // Register judo-specific card metric renderers via flow-dashboard events
  // ---------------------------------------------------------------------------

  pi.events?.emit("flow:register-card", { name: "model", factory: () => new ModelCard() });
  pi.events?.emit("flow:register-card", { name: "researcher", factory: () => new ResearcherCard() });
  pi.events?.emit("flow:register-card", { name: "developer", factory: () => new DeveloperCard() });
  pi.events?.emit("flow:register-card", { name: "writer", factory: () => new WriterCard() });
  pi.events?.emit("flow:register-card", { name: "chain", factory: () => new ChainCard() });
  pi.events?.emit("flow:register-card", { name: "tester", factory: () => new TesterCard() });
  pi.events?.emit("flow:register-card", { name: "verifier", factory: () => new VerifierCard() });

  // ---------------------------------------------------------------------------
  // Register SDD workflow into flow-dashboard
  // ---------------------------------------------------------------------------

  pi.events?.emit("flow:register-workflow", {
    id: "research-all",
    stages: [
      { name: "research", flows: ["judo:research-all"] },
    ],
  });

  pi.events?.emit("flow:register-workflow", {
    id: "research",
    stages: [
      { name: "research", flows: ["judo:research"] },
    ],
  });

  // ---------------------------------------------------------------------------
  // Register project and research gates
  // ---------------------------------------------------------------------------

  pi.events?.emit("flow:register-gate", {
    name: "judo-project",
    check: () => judoEnabled,
    flows: ["judo:*"],
    message: "No JUDO model files found (model/*.model). JUDO flows require a JUDO project.",
  });

  const researchDir = join(cwd, "judospec", "research");
  const hasResearch = () => existsSync(researchDir);

  pi.events?.emit("flow:register-gate", {
    name: "judo-research",
    check: hasResearch,
    flows: ["judo:research"],
    message: "No research directory found. Run /judo:research-all first to populate research.",
  });

  // ---------------------------------------------------------------------------
  // Registry + commands
  // ---------------------------------------------------------------------------

  const registry = new Registry(cwd);
  const serverManager = new ServerManager(cwd);

  registerStatusCommand(pi, registry);

  // ---------------------------------------------------------------------------
  // Guard model files (only if JUDO project)
  // ---------------------------------------------------------------------------

  if (judoEnabled) {
    const guard = createModelProtectionGuard();
    pi.on("tool_call", guard);

    // Register model_cli tool
    const modelCliTool = createModelCliTool(cwd);
    pi.registerTool(modelCliTool);
  }

  // ---------------------------------------------------------------------------
  // Session file tracker
  // ---------------------------------------------------------------------------

  const fileTracker = new SessionFileTracker();

  // Snapshot files BEFORE edit/write tool execution
  pi.on("tool_call", async (event: any) => {
    if (event.toolName === "edit" || event.toolName === "write") {
      fileTracker.snapshotFile(event.toolCallId, event.input.path);
    }
  });

  // Record file modifications AFTER edit/write tool execution
  pi.on("tool_result", async (event: any) => {
    if (event.isError) return;
    if (event.toolName === "edit" && event.details?.diff) {
      fileTracker.recordEdit(event.input.path, event.details.diff);
    } else if (event.toolName === "write") {
      const content: string = event.input?.content ?? "";
      const lineCount = content.split("\n").length;
      fileTracker.recordWrite(event.input.path, lineCount);
    }
  });

  // Track subagent file writes from flow completions
  pi.events?.on("flow:complete", (data: any) => {
    if (!data?.results) return;
    for (const stepResult of Object.values(data.results) as any[]) {
      if (!stepResult?.files) continue;
      // files is a comma-joined string like "src/main.ts (created), src/config.ts (modified)"
      for (const entry of stepResult.files.split(", ").filter(Boolean)) {
        const match = entry.match(/^(.+?)\s+\((created|modified|read)\)$/);
        if (!match || match[2] === "read") continue;
        const filePath = match[1];
        // Record as a write (no diff available from subagents)
        if (!filePath) continue;
        fileTracker.recordWrite(filePath, 0);
      }
    }
  });

  // Restore files on tree rewind
  pi.on("session_before_tree", async (event: any) => {
    const entryIds = new Set<string>(
      event.preparation.entriesToSummarize.map((e: any) => e.id),
    );
    if (entryIds.size > 0) {
      fileTracker.restoreFiles(entryIds);
    }
  });

  // Reset tracker after tree navigation
  pi.on("session_tree", async (event: any) => {
    const oldLeafId = event.oldLeafId;
    // Clear all tracking — post-rewind is a clean slate
    fileTracker.reset();
  });

  // ---------------------------------------------------------------------------
  // Footer
  // ---------------------------------------------------------------------------

  setupFooter(pi, serverManager, getMutationCount);

  // ---------------------------------------------------------------------------
  // Session start — show warning or onboarding
  // ---------------------------------------------------------------------------

  pi.on("session_start", async (_event, ctx) => {
    fileTracker.reset();

    if (ctx.hasUI) {
      // Print help once at session start, not as a persistent widget
      const lines = [
        "  /judo:status        All changes status",
        "  /judo:research      Research selected domains",
        "  /judo:research-all  Research all domains in parallel",
        "",
      ];
      pi.sendMessage({
        customType: "pi-judo-help",
        content: lines.join("\n"),
        display: true,
      });
    }

    if (!judoEnabled) {
      ctx.ui.setWidget("judo-warning", (_tui: any, theme: any) => ({
        render(width: number): string[] {
          const msg = " ⚠ No Judo model files found (model/*.model). Judo flow commands and subagents are disabled. Run pi from a Judo project root.";
          const line = theme.fg("error", msg);
          return [line];
        },
        invalidate() {},
      }), { placement: "aboveEditor" });
      return;
    }

    // JUDO project with existing research — nothing to prompt
    if (hasResearch()) return;

    // No research yet — onboarding flow
    const choice = await ctx.ui.select(
      "No project research found. How would you like to proceed?",
      ["Explore the project", "Provide specs/files", "Both (provide then explore)", "Skip for now"]
    );

    if (choice && choice !== "Skip for now") {
      await runOnboardingFlow(choice, pi, ctx, cwd);
    }
  });

  // Clear warning widget on first agent interaction
  pi.on("before_agent_start", async (_event, ctx) => {
    if (!judoEnabled) {
      ctx.ui.setWidget("judo-warning", undefined);
    }
    return {};
  });

  // ---------------------------------------------------------------------------
  // Session shutdown: release apply lock and stop server
  // ---------------------------------------------------------------------------

  pi.on("session_shutdown", async () => {
    const sessionId = process.pid.toString();
    registry.releaseApplyLock(sessionId);
    await serverManager.stop();
  });

  // ---------------------------------------------------------------------------
  // Server lifecycle for model agents
  //
  // The flow-engine dispatches agents via callbacks, not events.  We listen for
  // model_cli tool calls to auto-start the server, and stop it when idle.
  // ---------------------------------------------------------------------------

  pi.on("tool_call", async (event: any) => {
    if (event?.tool?.name === "model_cli") {
      if (serverManager.getState() !== "running") {
        serverManager.incrementRef();
        serverManager.start();
      }
    }
  });
}
