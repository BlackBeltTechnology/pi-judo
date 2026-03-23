import type { AgentCardRenderer } from "pi-flows/extensions/flow-dashboard/types.js";

export class WriterCard implements AgentCardRenderer {
  private filesRead = 0;
  private words = 0;

  onToolCall(toolName: string, _input: any): void {
    if (["read", "Read", "grep", "Grep"].includes(toolName)) this.filesRead++;
  }

  onToolResult(_toolName: string, output: any): void {
    this.words += String(output).split(/\s+/).length;
  }

  onComplete(): void {}

  renderMetric(width: number): string {
    return `  read:${this.filesRead} files │ ${(this.words / 1000).toFixed(1)}k words`.slice(0, width);
  }
}
