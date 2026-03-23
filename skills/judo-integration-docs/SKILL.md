---
name: judo-integration-docs
description: JUDO integration testing documentation. Covers judo-runtime-core-testkit setup, test class patterns, fixtures, assertions, and debugging. Use when writing or maintaining integration tests for a JUDO application.
---

# JUDO Integration Testing

This skill provides reference documentation for writing integration tests in JUDO applications. Integration tests verify that custom operations, interceptors, and data access logic work correctly with the full JUDO runtime stack.

## Overview

JUDO integration tests use the `judo-runtime-core-testkit` library, which provides:

- **In-memory runtime** -- A lightweight JUDO runtime that loads the model and executes operations without requiring an external database or application server
- **Test fixtures** -- Utilities for creating and populating test data through the DAO layer
- **SDK access** -- Full access to the generated SDK for invoking operations and querying data
- **Transaction management** -- Each test runs in a transaction that is rolled back after the test, ensuring test isolation

## Test Architecture

Integration tests operate at the service layer, testing custom operations and interceptors with the real DAO layer and model constraints. They do not test REST endpoints directly (that is covered by e2e tests).

```
Test Class
  └── Uses TestKit
       ├── In-memory runtime
       ├── Generated SDK / DAO
       ├── Custom operations
       └── Interceptors
```

## What to Test

- Custom operation logic (the primary target)
- Interceptor behavior (before/after hooks)
- Complex query patterns
- Validation and error handling
- Data integrity across related entities
- Authorization rules (using different actor principals)

## What Not to Test

- Generated CRUD operations (these are tested by the framework itself)
- REST serialization (covered by e2e tests)
- Frontend behavior (covered by frontend tests and e2e tests)

## Available Reference Files

- `testkit-setup.md` -- judo-runtime-core-testkit setup, dependencies, and configuration
- `test-patterns.md` -- Test class patterns, fixtures, assertions, and common testing strategies
- `debugging-tests.md` -- Debugging integration test failures, common issues, and solutions
