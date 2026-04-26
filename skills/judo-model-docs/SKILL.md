---
name: judo-model-docs
description: Model documentation for JUDO applications. Covers ESM metamodel, cardinality, CRUD flags, and advanced modeling patterns.
disable-model-invocation: false
user-invocable: false
model: inherit
context: fork
agent: general-purpose
---

# Model Documentation

This directory contains documentation related to the application's domain model.

## Model Design & Development

For model design specifications (entities, attributes, relations, operations), see:
- **JUDOSPEC_PIPELINE.md** `## YAML Requirements Format` - Complete YAML specification format
- **`judo-model-cli` skill** - CLI commands for querying and mutating models

**Key principle:** Model changes are designed by `change-architect` using YAML specifications, then executed by `judo-model-designer` using the CLI.

## Reference Documentation

- **[JUDO Model CLI](judo-cli.md)**: The `judo-cli.jar` platform tool — the only sanctioned way to read or change the ESM. **Read this first if you have not used the CLI before.**
- **[Transformation Pipeline](transformation-pipeline.md)**: ESM → PSM → ASM → RDBMS → Liquibase, server-side vs client-side regeneration, and the in-memory state model.
- **[Model Development Guide](model-development.md)**: Modeling workflow, naming conventions, and **JQL expression language reference**.
- **[UI Authoring Guide](ui-authoring-guide.md)**: How to compose `<form>`, `<table>`, `<view>` scaffolds on `TransferObjectType`s and wire them onto an `ActorType` menu. **Read this before authoring UI elements.**
- **[Advanced Modeling Patterns](advanced-modeling-patterns.md)**: Reusable design patterns for common modeling problems.
- **[Generalization Guide](generalization-guide.md)**: Entity inheritance and generalization patterns.
- **[XMI ID Traceability](xmi-id-traceability.md)**: How JUDO maintains traceability from model elements to generated artifacts.
- **[ESM Metamodel](./esm_metamodel/SKILL.md)**: Detailed breakdown of every component in `esm.ecore`.

## Quick Reference

### Cardinality

| Cardinality | Meaning | Example |
|-------------|---------|---------|
| `1..1` | Required single | `order: Order` (must have exactly one) |
| `0..1` | Optional single | `logo: Image` (zero or one) |
| `0..*` | Optional many | `participants: User[]` (zero or more) |
| `1..*` | Required many | `items: OrderItem[]` (at least one) |

### CRUD Flags

| Flag | Purpose |
|------|---------|
| `createable` | Entity instances can be created |
| `updateable` | Entity instances can be modified |
| `deleteable` | Entity instances can be deleted |

### Entity YAML Template

```yaml
name: Customer
namespace: northwind::entities
extends: AbstractEntity
crud:
  createable: true
  updateable: true
  deleteable: true
attributes:
  - name: email
    type: String
    cardinality: 0..1
relations:
  - name: orders
    target: Order
    cardinality: 0..*
    bidirectional: true
    opposite: customer
```
