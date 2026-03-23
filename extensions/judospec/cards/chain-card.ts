import type { AgentCardRenderer } from "pi-flows/extensions/flow-dashboard/types.js";

export class ChainCard implements AgentCardRenderer {
  private chains = 0;
  private steps = 0;
  private waves = 0;

  onToolCall(toolName: string, input: any): void {
    if (toolName === "chain_write") {
      this.chains++;
      const content = input?.content || "";
      this.steps += (content.match(/^## /gm) || []).length;
      this.waves = Math.max(this.waves, (content.match(/blockedBy:/g) || []).length + 1);
    }
  }

  onToolResult(): void {}
  onComplete(): void {}

  renderMetric(width: number): string {
    if (this.chains === 0) return "  planning...";
    return `  ${this.chains} chains │ ${this.steps} steps │ ${this.waves} waves`.slice(0, width);
  }
}
