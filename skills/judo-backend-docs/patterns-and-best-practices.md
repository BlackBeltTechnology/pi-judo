# Patterns and Best Practices

This guide covers general patterns and conventions for JUDO backend development.

## Project Structure

A JUDO application backend typically follows this layout:

```
application/
├── app/
│   └── src/main/java/
│       └── <package>/
│           ├── operations/       # Custom operation implementations
│           ├── interceptors/     # Custom interceptors
│           └── services/         # Additional service classes
├── model/                        # ESM model files
└── judo.sh                       # Build and management script
```

## Operation Implementation Pattern

1. The model defines the operation signature (input/output types)
2. The generator creates a `.default` implementation
3. The developer creates a custom `.java` file that replaces the default
4. The custom implementation uses injected DAO/SDK for data access
5. Build regeneration never overwrites custom implementations

## Separation of Concerns

- **Model**: Defines structure, constraints, and operation signatures
- **Custom Operations**: Contains business logic
- **Interceptors**: Cross-cutting concerns (logging, auditing)
- **DAO Layer**: Data access (generated, not customized directly)

## Naming Conventions

- Custom operation files: `<TransferObject>__<operationName>.java`
- Interceptor classes: `<Purpose>Interceptor.java` (e.g., `AuditInterceptor.java`)
- Error codes: `UPPER_SNAKE_CASE` constants
- Package structure mirrors the model namespace

## Transaction Management

- Custom operations run inside a transaction by default
- Avoid long-running transactions that hold locks
- Use the DAO for all data modifications to ensure transactional consistency
- If an operation fails, the entire transaction rolls back

## Avoiding Common Pitfalls

- Never modify `.default` files -- they are regenerated on build
- Always use the DAO layer instead of direct database access
- Do not catch and swallow exceptions silently -- let them propagate
- Avoid circular operation calls that could cause infinite loops
- Test custom operations with integration tests, not just unit tests
