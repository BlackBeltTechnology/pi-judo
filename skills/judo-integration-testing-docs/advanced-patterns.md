# Integration Testing - Advanced Patterns and Workarounds

**Part of**: [Integration Testing Documentation](./SKILL.md)

**Target Audience**: All levels - reference when encountering specific challenges

**Prerequisites**: Understanding of basic JUDO integration testing and type safety

---

## Quick Navigation

- [Back to Main Hub](./SKILL.md)
- [Query Filters](#pattern-query-filters)
- [Mocking VariableResolver](#pattern-mocking-variableresolver-for-authentication)
- [Handling Optional Fields](#pattern-handling-optional-fields-that-return-null)
- [Validating Entity References](#pattern-validating-related-entity-references)

---

## Overview

This guide covers solutions to common challenges encountered when writing JUDO integration tests:

1. **Query filters** - Using StringFilter, NumberFilter, BooleanFilter, and LocalDateFilter
2. **Authentication context** - Testing operations that require authenticated users
3. **Optional field handling** - Dealing with null Optional values
4. **Entity reference validation** - Testing foreign key constraints

---

## Pattern: Query Filters

**Problem**: Querying entities with specific criteria requires understanding the JUDO SDK filter types and their correct usage patterns.

### Filter Types and Import

All filter types are in the `hu.blackbelt.judo.sdk.query` package:

```java
import hu.blackbelt.judo.sdk.query.StringFilter;
import hu.blackbelt.judo.sdk.query.NumberFilter;
import hu.blackbelt.judo.sdk.query.BooleanFilter;
import hu.blackbelt.judo.sdk.query.LocalDateFilter;
```

### StringFilter

For filtering text/string fields:

```java
// Exact match
dao.query().filterByName(StringFilter.equalTo("Budapest")).selectList();

// Pattern matching with wildcards
dao.query().filterByName(StringFilter.like("Buda%")).selectList();      // Starts with
dao.query().filterByName(StringFilter.like("%pest")).selectList();      // Ends with
dao.query().filterByName(StringFilter.like("%uda%")).selectList();      // Contains

// Case-insensitive matching (use database-level LOWER if needed)
dao.query().filterByEmail(StringFilter.like("%@EXAMPLE.COM")).selectList();
```

### NumberFilter

For filtering numeric fields (Long, Integer, BigDecimal):

```java
// Exact match
dao.query().filterByCode(NumberFilter.equalTo(100L)).selectList();

// Comparison operators
dao.query().filterByCode(NumberFilter.greaterThan(50L)).selectList();
dao.query().filterByCode(NumberFilter.lessThan(200L)).selectList();
dao.query().filterByCode(NumberFilter.greaterThanOrEqualTo(100L)).selectList();
dao.query().filterByCode(NumberFilter.lessThanOrEqualTo(150L)).selectList();
```

### BooleanFilter

**IMPORTANT**: BooleanFilter does NOT have an `equalTo(boolean)` method. Use `isTrue()` or `isFalse()` instead.

```java
// ❌ WRONG - This will NOT compile
dao.query().filterByIsAdmin(BooleanFilter.equalTo(true)).selectList();

// ✅ CORRECT - Use isTrue() or isFalse()
dao.query().filterByIsAdmin(BooleanFilter.isTrue()).selectList();
dao.query().filterByIsAdmin(BooleanFilter.isFalse()).selectList();

// Combining boolean filters
List<User> adminCoordinators = userDao.query()
    .filterByIsAdmin(BooleanFilter.isTrue())
    .filterByIsCoordinator(BooleanFilter.isTrue())
    .selectList();
```

### LocalDateFilter

For filtering date fields:

```java
import java.time.LocalDate;

// Exact date
dao.query().filterByStartDate(LocalDateFilter.equalTo(LocalDate.of(2024, 1, 1))).selectList();

// Date ranges
dao.query().filterByStartDate(LocalDateFilter.greaterThanOrEqualTo(startDate)).selectList();
dao.query().filterByEndDate(LocalDateFilter.lessThanOrEqualTo(endDate)).selectList();

// Combined date range
dao.query()
    .filterByStartDate(LocalDateFilter.greaterThanOrEqualTo(rangeStart))
    .filterByEndDate(LocalDateFilter.lessThanOrEqualTo(rangeEnd))
    .selectList();
```

### Combining Multiple Filters

Filters are combined with AND logic:

```java
// Find active admin users with email containing "@company.com"
List<User> results = userDao.query()
    .filterByIsAdmin(BooleanFilter.isTrue())
    .filterByIsActive(BooleanFilter.isTrue())
    .filterByEmail(StringFilter.like("%@company.com"))
    .selectList();

// Find settlements in a code range with name starting with "S"
List<Settlement> results = settlementDao.query()
    .filterByCode(NumberFilter.greaterThan(100L))
    .filterByCode(NumberFilter.lessThan(200L))
    .filterByName(StringFilter.like("S%"))
    .selectList();
```

### Query Results

```java
// Get all matching entities as a list
List<Entity> list = dao.query().filterBy...().selectList();

// Get single result (throws if multiple)
Optional<Entity> one = dao.query().filterBy...().selectOne();

// Count all entities
long count = dao.countAll();
```

### Relationship Query Patterns

**Single-valued relationships** return the entity directly:

```java
// ✅ CORRECT - Returns entity directly, not a query object
Parent parent = childDao.queryParent(child);
County county = settlementDao.queryCounty(settlement);
```

**Multi-valued relationships** return a query customizer:

```java
// Multi-valued navigation with filtering
List<Settlement> settlements = countyDao.querySettlements(county)
    .filterByName(StringFilter.like("Buda%"))
    .selectList();

// Multi-valued without filtering
List<Child> allChildren = parentDao.queryChildren(parent).selectList();
```

**IMPORTANT**: Relation query customizers do NOT support ordering methods like `orderByCode()`. If ordering is needed, sort the results in Java after fetching.

### OR Logic with Custom Filter Expressions

Multiple `filterBy` calls are **always combined with AND logic**. For OR logic, use the `filterBy(String)` method with a custom filter expression:

```java
// AND logic (default) - all conditions must match
List<User> users = userDao.query()
    .filterByIsAdmin(BooleanFilter.isTrue())
    .filterByIsActive(BooleanFilter.isTrue())  // AND with above
    .selectList();

// OR logic - use custom filter expression string
// IMPORTANT: Use == for equality (NOT =)
List<User> users = userDao.query()
    .filterBy("this.isAdmin == true or this.isCoordinator == true")
    .selectList();

// Combining OR with AND in single expression
List<User> users = userDao.query()
    .filterBy("(this.isAdmin == true or this.isCoordinator == true) and this.isActive == true")
    .selectList();

// String equality with OR
List<User> users = userDao.query()
    .filterBy("this.userName == 'john.doe' or this.userName == 'jane.doe'")
    .selectList();

// LIKE pattern matching - uses method call syntax with ! operator
List<User> users = userDao.query()
    .filterBy("(this.email)!like('%@admin.com') or (this.email)!like('%@company.com')")
    .selectList();

// Complex nested logic
List<User> users = userDao.query()
    .filterBy("(this.isAdmin == true and this.isActive == true) or (this.isCoordinator == true and this.isCanvasser == true)")
    .selectList();
```

**JQL (JUDO Query Language) Expression Syntax:**
- Field reference: `this.fieldName`
- Equality: `==` (NOT `=`)
- Not equal: `!=`
- Comparisons: `< > <= >=`
- Pattern: `(this.field)!like('%pattern%')` (method call syntax)
- Boolean: `== true`, `== false`
- Logic: `and`, `or`
- Grouping: `(expr1 or expr2)`
- String literals: single quotes `'value'`

**IMPORTANT - What Does NOT Work:**
- Navigation: `this.relation.field` is NOT supported in filterBy
- Single equals: `this.field = value` - use `==` instead
- SQL-style LIKE: `this.field like 'pattern'` - use `(this.field)!like('pattern')` instead

### Common Mistakes

| Mistake | Correct Usage |
|---------|---------------|
| `BooleanFilter.equalTo(true)` | `BooleanFilter.isTrue()` |
| `BooleanFilter.equalTo(false)` | `BooleanFilter.isFalse()` |
| `parentDao.queryParent(child).selectOne()` | `childDao.queryParent(child)` (returns entity directly) |
| `queryChildren(parent).orderByCode()` | Sort in Java: `results.sort(Comparator.comparing(Entity::getCode))` |
| Multiple `filterBy` for OR logic | Use `filterBy("expr1 or expr2")` custom expression |
| `filterBy("this.field = value")` | Use `==`: `filterBy("this.field == value")` |
| `filterBy("this.field like '%x%'")` | Use method syntax: `filterBy("(this.field)!like('%x%')")` |
| `filterBy("this.relation.field == ...")` | Navigation NOT supported - use typed filters or fetch relations |

---

## Pattern: Mocking VariableResolver for Authentication

**Problem**: Custom operations often need authenticated user context via `VariableResolver.resolve("ACTOR", "userName")`. In OSGi runtime, this is injected via `@Reference`, but in integration tests this returns null or is unavailable.

**Solution**: Use Java reflection to inject a mock `VariableResolver` after `ReferenceInjector` creates the instance.

### Step 1: Create a VariableResolverMockHelper Utility

Create this helper in `src/test/java/[your/package]/[yourmodel]/integration/utils/VariableResolverMockHelper.java`:

```java
package [your.package].[yourmodel].integration.utils;

import hu.blackbelt.judo.dispatcher.api.VariableResolver;
import org.mockito.Mockito;
import java.lang.reflect.Field;

/**
 * Utility class for mocking VariableResolver in integration tests.
 *
 * VariableResolver is injected via OSGi @Reference and cannot be overridden
 * through Guice bindings. This helper uses reflection to inject a mock
 * VariableResolver after the ReferenceInjector creates the custom implementation.
 */
public class VariableResolverMockHelper {

    /**
     * Creates a test user for use in tests requiring authentication context.
     *
     * NOTE: Adapt this method to match your User entity structure.
     *
     * @param userDao The DAO for your User entity
     * @param userName The username/identifier for the test user
     * @return The created user entity
     */
    public static [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.User
            createTestUser(
                [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.UserDao userDao,
                String userName) {
        return userDao.create(
            [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.UserForCreate.builder()
                .withUserName(userName)
                .withEmail(userName + "@example.com")
                .withIsActive(true)
                .build()
        );
    }

    /**
     * Injects a mock VariableResolver into a custom implementation instance.
     *
     * The mock is configured to return the specified userName when
     * resolve(String.class, "ACTOR", "userName") is called.
     *
     * @param customImplementation The custom implementation instance
     * @param userName The username to return from the mock
     */
    public static void injectMockVariableResolver(Object customImplementation, String userName) {
        try {
            // Create mock VariableResolver
            VariableResolver mockResolver = Mockito.mock(VariableResolver.class);
            Mockito.when(mockResolver.resolve(String.class, "ACTOR", "userName"))
                .thenReturn(userName);

            // Find the variableResolver field via reflection
            Field variableResolverField = findVariableResolverField(customImplementation.getClass());
            variableResolverField.setAccessible(true);

            // Inject the mock
            variableResolverField.set(customImplementation, mockResolver);

        } catch (Exception e) {
            throw new RuntimeException("Failed to inject mock VariableResolver", e);
        }
    }

    /**
     * Finds the VariableResolver field in the class hierarchy.
     */
    private static Field findVariableResolverField(Class<?> clazz) {
        Class<?> current = clazz;
        while (current != null) {
            for (Field field : current.getDeclaredFields()) {
                if (field.getType().equals(VariableResolver.class)) {
                    return field;
                }
            }
            current = current.getSuperclass();
        }
        throw new IllegalStateException("No VariableResolver field found in " + clazz.getName());
    }
}
```

### Step 2: Use in Integration Tests

```java
import [your.package].[yourmodel].integration.utils.VariableResolverMockHelper;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.*;

@Test
@JudoTest
void testOperationRequiringAuthentication(JudoTestFixture fixture) {
    // Get DAOs
    UserDao userDao = fixture.newInstance(UserDao.class);
    AddressDao addressDao = fixture.newInstance(AddressDao.class);

    // Create custom implementation via ReferenceInjector
    CreateAddressCustomImplementation createAddress = ReferenceInjector.resolve(
        CreateAddressCustomImplementation.class,
        fixture.getInjector()
    );

    // Create test user and inject mock VariableResolver
    User testUser = VariableResolverMockHelper.createTestUser(userDao, "testuser");
    VariableResolverMockHelper.injectMockVariableResolver(createAddress, testUser.getUserName());

    // Now the custom operation can resolve the authenticated user
    CreateAddressInput input = CreateAddressInput.builder()
        .withPostalCode("1234")
        .build();

    createAddress.customCall(input);

    // Verify entity was created with correct user reference
    Address created = addressDao.query().selectOne().orElseThrow();
    assertEquals(testUser.getUserName(), created.getCreatedBy().getUserName());
}
```

### Why This Works

1. **ReferenceInjector creates the instance** - Custom implementation is instantiated with DAOs injected
2. **VariableResolver field exists but is null** - OSGi @Reference injection doesn't work in tests
3. **Reflection injects the mock** - We manually set the field after instance creation
4. **Custom operation uses the mock** - When it calls `variableResolver.resolve()`, it gets our test user

### Key Points

- **Must inject after ReferenceInjector** - The instance must exist before you can inject into it
- **One mock per operation instance** - Each custom implementation needs its own mock
- **Works with any authentication context** - Can mock any ACTOR property (userName, roles, etc.)
- **No Guice binding conflicts** - Doesn't interfere with DAO injection

### Alternative: API-Level Testing

For end-to-end validation with real authentication, test through the REST API:

```java
// REST API integration test (requires deployment)
@Test
void testCreateEntityViaAPI() {
    // Authenticate and get token
    String token = authenticateUser("testuser", "password");

    // Call REST endpoint with authentication
    Response response = given()
        .header("Authorization", "Bearer " + token)
        .contentType("application/json")
        .body(createEntityInput)
        .when()
        .post("/api/entities")
        .then()
        .statusCode(201)
        .extract().response();

    // Verify result
    assertThat(response.jsonPath().getString("status")).isEqualTo("CREATED");
}
```

Most projects use a combination: unit tests for business logic, integration tests for non-authenticated operations, and API tests for authenticated workflows.

---

## Pattern: Handling Optional Fields That Return Null

**Problem**: JUDO-generated service input classes return `null` for optional fields when not set, instead of returning `Optional.empty()`. This causes `NullPointerException` when calling `.orElse()` or `.isPresent()`.

### Example of the Problem

```java
// Generated service input class
public class CreateAddressInput {
    public Optional<String> getOptionalField() {
        // Returns null if key not present, not Optional.empty()!
        return this.internal.containsKey("optionalField")
            ? Optional.ofNullable((String) this.internal.get("optionalField"))
            : null;  // ❌ NULL, not Optional.empty()!
    }
}
```

**Symptom:**

```java
// This throws NullPointerException:
if (input.getOptionalField().orElse(false)) {  // NPE!
    // ...
}
```

### Solution: Always Null-Check Before Calling Optional Methods

In custom operation implementations, **always check for null before calling Optional methods**:

```java
// ❌ WRONG - Will throw NPE if field not set
if (input.getOptionalBooleanField().orElse(false)) {
    // ...
}

// ✅ CORRECT - Check for null first
if (input.getOptionalBooleanField() != null && input.getOptionalBooleanField().orElse(false)) {
    // ...
}
```

### Pattern: Safe Optional Field Access

```java
@Override
public void customCall(CreateAddressInput input) {
    // 1. Required fields - no null check needed
    if (input.getPostalCode() == null || input.getPostalCode().trim().isEmpty()) {
        throw new IllegalArgumentException("Postal code is required");
    }

    // 2. Optional fields with validation - always null-check first
    // Example: Business rule requiring building number when floor is specified
    if (input.getFloor() != null && input.getFloor().isPresent()) {
        if (input.getBuildingNumber() == null || !input.getBuildingNumber().isPresent()) {
            throw new IllegalArgumentException("Building number is required when floor is specified");
        }
    }

    // 3. Create entity builder with required fields only
    AddressForCreate address = AddressForCreate.builder()
        .withPostalCode(input.getPostalCode())
        .build();

    // 4. Set optional fields - null-check before calling ifPresent()
    if (input.getStreetName() != null) {
        input.getStreetName().ifPresent(address::setStreetName);
    }
    if (input.getBuildingNumber() != null) {
        input.getBuildingNumber().ifPresent(address::setBuildingNumber);
    }
    if (input.getFloor() != null) {
        input.getFloor().ifPresent(address::setFloor);
    }

    // 5. Create entity
    Address created = addressDao.create(address);
}
```

### Testing Optional Field Handling

Test that your custom operations handle missing optional fields correctly:

```java
@Test
@JudoTest
void testOptionalFieldsNotSet(JudoTestFixture fixture) {
    CreateAddressCustomImplementation createAddress = ReferenceInjector.resolve(
        CreateAddressCustomImplementation.class,
        fixture.getInjector()
    );

    // Create input with ONLY required fields - no optional fields set
    CreateAddressInput input = CreateAddressInput.builder()
        .withPostalCode("1234")
        // Optional fields NOT set - will be null, not Optional.empty()
        .build();

    // Should NOT throw NullPointerException
    assertDoesNotThrow(() -> createAddress.customCall(input));

    // Verify entity created successfully
    AddressDao addressDao = fixture.newInstance(AddressDao.class);
    assertEquals(1, addressDao.query().selectList().size());
}

@Test
@JudoTest(transaction = TransactionHandling.AUTO_ROLLBACK)
void testOptionalFieldValidation(JudoTestFixture fixture) {
    CreateAddressCustomImplementation createAddress = ReferenceInjector.resolve(
        CreateAddressCustomImplementation.class,
        fixture.getInjector()
    );

    // Test: Business rule - floor specified but building number missing
    CreateAddressInput input = CreateAddressInput.builder()
        .withPostalCode("1234")
        .withFloor(3)  // Optional field SET
        // buildingNumber NOT set - will be null
        .build();

    // Should throw IllegalArgumentException, not NullPointerException
    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> createAddress.customCall(input)
    );

    assertTrue(exception.getMessage().contains("Building number is required"));
}
```

### Common Optional Field Patterns

| Use Case | Pattern |
|----------|---------|
| **Check if present and true** | `if (input.getField() != null && input.getField().orElse(false))` |
| **Get value with default** | `String value = input.getField() != null ? input.getField().orElse("default") : "default";` |
| **Set if present** | `if (input.getField() != null) input.getField().ifPresent(entity::setField);` |
| **Validate when present** | `if (input.getField() != null && input.getField().isPresent()) { validate(input.getField().get()); }` |

### Why This Happens

JUDO's code generation uses a map-based internal representation:

```java
private final Map<String, Object> internal = new HashMap<>();

public Optional<String> getOptionalField() {
    // If key doesn't exist in map, return null (not Optional.empty())
    return this.internal.containsKey("optionalField")
        ? Optional.ofNullable((String) this.internal.get("optionalField"))
        : null;
}
```

When a field is not set via the builder, the key doesn't exist in the map, so the getter returns `null`.

### Integration Test Impact

When writing integration tests:

1. **Test with missing optional fields** - Ensure operations don't crash with NPE
2. **Test with optional fields set to null** - `withField(null)` is different from not calling `withField()`
3. **Test optional field validation** - Verify validation logic handles all null cases correctly

---

## Pattern: Validating Related Entity References

**Problem**: When custom operations accept entity references (e.g., settlement, electoral district), they may reference entities that have been deleted or don't exist. Integration tests need to verify that operations properly validate these references.

### Solution Pattern

```java
@Test
@JudoTest
void testInvalidReferenceRejection(JudoTestFixture fixture) {
    // Get DAOs
    SettlementDao settlementDao = fixture.newInstance(SettlementDao.class);

    // Create and then DELETE a settlement
    Settlement settlement = settlementDao.create(SettlementForCreate.builder()
        .withName("Test Settlement")
        .build());
    settlementDao.delete(settlement);  // Now it doesn't exist

    // Get custom operation
    CreateAddressCustomImplementation createAddress = ReferenceInjector.resolve(
        CreateAddressCustomImplementation.class,
        fixture.getInjector()
    );

    // Try to create address with deleted settlement reference
    CreateAddressInput input = CreateAddressInput.builder()
        .withPostalCode("1234")
        .withSettlement(settlement.adaptTo(
            [your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement.class
        ))
        .build();

    // Should throw IllegalArgumentException for invalid reference
    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> createAddress.customCall(input),
        "Invalid reference should be rejected"
    );

    assertTrue(exception.getMessage().contains("not found"));
}
```

### Custom Operation Implementation Pattern

```java
@Override
public void customCall(CreateAddressInput input) {
    // Validate required fields
    if (input.getSettlement() == null) {
        throw new IllegalArgumentException("Settlement is required");
    }

    // Validate settlement exists
    if (!settlementDao.getById(input.getSettlement().identifier()).isPresent()) {
        throw new IllegalArgumentException("Settlement not found");
    }

    // Validate other references similarly if your entity has multiple relationships
    if (input.getElectoralDistrict() != null) {
        if (!districtDao.getById(input.getElectoralDistrict().identifier()).isPresent()) {
            throw new IllegalArgumentException("Electoral district not found");
        }
    }

    // Continue with entity creation
    Address address = addressDao.create(AddressForCreate.builder()
        .withPostalCode(input.getPostalCode())
        .withSettlement(input.getSettlement().adaptTo(
            [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.settlement.Settlement.class
        ))
        .build());
}
```

### Why This Matters

- **Database foreign key constraints** handle this in production, but tests use transaction isolation
- **Transaction isolation** can cause false negatives - entity might exist in one transaction but not visible in another
- **Explicit validation** ensures clear error messages and prevents confusing constraint violation errors
- **Test verification** ensures your operations fail fast with meaningful errors

### Testing Invalid References

```java
@Test
@JudoTest
void testNullReference(JudoTestFixture fixture) {
    CreateAddressCustomImplementation createAddress = ReferenceInjector.resolve(
        CreateAddressCustomImplementation.class,
        fixture.getInjector()
    );

    // Test with null reference
    CreateAddressInput input = CreateAddressInput.builder()
        .withPostalCode("1234")
        // settlement NOT set - null reference
        .build();

    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> createAddress.customCall(input)
    );

    assertTrue(exception.getMessage().contains("Settlement is required"));
}

@Test
@JudoTest
void testDeletedReference(JudoTestFixture fixture) {
    SettlementDao settlementDao = fixture.newInstance(SettlementDao.class);

    // Create and delete
    Settlement settlement = settlementDao.create(SettlementForCreate.builder()
        .withName("Test")
        .build());
    settlementDao.delete(settlement);

    CreateAddressCustomImplementation createAddress = ReferenceInjector.resolve(
        CreateAddressCustomImplementation.class,
        fixture.getInjector()
    );

    CreateAddressInput input = CreateAddressInput.builder()
        .withPostalCode("1234")
        .withSettlement(settlement.adaptTo(
            [your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement.class
        ))
        .build();

    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> createAddress.customCall(input)
    );

    assertTrue(exception.getMessage().contains("not found"));
}
```

---

## Quick Reference: Complete Custom Operation Template

```java
@Override
public void customCall(CreateAddressInput input) {
    // 1. Validate required fields
    if (input.getPostalCode() == null || input.getPostalCode().trim().isEmpty()) {
        throw new IllegalArgumentException("Postal code is required");
    }
    if (input.getSettlement() == null) {
        throw new IllegalArgumentException("Settlement is required");
    }

    // 2. Validate references exist
    if (!settlementDao.getById(input.getSettlement().identifier()).isPresent()) {
        throw new IllegalArgumentException("Settlement not found");
    }

    // 3. Check business rules with optional fields
    if (input.getFloor() != null && input.getFloor().isPresent()) {
        if (input.getBuildingNumber() == null || !input.getBuildingNumber().isPresent()) {
            throw new IllegalArgumentException("Building number is required when floor is specified");
        }
    }

    // 4. Check uniqueness constraints
    if (addressDao.query()
            .filterByPostalCode(StringFilter.equalTo(input.getPostalCode()))
            .selectList().size() > 0) {
        throw new IllegalStateException("Address with this postal code already exists");
    }

    // 5. Build entity with required fields
    AddressForCreate address = AddressForCreate.builder()
        .withPostalCode(input.getPostalCode())
        .withSettlement(input.getSettlement().adaptTo(
            [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.settlement.Settlement.class
        ))
        .build();

    // 6. Set optional fields with null checks
    if (input.getStreetName() != null) {
        input.getStreetName().ifPresent(address::setStreetName);
    }
    if (input.getBuildingNumber() != null) {
        input.getBuildingNumber().ifPresent(address::setBuildingNumber);
    }
    if (input.getFloor() != null) {
        input.getFloor().ifPresent(address::setFloor);
    }

    // 7. Create entity
    Address created = addressDao.create(address);
    log.info("Address created with postal code: {}", created.getPostalCode());
}
```

---

## Summary

### Pattern Selection Guide

| Challenge | Pattern | When to Use |
|-----------|---------|-------------|
| **Querying by criteria** | Query filters (StringFilter, NumberFilter, BooleanFilter, LocalDateFilter) | Filtering entities by field values |
| **Authentication needed** | VariableResolver mocking | Testing operations that access ACTOR context |
| **Optional fields** | Null-check before Optional methods | All service input optional fields |
| **Entity references** | Validate with getById() | Testing foreign key relationships |
| **Complex validation** | Multiple null checks + business rules | Operations with conditional validation |

### Key Takeaways

1. **BooleanFilter uses isTrue()/isFalse()** - NOT `equalTo(boolean)` which doesn't exist
2. **Single-valued relationships return entities directly** - Don't call `.selectOne()` on them
3. **Relation query customizers don't support ordering** - Sort in Java after fetching
4. **VariableResolver must be mocked via reflection** - OSGi @Reference doesn't work in tests
5. **Optional fields can be null** - Always null-check before calling Optional methods
6. **Entity references need validation** - Check existence before using in DAOs
7. **Test all edge cases** - Missing fields, deleted references, invalid combinations

---

## Next Steps

**If you're done here**, return to the [Main Hub](./SKILL.md)

**If you need help with**:
- [Getting started with tests](./getting-started.md)
- [Type safety and adaptTo()](./type-safety.md)
- [Best practices and anti-patterns](./best-practices.md)

---

**Last Updated**: 2025-12-02
