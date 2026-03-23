# Authentication and Authorization Guide

JUDO provides built-in support for authentication and authorization through actor types, access points, and permission-based access control.

## Actor Types

The model defines actor types that represent different categories of users. Each actor type has:

- A dedicated access point with visible transfer objects and operations
- A set of permissions defining what data and operations are accessible
- An associated principal type that carries identity information

```
// Model concept (ESM)
actor type AdminUser maps User {
    access AdminAccessPoint;
    // Only sees admin-permitted TOs and operations
}
```

## Principals

The current authenticated user is available through the principal context:

```java
// In a custom operation
Principal principal = context.getPrincipal();
String username = principal.getName();
Identifier userId = principal.getIdentifier();
```

## Access Control

JUDO enforces access control at multiple levels:

1. **Access Point Level**: Each actor type only sees its permitted transfer objects and operations
2. **Operation Level**: Operations are only exposed if the actor type's access point includes them
3. **Row Level**: Custom interceptors can implement row-level security by filtering query results

## Implementing Row-Level Security

```java
public class TenantSecurityInterceptor implements DaoInterceptor {
    @Override
    public void beforeQuery(QueryContext context) {
        Principal principal = context.getPrincipal();
        // Add tenant filter to all queries
        context.addFilter("tenantId", principal.getTenantId());
    }
}
```

## Token Handling

JUDO's REST layer handles JWT token validation and principal extraction. Custom operations receive an already-authenticated principal. Token configuration (issuer, secret, expiry) is handled in the application's deployment configuration.

## Best Practices

- Define the narrowest possible access for each actor type
- Use interceptors for row-level security rather than checking in every operation
- Never trust client-supplied identity -- always use the principal from context
- Test authorization rules with integration tests using different actor types
- Log authentication and authorization failures for security monitoring
