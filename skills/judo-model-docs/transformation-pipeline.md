# Transformation Pipeline

The JUDO platform turns the developer-authored **ESM** (Entity State Model) into runtime-ready artifacts through a sequence of model-to-model transformations. This document describes the pipeline as a **platform concept** — what each stage produces, when it runs, and what state lives where.

## Pipeline shape

```
                                                  ┌────► Measure
                                                  │
ESM ──[esm2psm]──► PSM ──[psm2asm]──► ASM ──[asm2expression]──► Expression
                                       │
                                       ├──[asm2script]──► Script ──[script2operation]──► Operation
                                       │
                                       ├──[asm2rdbms]──► RDBMS ──[rdbms2liquibase]──► Liquibase
                                       │
                                       └──[asm2keycloak]──► Keycloak
```

## Layer meanings

| Layer | What it represents | Authored or derived |
|---|---|---|
| **ESM** (Entity State Model) | The single source of truth: entities, attributes, relations, transfer objects, actors, access points, operations, UI definitions. Platform-independent. | **Authored** by developers (via the CLI). |
| **PSM** (Platform-Specific Model) | Resolved inheritance hierarchies, transfer object structures, and platform mappings. The bridge layer. | Derived. |
| **ASM** (Application-Specific Model) | EMF/Ecore runtime structures: EClasses, EPackages, query expressions, scripted operations. | Derived. |
| **RDBMS** | Database schema model: tables, columns, foreign keys, indexes. Dialect-specific (PostgreSQL, HSQLDB). | Derived. |
| **Measure** | Units of measure and derived units extracted from the model. | Derived. |
| **Expression** | Compiled query and derivation expressions. | Derived. |
| **Script** / **Operation** | Operation-level metamodels driving runtime behaviour. | Derived. |
| **Keycloak** | Realm, client, and role mappings derived from access points. | Derived. |
| **Liquibase** | Database migration changesets generated from the RDBMS schema. | Derived. |

The **only** layer ever edited is ESM. Every other layer is regenerated.

## Where derived models live

Server-side derived models are written to:

```
application/model/target/cli-generated/
  ├── northwind-esm.model
  ├── northwind-psm.model
  ├── northwind-asm.model
  ├── northwind-rdbms_postgresql.model
  ├── northwind-measure.model
  ├── northwind-expression.model
  ├── northwind-esm2psm.model         (trace)
  ├── northwind-psm2asm.model         (trace)
  └── northwind-asm2rdbms_*.model     (trace)
```

The `*2*.model` files are **trace models** — they record which derived element came from which source element. The platform's traceability mechanism uses these. See [xmi-id-traceability.md](xmi-id-traceability.md).

## Server-side vs client-side regeneration

The pipeline is split across two execution contexts:

| | Server-side pipeline | Client-side pipeline |
|---|---|---|
| **Trigger** | CLI `transform` command | `./judo.sh build -f` (frontend full build) |
| **Maven plugin** | `judo-tatami-workflow-maven-plugin` | `judo-tatami-client-workflow-maven-plugin` |
| **Defined in** | `application/model/pom.xml` | `application/frontend-react/model/pom.xml` |
| **Reads** | `model/northwind.model` | `model/northwind.model` |
| **Produces** | PSM, ASM, RDBMS, Measure, Expression, Script, Operation, Keycloak, Liquibase | UI model + regenerated React code |
| **Includes UI?** | **No** | **Yes** |

This split has a sharp consequence: **the CLI's `transform` does not refresh the UI model.** After any ESM change that affects forms, tables, views, menu items, or actor UI scaffolding, `./judo.sh build -f` must run before UI queries return up-to-date results. The CLI will report `ui: loaded` even when the UI model on disk is stale — `--load` only makes the existing UI file visible to GraphQL queries, it does not re-run the client-side transformation.

## In-memory state model

The CLI keeps the loaded model in memory and tracks edits separately from disk:

```
                ┌────────────────────────────────┐
                │      In-memory ESM state       │
                │  (clean | dirty after mutation)│
                └────────────────┬───────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─────────┐             ┌──────────┐             ┌──────────┐
   │  save   │             │ discard  │             │transform │
   │         │             │ --force  │             │ --load   │
   │ writes  │             │          │             │          │
   │ to disk │             │ rolls    │             │ uses     │
   │         │             │ back to  │             │ in-memory│
   │ clears  │             │ disk     │             │ ESM      │
   │ dirty   │             │          │             │ (dirty   │
   │ flag    │             │ clears   │             │  is OK)  │
   └─────────┘             │ dirty    │             └──────────┘
                           │ flag     │
                           └──────────┘
```

A `.model.dirty` marker file alongside the ESM signals pending in-memory edits. **Dirty state survives server restarts** — until a `save` or `discard --force` runs, the dirty edits remain.

## Save / discard / transform-load — when to use which

| Goal | Approach | Why |
|---|---|---|
| Try a mutation, see derived effects, decide whether to keep | `transform --load`, then query the derived models | Transforms from the dirty in-memory ESM and loads the result, without persisting the ESM to disk. The fast feedback loop. |
| Persist a verified mutation | `save` | Only after `transform --load` succeeded and queries confirmed the result. |
| Roll back unwanted in-memory mutations | `discard --force` | Reverts in-memory ESM to the on-disk file. |
| Reset derived models to the official Maven build output | `discard --derived --force` | Drops the CLI's `cli-generated/` outputs and re-syncs to whatever the last Maven build produced. |
| Faster iteration during development | `transform --skip rdbms,liquibase --load` | Skip the heavy database-related stages when only iterating on entity / transfer object shape. |

## The git-restore hazard

A CLI `save` writes the `.model` file to disk but does **not** make a git commit. Any subsequent `git restore model/northwind.model` (or `git checkout HEAD -- model/...`, or `git stash` touching the model path) silently overwrites the saved file with the last committed version, destroying every prior `save`.

Two safe disciplines:

1. **Commit per stage.** Run `git add model && git commit` immediately after every `save` so version control is the durable backstop.
2. **Backup before risky git ops.** Copy the model file to a `.bak` before any `git restore` / `git checkout` / `git stash` that touches the model path.

## Why transform exists alongside the build

`./judo.sh build` runs the same server-side pipeline (and the client-side pipeline, and Maven compilation, and Liquibase migrations). So why does the CLI also expose `transform`?

Because `transform` operates on the **in-memory dirty ESM**, while `./judo.sh build` operates only on the **on-disk saved ESM**. The CLI's transform-load-query loop lets the assistant verify a change is correct **before** committing it to disk and triggering a multi-minute build. The build is still the final authority — it compiles Java, generates React bundles, runs Liquibase migrations. `transform --load` is the fast feedback loop on the model layer alone.

## See also

- [JUDO Model CLI](judo-cli.md) — the tool that drives the pipeline.
- [XMI ID Traceability](xmi-id-traceability.md) — how trace models thread element identity across layers.
