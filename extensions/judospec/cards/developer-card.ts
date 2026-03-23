import type { AgentCardRenderer } from "pi-flows/extensions/flow-dashboard/types.js";

export class DeveloperCard implements AgentCardRenderer {
  private filesModified = 0;
  private linesAdded = 0;
  private linesRemoved = 0;

  onToolCall(toolName: string, input: any): void {
    const lower = toolName.toLowerCase();
    if (lower === "write" || lower === "edit") {
      this.filesModified++;
    }
    if (lower === "write" && input?.content) {
      this.linesAdded += input.content.split("\n").length;
    } else if (lower === "edit") {
      if (input?.new_string) this.linesAdded += input.new_string.split("\n").length;
      if (input?.old_string) this.linesRemoved += input.old_string.split("\n").length;
    }
  }
  onToolResult(): void {}
  onComplete(): void {}
  renderMetric(width: number): string {
    return `  ${this.filesModified} files (+${this.linesAdded} -${this.linesRemoved})`.slice(0, width);
  }
}
