import type { AgentCardRenderer } from "pi-flows/extensions/flow-dashboard/types.js";

export class VerifierCard implements AgentCardRenderer {
  private buildStatus = "pending";
  private criteriaTotal = 0;
  private criteriaChecked = 0;

  onToolCall(toolName: string, input: any): void {
    if (toolName === "bash" || toolName === "Bash") {
      const cmd = input?.command || "";
      if (cmd.includes("judo.sh build")) this.buildStatus = "building";
    }
  }
  onToolResult(toolName: string, output: any): void {
    if (this.buildStatus === "building") {
      this.buildStatus = String(output).includes("BUILD SUCCESS") ? "passed" : "failed";
    }
    this.criteriaChecked++;
  }
  onComplete(): void {}
  renderMetric(width: number): string {
    const buildIcon = this.buildStatus === "passed" ? "✓" : this.buildStatus === "failed" ? "✗" : "◐";
    return `  build:${buildIcon} │ verified:${this.criteriaChecked}/${this.criteriaTotal || "?"}`.slice(0, width);
  }
}
