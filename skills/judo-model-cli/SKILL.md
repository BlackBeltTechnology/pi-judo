---
name: judo-model-cli
description: JUDO CLI (model_cli tool) documentation. Covers GraphQL querying, introspection, ESM-PSM-ASM transformation, and tracing. Use when exploring or working with JUDO models through the command-line interface.
---

# JUDO Model CLI

This skill documents the `model_cli` tool, the command-line interface for interacting with JUDO models. The CLI uses a GraphQL-based interface to query and introspect the Entity State Model (ESM), and to trigger model transformations.

## Overview

The `model_cli` tool provides:

- **Querying** -- Read model elements (entity types, transfer objects, relations, operations) using GraphQL queries
- **Introspection** -- Explore the model schema using `__type` queries to discover available types and fields
- **Transformation** -- Trigger the ESM to PSM to ASM transformation pipeline
- **Tracing** -- Debug model operations with verbose output

> **Note**: For mutation capabilities (create, update, delete model elements), also load the `judo-model-cli-mutations` skill.

## Key Concepts

- The CLI operates on the ESM (Entity State Model) level
- All queries use GraphQL syntax
- The model must be loaded before operations (use `--load` flag)
- Queries use GraphQL syntax
- Introspection queries (`__type`, `__schema`) reveal the model's structure
- Transformation regenerates the PSM and ASM from the modified ESM

## Workflow

The recommended workflow when exploring a model through the CLI:

1. **Introspect** -- Query the current model to understand existing structure
2. **Query** -- Read specific elements to understand their definition
3. **Trace** -- Use verbose output to debug query execution
4. **Transform** -- Run the ESM to PSM to ASM transformation with `--load`

## Available Reference Files

- `querying.md` -- GraphQL query patterns, introspection, `__type` queries, filtering, and navigation
- `transform.md` -- ESM to PSM to ASM transformation pipeline, the `--load` flag, and regeneration
- `tracing.md` -- Debugging and tracing model operations, verbose output, error diagnosis
