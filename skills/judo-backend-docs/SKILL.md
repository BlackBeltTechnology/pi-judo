---
name: judo-backend-docs
description: JUDO backend development documentation. Covers custom operations, interceptors, data access (DAO), error handling, type mappings, authentication, i18n, and general patterns. Use when implementing or modifying backend logic in a JUDO application.
---

# JUDO Backend Development

This skill provides comprehensive reference documentation for backend development in the JUDO framework. JUDO generates a full Java backend from an ESM (Entity State Model), but most real-world applications require custom business logic layered on top of the generated code.

## Key Concepts

**Custom Operations** are the primary extension mechanism. When a model defines an operation (bound or unbound), the code generator emits a `.default` implementation file. Developers override this by creating a non-`.default` implementation in the same package. The build system picks up the custom implementation and ignores the default. Service operations and exported operations follow the same pattern but differ in lifecycle and visibility.

**Interceptors** allow cross-cutting concerns (logging, auditing, validation) to be applied before or after DAO operations and custom operations. They are registered via the interceptor registry and follow an ordered chain-of-responsibility pattern.

**Data Access** is handled through the generated SDK and DAO layer. The DAO provides type-safe query builders, filtering, ordering, and pagination. All data operations go through the DAO to ensure model constraints are enforced.

**Error Handling** uses a structured exception hierarchy. Validation errors, business rule violations, and data access failures each have dedicated exception types that map to appropriate HTTP status codes in the REST layer.

**Type System** bridges between ESM model types (String, Integer, Boolean, Date, Timestamp, Binary, Enumeration, etc.) and their Java counterparts. Understanding these mappings is essential when writing custom operations that manipulate model data.

**Authentication and Authorization** is handled through JUDO's principal and access control mechanisms. The framework provides built-in support for actor types, permissions, and row-level security that can be extended with custom logic.

**Internationalization** support is built into the framework with message bundles, locale-aware formatting, and translatable model elements.

## Available Reference Files

- `custom-operations.md` -- How to implement custom operations using the .default file pattern, service operations, and exported operations
- `interceptors.md` -- How to write and register interceptors for cross-cutting concerns
- `data-access-guide.md` -- DAO patterns, query building, SDK interface usage, and data manipulation
- `error-handling-guide.md` -- Error handling patterns, exception hierarchy, and validation error reporting
- `type-system-guide.md` -- Type mappings between ESM model types and Java types
- `patterns-and-best-practices.md` -- General backend patterns, coding conventions, and architectural guidance
- `authentication-guide.md` -- Authentication, authorization, actor types, and access control patterns
- `internationalization-guide.md` -- i18n support, message bundles, and locale-aware formatting
