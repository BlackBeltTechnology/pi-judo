// ---------------------------------------------------------------------------
// Session File Tracker
//
// Tracks file modifications (edit/write tool calls) per session.
// Provides:
//   - Session-scoped file counts + insertions/deletions for the footer
//   - Pre-execution file snapshots for tree-based rewind
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ---- Types ----------------------------------------------------------------

interface FileStats {
  insertions: number;
  deletions: number;
}

export interface TrackerStats {
  fileCount: number;
  insertions: number;
  deletions: number;
}

// ---- Diff parser ----------------------------------------------------------

/**
 * Parse a unified diff string and count inserted/deleted lines.
 * Lines starting with '+' (not '+++') are insertions.
 * Lines starting with '-' (not '---') are deletions.
 */
export function parseDiffCounts(diff: string): { insertions: number; deletions: number } {
  let insertions = 0;
  let deletions = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) insertions++;
    else if (line.startsWith("-")) deletions++;
  }
  return { insertions, deletions };
}

// ---- Tracker --------------------------------------------------------------

export class SessionFileTracker {
  /** path → cumulative {insertions, deletions} for the session */
  private files = new Map<string, FileStats>();

  /** entryId → Map<path, content|null>  (null = file didn't exist) */
  private snapshots = new Map<string, Map<string, Buffer | null>>();

  // -- Snapshot (called from tool_call, BEFORE execution) -------------------

  snapshotFile(entryId: string, filePath: string): void {
    let entryMap = this.snapshots.get(entryId);
    if (!entryMap) {
      entryMap = new Map();
      this.snapshots.set(entryId, entryMap);
    }
    // Only snapshot once per entry per path (earliest = pre-entry state)
    if (entryMap.has(filePath)) return;

    if (existsSync(filePath)) {
      entryMap.set(filePath, readFileSync(filePath));
    } else {
      entryMap.set(filePath, null);
    }
  }

  // -- Recording (called from tool_result, AFTER execution) -----------------

  recordEdit(filePath: string, diff: string): void {
    const counts = parseDiffCounts(diff);
    const existing = this.files.get(filePath);
    if (existing) {
      existing.insertions += counts.insertions;
      existing.deletions += counts.deletions;
    } else {
      this.files.set(filePath, { insertions: counts.insertions, deletions: counts.deletions });
    }
  }

  recordWrite(filePath: string, lineCount: number): void {
    const existing = this.files.get(filePath);
    if (!existing) {
      // First write to this path — count lines as insertions
      this.files.set(filePath, { insertions: lineCount, deletions: 0 });
    }
    // Subsequent writes: just track the file, don't update +/-
  }

  // -- Stats (read by footer) -----------------------------------------------

  getStats(): TrackerStats {
    let insertions = 0;
    let deletions = 0;
    for (const stats of this.files.values()) {
      insertions += stats.insertions;
      deletions += stats.deletions;
    }
    return { fileCount: this.files.size, insertions, deletions };
  }

  // -- Rewind (called from session_before_tree) -----------------------------

  /**
   * Restore files from snapshots for the given abandoned entry IDs.
   * For each unique file path, restore from the earliest snapshot among the
   * abandoned entries (that's the pre-modification state).
   */
  restoreFiles(entryIds: Set<string>): void {
    // Collect earliest snapshot per file path across abandoned entries
    // We iterate snapshots in insertion order; Map preserves insertion order.
    const toRestore = new Map<string, Buffer | null>();

    for (const [entryId, entryMap] of this.snapshots) {
      if (!entryIds.has(entryId)) continue;
      for (const [filePath, content] of entryMap) {
        // Only keep the earliest (first encountered)
        if (!toRestore.has(filePath)) {
          toRestore.set(filePath, content);
        }
      }
    }

    // Restore each file
    for (const [filePath, content] of toRestore) {
      if (content === null) {
        // File was created by the tool — delete it
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } else {
        // File existed before — restore original content
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, content);
      }
    }
  }

  /**
   * Remove snapshots and file tracking for abandoned entries.
   * Called after tree navigation completes.
   */
  clearEntries(entryIds: Set<string>): void {
    for (const entryId of entryIds) {
      this.snapshots.delete(entryId);
    }
    // Reset file counters — after rewind, the active branch state is the baseline
    this.files.clear();
  }

  // -- Reset (called on session_start) --------------------------------------

  reset(): void {
    this.files.clear();
    this.snapshots.clear();
  }
}
