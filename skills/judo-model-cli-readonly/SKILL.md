---
name: judo-model-cli-readonly
description: JUDO CLI read-only documentation for model exploration. Covers GraphQL querying, introspection, and tracing without mutation capabilities. Use when agents or researchers need to explore the model without modifying it.
---

# JUDO Model CLI (Read-Only)

This skill documents the read-only capabilities of the `model_cli` tool. It is intended for agents and researchers who need to explore and understand a JUDO model without the ability to modify it.

This skill deliberately excludes mutation documentation to prevent accidental model modifications. For full CLI documentation including mutations and transformations, use the `judo-model-cli` skill instead.

## Overview

The read-only CLI capabilities include:

- **Querying** -- Read model elements using GraphQL queries to understand the current model structure
- **Introspection** -- Explore the model schema using `__type` queries to discover types and their fields
- **Tracing** -- Debug query execution with verbose output for diagnosis

## When to Use This Skill

Use this skill when you need to:

- Understand the existing model structure before writing backend or frontend code
- Explore entity types, transfer objects, relations, and operations
- Verify that expected model elements exist
- Debug unexpected behavior by inspecting the model
- Research the model for planning and proposal purposes

## Key Principles

- All operations in this skill are **read-only** -- they do not modify the model
- The `--load` flag is required to load the model before querying
- Queries use GraphQL syntax
- Introspection queries (`__type`, `__schema`) reveal the model's structure

## Available Reference Files

- `querying.md` -- GraphQL query patterns, introspection, `__type` queries, filtering, and navigation
- `tracing.md` -- Debugging query execution, verbose output, and error diagnosis
