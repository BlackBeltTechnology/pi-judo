# Integration Testing - Supplementary Patterns

**Part of**: [Integration Testing Documentation](./SKILL.md)

**Target Audience**: All levels - additional patterns discovered from real-world implementations

**Prerequisites**: Understanding of basic JUDO integration testing

---

## Quick Navigation

- [Back to Main Hub](./SKILL.md)
- [Test Fixture Pattern](#pattern-test-fixtures-for-complex-hierarchies)
- [ValidationUtils Pattern](#pattern-common-validation-utilities)
- [Idempotent Operations](#pattern-idempotent-operations)
- [Date Range Validation](#pattern-date-range-validation)
- [Paired Field Validation](#pattern-paired-field-validation)

---

## Overview

This guide contains additional patterns discovered from real-world JUDO integration test implementations. These patterns complement the core documentation with practical solutions to common challenges.

---

## Pattern: Test Fixtures for Complex Hierarchies

**Problem**: Creating entities with many prerequisites leads to code duplication and makes tests hard to maintain.

**Solution**: Encapsulate prerequisite creation in fixture classes.

### Fixture Class Structure

```java
package [your.package].[yourmodel].integration.fixtures;

import com.google.inject.Injector;
// Import your entity DAOs

/**
 * Fixture helper for creating entities with complex prerequisites.
 *
 * EntityA requires:
 * - EntityB (which requires EntityC)
 * - EntityD
 * - EntityE
 *
 * This fixture creates all prerequisites in the correct order.
 */
public class EntityATestFixtures {
    
    private final Injector injector;
    
    // DAOs
    private final EntityBDao entityBDao;
    private final EntityCDao entityCDao;
    private final EntityDDao entityDDao;
    private final EntityEDao entityEDao;
    
    // Created entities
    private EntityB entityB;
    private EntityC entityC;
    private EntityD entityD;
    private EntityE entityE;
    
    public EntityATestFixtures(Injector injector) {
        this.injector = injector;
        
        // Initialize DAOs
        this.entityBDao = injector.getInstance(EntityBDao.class);
        this.entityCDao = injector.getInstance(EntityCDao.class);
        this.entityDDao = injector.getInstance(EntityDDao.class);
        this.entityEDao = injector.getInstance(EntityEDao.class);
    }
    
    /**
     * Creates all prerequisite entities needed for EntityA tests.
     *
     * @return this fixture instance for method chaining
     */
    public EntityATestFixtures createAllPrerequisites() {
        // 1. Create EntityC (no dependencies)
        entityC = entityCDao.create(EntityCForCreate.builder()
            .withCode("C001")
            .withName("Test EntityC")
            .build());
        
        // 2. Create EntityB (requires EntityC)
        entityB = entityBDao.create(EntityBForCreate.builder()
            .withCode("B001")
            .withName("Test EntityB")
            .withEntityC(entityC)
            .build());
        
        // 3. Create EntityD (no dependencies)
        entityD = entityDDao.create(EntityDForCreate.builder()
            .withCode("D001")
            .build());
        
        // 4. Create EntityE (no dependencies)
        entityE = entityEDao.create(EntityEForCreate.builder()
            .withName("Test EntityE")
            .build());
        
        return this;
    }
    
    // Getters for all created entities
    
    public EntityB getEntityB() {
        return entityB;
    }
    
    public EntityC getEntityC() {
        return entityC;
    }
    
    public EntityD getEntityD() {
        return entityD;
    }
    
    public EntityE getEntityE() {
        return entityE;
    }
}
```

### Usage in Tests

```java
@Test
@JudoTest
void testCreateEntityA(JudoTestFixture fixture) {
    // Create all prerequisites with one call
    EntityATestFixtures fixtures = new EntityATestFixtures(fixture.getInjector());
    fixtures.createAllPrerequisites();
    
    // Get custom operation
    CreateEntityACustomImplementation createEntityA = ReferenceInjector.resolve(
        CreateEntityACustomImplementation.class,
        fixture.getInjector()
    );
    
    // Create input using fixture entities (adapt to service layer)
    CreateEntityAInput input = CreateEntityAInput.builder()
        .withName("Test EntityA")
        .withEntityB(fixtures.getEntityB().adaptTo(ServiceEntityB.class))
        .withEntityD(fixtures.getEntityD().adaptTo(ServiceEntityD.class))
        .withEntityE(fixtures.getEntityE().adaptTo(ServiceEntityE.class))
        .build();
    
    // Execute operation
    createEntityA.customCall(input);
    
    // Verify
    EntityADao entityADao = fixture.newInstance(EntityADao.class);
    assertEquals(1, entityADao.query().selectList().size());
}
```

### Benefits

- **Reduces code duplication** - Create prerequisites once, use in many tests
- **Enforces correct order** - Dependencies created in proper sequence
- **Improves readability** - Tests focus on what they're testing
- **Easier maintenance** - Change prerequisite creation in one place
- **Reusable** - One fixture can be used by multiple test classes

---

## Pattern: Common Validation Utilities

> **📖 Production Documentation**: For the complete ValidationUtils implementation and production usage patterns, see:
> - [Common Patterns - ValidationUtils](./common-patterns.md#validationutils)
> - [Custom Operations - ValidationUtils Pattern](./custom-operations.md#validationutils-pattern)

**Problem**: Same validation logic duplicated across multiple custom operations.

**Solution**: Extract common validations to utility class.

**This section shows**: How to test operations that use ValidationUtils.

### ValidationUtils Class (Reference)

```java
package [your.package].[yourmodel].custom.utils;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Common validation utilities for custom operations.
 */
public class ValidationUtils {
    
    /**
     * Validates that a string field is not null and not empty.
     *
     * @param value the value to validate
     * @param fieldName the field name for error messages
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }
    
    /**
     * Validates that an object is not null.
     *
     * @param value the value to validate
     * @param fieldName the field name for error messages
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateNotNull(Object value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }
    
    /**
     * Validates that end date is after start date.
     *
     * @param startDate the start date
     * @param endDate the end date
     * @throws IllegalArgumentException if end date is before start date
     */
    public static void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be after start date");
        }
    }
    
    /**
     * Validates numeric range.
     *
     * @param value the value to validate
     * @param min minimum allowed value (inclusive)
     * @param max maximum allowed value (inclusive)
     * @param fieldName the field name for error messages
     * @throws IllegalArgumentException if value is out of range
     */
    public static void validateRange(BigDecimal value, BigDecimal min, BigDecimal max, String fieldName) {
        if (value.compareTo(min) < 0 || value.compareTo(max) > 0) {
            throw new IllegalArgumentException(
                fieldName + " must be between " + min + " and " + max
            );
        }
    }
    
    /**
     * Validates string length.
     *
     * @param value the value to validate
     * @param maxLength maximum allowed length
     * @param fieldName the field name for error messages
     * @throws IllegalArgumentException if string is too long
     */
    public static void validateLength(String value, int maxLength, String fieldName) {
        if (value != null && value.length() > maxLength) {
            throw new IllegalArgumentException(
                fieldName + " cannot exceed " + maxLength + " characters"
            );
        }
    }
    
    /**
     * Validates email format (basic check).
     *
     * @param email the email to validate
     * @throws IllegalArgumentException if email format is invalid
     */
    public static void validateEmail(String email) {
        if (email != null && !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }
}
```

### Usage in Custom Operations

```java
@Override
public void customCall(CreateEntityInput input) {
    // Validate required fields
    ValidationUtils.validateRequired(input.getCode(), "Code");
    ValidationUtils.validateRequired(input.getName(), "Name");
    ValidationUtils.validateNotNull(input.getParent(), "Parent entity");
    
    // Validate string lengths
    ValidationUtils.validateLength(input.getCode(), 50, "Code");
    ValidationUtils.validateLength(input.getName(), 200, "Name");
    
    // Validate optional date range
    if (input.getStartDate() != null && input.getStartDate().isPresent()
        && input.getEndDate() != null && input.getEndDate().isPresent()) {
        ValidationUtils.validateDateRange(
            input.getStartDate().get(), 
            input.getEndDate().get()
        );
    }
    
    // Continue with entity creation...
}
```

### Testing ValidationUtils

```java
@Test
void testValidateRequired() {
    // Valid value - should not throw
    assertDoesNotThrow(() -> 
        ValidationUtils.validateRequired("valid", "Field")
    );
    
    // Null value - should throw
    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> ValidationUtils.validateRequired(null, "Field")
    );
    assertTrue(exception.getMessage().contains("Field is required"));
    
    // Empty value - should throw
    assertThrows(
        IllegalArgumentException.class,
        () -> ValidationUtils.validateRequired("", "Field")
    );
}
```

---

## Pattern: Idempotent Operations

> **📖 Production Documentation**: For complete idempotent operation patterns and implementation, see:
> - [Custom Operations - Idempotent Operation Pattern](./custom-operations.md#idempotent-operation-pattern)

**Problem**: Some operations (like initialization) should be safe to call multiple times without errors or duplication.

**Solution**: Check for existing data before creating, return early if already exists.

**This section shows**: How to test idempotent operations.

### Implementation Pattern

```java
@Override
public void run() {
    log.info("Initializing system configuration");
    
    // Check if configuration already exists
    long existingCount = configDao.query()
        .filterByKey(StringFilter.equalTo("system.initialized"))
        .count();
    
    if (existingCount > 0) {
        log.info("System already initialized, skipping");
        return; // Exit early, no error
    }
    
    // Create configuration
    Config config = configDao.create(ConfigForCreate.builder()
        .withKey("system.initialized")
        .withValue("true")
        .withCreatedAt(LocalDateTime.now())
        .build());
    
    log.info("System initialized successfully");
}
```

### Alternative: Upsert Pattern

```java
@Override
public void run() {
    // Try to find existing
    Optional<Config> existing = configDao.query()
        .filterByKey(StringFilter.equalTo("system.initialized"))
        .selectOne();
    
    if (existing.isPresent()) {
        // Update existing
        Config config = existing.get();
        config.setValue("true");
        config.setUpdatedAt(LocalDateTime.now());
        configDao.update(config);
        log.info("System configuration updated");
    } else {
        // Create new
        configDao.create(ConfigForCreate.builder()
            .withKey("system.initialized")
            .withValue("true")
            .withCreatedAt(LocalDateTime.now())
            .build());
        log.info("System configuration created");
    }
}
```

### Testing Idempotent Operations

```java
@Test
@JudoTest
void testIdempotentBehavior(JudoTestFixture fixture) {
    InitSystemCustomImplementation initSystem = ReferenceInjector.resolve(
        InitSystemCustomImplementation.class,
        fixture.getInjector()
    );
    
    ConfigDao configDao = fixture.newInstance(ConfigDao.class);
    
    // First call - should create
    initSystem.run();
    long countAfterFirst = configDao.countAll();
    assertEquals(1, countAfterFirst, "One config should exist after first call");
    
    // Second call - should not fail or duplicate
    assertDoesNotThrow(() -> initSystem.run(), "Second call should not throw");
    
    // Verify no duplication
    long countAfterSecond = configDao.countAll();
    assertEquals(countAfterFirst, countAfterSecond, "Count should remain the same");
    
    // Third call - still no error
    assertDoesNotThrow(() -> initSystem.run(), "Third call should not throw");
    assertEquals(countAfterFirst, configDao.countAll(), "Count should still be the same");
}
```

### Use Cases

- **System initialization** - Create default admin user, default settings
- **Data migration** - Run once to populate initial data
- **Feature flags** - Initialize feature toggles
- **Cache warming** - Pre-populate caches safely

---

## Pattern: Date Range Validation

**Problem**: Operations accept start/end dates that must form valid ranges.

**Solution**: Validate date ranges before entity creation.

### Basic Date Range Validation

```java
@Override
public void customCall(CreateCampaignInput input) {
    // Validate required fields
    ValidationUtils.validateRequired(input.getCode(), "Code");
    ValidationUtils.validateRequired(input.getName(), "Name");
    
    // Validate date range if both dates provided
    if (input.getStartDate() != null && input.getStartDate().isPresent()
        && input.getEndDate() != null && input.getEndDate().isPresent()) {
        ValidationUtils.validateDateRange(
            input.getStartDate().get(), 
            input.getEndDate().get()
        );
    }
    
    // Create campaign...
}
```

### Advanced Date Range Validation

```java
public static void validateDateRange(LocalDate startDate, LocalDate endDate, DateRangeConstraints constraints) {
    // Check basic order
    if (endDate.isBefore(startDate)) {
        throw new IllegalArgumentException("End date must be after start date");
    }
    
    // Check minimum duration
    if (constraints.hasMinDuration()) {
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
        if (daysBetween < constraints.getMinDurationDays()) {
            throw new IllegalArgumentException(
                "Date range must be at least " + constraints.getMinDurationDays() + " days"
            );
        }
    }
    
    // Check maximum duration
    if (constraints.hasMaxDuration()) {
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
        if (daysBetween > constraints.getMaxDurationDays()) {
            throw new IllegalArgumentException(
                "Date range cannot exceed " + constraints.getMaxDurationDays() + " days"
            );
        }
    }
    
    // Check future-only constraint
    if (constraints.isFutureOnly()) {
        if (startDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date must be in the future");
        }
    }
}
```

### Testing Date Range Validation

```java
@Test
@JudoTest(transaction = TransactionHandling.AUTO_ROLLBACK)
void testInvalidDateRangeRejection(JudoTestFixture fixture) {
    CreateCampaignCustomImplementation createCampaign = ReferenceInjector.resolve(
        CreateCampaignCustomImplementation.class,
        fixture.getInjector()
    );
    
    LocalDate startDate = LocalDate.of(2024, 12, 31);
    LocalDate endDate = LocalDate.of(2024, 1, 1);  // Before start!
    
    CreateCampaignInput input = CreateCampaignInput.builder()
        .withCode("CAMPAIGN2024")
        .withName("Invalid Campaign")
        .withStartDate(startDate)
        .withEndDate(endDate)
        .build();
    
    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> createCampaign.customCall(input)
    );
    
    assertTrue(exception.getMessage().toLowerCase().contains("date"));
}
```

---

## Pattern: Paired Field Validation

**Problem**: Some fields must be provided together (both or neither).

**Solution**: Validate paired fields before processing.

### Coordinate Pair Validation

```java
@Override
public void customCall(CreateLocationInput input) {
    ValidationUtils.validateRequired(input.getName(), "Name");
    
    // Validate coordinate pair - both or neither
    boolean hasLatitude = input.getLatitude() != null && input.getLatitude().isPresent();
    boolean hasLongitude = input.getLongitude() != null && input.getLongitude().isPresent();
    
    if (hasLatitude || hasLongitude) {
        if (hasLatitude && hasLongitude) {
            // Both provided - validate bounds
            BigDecimal latitude = BigDecimal.valueOf(input.getLatitude().get());
            BigDecimal longitude = BigDecimal.valueOf(input.getLongitude().get());
            
            ValidationUtils.validateRange(latitude, MIN_LATITUDE, MAX_LATITUDE, "Latitude");
            ValidationUtils.validateRange(longitude, MIN_LONGITUDE, MAX_LONGITUDE, "Longitude");
        } else {
            throw new IllegalArgumentException("Both latitude and longitude must be provided");
        }
    }
    
    // Create location...
}
```

### Generic Paired Field Pattern

```java
/**
 * Validates that paired fields are provided together.
 */
public static void validatePairedFields(
    Optional<?> field1, String field1Name,
    Optional<?> field2, String field2Name
) {
    boolean has1 = field1 != null && field1.isPresent();
    boolean has2 = field2 != null && field2.isPresent();
    
    if (has1 != has2) {
        throw new IllegalArgumentException(
            "Both " + field1Name + " and " + field2Name + " must be provided together"
        );
    }
}
```

### Testing Paired Field Validation

```java
@Test
@JudoTest(transaction = TransactionHandling.AUTO_ROLLBACK)
void testIncompletePairedFieldsRejection(JudoTestFixture fixture) {
    CreateLocationCustomImplementation createLocation = ReferenceInjector.resolve(
        CreateLocationCustomImplementation.class,
        fixture.getInjector()
    );
    
    // Provide only latitude (longitude missing)
    CreateLocationInput input = CreateLocationInput.builder()
        .withName("Test Location")
        .withLatitude(47.5074)
        // Longitude NOT provided
        .build();
    
    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> createLocation.customCall(input)
    );
    
    assertTrue(exception.getMessage().toLowerCase().contains("both"));
}
```

---

## Pattern: Test Logging with SLF4J

**Problem**: Test failures lack context about what was being tested.

**Solution**: Add structured logging to tests for better traceability.

### Test Class with Logging

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class CreateEntityIntegrationTest {
    
    private static final Logger log = LoggerFactory.getLogger(CreateEntityIntegrationTest.class);
    
    @Test
    @JudoTest
    void testSuccessfulCreation(JudoTestFixture fixture) {
        log.info("Testing successful entity creation");
        
        // Test setup
        log.debug("Creating prerequisite entities");
        EntityB entityB = createEntityB();
        log.debug("EntityB created with ID: {}", entityB.identifier());
        
        // Execute operation
        log.info("Executing CreateEntity operation");
        createEntity.customCall(input);
        
        // Verify
        log.debug("Verifying entity was created");
        assertEquals(1, entityDao.countAll());
        
        EntityA created = entityDao.query().selectOne().orElseThrow();
        log.info("Entity created successfully: {} - {}", created.getCode(), created.getName());
    }
    
    @Test
    @JudoTest(transaction = TransactionHandling.AUTO_ROLLBACK)
    void testValidationFailure(JudoTestFixture fixture) {
        log.info("Testing validation failure for missing required field");
        
        CreateEntityInput input = CreateEntityInput.builder()
            // Missing required fields
            .build();
        
        log.debug("Expecting IllegalArgumentException");
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> createEntity.customCall(input)
        );
        
        log.info("Validation correctly rejected: {}", exception.getMessage());
        assertTrue(exception.getMessage().contains("required"));
    }
}
```

### Configure Logging Level in logback-test.xml

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- Your test logging -->
    <logger name="[your.package].[yourmodel].integration" level="DEBUG"/>
    
    <!-- JUDO framework logging -->
    <logger name="hu.blackbelt.judo" level="INFO"/>

    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

### Benefits

- **Better test output** - See what test was doing when it failed
- **Easier debugging** - Trace test execution flow
- **Documentation** - Logs explain test intent
- **CI/CD visibility** - Test output shows progress

---

---

## Pattern: Get Current User from VariableResolver

**Problem**: Custom operations need to get the authenticated user entity for audit trails or business logic.

**Solution**: Create reusable method that resolves user from VariableResolver and looks up in database.

### Implementation Pattern

```java
@org.osgi.service.component.annotations.Component(
    immediate = true,
    service = YourOperationInterface.class
)
public class YourCustomImplementation implements YourOperationInterface {
    
    @org.osgi.service.component.annotations.Reference
    private hu.blackbelt.judo.dispatcher.api.VariableResolver variableResolver;
    
    @org.osgi.service.component.annotations.Reference
    private UserDao userDao;
    
    @Override
    public void customCall(YourInput input) {
        // Get current user for audit trail
        User currentUser = getCurrentUser();
        
        // Use in entity creation
        EntityForCreate entity = EntityForCreate.builder()
            .withCreatedBy(currentUser)
            .build();
    }
    
    /**
     * Gets the currently authenticated user from VariableResolver.
     *
     * @return the authenticated user entity
     * @throws IllegalStateException if no user is authenticated or user not found
     */
    private User getCurrentUser() {
        String userName = variableResolver.resolve(String.class, "ACTOR", "userName");
        if (userName == null) {
            throw new IllegalStateException("No authenticated user found");
        }

        return userDao.query()
            .filterByUserName(hu.blackbelt.judo.sdk.query.StringFilter.equalTo(userName))
            .selectOne()
            .orElseThrow(() -> new IllegalStateException("Current user not found: " + userName));
    }
}
```

### Benefits

- **Reusable method** - Use in multiple operations
- **Type-safe** - Returns entity not just username
- **Error handling** - Clear exceptions if authentication missing
- **Audit trail** - Link entities to creating user

### Testing

For testing, use VariableResolverMockHelper (see [Advanced Patterns](./advanced-patterns.md#pattern-mocking-variableresolver-for-authentication)).

---

## Pattern: Multiple Field Uniqueness Validation

**Problem**: Multiple fields need independent uniqueness checks with specific error messages.

**Solution**: Validate each field separately with descriptive errors.

### Implementation Pattern

```java
@Override
public void customCall(CreateUserInput input) {
    // Validate required fields
    ValidationUtils.validateRequired(input.getUserName(), "Username");
    ValidationUtils.validateRequired(input.getEmail(), "Email");
    
    // Check username uniqueness
    long usernameCount = userDao.query()
        .filterByUserName(hu.blackbelt.judo.sdk.query.StringFilter.equalTo(input.getUserName()))
        .count();
    
    if (usernameCount > 0) {
        throw new IllegalStateException("User with username '" + input.getUserName() + "' already exists");
    }

    // Check email uniqueness
    long emailCount = userDao.query()
        .filterByEmail(hu.blackbelt.judo.sdk.query.StringFilter.equalTo(input.getEmail()))
        .count();
    
    if (emailCount > 0) {
        throw new IllegalStateException("User with email '" + input.getEmail() + "' already exists");
    }
    
    // Create user...
}
```

### Testing Pattern

```java
@Test
@JudoTest
void testDuplicateUsernameRejection(JudoTestFixture fixture) {
    UserDao userDao = fixture.newInstance(UserDao.class);
    
    // Create first user
    userDao.create(UserForCreate.builder()
        .withUserName("testuser")
        .withEmail("user1@example.com")
        .build());
    
    // Try to create second user with same username but different email
    CreateUserInput input = CreateUserInput.builder()
        .withUserName("testuser")  // Duplicate username
        .withEmail("user2@example.com")  // Different email
        .build();
    
    IllegalStateException exception = assertThrows(
        IllegalStateException.class,
        () -> createUser.customCall(input)
    );
    
    assertTrue(exception.getMessage().contains("username"));
    assertTrue(exception.getMessage().contains("testuser"));
}
```

---

## Pattern: At Least One Flag Required

**Problem**: User must have at least one boolean flag set to true (e.g., at least one role assigned).

**Solution**: Validate that at least one flag is true before entity creation.

### Implementation Pattern

```java
@Override
public void customCall(CreateUserInput input) {
    // Validate at least one role is assigned
    boolean hasRole = Boolean.TRUE.equals(input.getIsAdmin()) ||
                     Boolean.TRUE.equals(input.getIsCampaignManager()) ||
                     Boolean.TRUE.equals(input.getIsCoordinator()) ||
                     Boolean.TRUE.equals(input.getIsCanvasser());

    if (!hasRole) {
        throw new IllegalArgumentException("User must have at least one role assigned");
    }
    
    // Create user...
}
```

### Generic Pattern

```java
/**
 * Validates that at least one boolean flag is true.
 *
 * @param flags array of boolean values
 * @param errorMessage error message if all false
 */
public static void validateAtLeastOneTrue(Boolean[] flags, String errorMessage) {
    boolean hasTrue = Arrays.stream(flags)
        .anyMatch(flag -> Boolean.TRUE.equals(flag));
    
    if (!hasTrue) {
        throw new IllegalArgumentException(errorMessage);
    }
}

// Usage
ValidationUtils.validateAtLeastOneTrue(
    new Boolean[] { input.getIsAdmin(), input.getIsManager(), input.getIsUser() },
    "User must have at least one role assigned"
);
```

---

## Pattern: Default Boolean Values

**Problem**: Boolean fields should have explicit defaults, not null values.

**Solution**: Provide default values in entity creation, typically false for permission flags.

### Implementation Pattern

```java
// Set explicit defaults for all boolean fields
UserForCreate user = UserForCreate.builder()
    .withUserName(input.getUserName())
    .withEmail(input.getEmail())
    // Explicit defaults - never null
    .withIsAdmin(input.getIsAdmin() != null ? input.getIsAdmin() : false)
    .withIsManager(input.getIsManager() != null ? input.getIsManager() : false)
    .withIsActive(true)  // Always true for new users
    .build();
```

### Benefits

- **No null values** - Database has explicit true/false
- **Clear intent** - Defaults are visible in code
- **Consistent state** - All entities have valid boolean states

---

## Pattern: Past/Future DateTime Validation

**Problem**: Some events must be in the past, others in the future.

**Solution**: Validate datetime against current time before entity creation.

### Past-Only Pattern

```java
// Validate event datetime is not in future
if (input.getEventDateTime().isAfter(LocalDateTime.now())) {
    throw new IllegalArgumentException("Event datetime cannot be in the future");
}
```

### Future-Only Pattern

```java
// Validate scheduled datetime is in future
if (input.getScheduledDateTime().isBefore(LocalDateTime.now())) {
    throw new IllegalArgumentException("Scheduled datetime must be in the future");
}
```

### Within Range Pattern

```java
// Validate datetime is within acceptable range
LocalDateTime minDate = LocalDateTime.now().minusDays(30);
LocalDateTime maxDate = LocalDateTime.now().plusDays(30);

if (input.getEventDateTime().isBefore(minDate) || input.getEventDateTime().isAfter(maxDate)) {
    throw new IllegalArgumentException("Event datetime must be within 30 days of today");
}
```

---

## Pattern: Email and Pattern Validation

**Problem**: Fields like email, phone, postal code need format validation with regex.

**Solution**: Use compiled patterns in ValidationUtils for reusability.

### Email Validation Pattern

```java
public class ValidationUtils {
    // RFC 5322 simplified email pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );
    
    public static void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + email);
        }
    }
}
```

### Generic Pattern Validation

```java
/**
 * Validates a string against a regex pattern.
 *
 * NOTE: Adapt the pattern to your domain requirements.
 * Examples:
 * - Postal code: "^\\d{5}$" (5 digits, US ZIP)
 * - Postal code: "^\\d{4}$" (4 digits, some European countries)
 * - Phone: "^\\+?[1-9]\\d{1,14}$" (E.164 format)
 * - UUID: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
 *
 * @param value the value to validate
 * @param pattern the compiled regex pattern
 * @param fieldName the field name for error messages
 * @param formatDescription description of expected format
 */
public static void validatePattern(String value, Pattern pattern, String fieldName, String formatDescription) {
    if (value == null || value.trim().isEmpty()) {
        throw new IllegalArgumentException(fieldName + " is required");
    }
    if (!pattern.matcher(value.trim()).matches()) {
        throw new IllegalArgumentException(
            "Invalid " + fieldName + " format (expected: " + formatDescription + "): " + value
        );
    }
}
```

---

## Summary

### Patterns Covered

1. **Test Fixtures** - Manage complex entity hierarchies
2. **ValidationUtils** - Extract common validation logic
3. **Idempotent Operations** - Safe to call multiple times
4. **Date Range Validation** - Validate temporal constraints
5. **Paired Field Validation** - Validate dependent fields
6. **Test Logging** - Improve test traceability
7. **Get Current User** - Resolve authenticated user from VariableResolver
8. **Multiple Field Uniqueness** - Independent uniqueness checks
9. **At Least One Flag Required** - Boolean flag validation
10. **Default Boolean Values** - Explicit defaults for boolean fields
11. **Past/Future DateTime Validation** - Time-based validation
12. **Email and Pattern Validation** - Regex format validation

### Quick Reference

| Pattern | Use When | Key Benefit |
|---------|----------|-------------|
| Test Fixtures | Entity has 3+ prerequisites | Reduce duplication, enforce order |
| ValidationUtils | Same validation in 3+ places | Centralize logic, improve consistency |
| Idempotent | Initialization or setup operations | Safe re-execution |
| Date Range | Temporal data with start/end | Enforce valid ranges |
| Paired Fields | Fields must be provided together | Prevent incomplete data |
| Test Logging | All integration tests | Better debugging |
| Get Current User | Audit trails, user-specific logic | Type-safe user access |
| Multiple Uniqueness | Multiple unique fields (email, username) | Clear error messages |
| At Least One Flag | Users need roles/permissions | Ensure valid state |
| Default Booleans | Permission flags, status fields | No null values |
| Past/Future DateTime | Event logging, scheduling | Time-based business rules |
| Pattern Validation | Email, phone, postal code | Consistent format enforcement |

---

## Next Steps

**If you're done here**, return to the [Main Hub](./SKILL.md)

**If you need help with**:
- [Getting started with tests](./getting-started.md)
- [Type safety and adaptTo()](./type-safety.md)
- [Advanced authentication patterns](./advanced-patterns.md)
- [Best practices and anti-patterns](./best-practices.md)

---

**Last Updated**: 2025-11-02
