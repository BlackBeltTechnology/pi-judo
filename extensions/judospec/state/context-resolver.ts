import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ResolvedContext {
  path: string;
  content: string;
  exists: boolean;
}

/** Bare paths that live under the plan/ subdirectory of a change. */
const PLAN_ARTIFACTS = new Set([
  "proposal.md",
  "design.md",
  "research-brief.md",
]);

/**
 * Resolve context file paths for an agent.
 *
 * Bare paths (no leading slash or protocol) resolve as follows:
 *   - Plan artifacts (proposal.md, design.md, research-brief.md) resolve to
 *     judospec/changes/<change-id>/plan/<path>
 *   - Paths starting with "research/" resolve to judospec/research/<rest>
 *   - All other bare paths resolve to judospec/changes/<change-id>/<path>
 *
 * Absolute paths are used as-is (relative to cwd).
 */
export function resolveContextFiles(
  contextPaths: string[],
  changeId: string,
  cwd: string
): ResolvedContext[] {
  const changeDir = join(cwd, "judospec", "changes", changeId);
  const researchDir = join(cwd, "judospec", "research");

  return contextPaths.map((barePath) => {
    const resolved = resolveBarePath(barePath, changeDir, researchDir, cwd);
    const fileExists = existsSync(resolved);
    let content = "";

    if (fileExists) {
      try {
        content = readFileSync(resolved, "utf-8");
      } catch {
        // Readable check passed but read failed (permissions, race, etc.)
        content = "";
      }
    }

    return { path: resolved, content, exists: fileExists };
  });
}

function resolveBarePath(
  barePath: string,
  changeDir: string,
  researchDir: string,
  cwd: string
): string {
  // Absolute paths stay absolute (resolved against cwd)
  if (barePath.startsWith("/")) {
    return join(cwd, barePath);
  }

  // Global research paths
  if (barePath.startsWith("research/")) {
    const rest = barePath.slice("research/".length);
    return join(researchDir, rest);
  }

  // Plan artifacts live under plan/
  if (PLAN_ARTIFACTS.has(barePath)) {
    return join(changeDir, "plan", barePath);
  }

  // Everything else is relative to the change directory
  return join(changeDir, barePath);
}
