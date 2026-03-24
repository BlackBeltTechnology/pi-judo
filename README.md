# pi-judo

A [pi-package](https://github.com/badlogic/pi-mono) for working with [JUDO](https://github.com/BlackBeltTechnology/judo-community) projects. Provides a complete spec-driven development pipeline with specialized agents, flows, skills, and tools for model-driven development with the JUDO framework.

Requires [pi-flows](https://github.com/BlackBeltTechnology/pi-flows) for flow orchestration and dashboard.

## Install

Global (available in all projects):

```bash
pi install git:github.com/BlackBeltTechnology/pi-flows
pi install git:github.com/BlackBeltTechnology/pi-judo
```

Local (project-only, saved to `.pi/settings.json`):

```bash
pi install -l git:github.com/BlackBeltTechnology/pi-flows
pi install -l git:github.com/BlackBeltTechnology/pi-judo
```

## Quick Start

1. **Open a JUDO project** — pi-judo activates when it finds `model/*.model` files in the working directory.

2. **Set up providers and roles** — JUDO agents use model roles (`@planning`, `@coding`, `@research`, `@modelling`, `@compact`):
   ```
   /provider       Add an LLM provider
   /roles          Assign models to roles
   ```

3. **Run the pipeline** — the full spec-driven development workflow:
   ```
   /judo:research    Research the codebase (select domains)
   /judo:plan        Create or revise a proposal with design decisions
   /judo:apply       Generate execution DAG, implement, verify, fix
   /judo:archive     Merge knowledge, update changelog, commit
   ```

## Pipeline

The JudoSpec pipeline follows a research → plan → apply → archive lifecycle:

```
/judo:research ──▶ /judo:plan ──▶ /judo:apply ──▶ /judo:archive
     │                  │               │                │
     ▼                  ▼               ▼                ▼
 Select domains    Create/revise    Generate DAG     Merge knowledge
 Run researchers   Design Q&A      Run agents       Update changelog
 Summarize         GAP resolution  Verify + fix     Commit
```

### `/judo:research` — Domain Research

Asks which domains to research (model, backend, frontend), then dispatches researchers in parallel with model-first dependency ordering.

```
fork: select domains
        │
        ▼
judo-model-researcher
        │
   ┌────┴────┐
   ▼         ▼
backend   frontend    (parallel, blockedBy model)
   │         │
   └────┬────┘
        ▼
judo-summarizer ──▶ judospec/research/summary.md
```

### `/judo:plan` — Proposal & Design

Merged discuss + proposal flow. Auto-detects whether a proposal exists:

- **No proposal** → optional design discussion → create proposal + tasks → GAP check loop
- **Proposal exists** → fork: revise, discuss design, or start fresh → GAP resolution loop

```
conditional: has-proposal?
        │
   ┌────┴────┐
   ▼         ▼
create     revise/discuss
   │         │
   ▼         ▼
proposal-writer ◀──────────────┐
   │                           │
   ▼                           │
gap-check loop ── has gaps? ──▶ fork: resolve gaps
   │                              │
 no gaps                    user answers
   ▼
plan-complete
```

### `/judo:apply` — Execute & Verify

Two-phase execution: a **flow-writer agent** generates a DAG from tasks.md, then the engine runs it. Verification loops with bounded backpropagation.

```
judo-flow-writer ── reads tasks.md, writes apply.flow.md
        │
        ▼
flow-ref: apply.flow.md ── generated DAG runs
        │                   (model → backend ∥ frontend → tests)
        ▼
judo-verifier ── build + acceptance criteria
        │
   ┌────┴────┐
   ▼         ▼
 pass      gaps found
   │         ▼
   │    backpropagator ── generates fix.flow.md
   │         ▼
   │    flow-ref: fix.flow.md
   │         │
   │    (back to verifier, max 3 iterations)
   ▼
judo-summarizer ──▶ judo-git-manager
```

### `/judo:archive` — Finalize

Sequential: merge change research into global knowledge, append changelog, commit.

```
judo-archiver ──▶ judo-git-manager
```

## Commands

| Command | Description |
|---------|-------------|
| `/judo:research` | Research selected domains — model, backend, frontend |
| `/judo:plan` | Create, revise, or discuss a proposal with GAP resolution |
| `/judo:apply` | Generate execution DAG, run agents, verify, fix, commit |
| `/judo:archive` | Merge knowledge, update changelog, commit |
| `/judo:status` | Show status of all tracked changes |

## Agents

### Research

| Agent | What It Does | Model Role |
|-------|-------------|------------|
| `judo-model-researcher` | Explores ESM model structure via `model_cli` | `@research` |
| `judo-backend-researcher` | Investigates Java backend patterns and services | `@research` |
| `judo-frontend-researcher` | Investigates React hooks, UI generation patterns | `@research` |
| `judo-summarizer` | Produces unified summary from research outputs | `@compact` |

### Planning

| Agent | What It Does | Model Role |
|-------|-------------|------------|
| `judo-proposal-writer` | Creates/revises proposals, resolves GAP markers (3 modes) | `@planning` |
| `judo-flow-writer` | Generates execution DAG flows from tasks.md | `@planning` |

### Development

| Agent | What It Does | Model Role |
|-------|-------------|------------|
| `judo-model-designer` | Designs and mutates ESM model entities via `model_cli` | `@modelling` |
| `judo-backend-developer` | Implements custom operations, interceptors, DAO code | `@coding` |
| `judo-frontend-developer` | Builds React hooks, component overrides, theme mods | `@coding` |
| `judo-external-developer` | Non-JUDO code — scripts, utilities, external integrations | `@coding` |

### Testing & Verification

| Agent | What It Does | Model Role |
|-------|-------------|------------|
| `judo-integration-tester` | Writes backend integration tests using testkit | `@coding` |
| `judo-e2e-tester` | Writes Playwright E2E tests for frontend scenarios | `@coding` |
| `judo-verifier` | Builds the project and verifies acceptance criteria | `@planning` |
| `judo-backpropagator` | Analyzes verification gaps and creates fix flows | `@planning` |

### Lifecycle

| Agent | What It Does | Model Role |
|-------|-------------|------------|
| `judo-git-manager` | Commits change artifacts to git | `@planning` |
| `judo-archiver` | Archives completed changes and updates changelog | `@planning` |

## Skills

Skills are reference documentation injected into agents automatically based on their `skills:` field.

| Skill | Covers |
|-------|--------|
| `judo-model-docs` | Entity types, transfer objects, relations, enumerations, access points, constraints |
| `judo-model-cli` | GraphQL querying, mutations, ESM/PSM/ASM transforms, tracing |
| `judo-model-cli-readonly` | Read-only model exploration (for researchers) |
| `judo-backend-docs` | Custom operations, interceptors, DAO, error handling, auth, i18n |
| `judo-frontend-docs` | React hooks, component overrides, themes, state management, testing |
| `judo-integration-docs` | Testkit setup, test patterns, fixtures, debugging |
| `judo-e2e-docs` | Playwright setup, page objects, test scenarios, CI |
| `judo-deployment-docs` | Build system, Maven, deployment, troubleshooting, verification |

## Model CLI Tool

The `model_cli` tool provides GraphQL-based access to JUDO ESM models. Agents use this instead of reading `.model` files directly — direct model file access is blocked by a protection guard.

The tool automatically starts a model server when first used and stops it when idle.

Two variants:
- **`model_cli`** — full read/write access (used by `judo-model-designer`)
- **`model_cli_readonly`** — read-only access as a skill (used by researchers)

## Dashboard Cards

When flows run, the dashboard shows specialized cards for each agent type:

| Card Type | Shows |
|-----------|-------|
| Model | Mutation count, entity stats |
| Researcher | Discovered files and patterns |
| Developer | Code changes, file modifications |
| Writer | Generated documentation metrics |
| Tester | Test counts, pass/fail status |
| Verifier | Build status, acceptance criteria results |

## Architecture Notes

**Template variables**: Flows use only pi-flows' available variables (`{task}`, `{result.*}`, `{input.*}`, `{fork.*}`, `{loop.*}`). There are no `{change_id}` or `{change_dir}` variables — the extension injects change-scoped paths via `{task}` and agent `context:` file resolution.

**Dynamic DAG generation**: The apply flow uses a `judo-flow-writer` agent with pi-flows' built-in `flow_write`/`flow_validate` tools to generate execution DAGs from `tasks.md`. Generated flows are referenced via `flow-ref` with glob patterns (`judospec/changes/*/apply.flow.md`).

**Agent access control**: Each agent declares `access:` rules in frontmatter (read/write paths, bash deny lists). The guard extension enforces these rules at tool-call time. Direct `.model` file access is universally blocked — agents use `model_cli` instead.

**Serial model mutations**: Model-designer steps are always sequential (never parallel) in generated DAGs. The flow-writer enforces this constraint.

## Project Structure

pi-judo expects and creates the following in your JUDO project:

```
your-project/
├── model/                          # JUDO .model files (must exist)
└── judospec/
    ├── research/                   # Global research output
    │   ├── model.md
    │   ├── backend.md
    │   ├── frontend.md
    │   └── summary.md
    ├── changes/                    # Per-change directories
    │   └── <change-name>/
    │       ├── proposal.md
    │       ├── design.md
    │       ├── tasks.md
    │       ├── verification.md
    │       ├── apply.flow.md       # Generated execution DAG
    │       └── fix-*.flow.md       # Generated fix flows
    ├── summaries/                  # Change summaries
    ├── archived-changes/           # Completed changes
    └── CHANGELOG.md
```

## Requirements

- [pi](https://github.com/badlogic/pi-mono) v0.58.4+
- [pi-flows](https://github.com/BlackBeltTechnology/pi-flows)
- Node.js 20.6+
- A JUDO project with `model/*.model` files

## License

MIT
