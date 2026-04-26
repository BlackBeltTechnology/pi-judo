# Integration Testing - Best Practices and Anti-Patterns

**Part of**: [Integration Testing Documentation](./SKILL.md)

**Target Audience**: All levels - reference for ongoing work

**Prerequisites**: Understanding of JUDO integration testing basics

---

## Quick Navigation

- [Back to Main Hub](./SKILL.md)
- [Best Practices](#best-practices)
- [Common Anti-Patterns](#common-anti-patterns)
- [Custom Operation Patterns](#common-pitfalls-in-custom-operations)
- [Test Organization](#test-organization-best-practices)

---

## Overview

This guide covers best practices for writing maintainable, efficient integration tests and common anti-patterns to avoid.

---

## Best Practices

### 1. Test Organization

**Organize tests by functionality:**

```
src/test/java/[your/package]/[yourmodel]/integration/
├── operations/          # Custom operation tests
│   ├── CreateAddressIntegrationTest.java
│   ├── CreateCampaignIntegrationTest.java
│   └── CreatePollingStationIntegrationTest.java
├── fixtures/            # Test data builders
│   ├── AddressTestFixtures.java
│   └── UserTestFixtures.java
└── utils/               # Test utilities
    └── VariableResolverMockHelper.java
```

### 2. Transaction Mode Selection

Choose the right transaction mode for your test:

```java
// ✅ Use AUTO_ROLLBACK for read-only verification tests
@JudoTest(transaction = TransactionHandling.AUTO_ROLLBACK)
void testEntityCreatedWithCorrectData(JudoTestFixture fixture) {
    // Test verifies data without needing persistence
}

// ✅ Use AUTO_COMMIT for persistence tests
@JudoTest(transaction = TransactionHandling.AUTO_COMMIT)
void testEntityPersisted(JudoTestFixture fixture) {
    // Test verifies entity persists across transactions
}

// ✅ Use MANUAL for complex multi-transaction scenarios
@JudoTest(transaction = TransactionHandling.MANUAL)
void testMultiStepWorkflow(JudoTestFixture fixture) {
    // Test controls transaction boundaries explicitly
}
```

### 3. Test Data Management

**Use test fixtures for reusable test data:**

```java
public class AddressTestFixtures {

    public static Settlement createTestSettlement(SettlementDao settlementDao) {
        return settlementDao.create(SettlementForCreate.builder()
            .withName("Test Settlement")
            .withZipCode(1234)
            .build());
    }

    public static Address createTestAddress(AddressDao addressDao, Settlement settlement) {
        return addressDao.create(AddressForCreate.builder()
            .withPostalCode("1234")
            .withSettlement(settlement)
            .withStreetName("Test Street")
            .withBuildingNumber("42")
            .build());
    }
}
```

**Use in tests:**

```java
@Test
@JudoTest
void testCreatePollingStation(JudoTestFixture fixture) {
    SettlementDao settlementDao = fixture.newInstance(SettlementDao.class);
    AddressDao addressDao = fixture.newInstance(AddressDao.class);

    // Use fixtures for clean, readable tests
    Settlement settlement = AddressTestFixtures.createTestSettlement(settlementDao);
    Address address = AddressTestFixtures.createTestAddress(addressDao, settlement);

    // Rest of test...
}
```

### 4. Assertion Strategies

**Test the right things:**

```java
@Test
@JudoTest
void testCreateAddress(JudoTestFixture fixture) {
    // ... create address ...

    // ✅ Verify entity was created
    assertEquals(1, addressDao.query().selectList().size());

    // ✅ Verify correct data
    Address created = addressDao.query().selectOne().orElseThrow();
    assertEquals("1234", created.getPostalCode());
    assertEquals("Test Street", created.getStreetName().orElse(null));

    // ✅ Verify relationships
    assertTrue(created.getSettlement() != null);
    assertEquals(settlement.identifier(), created.getSettlement().identifier());

    // ❌ Don't test framework behavior
    // assertNotNull(created.identifier());  // Framework always sets this
}
```

### 5. Logging and Debugging

**Configure appropriate logging in `logback-test.xml`:**

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- Project logging -->
    <logger name="[your.package].[yourmodel]" level="DEBUG"/>

    <!-- JUDO framework logging -->
    <logger name="hu.blackbelt.judo" level="INFO"/>

    <!-- SQL logging (enable when debugging queries) -->
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    <logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE"/>

    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

### 6. Test Isolation

**Ensure tests don't interfere with each other:**

```java
// ✅ Use truncateTables = true (default)
@JudoTest(truncateTables = true)
void testIsolated(JudoTestFixture fixture) {
    // Database is clean before this test runs
}

// ⚠️ Only disable when you have expensive setup
@JudoTest(truncateTables = false)
void testWithSharedData(JudoTestFixture fixture) {
    // Make sure test handles existing data properly
}
```

### 7. Performance Considerations

**Use masks for partial entity loading:**

```java
// ❌ Slow - loads all fields and relationships
Address address = addressDao.getById(addressId).orElseThrow();

// ✅ Fast - loads only what you need
Address address = addressDao.getById(addressId, AddressMask.addressMask()
    .withPostalCode()
    .withStreetName()
).orElseThrow();

// ✅ Very fast - existence check only
boolean exists = addressDao.getById(addressId, AddressMask.addressMask()).isPresent();
```

### 8. Helper Method Reuse

**Create base test classes for common patterns:**

```java
public abstract class BaseIntegrationTest {

    protected <T> T getInstance(JudoTestFixture fixture, Class<T> clazz) {
        return fixture.newInstance(clazz);
    }

    protected void assertEntityExists(Object dao, Object identifier) {
        // Common assertion logic
    }

    protected void assertFieldEquals(String expected, String actual, String fieldName) {
        assertEquals(expected, actual, fieldName + " should match");
    }
}
```

### 9. BaseIntegrationTest Pattern for Complex Entity Dependencies

**For applications with complex entity relationships**, create a `BaseIntegrationTest` class with helper methods that manage prerequisite entity creation. This pattern is especially valuable when:
- Many entities require other entities to be created first (e.g., Address requires Country, FaultRegistry requires Address and User)
- Tests need consistent, reusable test data
- You want to centralize test data creation logic

**Example implementation:**

```java
public abstract class BaseIntegrationTest {

    /**
     * Helper method to create a test Country
     */
    protected Country createTestCountry(JudoRuntimeFixture fixture) {
        CountryDao countryDao = fixture.getInjector().getInstance(CountryDao.class);
        return countryDao.create(CountryForCreate.builder()
                .withName("Hungary")
                .withCode("HU")
                .build());
    }

    /**
     * Helper method to create a test Address
     * Note: Creates prerequisite Country automatically
     */
    protected Address createTestAddress(JudoRuntimeFixture fixture, Country country) {
        AddressDao addressDao = fixture.getInjector().getInstance(AddressDao.class);
        return addressDao.create(AddressForCreate.builder()
                .withCity("Budapest")
                .withPostalCode("1000")
                .withStreetName("Test Street")
                .withAddressInformation("Test Info")
                .withManualAddressInformation(false)
                .withCountry(country)
                .build());
    }

    /**
     * Helper method to create a test User
     */
    protected User createTestUser(JudoRuntimeFixture fixture) {
        UserDao userDao = fixture.getInjector().getInstance(UserDao.class);
        return userDao.create(UserForCreate.builder()
                .withName("Test User")
                .withEmail("test@example.com")
                .build());
    }

    /**
     * Helper method to create a test FaultRegistry
     * Note: Requires multiple prerequisites (Address, User)
     */
    protected FaultRegistry createTestFaultRegistry(JudoRuntimeFixture fixture,
                                                   Address facility,
                                                   User assignedTo,
                                                   String registryNumber) {
        FaultRegistryDao faultRegistryDao = fixture.getInjector().getInstance(FaultRegistryDao.class);
        return faultRegistryDao.create(FaultRegistryForCreate.builder()
                .withRegistryNumber(registryNumber)
                .withFacility(facility)
                .withAssignedTo(assignedTo)
                .withOfferCreated(false)
                .build());
    }
}
```

**Using in tests:**

```java
class FaultRegistryBasicTest extends BaseIntegrationTest {

    @Test
    @JudoTest(
        modelName = "rackinspect",
        dialect = "hsqldb",
        transaction = TransactionHandling.AUTO_ROLLBACK,
        truncateTables = true,
        modelSource = JudoTest.ModelSource.CLASSPATH,
        modules = { RackinspectDaoModules.class }
    )
    void testCreateFaultRegistry(JudoRuntimeFixture fixture) {
        // Clean, readable test using helper methods
        Country country = createTestCountry(fixture);
        Address facility = createTestAddress(fixture, country);
        User assignedTo = createTestUser(fixture);

        FaultRegistry registry = createTestFaultRegistry(
            fixture, facility, assignedTo, "REG-001"
        );

        assertNotNull(registry);
        assertEquals("REG-001", registry.getRegistryNumber());
        assertEquals(facility.identifier(), registry.getFacility().identifier());
    }
}
```

**Benefits of this pattern:**
- ✅ **Cleaner test code** - Hides complexity of prerequisite creation
- ✅ **Consistency** - Same test data across all tests
- ✅ **Maintainability** - Update helper methods instead of every test
- ✅ **Reusability** - Helper methods work across all test classes
- ✅ **Documentation** - Helper method names describe what entities are created

**Real-world example**: See `application/integration-test/src/test/java/*/integration/BaseIntegrationTest.java` for a production implementation managing Country, Address, User, Currency, Item, and FaultRegistry creation.

---

## Common Anti-Patterns

### Anti-Pattern 1: Type Layer Confusion

**Problem**: Mixing entity layer and service layer types causes compilation errors.

```java
// ❌ WRONG - Type mismatch
Settlement entitySettlement = settlementDao.create(...);  // Entity layer

CreateAddressInput input = CreateAddressInput.builder()
    .withSettlement(entitySettlement)  // Expects service layer - ERROR!
    .build();
```

**Solution**: Use `adaptTo()` to convert between layers.

```java
// ✅ CORRECT - Adapt entity to service layer
Settlement entitySettlement = settlementDao.create(...);

CreateAddressInput input = CreateAddressInput.builder()
    .withSettlement(entitySettlement.adaptTo(
        [your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement.class
    ))
    .build();
```

**Reference**: See [Type Safety Guide](./type-safety.md) for detailed explanations.

### Anti-Pattern 2: Assuming Entity Relationships Are Navigable

**Problem**: Trying to navigate relationships that haven't been loaded.

```java
// ❌ WRONG - Relationship might not be loaded
Address address = addressDao.create(...);
Settlement settlement = address.getSettlement();  // Might be null!
```

**Solution**: Create prerequisites first and explicitly set relationships.

```java
// ✅ CORRECT - Create prerequisites first
Settlement settlement = settlementDao.create(...);

Address address = addressDao.create(AddressForCreate.builder()
    .withPostalCode("1234")
    .withSettlement(settlement)  // Explicitly set relationship
    .build());
```

### Anti-Pattern 3: Wrong Transaction Mode

**Problem**: Using wrong transaction mode leads to test failures or false positives.

```java
// ❌ WRONG - AUTO_ROLLBACK for persistence test
@JudoTest(transaction = TransactionHandling.AUTO_ROLLBACK)
void testEntityPersisted() {
    Address address = addressDao.create(...);
    // Test passes but data doesn't actually persist!
}
```

**Solution**: Match transaction mode to test intent.

```java
// ✅ CORRECT - AUTO_COMMIT for persistence tests
@JudoTest(transaction = TransactionHandling.AUTO_COMMIT)
void testEntityPersisted() {
    Address address = addressDao.create(...);
    // Data actually persists
}
```

### Anti-Pattern 4: Not Importing TransactionHandling Correctly

**Problem**: Wildcard imports don't include nested enum classes.

```java
// ❌ WRONG - Won't compile
import hu.blackbelt.judo.runtime.core.jsl.fixture.*;

@JudoTest(transaction = TransactionHandling.AUTO_COMMIT)  // ERROR!
```

**Solution**: Import the nested enum explicitly.

```java
// ✅ CORRECT - Import nested enum
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTest;
import hu.blackbelt.judo.runtime.core.jsl.fixture.TransactionHandling;

@JudoTest(transaction = TransactionHandling.AUTO_COMMIT)  // Works!
```

---

## Common Pitfalls in Custom Operations

### Anti-Pattern 6: Not Checking Optional Field Nulls

**Problem**: Optional field getters can return `null`, not `Optional.empty()`.

```java
// ❌ WRONG - NullPointerException if field not set
public void customCall(CreateAddressInput input) {
    input.getFloor().ifPresent(address::setFloor);  // NPE if null!
}
```

**Solution**: Always null-check before calling Optional methods.

```java
// ✅ CORRECT - Null-check first
public void customCall(CreateAddressInput input) {
    if (input.getFloor() != null) {
        input.getFloor().ifPresent(address::setFloor);
    }
}
```

**Reference**: See [Advanced Patterns Guide](./advanced-patterns.md#pattern-handling-optional-fields-that-return-null) for details.

### Anti-Pattern 6.5: Not Handling Optional<T> Return Types in Assertions

**Problem**: JUDO-generated entities can return `Optional<T>` for certain fields (like `getName()` in some entities), which requires different assertion patterns than direct value comparisons.

```java
// ❌ WRONG - Comparing Optional to String directly
Currency currency = currencyDao.create(...);
assertEquals("Hungarian Forint", currency.getName());  // Type mismatch!

// ❌ WRONG - Not checking if Optional has value
String name = currency.getName().get();  // NoSuchElementException if empty!
```

**Solution**: Use Optional-aware assertions and safe value extraction.

```java
// ✅ CORRECT - Check presence and extract value
Currency currency = currencyDao.create(CurrencyForCreate.builder()
    .withCode("HUF")
    .withName("Hungarian Forint")
    .build());

// Verify Optional is present
assertTrue(currency.getName().isPresent(), "Currency name should be present");

// Extract and verify value
assertEquals("Hungarian Forint", currency.getName().get());

// ✅ CORRECT - Safe logging with Optional
log.info("Created Currency: {} ({})",
    currency.getName().orElse("N/A"),  // Safe default
    currency.getCode());
```

**When This Occurs**: Not all entity fields return `Optional<T>` - this depends on how the model is defined. Common scenarios:
- Optional string fields (names, descriptions)
- Optional numeric fields
- Fields that can be null in the model

**Testing Strategy**: When encountering entity fields, check their return type and use appropriate assertions:

```java
// For Optional<T> fields
if (entity.getFieldName() != null) {
    assertTrue(entity.getFieldName().isPresent());
    assertEquals(expectedValue, entity.getFieldName().get());
}

// For direct value fields
assertEquals(expectedValue, entity.getFieldName());
```

**Reference**: This pattern was discovered in real-world testing and is not documented in standard JUDO integration testing guides. See the Currency entity tests in `application/integration-test/src/test/java/*/integration/CurrencyBasicTest.java` for examples.

### Anti-Pattern 7: Using adaptTo() to Get Identifiers

**Problem**: Unnecessary complexity when getting identifiers.

```java
// ❌ WRONG - Overcomplicated
SettlementIdentifier settlementId = input.getSettlement().adaptTo(SettlementIdentifier.class);
```

**Solution**: Use the `identifier()` method directly.

```java
// ✅ CORRECT - Direct identifier access
SettlementIdentifier settlementId = input.getSettlement().identifier();
```

### Anti-Pattern 7.5: Validating Foreign Key References in Custom Operations

**Problem**: Explicit validation fails in tests due to transaction isolation.

```java
// ❌ WRONG - Causes test failures
public void customCall(CreateAddressInput input) {
    if (!settlementDao.getById(input.getSettlement().identifier()).isPresent()) {
        throw new IllegalArgumentException("Settlement not found");
    }
    addressDao.create(...);  // This check is redundant anyway
}
```

**Solution**: Let database constraints handle validation.

```java
// ✅ CORRECT - Database handles validation
public void customCall(CreateAddressInput input) {
    // Database foreign key constraint validates automatically
    addressDao.create(AddressForCreate.builder()
        .withSettlement(input.getSettlement().adaptTo(Settlement.class))
        .build());
}
```

### Anti-Pattern 8: Using getById().isPresent() for Existence Checks

**Problem**: Loads entire entity when you only need to check existence.

```java
// ❌ WRONG - Loads all fields and relationships
if (!addressDao.getById(addressId).isPresent()) {
    throw new IllegalArgumentException("Address not found");
}
```

**Solution**: Use empty mask for fast existence checks.

```java
// ✅ CORRECT - Only checks existence
if (!addressDao.getById(addressId, AddressMask.addressMask()).isPresent()) {
    throw new IllegalArgumentException("Address not found");
}
```

### Anti-Pattern 9: Not Using Masks for Partial Loads

**Problem**: Loading entire entities wastes resources.

```java
// ❌ WRONG - Loads everything
Address address = addressDao.getById(id).orElseThrow();
String postalCode = address.getPostalCode();
```

**Solution**: Use masks to load only required fields.

```java
// ✅ CORRECT - Loads only postal code
Address address = addressDao.getById(id, AddressMask.addressMask()
    .withPostalCode()
).orElseThrow();
String postalCode = address.getPostalCode();
```

---

## Quick Reference: Custom Operation Patterns

### Reference Validation Pattern

```java
// Check existence with empty mask (fast)
if (!settlementDao.getById(input.getSettlement().identifier(), SettlementMask.settlementMask()).isPresent()) {
    throw new IllegalArgumentException("Settlement not found");
}
```

### Optional Field Pattern

```java
// Always null-check before Optional operations
if (input.getFloor() != null) {
    input.getFloor().ifPresent(address::setFloor);
}
```

### Entity Conversion Pattern

```java
// Service layer → Entity layer for DAO operations
Settlement entitySettlement = input.getSettlement().adaptTo(
    [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.settlement.Settlement.class
);

addressDao.create(AddressForCreate.builder()
    .withSettlement(entitySettlement)
    .build());
```

### Complete Custom Operation Template

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

    // 2. Validate references exist (with empty masks for performance)
    if (!settlementDao.getById(input.getSettlement().identifier(),
            SettlementMask.settlementMask()).isPresent()) {
        throw new IllegalArgumentException("Settlement not found");
    }

    // 3. Check business rules with optional fields
    if (input.getFloor() != null && input.getFloor().isPresent()) {
        if (input.getBuildingNumber() == null || !input.getBuildingNumber().isPresent()) {
            throw new IllegalArgumentException("Building number required when floor specified");
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
    log.info("Address created: {}", created.getPostalCode());
}
```

---

## Test Organization Best Practices

### Naming Conventions

```java
// ✅ Good test names - describe what is being tested
@Test
void testCreateAddressWithValidData() { }

@Test
void testCreateAddressRejectsInvalidPostalCode() { }

@Test
void testCreateAddressRequiresSettlement() { }

// ❌ Bad test names - too generic
@Test
void test1() { }

@Test
void testAddress() { }
```

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```java
@Test
@JudoTest
void testCreateAddress(JudoTestFixture fixture) {
    // ARRANGE - Set up test data
    SettlementDao settlementDao = fixture.newInstance(SettlementDao.class);
    AddressDao addressDao = fixture.newInstance(AddressDao.class);

    Settlement settlement = settlementDao.create(SettlementForCreate.builder()
        .withName("Test Settlement")
        .build());

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

    // ACT - Execute the operation
    createAddress.customCall(input);

    // ASSERT - Verify the results
    assertEquals(1, addressDao.query().selectList().size());
    Address created = addressDao.query().selectOne().orElseThrow();
    assertEquals("1234", created.getPostalCode());
}
```

### Test Coverage Guidelines

**What to test:**

✅ **Happy path** - Operations succeed with valid data
✅ **Validation** - Operations reject invalid data
✅ **Business rules** - Operations enforce domain logic
✅ **Edge cases** - Operations handle boundary conditions
✅ **Error handling** - Operations fail gracefully

**What not to test:**

❌ **Framework behavior** - JUDO framework is already tested
❌ **Generated code** - DAOs and entities are generated correctly
❌ **Database constraints** - Database enforces these automatically
❌ **Third-party libraries** - External dependencies have their own tests

---

## Summary

### Best Practices Checklist

- [ ] Organize tests by functionality
- [ ] Use correct transaction mode for each test
- [ ] Create reusable test fixtures
- [ ] Test the right things (business logic, not framework)
- [ ] Configure appropriate logging
- [ ] Ensure test isolation with `truncateTables = true`
- [ ] Use masks for performance
- [ ] Create base test classes for common patterns

### Anti-Patterns to Avoid

- [ ] Mixing entity and service layer types
- [ ] Assuming relationships are loaded
- [ ] Using wrong transaction mode
- [ ] Not importing TransactionHandling correctly
- [ ] Not null-checking optional fields
- [ ] Overcomplicating identifier access
- [ ] Validating foreign keys explicitly
- [ ] Using full entity loads for existence checks
- [ ] Not using masks for partial loads

### Key Takeaways

1. **Type safety is critical** - Always use `adaptTo()` correctly
2. **Transaction mode matters** - Choose based on test intent
3. **Optional fields can be null** - Always null-check first
4. **Performance matters** - Use masks appropriately
5. **Test structure matters** - Follow Arrange-Act-Assert
6. **Test coverage matters** - Test business logic, not framework

---

## Next Steps

**If you're done here**, return to the [Main Hub](./SKILL.md)

**If you need help with**:
- [Getting started with tests](./getting-started.md)
- [Type safety and adaptTo()](./type-safety.md)
- [Advanced patterns and workarounds](./advanced-patterns.md)

---

**Last Updated**: 2025-11-02
