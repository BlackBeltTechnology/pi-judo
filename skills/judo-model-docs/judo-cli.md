# JUDO Model CLI

The `judo-cli.jar` is the JUDO platform's command-line interface to the model. Every read of and change to the ESM **must** go through this tool — never by editing the model files directly.

## Identity

| | |
|---|---|
| **Artifact** | `judo-cli.jar` |
| **Location** | `target/judo-cli.jar` (produced by `./judo.sh build`) |
| **Source ESM** | `model/northwind.model` |
| **Interface** | GraphQL over the ESM (and over the derived models, when loaded) |

## Why a CLI is mandatory

The ESM is stored as a single XMI file (`model/northwind.model`). Three properties of that file make it unsafe to read or edit by hand:

- **Size.** A typical project's ESM contains tens of thousands of XMI elements. Reading the file is expensive in token budget and dangerous in attention — patterns spread across thousands of lines are easily missed.
- **Internal cross-references.** Elements reference each other by `xmi:id`. A single hand edit in one part of the file can silently dangle a reference somewhere else, with no immediate error.
- **Schema validation.** The metamodel imposes containment rules, type constraints, and structural invariants. The build will reject mutations that violate them — but only at build time, long after the bad edit was made.

For all three reasons, the CLI exists. It exposes the ESM as a GraphQL graph, validates every mutation against the metamodel before applying it, and runs the platform's transformation pipeline that lifts ESM into PSM, ASM, RDBMS and the other derived models.

## Capability surface

The tool groups its capabilities into a small set of concerns:

| Concern | What it does |
|---|---|
| **Querying & introspection** | Read elements (entity types, transfer objects, relations, operations, UI definitions). Walk relationships. Use schema introspection (`__type`, `__schema`) to discover available fields and types. |
| **Mutation** | Create, update, and delete ESM elements. Metamodel rules are enforced — invalid mutations fail fast, before they reach the build. |
| **Transformation** | Run the platform pipeline ESM → PSM → ASM → RDBMS → Liquibase, producing derived models in `application/model/target/cli-generated/`. See [transformation-pipeline.md](transformation-pipeline.md). |
| **State management** | Load, save, and discard model state. Track in-memory edits via the `.model.dirty` flag. |
| **Tracing** | Follow an element from its ESM origin through every derived model down to the runtime artifact (and back). |

## Mandatory rules

These rules are **platform invariants**, not preferences. Violating them produces incorrect or destructive results.

1. **Never read the `.model` XML file directly.** Always go through CLI queries. The XML is too large to safely read in attention, and any analysis that bypasses the GraphQL view is unverified.

2. **Never edit the `.model` XML file directly.** Even tiny hand edits can break `xmi:id` references in distant parts of the file. Always go through CLI mutations.

3. **Always paginate query results.** Use `limit`, `offset`, and `totalCount` together. Without explicit pagination, large result sets are silently truncated and the assistant operates on a partial view of the model.

4. **Never `save` blindly.** Always run the transformation pipeline (`transform --load`) and verify the derived models query correctly **before** persisting an ESM mutation. A `save` without prior validation can leave the model in a state that the next build will reject.

5. **The `transform` command is server-side only.** It regenerates PSM, ASM, RDBMS, Liquibase — but it does **not** regenerate the UI model. After any UI-affecting ESM mutation (forms, tables, views, menu items, actor scaffolding), the client-side build (`./judo.sh build -f`) must run before UI queries reflect reality. See [transformation-pipeline.md](transformation-pipeline.md).

6. **`save` writes to disk; it does not commit.** A CLI `save` overwrites the on-disk `.model` file but does not make a git commit. Running `git restore` or `git checkout` on the model file at any later point silently destroys every uncommitted save. Either commit immediately after each `save`, or copy the model file to a backup before any git operation that could touch it.

## Reach for the CLI when…

- You need to know what is currently in the model (entities, attributes, relations, actors, UI definitions).
- You need to add, modify, or remove any model element.
- You need to verify that a model change actually transformed correctly.
- You need to trace where a runtime artifact (REST endpoint, database table, UI form) originates in the ESM.

## Do not reach for the CLI for…

- Reading or modifying the application's Java source code (use the file system).
- Reading or modifying the React frontend's custom hooks, overrides, or theme files (use the file system).
- Building the project (use `./judo.sh build`).

The CLI's authority is the model. Code, build, and runtime concerns live elsewhere.

## See also

- [Transformation Pipeline](transformation-pipeline.md) — what `transform` produces, and the boundary between server-side and client-side regeneration.
- [Model Development](model-development.md) — modeling workflow, naming conventions, JQL.
- [UI Authoring Guide](ui-authoring-guide.md) — what to put in the model when authoring UI.
- [XMI ID Traceability](xmi-id-traceability.md) — how the platform tracks an element through the pipeline.
