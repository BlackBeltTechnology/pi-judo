---
name: judo-model-cli-mutations
description: JUDO CLI mutation documentation. Covers create, update, and delete operations for model elements (entity types, fields, relations, enumerations, operations). Only load this skill when the agent needs to modify the model.
---

# JUDO Model CLI -- Mutations

This skill documents the mutation capabilities of the `model_cli` tool. It covers creating, updating, and deleting model elements through GraphQL mutations.

> **Prerequisites**: This skill extends the general `judo-model-cli` skill. Agents using mutations should load both `judo-model-cli` and `judo-model-cli-mutations`.

## Overview

Mutations allow you to:

- **Create** -- Add new entity types, fields, relations, enumerations, and operations
- **Update** -- Modify existing model elements (rename, change types, update constraints)
- **Delete** -- Remove model elements from the ESM

## Key Principles

- Mutations modify the model files on disk
- Always query before mutating to understand current state
- Validate mutations by querying back after execution
- Run `transform --load` after mutations to regenerate derived models

## Workflow

1. **Query** -- Understand current model state (see `judo-model-cli` skill)
2. **Plan** -- Determine the changes needed
3. **Execute** -- Apply mutations to the model
4. **Validate** -- Query back to confirm changes are correct
5. **Transform** -- Run `transform --load` to regenerate PSM/ASM

## Available Reference Files

- `mutations.md` -- Create, update, and delete mutations for all model element types, batch operations
