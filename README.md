# pi-judo

A [pi-package](https://github.com/badlogic/pi-mono) for working with [JUDO](https://github.com/BlackBeltTechnology/judo-community) projects. Provides a complete **spec-driven development (SDD) pipeline** with specialized agents, flows, skills, and tools for model-driven development with the JUDO framework.

Built on top of [pi-flows](https://github.com/BlackBeltTechnology/pi-flows), which provides the multi-agent orchestration engine, live dashboard, and extensibility API.

---

## Table of Contents

- [What It Solves](#what-it-solves)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Pipeline Overview](#pipeline-overview)
  - [/judo:research — Domain Research](#judoresearch--domain-research)
  - [/judo:discuss — Design Discussion](#judodiscuss--design-discussion)
  - [/judo:plan — Proposal & Design](#judoplan--proposal--design)
  - [/judo:apply — Execute & Verify](#judoapply--execute--verify)
  - [/judo:archive — Finalize](#judoarchive--finalize)
- [Commands](#commands)
- [Agents](#agents)
  - [Research Agents](#research-agents)
  - [Planning Agents](#planning-agents)
  - [Development Agents](#development-agents)
  - [Testing Agents](#testing-agents)
  - [Lifecycle Agents](#lifecycle-agents)
- [Flows](#flows)
- [Skills](#skills)
- [Model CLI Tool](#model-cli-tool)
- [Model Protection Guard](#model-protection-guard)
- [Dashboard Integration](#dashboard-integration)
  - [Dashboard Cards](#dashboard-cards)
  - [Workflow Breadcrumbs](#workflow-breadcrumbs)
  - [Footer Segments](#footer-segments)
- [State Management](#state-management)
- [Project Structure](#project-structure)
- [Architecture — How pi-judo Extends pi-flows](#architecture--how-pi-judo-extends-pi-flows)
- [Configuration](#configuration)
- [pi-flows Documentation](#pi-flows-documentation)
- [License](#license)

---

## What It Solves

JUDO is a model-driven full-stack framework where the data model drives generated backend APIs, frontend UI, and database schemas. Changing a JUDO project typically involves coordinated edits across the **model layer** (ESM entities, transfer objects, relations), the **backend** (Java custom operations, interceptors), and the **frontend** (React hooks, component overrides). These layers are tightly coupled through code generation — a model change cascades through the entire stack.

pi-judo turns this multi-layer development process into a structured, repeatable pipeline:

1. **Research** the codebase to understand existing model structure, backend patterns, and frontend customizations
2. **Discuss** design decisions interactively — separate high-priority cascading choices from low-priority cosmetic ones
3. **Plan** a proposal with WHEN/THEN acceptance criteria and a task breakdown
4. **Apply** the plan by generating an execution DAG, running specialized agents in parallel, verifying the result, and auto-fixing issues
5. **Archive** the completed change into the knowledge base and commit

Each step uses domain-specialized agents that understand JUDO conventions, have access to the right tools, and are sandboxed to prevent accidental damage.

---

## Requirements

- [pi](https://github.com/badlogic/pi-mono) v0.58.4+
- [pi-flows](https://github.com/BlackBeltTechnology/pi-flows) (installed automatically as a dependency)
- Node.js 20.6+
- Java (for `judo-cli.jar` — the JUDO model CLI)
- A JUDO project with `model/*.model` files

---

## Installation

**Global** (available in all projects):

```bash
pi install git:github.com/BlackBeltTechnology/pi-flows
pi install git:github.com/BlackBeltTechnology/pi-judo
```

**Local** (project-only, saved to `.pi/settings.json`):

```bash
pi install -l git:github.com/BlackBeltTechnology/pi-flows
pi install -l git:github.com/BlackBeltTechnology/pi-judo
```

> **Note:** pi-flows must be installed before or alongside pi-judo. pi-judo registers all its agents, flows, and skills with the pi-flows engine on activation.

---

## Quick Start

### 1. Open a JUDO project

pi-judo activates automatically when it detects `model/*.model` files in the working directory. If no model files are found, JUDO flows are disabled and a warning is displayed.

### 2. Set up providers and roles

JUDO agents use model roles to select appropriate LLMs for different tasks:

```
/provider       Add an LLM provider (Anthropic, OpenAI, etc.)
/roles          Assign models to roles
```

The roles used by JUDO agents:

| Role | Used For |
|------|----------|
| `@planning` | Architecture, proposals, verification, orchestration |
| `@coding` | Code generation — model mutations, backend, frontend |
| `@research` | Codebase investigation and analysis |
| `@compact` | Summarization and brief outputs |

### 3. Research the codebase

```
/judo:research    Investigate the project architecture
```

Select which domains to research (Model, Backend, Frontend, or All). Research results are written to `judospec/research/`.

### 4. Plan your change

```
/judo:plan        Add customer status tracking with active/inactive states
```

The planner creates a proposal with acceptance criteria, design decisions, and a task breakdown. GAP markers are inserted where decisions need user input.

### 5. Execute the plan

```
/judo:apply       Apply the customer status change
```

A flow writer generates an execution DAG from your tasks, agents run in parallel (model → backend ∥ frontend → tests), a verifier checks acceptance criteria, and a backpropagator creates fix flows if issues are found.

### 6. Archive when done

```
/judo:archive
```

Merges change knowledge into the global research base, updates the changelog, and commits.

---

## Pipeline Overview

The SDD pipeline follows a **research → discuss → plan → apply → archive** lifecycle. Each stage is a pi-flows flow registered as a slash command.

```
/judo:research ──▶ /judo:discuss ──▶ /judo:plan ──▶ /judo:apply ──▶ /judo:archive
     │                  │                 │               │                │
     ▼                  ▼                 ▼               ▼                ▼
 Select domains    Decompose into    Create/revise    Generate DAG     Merge knowledge
 Run researchers   design decisions  proposal+tasks   Run agents       Update changelog
 Summarize         User/AI decide    GAP resolution   Verify + fix     Commit
```

You can enter the pipeline at any stage. For example, skip research if you already know the codebase, or jump straight to `/judo:apply` if you've written the proposal manually.

### `/judo:research` — Domain Research

Asks which domains to research (Model, Backend, Frontend, All), then dispatches researchers in parallel with model-first dependency ordering. Model research runs first because backend and frontend researchers need model context.

```
fork: select domains
        │
        ▼
judo-model-researcher          (queries model via model_cli)
        │
   ┌────┴────┐
   ▼         ▼
backend   frontend              (parallel, after model completes)
   │         │
   └────┬────┘
        ▼
judo-summarizer ──▶ judospec/research/summary.md
```

**Output:** Research files in `judospec/research/` — `model.md`, `backend.md`, `frontend.md`, and `summary.md`.

### `/judo:discuss` — Design Discussion

An interactive flow that decomposes research into categorized design decisions, separating **high-priority** cascading choices (model shape, relations, security boundaries) from **low-priority** localized ones (labels, tooltips, cosmetic spacing).

```
decompose research into questions
        │
        ▼
fork: high-priority decisions
   ┌────┴────┐
   ▼         ▼
 user      delegate           (user answers or delegates to Claude)
 answers   to Claude
   │         │
   └────┬────┘
        ▼
fork: low-priority decisions
        │
        ▼
finalize → override gate → design.md
```

The user can answer questions themselves, delegate to Claude, or mix both. An override gate at the end lets the user review and change any AI-made decisions.

**Output:** `judospec/changes/<name>/design.md` with categorized, attributed decisions.

### `/judo:plan` — Proposal & Design

Creates or revises a proposal. Auto-detects whether a proposal already exists and routes accordingly:

- **No proposal** → optional design discussion → create proposal + tasks → GAP check loop
- **Proposal exists** → fork: revise, discuss gaps, or start fresh

```
detect-state ── has proposal.md?
   ┌────┴────┐
   ▼         ▼
create     revise/discuss
   │         │
   ▼         ▼
proposal-writer ◀──────────────┐
   │                           │
   ▼                           │
gap-check loop ── has gaps? ──▶ fill gaps
   │                              │
 no gaps                    user answers
   ▼
plan-done ──▶ summarizer
```

**GAP markers:** When the proposal writer lacks backing from research or design for a decision, it inserts inline `<!-- GAP: question -->` markers. The gap-check loop presents these to the user for resolution, then rewrites the proposal. This loops up to 3 times until all gaps are resolved.

**Output:** `judospec/changes/<name>/proposal.md`, `tasks.md`, and optionally `design.md`.

### `/judo:apply` — Execute & Verify

Two-phase execution: a **flow-writer agent** reads `tasks.md` and generates a DAG, then the engine runs it. Verification loops with bounded backpropagation.

```
judo-flow-writer ── reads tasks.md, writes apply-exec.yaml
        │
        ▼
flow-ref: apply-exec.yaml ── generated DAG runs
        │                       (model → backend ∥ frontend → tests)
        ▼
judo-verifier ── build + acceptance criteria check
        │
   ┌────┴────┐
   ▼         ▼
 pass      gaps found
   │         ▼
   │    backpropagator ── generates fix-N.yaml
   │         ▼
   │    flow-ref: fix-N.yaml
   │         │
   │    (back to verifier, max 3 iterations)
   ▼
judo-summarizer ──▶ judo-git-manager ──▶ commit
```

**Key constraints enforced by the flow writer:**
- **Serial model mutations** — model-designer steps are always sequential (never parallel) because the model CLI operates on shared state
- **Dependency ordering** — backend/frontend steps depend on the last model step; test steps depend on their implementation steps
- **Exclusion rule** — verifier, backpropagator, summarizer, and git-manager are handled by the parent flow, not the generated DAG

**Output:** `apply-exec.yaml` (generated DAG), `verification.md`, optionally `fix-N.yaml` files.

### `/judo:archive` — Finalize

Sequential: merge change research into global knowledge, append changelog entry, commit. After the archive flow completes, the extension automatically cleans up generated flow artifacts (`apply-exec.yaml`, `fix-*.yaml`) and moves the change directory to `judospec/archived-changes/`.

```
judo-archiver ──▶ judo-git-manager
```

**Output:** Updated `judospec/research/` files, `judospec/CHANGELOG.md`, git commit.

---

## Commands

| Command | Description |
|---------|-------------|
| `/judo:research` | Research selected domains — model, backend, frontend |
| `/judo:discuss` | Interactive design Q&A — decompose research into prioritized decisions |
| `/judo:plan` | Create, revise, or discuss a proposal with GAP resolution |
| `/judo:apply` | Generate execution DAG, run agents, verify, fix, commit |
| `/judo:archive` | Merge knowledge, update changelog, commit |
| `/judo:status` | Show status of all tracked changes |

All `/judo:*` commands require a JUDO project (model files must exist). The status command shows per-change progress:

```
/judo:status

2 change(s):

  customer-status
    ✓ research  ✓ design  ✓ proposal  ✓ tasks  ○ apply-exec  ○ verification
    Phase: planned

  order-refactor
    ✓ research  ○ design  ○ proposal  ○ tasks  ○ apply-exec  ○ verification
    Phase: created
```

---

## Agents

pi-judo provides 16 specialized agents organized by pipeline phase. Each agent is a `.md` file with YAML frontmatter defining its model role, tools, skills, access rules, and dashboard card type.

### Research Agents

| Agent | Description | Model Role | Key Tools |
|-------|-------------|:----------:|-----------|
| `judo-model-researcher` | Explores ESM model structure via read-only GraphQL queries | `@research` | `model_cli`, `skill_read` |
| `judo-backend-researcher` | Investigates Java backend patterns, custom operations, interceptors | `@research` | `read`, `grep`, `find`, `skill_read` |
| `judo-frontend-researcher` | Investigates React hooks, UI generation patterns, theme customizations | `@research` | `read`, `grep`, `find`, `skill_read` |
| `judo-web-researcher` | Researches external libraries, APIs, and third-party documentation | `@research` | `read`, `bash`, `grep`, `skill_read` |
| `judo-summarizer` | Produces unified summary from domain research outputs | `@compact` | `read`, `write`, `grep` |

**Research agent design:**
- The model researcher uses `model_cli` exclusively — no file reads, no bash. This ensures all model access goes through the GraphQL interface.
- Backend and frontend researchers have read-only access scoped to their domain directories (`application/` and `frontend/` respectively).
- All researchers receive model context from the model researcher via input wiring, so they understand the data model their domain implements.

### Planning Agents

| Agent | Description | Model Role | Key Tools |
|-------|-------------|:----------:|-----------|
| `judo-proposal-writer` | Creates/revises proposals with WHEN/THEN specs, resolves GAP markers | `@planning` | `read`, `write`, `grep`, `skill_read` |
| `judo-flow-writer` | Generates execution DAG flows from `tasks.md` | `@planning` | `read`, `grep`, `flow_write` |

**Proposal writer modes:** The proposal writer operates in five modes determined by the task prefix:
1. **Detect** — checks if `proposal.md` exists (lightweight filesystem check)
2. **Create** — synthesizes research into a proposal with acceptance criteria
3. **Revision** — inserts GAP markers where the user wants changes
4. **Gap resolution** — resolves `<!-- GAP: ... -->` markers using user answers
5. **Pre-proposal design discussion** — decomposes research into categorized decisions

### Development Agents

| Agent | Description | Model Role | Key Tools |
|-------|-------------|:----------:|-----------|
| `judo-model-designer` | Designs and mutates ESM model entities via GraphQL mutations | `@coding` | `model_cli`, `skill_read` |
| `judo-backend-developer` | Implements Java custom operations, interceptors, DAO code | `@coding` | `read`, `write`, `edit`, `bash`, `skill_read` |
| `judo-frontend-developer` | Builds React hooks, component overrides, theme modifications | `@coding` | `read`, `write`, `edit`, `bash`, `skill_read` |
| `judo-external-developer` | Non-JUDO code — scripts, utilities, external integrations | `@coding` | `read`, `write`, `edit`, `bash` |

**Development agent sandboxing:**
- The model designer has **only** `model_cli` access — no bash, no file read/write. All model changes go through GraphQL mutations.
- Backend and frontend developers are scoped to their domain paths via `access:` rules and cannot run `./judo.sh build` or `rm -rf`.
- The external developer is isolated from all JUDO infrastructure — no access to `judo-cli.jar`, `judo.sh`, or Maven.

### Testing Agents

| Agent | Description | Model Role | Key Tools |
|-------|-------------|:----------:|-----------|
| `judo-integration-tester` | Writes backend integration tests using `judo-runtime-core-testkit` | `@coding` | `read`, `write`, `edit`, `bash`, `skill_read` |
| `judo-e2e-tester` | Writes Playwright E2E tests for frontend scenarios | `@coding` | `read`, `write`, `edit`, `bash`, `skill_read` |
| `judo-verifier` | Builds the project and verifies acceptance criteria from the proposal | `@planning` | `read`, `grep`, `bash`, `model_cli`, `skill_read` |
| `judo-backpropagator` | Analyzes verification gaps and creates targeted fix flows | `@planning` | `read`, `write`, `edit`, `grep`, `flow_write` |

**Verification loop:**
- The verifier is the **only** agent allowed to run `./judo.sh build` — it has unrestricted bash access.
- After building, it checks every WHEN/THEN acceptance criterion from the proposal and queries the model to verify structural changes.
- If gaps are found, they're reported in a structured `<gaps>` XML artifact that the backpropagator reads.
- The backpropagator creates a minimal fix flow targeting only the agents needed to resolve the specific gaps, respecting the serial model-designer constraint.

### Lifecycle Agents

| Agent | Description | Model Role | Key Tools |
|-------|-------------|:----------:|-----------|
| `judo-git-manager` | Commits change artifacts to git with structured messages | `@planning` | `read`, `bash`, `grep` |
| `judo-archiver` | Merges change knowledge into global research, updates changelog | `@planning` | `read`, `write`, `edit`, `grep` |

---

## Flows

pi-judo registers 5 flows in the `flows/judo/` directory. Because they're in a `judo/` subdirectory, they auto-register with the `judo:` command prefix.

| Flow File | Command | Description |
|-----------|---------|-------------|
| `judo/research.yaml` | `/judo:research` | Domain research with parallel investigators |
| `judo/discuss.yaml` | `/judo:discuss` | Interactive design Q&A with priority categorization |
| `judo/plan.yaml` | `/judo:plan` | Proposal creation/revision with GAP resolution loop |
| `judo/apply.yaml` | `/judo:apply` | DAG generation → execution → verification → fix loop → commit |
| `judo/archive.yaml` | `/judo:archive` | Knowledge merge → changelog → commit |

### Flow features used

pi-judo flows exercise the full range of pi-flows step types:

| Step Type | Used In | Purpose |
|-----------|---------|---------|
| **Agent steps** | All flows | Dispatch specialized agents with task + inputs |
| **Fork steps** | research, discuss, plan | User choice points (domain selection, approach, gap resolution) |
| **Conditional steps** | plan | Route based on whether `proposal.md` exists |
| **Agent-loop-decision** | plan, apply | GAP resolution loops (max 3), verify/fix loops (max 3) |
| **Flow-ref steps** | apply | Execute generated DAGs (`apply-exec.yaml`, `fix-*.yaml`) via glob |

### Dynamic DAG generation

The apply flow's most distinctive feature is **runtime flow generation**. Instead of hardcoding the implementation steps, a `judo-flow-writer` agent reads `tasks.md` and produces a `.yaml` file with one step per task, properly wired by dependencies. The parent `apply.yaml` then executes this generated flow via a `flow-ref` step with a glob pattern (`judospec/changes/*/apply-exec.yaml`).

This allows the same apply flow to handle any change, regardless of how many tasks it involves or which agents are needed.

---

## Skills

Skills are JUDO-specific reference documentation that get injected into agent system prompts. Each skill is a directory with a `SKILL.md` entry point and optional detail files readable via the `skill_read` tool.

| Skill | Description | Used By |
|-------|-------------|---------|
| `judo-model-docs` | ESM metamodel, entity types, relations, enumerations, modeling patterns, JQL | Model researcher, proposal writer |
| `judo-model-cli` | GraphQL querying, introspection, ESM→PSM→ASM transforms, tracing | Model researcher, model designer, backend/frontend researchers, verifier, testers |
| `judo-model-cli-mutations` | GraphQL mutations — create, update, delete model elements, save/discard | Model designer |
| `judo-backend-docs` | Custom operations, interceptors, DAO, error handling, auth, i18n, SDK | Backend researcher, backend developer, proposal writer |
| `judo-frontend-docs` | React hooks, component overrides, themes, state management, ESM→UI mappings | Frontend researcher, frontend developer, proposal writer |
| `judo-integration-testing-docs` | `judo-runtime-core-testkit` setup, test patterns, fixtures, debugging | Integration tester, backend developer |
| `judo-e2e-testing-docs` | Playwright setup, page objects, test scenarios, CI configuration | E2E tester |
| `judo-deployment-docs` | `judo.sh` build commands, Docker setup, Maven, troubleshooting | Verifier, E2E tester |
| `judo-domain-docs` | Domain-specific business rules, constraints, and project conventions | Proposal writer |

### Skill structure

```
skills/
├── judo-model-docs/
│   ├── SKILL.md                    # Injected into system prompt
│   ├── model-development.md        # Detail file (via skill_read)
│   ├── advanced-modeling-patterns.md
│   ├── generalization-guide.md
│   ├── xmi-id-traceability.md
│   └── esm_metamodel/
│       ├── SKILL.md
│       └── namespace.md
├── judo-frontend-docs/
│   ├── SKILL.md
│   ├── theming.md
│   ├── i18n.md
│   ├── development-workflow.md
│   ├── hooks/SKILL.md
│   └── esm-to-ui-mappings/
│       ├── SKILL.md
│       └── widgets.md
└── ...
```

Agents declare skills in their frontmatter (`skills: judo-model-cli, judo-model-docs`), and the `SKILL.md` content is prepended to their system prompt. Detail files within the skill directory are accessible at runtime via the `skill_read` tool, giving agents on-demand access to deep reference material without bloating the initial context.

---

## Model CLI Tool

The `model_cli` tool provides GraphQL-based access to JUDO ESM models. It's registered as a custom tool via pi-flows' `flow:register-tool` event, making it available to any agent that declares `tools: model_cli`.

### Commands

| Command | Description |
|---------|-------------|
| `graphql` | Execute a GraphQL query or mutation against the model |
| `validate` | Validate the current model state |
| `transform` | Run ESM → PSM → ASM transformation pipeline |
| `save` | Persist model changes to disk |
| `discard` | Revert all unsaved model changes |
| `status` | Show current model state |

### Example usage

```
model_cli command=graphql query='{ entityTypes { name fields { name type } } }'
model_cli command=graphql query='mutation { createEntityType(input: { name: "Order" }) { name } }'
model_cli command=save
```

### How it works

1. The tool auto-detects the `.model` file in `model/` and the `judo-cli.jar` in `target/`
2. A background server process is started on first use and stopped on session shutdown
3. GraphQL mutations are tracked — the footer shows a live mutation count
4. The `discard` command resets the mutation counter

### Two access levels

- **`model_cli`** (read/write) — used by `judo-model-designer`. Supports queries and mutations.
- **`judo-model-cli` skill** (read-only documentation) — loaded by researchers who need to understand the model but should not modify it. The researcher agents only have `graphql` command access with query-only instructions in their system prompt.

---

## Model Protection Guard

pi-judo enforces a strict rule: **no agent may read or write `.model` files directly**. All model access must go through `model_cli`.

The guard intercepts tool calls at the extension level:

| Tool | Blocked When |
|------|-------------|
| `read`, `grep` | Path targets a `.model` file |
| `glob` | Pattern references `.model` files |
| `write`, `edit` | Path targets a `.model` file |
| `bash` | Command includes `cat`, `sed`, `grep`, etc. on a `.model` file |

This guard is applied to:
1. **The main session** — via `pi.on("tool_call", guard)`
2. **All spawned agent processes** — via `flow:register-guard-extension`, which injects the guard into subagent sessions

---

## Dashboard Integration

pi-judo extends the pi-flows dashboard with custom cards, workflow breadcrumbs, and footer segments.

### Dashboard Cards

Each agent type has a specialized card renderer that shows domain-specific metrics during flow execution:

| Card Type | Metric | Shows |
|-----------|--------|-------|
| `model` | Model | GraphQL query count, mutation count, save/discard status |
| `researcher` | Researcher | Discovered files and patterns |
| `developer` | Developer | Code changes, file modifications |
| `writer` | Writer | Generated documentation metrics |
| `chain` | Chain | Multi-step chain progress |
| `tester` | Tester | Test counts, pass/fail status |
| `verifier` | Verifier | Build status, acceptance criteria results |

Cards are registered via `flow:register-card` and automatically activated when a matching agent runs.

### Workflow Breadcrumbs

pi-judo registers a `judo-sdd` workflow with pi-flows that connects all pipeline stages:

```
research → discuss → plan → apply → archive
```

When any JUDO flow runs, the dashboard summary widget shows breadcrumb navigation indicating which pipeline stage just completed and what comes next.

### Footer Segments

Two footer segments appear in the status bar when working in a JUDO project:

| Segment | Shows |
|---------|-------|
| **Mutations** | Live count of model mutations in the current session (e.g., `3 mut`) |
| **Server** | Model server status: `● server (ModelName)` running, `◐ server` starting, `○ server` stopped, `✗ server` error |

---

## State Management

pi-judo uses a **filesystem-is-the-state** approach — no registry files, no JSON state. The current phase of a change is derived entirely from which files exist in its directory:

| File Exists | Phase |
|-------------|-------|
| (directory created) | `created` |
| `design.md` | `designed` |
| `proposal.md` | `proposed` |
| `tasks.md` | `planned` |
| `apply-exec.yaml` | `applying` |
| `verification.md` | `verified` |

The `/judo:status` command reads the filesystem to report per-change progress. Agents discover the active change by globbing `judospec/changes/*/` — if only one directory exists, that's the active change.

### Post-archive cleanup

When the archive flow completes successfully, the extension automatically:
1. Deletes generated flow artifacts (`apply-exec.yaml`, `fix-*.yaml`) from the change directory
2. Moves the entire change directory to `judospec/archived-changes/`

---

## Project Structure

pi-judo expects and creates the following structure in your JUDO project:

```
your-project/
├── model/                          # JUDO .model files (must exist for activation)
│   └── *.model
├── target/
│   └── judo-cli.jar                # Built JUDO CLI (required for model_cli)
├── application/                    # Backend Java code
│   ├── app/
│   └── interceptors/
├── frontend/                       # Frontend React code
│   ├── src/
│   └── overrides/
└── judospec/                       # Created by pi-judo
    ├── research/                   # Global research output
    │   ├── model.md
    │   ├── backend.md
    │   ├── frontend.md
    │   └── summary.md
    ├── changes/                    # Per-change directories
    │   └── <change-name>/
    │       ├── design.md           # Design decisions (from /judo:discuss)
    │       ├── proposal.md         # Proposal with WHEN/THEN specs
    │       ├── tasks.md            # Implementation task breakdown
    │       ├── verification.md     # Verification report
    │       ├── apply-exec.yaml     # Generated execution DAG (ephemeral)
    │       └── fix-*.yaml          # Generated fix flows (ephemeral)
    ├── archived-changes/           # Completed changes (moved after archive)
    ├── summaries/                  # Change summaries
    ├── CHANGELOG.md                # Maintained by archiver
    └── logs/                       # Build logs from verifier
```

---

## Architecture — How pi-judo Extends pi-flows

pi-judo is a pure pi-flows extension package. It registers all of its resources through pi-flows' event-based extension API from a single `activate` function:

```typescript
export default function activate(pi: ExtensionAPI) {
  // Register agents, flows, and skills directories
  pi.events.emit("flow:register-agents-dir", { dir: join(pkgRoot, "agents") });
  pi.events.emit("flow:register-flows-dir",  { dir: join(pkgRoot, "flows") });
  pi.events.emit("flow:register-skills-dir", { dir: join(pkgRoot, "skills") });

  // Register custom dashboard cards
  pi.events.emit("flow:register-card", { name: "model", factory: () => new ModelCard() });
  // ... 6 more card types

  // Register the SDD workflow for breadcrumb navigation
  pi.events.emit("flow:register-workflow", { id: "judo-sdd", stages: [...] });

  // Register a gate: JUDO flows require model/*.model files
  pi.events.emit("flow:register-gate", { name: "judo-project", check: () => judoEnabled, ... });

  // Register the model_cli tool for agent sessions
  pi.events.emit("flow:register-tool", { tool: modelCliTool });

  // Register the model protection guard for spawned agents
  pi.events.emit("flow:register-guard-extension", { factory: (piApi) => { ... } });

  // Register footer segments
  pi.events.emit("flow:register-footer-segment", { name: "judo-mutations", ... });
  pi.events.emit("flow:register-footer-segment", { name: "judo-server", ... });
}
```

### Extension events used

| pi-flows Event | pi-judo Usage |
|----------------|---------------|
| `flow:register-agents-dir` | Register 16 JUDO agent `.md` files |
| `flow:register-flows-dir` | Register 5 JUDO flow `.yaml` files |
| `flow:register-skills-dir` | Register 9 JUDO skill directories |
| `flow:register-card` | Register 7 custom dashboard card renderers |
| `flow:register-workflow` | Register the SDD pipeline for breadcrumb navigation |
| `flow:register-gate` | Block JUDO flows when no model files exist |
| `flow:register-tool` | Make `model_cli` available to flow agent sessions |
| `flow:register-guard-extension` | Inject `.model` file protection into all spawned agents |
| `flow:register-footer-segment` | Add mutation count and server status to the footer |
| `flow:complete` (listener) | Clean up generated flows and archive changes after `/judo:archive` |

### Template variables

Flows use pi-flows' standard template variables (`${{task}}`, `${{result.*}}`, `${{input.*}}`, `${{fork.*}}`, `${{loop.*}}`). There are no JUDO-specific template variables — the extension injects change-scoped paths via `${{task}}` text and agent `context:` file resolution.

### Discovery priority

Project-local agents (`.pi/flows/agents/`) override pi-judo agents, which override pi-flows built-in agents. This lets you customize any JUDO agent for your project by placing a file with the same name in your local agents directory.

---

## Configuration

pi-judo requires no configuration files beyond what pi and pi-flows provide. Its behavior is controlled by:

| Setting | How to Configure | Default |
|---------|-----------------|---------|
| **LLM providers** | `/provider` command | None — must configure at least one |
| **Model roles** | `/roles` command | None — must assign `@planning`, `@coding`, `@research`, `@compact` |
| **JUDO project detection** | Automatic — looks for `model/*.model` | Disabled if not found |
| **Build tool** | `target/judo-cli.jar` must exist | Error on `model_cli` use if missing |
| **Max concurrent agents** | Set per-flow in YAML (`max_concurrent:`) | `3` for research/apply, `1` for discuss/archive, `2` for plan |
| **Verify/fix iterations** | Set in `apply.yaml` (`max_iterations:`) | `3` |

---

## pi-flows Documentation

pi-judo is built entirely on pi-flows. For details on the underlying engine, see:

| Document | Description |
|----------|-------------|
| [pi-flows README](https://github.com/BlackBeltTechnology/pi-flows) | Complete user guide — writing agents, flows, template variables, dashboard |
| [Architecture](https://github.com/BlackBeltTechnology/pi-flows/blob/main/docs/architecture.md) | System overview, component stack, agent isolation model |
| [Creating Packages](https://github.com/BlackBeltTechnology/pi-flows/blob/main/docs/creating-packages.md) | How to build a custom pi-flows package (like pi-judo) |
| [Events API](https://github.com/BlackBeltTechnology/pi-flows/blob/main/docs/events-api.md) | All `flow:*` events with data shapes and examples |
| [Agent Reference](https://github.com/BlackBeltTechnology/pi-flows/blob/main/docs/agents.md) | Agent definition format, frontmatter schema, tools |
| [Flow Reference](https://github.com/BlackBeltTechnology/pi-flows/blob/main/docs/flows.md) | All flow step types — agent, fork, conditional, loop, flow-ref |
| [Skills & Extensions](https://github.com/BlackBeltTechnology/pi-flows/blob/main/docs/skills-and-extensions.md) | Skill directory format, extension API, guard patterns |

---

## License

MIT
