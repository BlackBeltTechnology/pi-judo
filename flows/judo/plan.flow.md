---
name: plan
description: Create or revise a proposal with design decisions and GAP resolution
task_required: true
task_prompt: "Describe what you want to build or change:"
max_concurrent: 2
---

## has-proposal
stepType: conditional
check: judo-proposal-writer.artifacts
present: revise-intent
absent: design-questions

## design-questions
stepType: fork
question: >
  Review design decisions interactively before creating the proposal?
options:
  - Yes, discuss design first
  - No, go straight to proposal
branches:
  Yes, discuss design first: design-discuss
  No, go straight to proposal: create-proposal

## design-discuss
agent: judo-proposal-writer
task: >
  MODE: Pre-proposal design discussion.
  Analyze the research and decompose into design decision categories.
  Write design.md with decisions and open questions.

## after-discuss
stepType: conditional
check: design-discuss.summary
present: create-proposal
absent: create-proposal

## create-proposal
agent: judo-proposal-writer
task: >
  MODE: Create.
  Create proposal.md and tasks.md based on research findings.
  If design.md exists, incorporate those decisions.
inputs:
  design: "${{result.design-discuss.summary}}"

## after-create
stepType: conditional
check: create-proposal.summary
present: resolve-gaps
absent: resolve-gaps

## resolve-gaps
stepType: fork
question: >
  The proposal has unresolved design decisions (GAP markers).
  Review and provide your answers:
options:
  - Resolve gaps now
  - Skip, leave gaps for later
allowNotes: true
branches:
  Resolve gaps now: gap-filler
  Skip, leave gaps for later: plan-complete

## gap-filler
agent: judo-proposal-writer
task: >
  MODE: Gap resolution.
  Read proposal.md, find all GAP markers.
  Resolve gaps using the user's decision and notes.
  Rewrite proposal.md with gaps filled. Regenerate tasks.md.

## gap-check
stepType: agent-loop-decision
agent: flow-decision
task: >
  Check the proposal for GAP markers.
  Proposal artifacts: ${{result.create-proposal.artifacts}}${{result.revise-proposal.artifacts}}${{result.discuss-proposal.artifacts}}
  Gap filler result: ${{result.gap-filler.artifacts}}
  If unresolved GAP markers remain, choose "loop". If clean, choose "exit".
loop_target: resolve-gaps
exit_target: plan-complete
max_iterations: 2

## plan-complete
agent: judo-summarizer
task: >
  Summarize the completed plan.
  Read proposal.md and tasks.md, produce a brief overview.

## revise-intent
stepType: fork
question: >
  A proposal already exists. What would you like to do?
options:
  - Revise the proposal
  - Discuss design decisions
  - Start fresh
allowNotes: true
branches:
  Revise the proposal: revise-proposal
  Discuss design decisions: discuss-proposal
  Start fresh: design-questions

## revise-proposal
agent: judo-proposal-writer
task: >
  MODE: Revision.
  Read existing proposal.md. Apply the user's requested changes.
  Insert GAP markers at locations that need decisions.
  Do NOT resolve the gaps — just mark them.

## after-revise
stepType: conditional
check: revise-proposal.summary
present: gap-check
absent: gap-check

## discuss-proposal
agent: judo-proposal-writer
task: >
  MODE: Post-proposal discussion.
  Scan proposal.md for GAP markers and unresolved decisions.
  Present findings in your summary.

## after-discuss-review
stepType: conditional
check: discuss-proposal.summary
present: gap-check
absent: gap-check
