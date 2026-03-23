import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";

export type ServerState = "stopped" | "starting" | "running" | "error";

export class ServerManager {
  private state: ServerState = "stopped";
  private process: ChildProcess | null = null;
  private refCount = 0;
  private modelPath: string | null = null;
  private stateChangeCallback?: () => void;

  constructor(private cwd: string) {
    // Auto-detect model path
    try {
      const { globSync } = require("node:fs");
      const models = globSync(join(cwd, "model", "*.model"));
      if (models.length > 0) this.modelPath = models[0];
    } catch {}
  }

  getState(): ServerState { return this.state; }
  getRefCount(): number { return this.refCount; }

  getModelName(): string | null {
    if (!this.modelPath) return null;
    return basename(this.modelPath).replace(/\.model$/, "");
  }

  onStateChange(cb: () => void): void {
    this.stateChangeCallback = cb;
  }

  private setState(newState: ServerState): void {
    this.state = newState;
    this.stateChangeCallback?.();
  }

  async start(): Promise<boolean> {
    if (this.state === "running") return true;
    if (!this.modelPath || !existsSync(join(this.cwd, "target", "judo-cli.jar"))) {
      this.setState("error");
      return false;
    }

    this.setState("starting");
    try {
      this.process = spawn("java", ["-jar", "target/judo-cli.jar", "-m", this.modelPath, "server"], {
        cwd: this.cwd,
        stdio: ["ignore", "pipe", "pipe"],
      });

      // Wait for server ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Server start timeout")), 30000);
        this.process?.stdout?.on("data", (data: Buffer) => {
          if (data.toString().includes("ready") || data.toString().includes("listening")) {
            clearTimeout(timeout);
            resolve();
          }
        });
        this.process?.on("error", (err) => { clearTimeout(timeout); reject(err); });
        this.process?.on("exit", (code) => { if (code !== 0) { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); } });
        // Also resolve after 5s optimistically
        setTimeout(() => { clearTimeout(timeout); resolve(); }, 5000);
      });

      this.setState("running");
      return true;
    } catch {
      this.setState("error");
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => { this.process?.kill("SIGKILL"); resolve(); }, 10000);
        this.process?.on("exit", () => { clearTimeout(timeout); resolve(); });
      });
      this.process = null;
    }
    this.setState("stopped");
  }

  incrementRef(): void { this.refCount++; }
  decrementRef(): number { return Math.max(0, --this.refCount); }
}
