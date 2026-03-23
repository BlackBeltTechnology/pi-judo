// ---------------------------------------------------------------------------
// Judo Footer Segments
//
// Registers domain-specific footer segments via pi-flows' extension point.
// Base segments (provider, branch, files) are handled by pi-flows.
// Judo adds: mutations count, server status.
// ---------------------------------------------------------------------------

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { ServerManager } from "./server/lifecycle.js";

export function setupFooter(
  pi: ExtensionAPI,
  serverManager: ServerManager,
  getMutationCount: () => number,
): void {
  let invalidateFn: (() => void) | null = null;

  // Re-render when server state changes
  serverManager.onStateChange(() => invalidateFn?.());

  // Register mutation count segment
  pi.events?.emit("flow:register-footer-segment", {
    name: "judo-mutations",
    render: () => {
      const mutations = getMutationCount();
      return `${mutations} mut`;
    },
    onRegistered: (invalidate: () => void) => {
      invalidateFn = invalidate;
    },
  });

  // Register server status segment
  pi.events?.emit("flow:register-footer-segment", {
    name: "judo-server",
    render: () => {
      const state = serverManager.getState();
      const modelName = serverManager.getModelName();
      const modelSuffix = modelName ? ` (${modelName})` : "";
      // Note: theme colors not available here — use plain text indicators
      if (state === "running") return `● server${modelSuffix}`;
      if (state === "starting") return `◐ server${modelSuffix}`;
      if (state === "error") return `✗ server${modelSuffix}`;
      return `○ server${modelSuffix}`;
    },
    onRegistered: (invalidate: () => void) => {
      // Merge with existing invalidator
      const prev = invalidateFn;
      invalidateFn = () => { prev?.(); invalidate(); };
    },
  });
}
