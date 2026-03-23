import type { AgentCardRenderer } from "pi-flows/extensions/flow-dashboard/types.js";

export class TesterCard implements AgentCardRenderer {
  private passed = 0;
  private failed = 0;
  private running = "";

  onToolCall(toolName: string, input: any): void {
    if (toolName === "bash" || toolName === "Bash") {
      const cmd = input?.command || "";
      const testMatch = cmd.match(/test\w*|jest|vitest|playwright/i);
      if (testMatch) this.running = cmd.slice(0, 30);
    }
  }
  onToolResult(_toolName: string, output: any): void {
    const text = String(output);
    const passMatch = text.match(/(\d+)\s+pass/i);
    const failMatch = text.match(/(\d+)\s+fail/i);
    if (passMatch) this.passed += parseInt(passMatch[1]);
    if (failMatch) this.failed += parseInt(failMatch[1]);
    this.running = "";
  }
  onComplete(): void {}
  renderMetric(width: number): string {
    return `  tests:${this.passed}✓ ${this.failed}✗${this.running ? ` │ ◐ ${this.running}` : ""}`.slice(0, width);
  }
}
