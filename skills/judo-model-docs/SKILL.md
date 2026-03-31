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

- **[Model Development Guide](model-development.md)**: Modeling workflow, naming conventions, and **JQL expression language reference**.
- **[Advanced Modeling Patterns](advanced-modeling-patterns.md)**: Reusable design patterns for common modeling problems.
- **[Generalization Guide](generalization-guide.md)**: Entity inheritance and generalization patterns.
- **[XMI ID Traceability](xmi-id-traceability.md)**: How JUDO maintains traceability from model elements to generated artifacts.
- **[ESM Metamodel](./esm_metamodel/SKILL.md)**: Detailed breakdown of every component in `esm.ecore`.
  - [Namespace Package](./esm_metamodel/namespace.md) - Model organization, naming, structure
  - [Type Package](./esm_metamodel/type.md) - Logical data types (StringType, NumericType, etc.)
  - [Structure Package](./esm_metamodel/structure.md) - Entities, attributes, relationships
  - [Operation Package](./esm_metamodel/operation.md) - Service definitions, methods, parameters
  - [Accesspoint Package](./esm_metamodel/accesspoint.md) - Security model, actors, permissions
  - [UI Package](./esm_metamodel/ui.md) - User interface definitions
  - [UI Behaviour](./esm_metamodel/ui-behaviour.md) - Conditional behaviour rules
  - [UI Visual Style Guide](./esm_metamodel/ui-visual-styleguide.md) - Visual styling rules
  - [Other Packages](./esm_metamodel/other.md) - Measure, expression, script packages

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
