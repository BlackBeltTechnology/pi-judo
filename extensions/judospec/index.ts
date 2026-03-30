import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, globSync, readdirSync, statSync, rmSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { createModelProtectionGuard } from "./guards.js";
import { createModelCliTool, getMutationCount } from "./tools/model-cli.js";
import { ServerManager } from "./server/lifecycle.js";
import { setupFooter } from "./footer.js";
import { SessionFileTracker } from "./file-tracker.js";
import { registerStatusCommand } from "./commands/status.js";

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
  // Dashboard cards
  // ---------------------------------------------------------------------------

  pi.events?.emit("flow:register-card", { name: "model", factory: () => new ModelCard() });
  pi.events?.emit("flow:register-card", { name: "researcher", factory: () => new ResearcherCard() });
  pi.events?.emit("flow:register-card", { name: "developer", factory: () => new DeveloperCard() });
  pi.events?.emit("flow:register-card", { name: "writer", factory: () => new WriterCard() });
  pi.events?.emit("flow:register-card", { name: "chain", factory: () => new ChainCard() });
  pi.events?.emit("flow:register-card", { name: "tester", factory: () => new TesterCard() });
  pi.events?.emit("flow:register-card", { name: "verifier", factory: () => new VerifierCard() });

  // ---------------------------------------------------------------------------
  // SDD workflow pipeline (for dashboard breadcrumb)
  // ---------------------------------------------------------------------------

  pi.events?.emit("flow:register-workflow", {
    id: "judo-sdd",
    stages: [
      { name: "research", flows: ["judo:research"] },
      { name: "discuss", flows: ["judo:discuss"] },
      { name: "plan", flows: ["judo:plan"] },
      { name: "apply", flows: ["judo:apply"] },
      { name: "archive", flows: ["judo:archive"] },
    ],
  });

  // ---------------------------------------------------------------------------
  // Gate: JUDO project required (model/*.model must exist)
  // ---------------------------------------------------------------------------

  pi.events?.emit("flow:register-gate", {
    name: "judo-project",
    check: () => judoEnabled,
    flows: ["judo:*"],
    message: "No JUDO model files found (model/*.model). JUDO flows require a JUDO project.",
  });

  // ---------------------------------------------------------------------------
  // Status command (filesystem-based, no registry)
  // ---------------------------------------------------------------------------

  const serverManager = new ServerManager(cwd);
  registerStatusCommand(pi, cwd);

  // ---------------------------------------------------------------------------
  // Model file guards + model_cli tool (only if JUDO project)
  // ---------------------------------------------------------------------------

  if (judoEnabled) {
    const guard = createModelProtectionGuard();
    pi.on("tool_call", guard);

    pi.events?.emit("flow:register-guard-extension", {
      factory: (piApi: any) => {
        piApi.on("tool_call", createModelProtectionGuard());
      },
    });

    const modelCliTool = createModelCliTool(cwd);
    pi.registerTool(modelCliTool);
    // Make model_cli available to flow agent sessions (e.g., judo-model-researcher)
    pi.events.emit("flow:register-tool", { tool: modelCliTool });
  }

  // ---------------------------------------------------------------------------
  // Session file tracker
  // ---------------------------------------------------------------------------

  const fileTracker = new SessionFileTracker();

  pi.on("tool_call", async (event: any) => {
    if (event.toolName === "edit" || event.toolName === "write") {
      fileTracker.snapshotFile(event.toolCallId, event.input.path);
    }
  });

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

  pi.events?.on("flow:complete", (data: any) => {
    if (!data?.results) return;
    for (const stepResult of Object.values(data.results) as any[]) {
      if (!stepResult?.files) continue;
      for (const entry of stepResult.files.split(", ").filter(Boolean)) {
        const match = entry.match(/^(.+?)\s+\((created|modified|read)\)$/);
        if (!match || match[2] === "read") continue;
        const filePath = match[1];
        if (!filePath) continue;
        fileTracker.recordWrite(filePath, 0);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Post-archive cleanup: delete generated flows, move to archived-changes
  // ---------------------------------------------------------------------------

  pi.events?.on("flow:complete", (data: any) => {
    if (data?.flowName !== "judo:archive") return;
    if (data?.status === "error" || data?.status === "aborted") return;

    const changesDir = join(cwd, "judospec", "changes");
    if (!existsSync(changesDir)) return;

    let changeDirs: string[];
    try {
      changeDirs = readdirSync(changesDir).filter((entry) => {
        try { return statSync(join(changesDir, entry)).isDirectory(); }
        catch { return false; }
      });
    } catch { return; }

    const archivedDir = join(cwd, "judospec", "archived-changes");

    for (const changeName of changeDirs) {
      const changeDir = join(changesDir, changeName);

      // Delete generated flow artifacts (ephemeral execution DAGs)
      try {
        const files = readdirSync(changeDir);
        for (const file of files) {
          if (file === "apply-exec.yaml" || (file.startsWith("fix-") && file.endsWith(".yaml"))) {
            rmSync(join(changeDir, file), { force: true });
          }
        }
      } catch { /* best-effort cleanup */ }

      // Move change directory to archived-changes
      try {
        mkdirSync(archivedDir, { recursive: true });
        renameSync(changeDir, join(archivedDir, changeName));
      } catch { /* best-effort — may fail if cross-device */ }
    }
  });

  // Tree rewind support
  pi.on("session_before_tree", async (event: any) => {
    const entryIds = new Set<string>(
      event.preparation.entriesToSummarize.map((e: any) => e.id),
    );
    if (entryIds.size > 0) {
      fileTracker.restoreFiles(entryIds);
    }
  });

  pi.on("session_tree", async (_event: any) => {
    fileTracker.reset();
  });

  // ---------------------------------------------------------------------------
  // Footer
  // ---------------------------------------------------------------------------

  setupFooter(pi, serverManager, getMutationCount);

  // ---------------------------------------------------------------------------
  // Session start
  // ---------------------------------------------------------------------------

  pi.on("session_start", async (_event, ctx) => {
    fileTracker.reset();

    if (ctx.hasUI) {
      const lines = [
        "  /judo:status        Project & change status",
        "  /judo:research      Research selected domains",
        "  /judo:discuss       Interactive design Q&A",
        "  /judo:plan          Create or revise a proposal",
        "  /judo:apply         Execute change — DAG, verify, fix, commit",
        "  /judo:archive       Archive completed change",
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
        render(_width: number): string[] {
          const msg = " ⚠ No Judo model files found (model/*.model). Judo flows are disabled.";
          return [theme.fg("error", msg)];
        },
        invalidate() {},
      }), { placement: "aboveEditor" });
      return;
    }

    const researchDir = join(cwd, "judospec", "research");
    if (existsSync(researchDir)) return;

    ctx.ui.notify("No project research found. Run /judo:research to explore the project.", "info");
  });

  pi.on("before_agent_start", async (_event, ctx) => {
    if (!judoEnabled) {
      ctx.ui.setWidget("judo-warning", undefined);
    }
    return {};
  });

  // ---------------------------------------------------------------------------
  // Session shutdown: stop server
  // ---------------------------------------------------------------------------

  pi.on("session_shutdown", async () => {
    await serverManager.stop();
  });

  // ---------------------------------------------------------------------------
  // Server lifecycle: auto-start on model_cli usage
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
