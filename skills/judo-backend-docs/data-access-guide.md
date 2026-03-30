# Data Access Guide

This guide provides a comprehensive overview of data access patterns in a JUDO application. It covers how to inject Data Access Objects (DAOs), perform queries, and use masks for performance optimization.

## Table of Contents
- [Injecting DAOs and Services](#injecting-daos-and-services)
- [Query Patterns](#query-patterns)
- [CRUD Operations](#crud-operations)
- [Using Masks (Projections)](#using-masks-projections)
  - [Why Use Masks?](#why-use-masks)
  - [Mask Basics](#mask-basics)
  - [Common Mask Patterns](#common-mask-patterns)
  - [Performance Comparison](#performance-comparison)

---

## Injecting DAOs and Services

The primary way to interact with the database is by injecting DAOs and other OSGi services into your custom implementation classes using the `@Reference` annotation.

```java
// Standard DAO injection for entities
@Reference
private EntityDao entityDao;

@Reference
private ChildEntityDao childEntityDao;

// Injecting other custom operations
@Reference
private RecalculateRelatedData recalculateRelatedData;

// Injecting JUDO runtime services
@Reference
private VariableResolver variableResolver;

// Injecting an external service (from another OSGi bundle)
@Reference
private ExternalDataService externalDataService;
```

## Query Patterns

The generated DAOs provide a fluent API for building type-safe queries.

```java
// Simple query with a single filter
List<ConfigurationEntity> configs = configurationEntityDao.query()
    .filterByCode(StringFilter.notEqualTo("BASE_CONFIG"))
    .selectList();

// Query with multiple filters
Optional<ExternalDataEntity> data = externalDataEntityDao.query()
    .filterByDate(DateFilter.equalTo(date))
    .filterBySourceCode(StringFilter.equalTo(sourceCode))
    .filterByTargetCode(StringFilter.equalTo("BASE_CONFIG"))
    .selectOne();

// Query with ordering
ExternalDataEntity latest = externalDataEntityDao.query()
    .filterByDate(DateFilter.equalTo(date))
    .orderByDescending(ExternalDataEntityAttribute.TIMESTAMP_OF_RECORDING)
    .selectOne()
    .orElse(null);

// Query with a mask (projection) to control loaded fields
List<ChildEntity> children = parentEntityDao.queryChildEntities(parent)
    .maskedBy(ChildEntityMask.childEntityMask().withIsDefault())
    .selectList();

// Get the total count of entities
long count = entityDao.query().count();
```

### SDK Query Filters Reference

All filter classes are in `hu.blackbelt.judo.sdk.query` package.

#### StringFilter

For filtering string/text fields.

```java
import hu.blackbelt.judo.sdk.query.StringFilter;

// Exact match
.filterByName(StringFilter.equalTo("Budapest"))

// Not equal
.filterByCode(StringFilter.notEqualTo("DELETED"))

// Pattern matching (SQL LIKE)
.filterByEmail(StringFilter.like("%@company.com"))   // ends with
.filterByName(StringFilter.like("Budapest%"))        // starts with
.filterByFullAddress(StringFilter.like("%Kossuth%")) // contains

// Case-insensitive matching
.filterByName(StringFilter.ilike("BUDAPEST"))
```

#### NumberFilter

For filtering numeric fields (Integer, Long, BigDecimal).

```java
import hu.blackbelt.judo.sdk.query.NumberFilter;

// Exact match
.filterByCode(NumberFilter.equalTo(1L))

// Comparisons
.filterByAmount(NumberFilter.greaterThan(100L))
.filterByAmount(NumberFilter.greaterOrEqualThan(100L))
.filterByAmount(NumberFilter.lessThan(1000L))
.filterByAmount(NumberFilter.lessOrEqualThan(1000L))

// Not equal
.filterByCode(NumberFilter.notEqualTo(0L))
```

#### DateFilter

For filtering `LocalDate` fields.

```java
import hu.blackbelt.judo.sdk.query.DateFilter;

// Exact match
.filterByStartDate(DateFilter.equalTo(LocalDate.of(2024, 1, 1)))

// Comparisons
.filterByStartDate(DateFilter.greaterThan(LocalDate.now()))
.filterByStartDate(DateFilter.greaterOrEqualThan(LocalDate.of(2024, 1, 1)))
.filterByEndDate(DateFilter.lessThan(LocalDate.now()))
.filterByEndDate(DateFilter.lessOrEqualThan(LocalDate.of(2024, 12, 31)))

// Not equal
.filterByDate(DateFilter.notEqualTo(LocalDate.now()))
```

#### TimestampFilter

For filtering `LocalDateTime` fields.

```java
import hu.blackbelt.judo.sdk.query.TimestampFilter;

// Exact match
.filterByCreatedAt(TimestampFilter.equalTo(LocalDateTime.now()))

// Comparisons
.filterByModifiedAt(TimestampFilter.greaterThan(LocalDateTime.of(2024, 1, 1, 0, 0)))
.filterByModifiedAt(TimestampFilter.greaterOrEqualThan(LocalDateTime.now().minusDays(7)))
.filterByCreatedAt(TimestampFilter.lessThan(LocalDateTime.now()))
.filterByCreatedAt(TimestampFilter.lessOrEqualThan(LocalDateTime.now().minusHours(1)))
```

#### BooleanFilter

For filtering boolean fields. **Note**: Uses `isTrue()` / `isFalse()`, not `equalTo(boolean)`.

```java
import hu.blackbelt.judo.sdk.query.BooleanFilter;

// Filter for true values
.filterByIsActive(BooleanFilter.isTrue())
.filterByIsAdmin(BooleanFilter.isTrue())

// Filter for false values
.filterByIsDeleted(BooleanFilter.isFalse())
.filterByIsArchived(BooleanFilter.isFalse())
```

#### EnumerationFilter

For filtering enum fields. The enum must implement `hu.blackbelt.judo.sdk.Enumeration`.

```java
import hu.blackbelt.judo.sdk.query.EnumerationFilter;

// Exact match
.filterByCampaignType(EnumerationFilter.equalTo(CampaignType.NATIONAL))
.filterByStatus(EnumerationFilter.equalTo(Status.ACTIVE))

// Not equal
.filterByStatus(EnumerationFilter.notEqualTo(Status.DELETED))
```

### Combining Multiple Filters

Filters are combined with **AND logic** when chained:

```java
// Find active admin users with company email (all conditions must match)
List<User> users = userDao.query()
    .filterByIsActive(BooleanFilter.isTrue())
    .filterByIsAdmin(BooleanFilter.isTrue())
    .filterByEmail(StringFilter.like("%@company.com"))
    .selectList();

// Find campaigns of specific type within date range
List<Campaign> campaigns = campaignDao.query()
    .filterByCampaignType(EnumerationFilter.equalTo(CampaignType.NATIONAL))
    .filterByStartDate(DateFilter.greaterOrEqualThan(LocalDate.of(2024, 1, 1)))
    .filterByEndDate(DateFilter.lessOrEqualThan(LocalDate.of(2024, 12, 31)))
    .selectList();
```

### OR Logic with Custom Filter Expressions

For **OR logic**, use the `filterBy(String)` method with a custom JQL (JUDO Query Language) expression:

```java
// OR logic with boolean fields - IMPORTANT: Use == for equality (NOT =)
List<User> users = userDao.query()
    .filterBy("this.isAdmin == true or this.isCoordinator == true")
    .selectList();

// String equality with OR
List<User> users = userDao.query()
    .filterBy("this.userName == 'john.doe' or this.userName == 'jane.doe'")
    .selectList();

// Combining OR with AND in single expression
List<User> users = userDao.query()
    .filterBy("(this.isAdmin == true or this.isCoordinator == true) and this.isActive == true")
    .selectList();

// LIKE pattern - uses method call syntax with ! operator
List<User> users = userDao.query()
    .filterBy("(this.email)!like('%@admin.com') or (this.email)!like('%@company.com')")
    .selectList();

// Complex nested logic
List<User> users = userDao.query()
    .filterBy("(this.isAdmin == true and this.isActive == true) or (this.isCoordinator == true and this.isCanvasser == true)")
    .selectList();
```

**JQL (JUDO Query Language) Expression Syntax:**

| Element | Example | Description |
|---------|---------|-------------|
| Field reference | `this.fieldName` | Access entity field |
| Equality | `==` | Equal comparison (NOT `=`) |
| Not equal | `!=` | Not equal comparison |
| Comparison | `< > <= >=` | Comparison operators |
| Pattern match | `(this.field)!like('%pattern%')` | Method call syntax |
| Boolean | `== true`, `== false` | Boolean comparison |
| Logical AND | `expr1 and expr2` | All conditions must match |
| Logical OR | `expr1 or expr2` | Any condition must match |
| Grouping | `(expr1 or expr2)` | Parentheses for precedence |
| String literals | `'value'` | Single quotes for strings |

**IMPORTANT - What Does NOT Work:**
- Navigation: `this.relation.field` is NOT supported in filterBy
- Single equals: `this.field = value` - use `==` instead
- SQL-style LIKE: `this.field like 'pattern'` - use `(this.field)!like('pattern')` instead

### Query Result Methods

```java
// Get list of all matching entities
List<Entity> list = dao.query().filterBy...().selectList();

// Get single result (returns Optional)
Optional<Entity> one = dao.query().filterBy...().selectOne();

// Get count of matching entities
long count = dao.query().filterBy...().count();

// Check if any matching entity exists
boolean exists = dao.query().filterBy...().count() > 0;
```

### Relationship Navigation Queries

For navigating relationships between entities:

```java
// One-to-Many (multi-valued): Returns query customizer, use selectList()
List<Settlement> settlements = countyDao.querySettlements(county).selectList();

// Many-to-One (single-valued): Returns entity DIRECTLY, NOT a query object
County county = settlementDao.queryCounty(settlement);
// ❌ WRONG: settlementDao.queryCounty(settlement).selectOne() - won't compile!

// With filters on multi-valued relationship queries
List<Settlement> activeSettlements = countyDao.querySettlements(county)
    .filterByIsActive(BooleanFilter.isTrue())
    .selectList();

// With masks on relationship queries
List<Settlement> settlements = countyDao.querySettlements(county)
    .maskedBy(SettlementMask.settlementMask().withName().withCode())
    .selectList();
```

**Important**: Single-valued (Many-to-One) relationship queries return the entity directly. Multi-valued (One-to-Many) relationship queries return a query customizer that supports filtering, masking, and `selectList()`.

**Note**: Relation query customizers do NOT support ordering methods like `orderByCode()`. If ordering is needed, sort the results in Java after fetching:
```java
List<Settlement> settlements = countyDao.querySettlements(county).selectList();
settlements.sort(Comparator.comparing(Settlement::getCode));
```

### Common Query Mistakes

| Mistake | Correct Usage |
|---------|---------------|
| `BooleanFilter.equalTo(true)` | `BooleanFilter.isTrue()` |
| `BooleanFilter.equalTo(false)` | `BooleanFilter.isFalse()` |
| `settlementDao.queryCounty(s).selectOne()` | `settlementDao.queryCounty(s)` (returns entity directly) |
| `countyDao.querySettlements(c).orderByCode()` | Sort in Java: `results.sort(Comparator.comparing(Settlement::getCode))` |
| Multiple `filterBy` for OR logic | Use `filterBy("expr1 or expr2")` custom expression |
| `filterBy("this.field = value")` | Use `==`: `filterBy("this.field == value")` |
| `filterBy("this.field like '%x%'")` | Use method syntax: `filterBy("(this.field)!like('%x%')")` |
| `filterBy("this.relation.field == ...")` | Navigation NOT supported - use typed filters or fetch relations |

---

## CRUD Operations

DAOs provide standard methods for Create, Read, Update, and Delete operations.

```java
// Create using the generated builder pattern
ExternalDataEntity newData = externalDataEntityDao.create(
    ExternalDataEntityForCreate.builder()
        .withDate(todayDate)
        .withSource(config.get())
        .withTarget(baseConfig.get())
        .withValue(record.getValue())
        .build()
);

// Read by ID, throwing an exception if not found
Entity entity = entityDao.getById(entityId).orElseThrow();

// Read by ID with a mask to load specific fields
ParentEntity parentEntity = parentEntityDao.getById(
    parentEntityId,
    ParentEntityMask.parentEntityMask()
        .withValidationErrors(ValidationErrorMask.validationErrorMask())
        .withIsValid()
).orElseThrow();

// Update a full entity
entity.setStatus(false);
entity = entityDao.update(entity);

// Update with a mask (only updates the specified fields)
childEntityDao.update(childEntity, ChildEntityMask.childEntityMask().withIsDefault());

// Delete an entity
entityDao.delete(entity);
```

---

## Using Masks (Projections)

> [!IMPORTANT]
> **Masks are the most critical pattern for backend performance.** They allow you to specify exactly which fields and relationships should be loaded or updated, preventing common performance issues like N+1 queries.

### Why Use Masks?

**Without masks:**
- ❌ Loads ALL fields and relationships, leading to N+1 query problems.
- ❌ Slower database queries and higher memory usage.
- ❌ Unnecessary data transfer between the application and the database.

**With masks:**
- ✅ Loads only the fields you explicitly need.
- ✅ Results in significantly faster queries and lower memory consumption.
- ✅ Gives you explicit control over your data fetching strategy.

### Mask Basics

Every entity has a generated `[Entity]Mask` class with a fluent builder API:
- **Static factory method**: `[Entity]Mask.[entityName]Mask()`
- **Builder methods**: `.withFieldName()` for each attribute.
- **Nested masks**: `.withRelationship([RelatedEntity]Mask.relatedEntityMask())` to control the data loaded for related entities.

### Common Mask Patterns

#### Pattern 1: Existence Check (Empty Mask)
The fastest way to check if an entity exists is to use an empty mask, which only loads the identifier.

```java
boolean exists = dao.getById(id, EntityMask.entityMask()).isPresent();
```

#### Pattern 2: List Views (Simple Mask)
When loading a list of entities for a UI, only fetch the columns that will be displayed.

```java
List<User> users = userDao.query()
    .maskedBy(UserMask.userMask()
        .withUserName()
        .withEmail()
        .withIsActive()
    )
    .selectList();
```

#### Pattern 3: Detail Views (Nested Masks)
When loading a single entity for a detail view, you can use nested masks to control the depth of relationship loading.

```java
Address address = addressDao.getById(
    addressId,
    AddressMask.addressMask()
        .withFullAddress()
        .withSettlement(SettlementMask.settlementMask()
            .withName()
            .withCounty(CountyMask.countyMask()
                .withName()
            )
        )
).orElseThrow();
```

#### Pattern 4: Partial Updates
When updating an entity, use a mask to ensure you only modify the fields that have changed.

```java
// Load the entity, modify specific fields...
entity.setStatus(newStatus);
entity.setLastModified(LocalDateTime.now());

// Update only those fields in the database
entityDao.update(
    entity,
    EntityMask.entityMask()
        .withStatus()
        .withLastModified()
);
```

### Performance Comparison

The performance difference is significant, especially with large datasets.

```java
// ❌ BAD: Loads everything. Can be 10x slower and use 10x more memory.
List<Address> addresses = addressDao.query().selectList();

// ✅ GOOD: Loads only what's needed.
List<Address> addresses = addressDao.query()
    .maskedBy(AddressMask.addressMask()
        .withFullAddress()
        .withLatitude()
        .withLongitude()
    )
    .selectList();
```

### Mask Best Practices

**✅ DO:**
1.  **Always use masks for queries** to prevent loading unnecessary data.
2.  Use **empty masks** for the fastest existence checks.
3.  Use **minimal masks in loops** to reduce memory overhead.
4.  **Chain masks** for nested relationships to control loading depth.
5.  Use **masks in updates** to perform efficient partial updates.

**❌ DON'T:**
1.  Don't perform full entity loads when you only need a few fields.
2.  Don't forget masks in queries, as this can lead to N+1 problems.
3.  Don't load large collections without a mask.
4.  Don't access fields that were not included in your mask (they will be `null`).

---

## See Also
- [Custom Operations](custom-operations.md) - For how to apply these patterns in your business logic.
- [Patterns and Best Practices](patterns-and-best-practices.md) - For other common backend patterns.