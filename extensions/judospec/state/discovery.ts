// ---------------------------------------------------------------------------
// Filesystem-based change discovery (Approach B)
//
// No registry. No JSON state file. The filesystem IS the state.
// Agents discover state by checking which files exist.
// This module provides helpers for the status command and extension.
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

export interface ChangeInfo {
  name: string;
  dir: string;
  hasResearch: boolean;
  hasProposal: boolean;
  hasDesign: boolean;
  hasTasks: boolean;
  hasApplyExec: boolean;
  hasVerification: boolean;
  phase: string;
}

/**
 * Derive the current phase from which files exist in the change directory.
 */
function derivePhase(dir: string): string {
  if (existsSync(join(dir, "verification.md"))) return "verified";
  if (existsSync(join(dir, "apply-exec.yaml"))) return "applying";
  if (existsSync(join(dir, "tasks.md"))) return "planned";
  if (existsSync(join(dir, "proposal.md"))) return "proposed";
  if (existsSync(join(dir, "design.md"))) return "designed";
  return "created";
}

/**
 * Discover all changes from the filesystem.
 */
export function discoverChanges(cwd: string): ChangeInfo[] {
  const changesDir = join(cwd, "judospec", "changes");
  if (!existsSync(changesDir)) return [];

  let entries: string[];
  try {
    entries = readdirSync(changesDir).filter(e => {
      try { return statSync(join(changesDir, e)).isDirectory(); }
      catch { return false; }
    });
  } catch { return []; }

  return entries.map(name => {
    const dir = join(changesDir, name);
    return {
      name,
      dir,
      hasResearch: existsSync(join(cwd, "judospec", "research", "summary.md")),
      hasProposal: existsSync(join(dir, "proposal.md")),
      hasDesign: existsSync(join(dir, "design.md")),
      hasTasks: existsSync(join(dir, "tasks.md")),
      hasApplyExec: existsSync(join(dir, "apply-exec.yaml")),
      hasVerification: existsSync(join(dir, "verification.md")),
      phase: derivePhase(dir),
    };
  });
}

/**
 * Find the single active change directory, or null if zero or multiple.
 */
export function findActiveChange(cwd: string): ChangeInfo | null {
  const changes = discoverChanges(cwd);
  return changes.length === 1 ? changes[0] : null;
}
