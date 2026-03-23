# Interceptors

Interceptors provide a mechanism for applying cross-cutting concerns to DAO operations and custom operations. They follow a chain-of-responsibility pattern and are executed in a defined order.

## Writing an Interceptor

An interceptor implements the interceptor interface and provides before/after hooks:

```java
public class AuditInterceptor implements DaoInterceptor {

    @Override
    public void beforeCreate(CreateContext context) {
        // Log or modify the entity before creation
        context.getPayload().set("createdBy", getCurrentPrincipal());
    }

    @Override
    public void afterCreate(CreateContext context, Object result) {
        // Post-creation actions (audit logging, notifications)
        auditLog.record("CREATE", context.getType(), result);
    }

    @Override
    public int getOrder() {
        return 100; // Lower numbers execute first
    }
}
```

## Registering Interceptors

Interceptors are registered in the interceptor registry, typically during application bootstrap:

```java
interceptorRegistry.register(new AuditInterceptor());
interceptorRegistry.register(new ValidationInterceptor());
```

The registry respects the `getOrder()` value to determine execution sequence.

## Interceptor Types

- **DaoInterceptor** -- intercepts DAO-level CRUD operations (create, update, delete, query)
- **OperationInterceptor** -- intercepts custom operation invocations
- **SecurityInterceptor** -- specialized interceptors for access control checks

## Lifecycle

1. Before-hooks execute in ascending order
2. The target operation executes
3. After-hooks execute in descending order (reverse of before)
4. If any interceptor throws, the chain is aborted and after-hooks for already-executed interceptors run for cleanup

## Common Use Cases

- **Auditing**: Record who changed what and when
- **Validation**: Apply cross-entity validation rules
- **Caching**: Invalidate caches on data changes
- **Notifications**: Trigger events after successful operations
- **Soft-delete**: Convert delete operations into status updates
