# pi-judo

A [pi-package](https://github.com/badlogic/pi-mono) for working with [JUDO](https://github.com/BlackBeltTechnology/judo-community) projects. Provides specialized agents, skills, flows, and tools for model-driven development with the JUDO framework.

Depends on [pi-flows](https://github.com/BlackBeltTechnology/pi-flows) for flow orchestration and dashboard infrastructure.

## Install

```bash
pi install git:github.com/BlackBeltTechnology/pi-judo
```

pi-judo requires [pi-flows](https://github.com/BlackBeltTechnology/pi-flows) to be installed as well:

```bash
pi install git:github.com/BlackBeltTechnology/pi-flows
```

## What It Does

pi-judo extends pi with deep knowledge of the JUDO framework — its ESM model layer, generated backend/frontend code, build system, and testing patterns. It provides:

### Model-Driven Tooling

- **`model_cli` tool** — GraphQL-based interface to query and mutate JUDO ESM models (entities, transfer objects, relations, enumerations, access points). Agents use this instead of directly editing `.model` files.
- **Model protection guard** — blocks direct `.model` file reads/edits via `read`, `write`, `edit`, and `bash` tools. All model access goes through `model_cli`.
- **Automatic server lifecycle** — starts the JUDO model server on demand when `model_cli` is used, stops when idle.

### Specialized Agents

15 purpose-built agents covering every aspect of JUDO development:

| Agent | Role | Model | Key Tools |
|-------|------|-------|-----------|
| `judo-model-researcher` | Explore ESM model structure | `@research` | `model_cli` (read-only) |
| `judo-model-designer` | Design and mutate model entities | `@modelling` | `model_cli` |
| `judo-backend-researcher` | Investigate Java backend patterns | `@research` | `read`, `grep`, `skill_read` |
| `judo-backend-developer` | Implement custom operations & interceptors | `@coding` | Full toolset + `skill_read` |
| `judo-frontend-researcher` | Investigate React hooks and UI patterns | `@research` | `read`, `grep`, `skill_read` |
| `judo-frontend-developer` | Build hooks, customizations, theme mods | `@coding` | Full toolset + `skill_read` |
| `judo-integration-tester` | Write backend integration tests | `@coding` | Full toolset + `skill_read` |
| `judo-e2e-tester` | Write Playwright E2E tests | `@coding` | Full toolset + `skill_read` |
| `judo-verifier` | Build project & verify acceptance criteria | `@planning` | `bash`, `model_cli`, `skill_read` |
| `judo-proposal-writer` | Create proposals with WHEN/THEN specs | `@planning` | `read`, `write`, `grep` |
| `judo-summarizer` | Produce unified research summaries | `@compact` | `read`, `write`, `grep` |
| `judo-git-manager` | Commit change artifacts | `@planning` | `bash`, `read`, `grep` |
| `judo-archiver` | Archive completed changes & update changelog | `@planning` | `read`, `write`, `edit`, `grep` |
| `judo-backpropagator` | Analyze verification gaps & create fix chains | `@planning` | `read`, `write`, `edit`, `grep` |
| `judo-external-developer` | Non-JUDO code (scripts, utilities) | `@coding` | Full toolset |

### Skills (Reference Documentation)

8 comprehensive skill sets injected into agents on demand:

| Skill | Covers |
|-------|--------|
| `judo-model-docs` | Entity types, transfer objects, relations, enumerations, access points, constraints |
| `judo-model-cli` | GraphQL querying, mutations, ESM/PSM/ASM transforms, tracing |
| `judo-model-cli-readonly` | Read-only model exploration (for researchers) |
| `judo-backend-docs` | Custom operations, interceptors, DAO, error handling, auth, i18n |
| `judo-frontend-docs` | React hooks, component overrides, themes, state management, testing |
| `judo-integration-docs` | testkit setup, test patterns, fixtures, debugging |
| `judo-e2e-docs` | Playwright setup, page objects, test scenarios, CI |
| `judo-deployment-docs` | Build system, Maven, deployment, troubleshooting, verification |

### Flows

Pre-built orchestration workflows:

| Command | Flow | What It Does |
|---------|------|-------------|
| `/judo:research-all` | `judo/research-all.flow.md` | Full parallel research — model → backend + frontend → summary |
| `/judo:research` | `judo/research.flow.md` | Selective research — pick domains via fork, then parallel research → summary |

Both flows produce a unified summary at `judospec/research/summary.md`.

### Dashboard Integration

Custom card renderers for the pi-flows dashboard:

- **Model card** — shows mutation count and model entity stats
- **Researcher card** — displays discovered files and patterns
- **Developer card** — tracks code changes and file modifications
- **Writer card** — shows generated documentation metrics
- **Tester card** — displays test counts and pass/fail status
- **Verifier card** — shows build status and acceptance criteria results
- **Chain card** — multi-step chain execution progress

### Commands

| Command | Description |
|---------|-------------|
| `/judo:status` | Show all changes status |
| `/judo:research` | Research selected domains (model, backend, frontend) |
| `/judo:research-all` | Research all domains in parallel |

### Other Features

- **Change registry** — tracks change lifecycle (create, switch, phase tracking)
- **Onboarding flow** — guides new projects through initial research
- **Footer segments** — JUDO server status and mutation counter in the footer
- **Session file tracking** — snapshots files before edits, supports tree rewind/restore
- **Project gates** — flows are disabled outside JUDO projects (requires `model/*.model` files)

## Project Structure

```
pi-judo/
├── agents/              # 15 specialized agent definitions
├── extensions/
│   └── judospec/        # Main extension
│       ├── cards/       # Dashboard card renderers
│       ├── commands/    # CLI commands (/judo:status)
│       ├── server/      # JUDO model server lifecycle
│       ├── state/       # Change registry, context resolution
│       ├── tools/       # model_cli tool
│       ├── tui/         # TUI components (save/discard gate)
│       └── utils/       # Helpers
├── flows/
│   └── judo/            # Pre-built flow definitions
├── skills/              # 8 reference documentation sets
├── prompts/             # Prompt templates (placeholder)
└── themes/              # Themes (placeholder)
```

## Requirements

- [pi](https://github.com/badlogic/pi-mono) v0.58.4+
- [pi-flows](https://github.com/BlackBeltTechnology/pi-flows) — flow engine and dashboard
- Node.js 20.6+
- A JUDO project with `model/*.model` files in the working directory

## License

MIT
