import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

// ---------------------------------------------------------------------------
// Simplified registry — backward-compatible with existing registry.json data.
// Change lifecycle (create, switch, phase tracking) has moved to pi-flows'
// change-workspace extension.  This module retains read-only access for the
// judo:status command and footer display, plus the apply-lock for session
// cleanup.
// ---------------------------------------------------------------------------

export type ChangeStatus = "pending" | "in-progress" | "complete" | "error";

export interface ChangeEntry {
  phase: string;
  status: ChangeStatus;
  description: string;
  created: string;
  files: string[];
  mutations: number;
}

export interface ApplyLock {
  change_id: string;
  session_id: string;
  acquired: string;
}

export interface RegistryData {
  changes: Record<string, ChangeEntry>;
  apply_lock: ApplyLock | null;
}

export class Registry {
  private data: RegistryData;
  private filePath: string;

  constructor(private cwd: string) {
    this.filePath = join(cwd, "judospec", "registry.json");
    this.data = this.load();
  }

  // ---------------------------------------------------------------------------
  // Load / Save
  // ---------------------------------------------------------------------------

  private load(): RegistryData {
    if (!existsSync(this.filePath)) {
      return { changes: {}, apply_lock: null };
    }
    try {
      const raw = readFileSync(this.filePath, "utf-8");
      return JSON.parse(raw) as RegistryData;
    } catch {
      return { changes: {}, apply_lock: null };
    }
  }

  private save(): void {
    const dir = dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2) + "\n", "utf-8");
  }

  // ---------------------------------------------------------------------------
  // Read-only accessors (used by status command + footer)
  // ---------------------------------------------------------------------------

  getChangeById(id: string): ChangeEntry | undefined {
    return this.data.changes[id];
  }

  listChanges(): Record<string, ChangeEntry> {
    return { ...this.data.changes };
  }

  // ---------------------------------------------------------------------------
  // Apply lock (retained for session cleanup)
  // ---------------------------------------------------------------------------

  releaseApplyLock(sessionId: string): boolean {
    if (!this.data.apply_lock) {
      return false;
    }
    if (this.data.apply_lock.session_id && this.data.apply_lock.session_id !== sessionId) {
      return false;
    }
    this.data.apply_lock = null;
    this.save();
    return true;
  }

  getApplyLock(): ApplyLock | null {
    return this.data.apply_lock;
  }
}
