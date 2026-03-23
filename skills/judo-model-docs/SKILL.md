---
name: judo-model-docs
description: JUDO model (ESM) documentation. Covers entity types, transfer objects, relations, enumerations, access points, constraints, and derived attributes. Use when designing, understanding, or modifying a JUDO data model.
---

# JUDO Model (ESM) Documentation

This skill provides comprehensive reference documentation for the JUDO Entity State Model (ESM). The ESM is the central artifact in a JUDO application -- it defines the data structure, business operations, access points, and constraints from which the entire application (backend, frontend, API) is generated.

## What is ESM?

The Entity State Model is a platform-independent model that describes:

- **Entity Types** -- The persistent domain objects with their fields and constraints
- **Transfer Objects (TOs)** -- The data shapes exposed through the API, which may be mapped to entities or stand-alone (unmapped)
- **Relations** -- How entity types and transfer objects connect to each other (associations, composition, containment)
- **Enumerations** -- Named sets of constant values
- **Access Points** -- Entry points that define which transfer objects and operations are visible to which actor types
- **Operations** -- Business operations (bound to a TO or unbound/exported) that define the application's API surface
- **Constraints and Derived Attributes** -- Validation rules, calculated fields, and expressions

## Model Transformation Pipeline

The ESM goes through a transformation pipeline:

1. **ESM** (Entity State Model) -- Platform-independent, what the developer writes
2. **PSM** (Platform-Specific Model) -- Generated from ESM, adds platform details
3. **ASM** (Application-Specific Model) -- Final artifact used by the runtime

The `model_cli` tool can introspect and query the model at any stage of this pipeline.

## Key Principles

- The model is the single source of truth for the application's structure
- Changes to the model regenerate the backend and frontend
- Custom code is preserved through the `.default` file pattern (backend) and customizer pattern (frontend)
- The model enforces constraints at the DAO layer, ensuring data integrity regardless of the access path

## Available Reference Files

- `entity-types.md` -- Entity type definitions, fields, primitive types, and constraints
- `transfer-objects.md` -- Mapped and unmapped transfer objects, field mappings between TOs and entities
- `relations.md` -- Relations, associations, composition, and containment semantics
- `enumerations.md` -- Enum types, members, and usage patterns
- `access-points.md` -- Access points, actor types, bound and unbound operations
- `constraints-and-derived.md` -- Constraints, derived attributes, calculated fields, and expressions
