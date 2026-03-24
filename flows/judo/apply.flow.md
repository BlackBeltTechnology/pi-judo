---
name: apply
description: Execute a change — generate DAG from tasks, run agents, verify, fix, commit
max_concurrent: 4
---

## judo-flow-writer
task: >
  Read the proposal and tasks for this change.
  Generate an execution flow as a .flow.md file.
  Rules:
  - One agent step per task in tasks.md
  - Wire blockedBy from task dependencies
  - Model-designer tasks must be sequential (serial, never parallel)
  - Backend/frontend tasks depend on the last model task
  - Test tasks depend on their implementation tasks
  - Do NOT include verifier, backpropagator, summarizer, or git-manager steps
  Write the flow using flow_write tool.

## flow-ref: apply-execution
path: judospec/changes/*/apply.flow.md
on_complete: judo-verifier

## judo-verifier
task: >
  Build the project and verify acceptance criteria from the proposal.
  Write verification report to verification.md.
inputs:
  implementation_output: "{result.apply-execution.summary}"

## judo-backpropagator
task: >
  Analyze verification gaps and generate a fix flow.
  Gaps: {result.judo-verifier.artifacts}
  Write the fix flow using flow_write tool.
inputs:
  verification_gaps: "{result.judo-verifier.artifacts}"

## flow-ref: fix-execution
path: judospec/changes/*/fix-*.flow.md
on_complete: judo-verifier

## agent-loop-decision: verify-loop
agent: flow-decision
task: >
  Evaluate the verification result: {result.judo-verifier.summary}
  Verification artifacts: {result.judo-verifier.artifacts}
  If gaps remain, choose "loop" to run another fix cycle.
  If all acceptance criteria pass, choose "exit".
loop_target: judo-backpropagator
exit_target: judo-summarizer
max_iterations: 3

## judo-summarizer
task: >
  Generate a change summary from the implementation and verification results.
  Verifier result: {result.judo-verifier.summary}

## judo-git-manager
blockedBy: judo-summarizer
task: >
  Commit all changes.
  Verification: {result.judo-verifier.summary}
