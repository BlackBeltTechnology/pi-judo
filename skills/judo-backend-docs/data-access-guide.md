# Data Access Guide

JUDO generates a type-safe data access layer (DAO) from the model. All data operations should go through the DAO to ensure model constraints, access control, and interceptors are applied.

## DAO Interface

Each entity type and transfer object gets a generated DAO interface:

```java
// Generated DAO for a transfer object
public interface MyEntityDao {
    MyEntityTO create(MyEntityTO input);
    MyEntityTO update(MyEntityTO input);
    void delete(MyEntityTO input);
    MyEntityTO getById(Identifier id);
    List<MyEntityTO> query(QueryCustomizer<MyEntityTO> customizer);
    long count(QueryCustomizer<MyEntityTO> customizer);
}
```

## Query Building

The `QueryCustomizer` provides a fluent API for filtering, ordering, and pagination:

```java
QueryCustomizer<OrderTO> customizer = QueryCustomizer.of(OrderTO.class)
    .withFilter(FilterBuilder.of(OrderTO.class)
        .eq("status", OrderStatus.ACTIVE)
        .and()
        .gt("totalAmount", BigDecimal.valueOf(100))
        .build())
    .withOrderBy("createdAt", OrderDirection.DESC)
    .withPageSize(25)
    .withOffset(0);

List<OrderTO> results = orderDao.query(customizer);
```

## Fetching Relations

Eager and lazy fetching follows model definitions. To explicitly load relations:

```java
QueryCustomizer<OrderTO> customizer = QueryCustomizer.of(OrderTO.class)
    .withMask(MaskBuilder.of(OrderTO.class)
        .include("orderItems")
        .include("customer")
        .build());
```

## SDK Interface

The SDK aggregates all DAO instances and provides the entry point for data operations in custom operations:

```java
@Inject
private SDK sdk;

public void myOperation() {
    MyEntityDao dao = sdk.getDao(MyEntityDao.class);
    // Use DAO for data access
}
```

## Transactions

DAO operations participate in the current transaction context. Custom operations are wrapped in a transaction by default. Use `TransactionManager` for explicit transaction control when needed.

## Best Practices

- Always use the DAO layer, never bypass it with direct SQL
- Prefer query customizers over loading all data and filtering in Java
- Use masks to load only the relations you need
- Be mindful of N+1 query patterns when iterating over relations
