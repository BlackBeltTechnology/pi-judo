# Error Handling Guide

JUDO provides a structured exception hierarchy that maps business errors to appropriate REST responses. Consistent error handling ensures the frontend receives actionable error information.

## Exception Hierarchy

```
JudoException (base)
├── ValidationException        -- Input validation failures (400)
├── BusinessException          -- Business rule violations (422)
├── NotFoundException          -- Entity not found (404)
├── AccessDeniedException      -- Authorization failures (403)
├── ConflictException          -- Optimistic locking / state conflicts (409)
└── InternalException          -- Unexpected errors (500)
```

## Validation Errors

Validation exceptions carry field-level error details that the frontend can display:

```java
ValidationException ex = new ValidationException();
ex.addFieldError("email", "INVALID_FORMAT", "Email must be a valid address");
ex.addFieldError("age", "OUT_OF_RANGE", "Age must be between 0 and 150");
throw ex;
```

The REST layer serializes this as:

```json
{
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "email", "code": "INVALID_FORMAT", "message": "..." },
    { "field": "age", "code": "OUT_OF_RANGE", "message": "..." }
  ]
}
```

## Business Exceptions

For business rule violations that are not field-specific:

```java
throw new BusinessException("ORDER_LIMIT_EXCEEDED",
    "Cannot place more than 10 orders per day");
```

## Error Codes

Use consistent, uppercase, snake_case error codes. Define them as constants:

```java
public final class ErrorCodes {
    public static final String ORDER_LIMIT_EXCEEDED = "ORDER_LIMIT_EXCEEDED";
    public static final String INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK";
    public static final String INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION";
}
```

## Best Practices

- Throw specific exception types rather than generic ones
- Always include meaningful error codes and messages
- Use validation exceptions for input problems, business exceptions for rule violations
- Let the framework handle exception-to-HTTP-status mapping
- Log unexpected exceptions at ERROR level, expected ones at WARN or DEBUG
- Never expose internal stack traces or implementation details in error messages
