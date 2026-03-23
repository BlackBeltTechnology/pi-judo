import type { AgentCardRenderer } from "pi-flows/extensions/flow-dashboard/types.js";

export class ModelCard implements AgentCardRenderer {
  private queries = 0;
  private mutations = 0;
  private lastAction: "" | "saved" | "reverted" = "";

  onToolCall(toolName: string, input: any): void {
    if (toolName !== "model_cli") return;
    if (input?.command === "save") {
      this.lastAction = "saved";
    } else if (input?.command === "discard") {
      this.lastAction = "reverted";
    } else if (input?.query?.startsWith("mutation")) {
      this.mutations++;
    } else {
      this.queries++;
    }
  }

  onToolResult(): void {}
  onComplete(): void {}

  renderMetric(width: number): string {
    const parts: string[] = [];
    parts.push(`query:${this.queries}`);
    parts.push(`mut:${this.mutations}`);
    if (this.lastAction) parts.push(this.lastAction);
    return `  ${parts.join(" │ ")}`.slice(0, width);
  }
}
