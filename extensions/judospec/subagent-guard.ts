// ---------------------------------------------------------------------------
// Subagent Guard — .model file protection for spawned agent processes
//
// Loaded as an additional --extension in spawned subagent processes via
// flow:register-guard-extension event. Blocks direct .model file access
// and directs agents to use the model_cli tool instead.
// ---------------------------------------------------------------------------

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createModelProtectionGuard } from "./guards.js";

export default function subagentGuard(pi: ExtensionAPI) {
  pi.on("tool_call", createModelProtectionGuard());
}
