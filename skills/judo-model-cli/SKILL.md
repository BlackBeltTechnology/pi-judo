---
name: judo-model-cli
description: JUDO CLI (model_cli tool) full documentation. Covers GraphQL querying, introspection, mutations (create/update/delete), ESM-PSM-ASM transformation, and tracing. Use when working with the JUDO model through the command-line interface.
---

# JUDO Model CLI

This skill documents the `model_cli` tool, the command-line interface for interacting with JUDO models. The CLI uses a GraphQL-based interface to query, introspect, and mutate the Entity State Model (ESM), and to trigger model transformations.

## Overview

The `model_cli` tool provides:

- **Querying** -- Read model elements (entity types, transfer objects, relations, operations) using GraphQL queries
- **Introspection** -- Explore the model schema using `__type` queries to discover available types and fields
- **Mutations** -- Create, update, and delete model elements (entity types, fields, relations, enumerations, operations)
- **Transformation** -- Trigger the ESM to PSM to ASM transformation pipeline
- **Tracing** -- Debug model operations with verbose output

## Workflow

The recommended workflow when modifying a model through the CLI:

1. **Introspect** -- Query the current model to understand existing structure
2. **Query** -- Read specific elements you plan to modify
3. **Plan** -- Determine the changes needed
4. **Dry-run** -- Validate mutations before applying (when supported)
5. **Execute** -- Apply mutations to the model
6. **Validate** -- Query back to confirm changes are correct
7. **Transform** -- Run the ESM to PSM to ASM transformation with `--load`

## Key Concepts

- The CLI operates on the ESM (Entity State Model) level
- All queries and mutations use GraphQL syntax
- The model must be loaded before operations (use `--load` flag)
- Mutations modify the model files on disk
- Transformation regenerates the PSM and ASM from the modified ESM

## Available Reference Files

- `querying.md` -- GraphQL query patterns, introspection, `__type` queries, filtering, and navigation
- `mutations.md` -- Create, update, and delete mutations for all model element types, batch operations
- `transform.md` -- ESM to PSM to ASM transformation pipeline, the `--load` flag, and regeneration
- `tracing.md` -- Debugging and tracing model operations, verbose output, error diagnosis
