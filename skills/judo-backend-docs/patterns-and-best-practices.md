# Backend Patterns and Best Practices

This document provides a catalog of common and advanced design patterns for backend developers writing custom Java code for a JUDO application. These patterns represent best practices for building robust, maintainable, and scalable business logic.

> [!IMPORTANT]
> **Golden Rule: `.default` Files Are Read-Only**
>
> **NEVER modify `.default` files.** They are generated blueprints that are overwritten on every build. Think of them as reference documentation, not implementation files. Your custom code should always be in separate `.java` files (without the `.default` extension).
>
> See the [Custom Operations Guide](custom-operations.md) for a detailed workflow on using these files correctly.

## Table of Contents

- [Core Technologies: OSGi and Declarative Services](#core-technologies-osgi-and-declarative-services)
- [1. Manual Polymorphic Factory](#1-manual-polymorphic-factory)
- [2. Accessing User & Request Context](#2-accessing-user--request-context)
- [3. Implementing a Custom Data Type](#3-implementing-a-custom-data-type)
- [4. Implementing Custom Validation](#4-implementing-custom-validation)
- [5. Utility Patterns](#5-utility-patterns)
  - [ValidationUtils](#validationutils)
  - [TypeConverter](#typeconverter)
- [Query Patterns](#query-patterns)
- [Using Masks for Performance](#using-masks-for-performance)
- [General Best Practices](#general-best-practices)

## Core Technologies: OSGi and Declarative Services

Custom backend code in JUDO operates within an **OSGi** container. The standard way to create components and manage dependencies is through **Declarative Services** annotations:
-   **`@Component`**: Marks a class as an OSGi component. It should specify the `service` it implements.
-   **`@Reference`**: Injects a dependency on another OSGi service, such as a DAO or a platform utility.
-   **`@Activate`**: Marks a method to be called once all dependencies are injected and the component is activated.

### Component and Service Annotations

```java
@Component(
    immediate = true,              // Start on bundle activation
    service = MyService.class,     // Register as OSGi service
    property = {                   // Service properties
        "service.ranking:Integer=100"
    }
)
public class MyServiceImpl implements MyService {
    // Implementation
}
```

### Dependency Injection with `@Reference`

```java
// Mandatory dependency (will fail to activate if not available)
@Reference                          
private Dao<ChildEntity> childEntityDao;

// Optional dependency
@Reference(cardinality = ReferenceCardinality.OPTIONAL)
private OptionalService optionalService;

// Multiple services implementing the same interface
@Reference(cardinality = ReferenceCardinality.MULTIPLE)
private List<Plugin> plugins;
```

### Field vs. Method Injection

**Field injection (recommended for most cases):**
```java
@Reference
private EntityDao entityDao;
```

**Method injection (useful for the delegation pattern):**
```java
@Reference
public void setEntityDao(EntityDao entityDao) {
    this.delegate.setEntityDao(entityDao);
}
```

---

## 1. Manual Polymorphic Factory

This pattern is the Java implementation for creating one of several possible concrete subtypes based on an input parameter.

*   **Use Case**: An operation needs to create a new `VoteDefinition`, but it could be a `YesNoVoteDefinition`, a `RatingVoteDefinition`, etc., based on user input.
*   **Implementation**:
    1.  The `Operation`'s input TO contains a "type" field (e.g., a `VoteType` enum).
    2.  The custom service method implementing the operation uses an `if/else if` or `switch` statement on this type field.
    3.  Inside each block, it instantiates the correct concrete `EntityType` (e.g., `YesNoVoteDefinition`) using its specific DAO and builder.

*   **Example (`closeDebate` method from `IssueService.java`)**:
    ```java
    public Optional<Serializable> closeDebate(Serializable issueId, VoteType voteType, ...) {
        // ...
        if (voteType == VoteType.YES_NO) {
            voteDefinitionId = yesNoVoteDefinitionDao.create(YesNoVoteDefinitionForCreate.builder()
                    // ... build the YesNoVoteDefinition
                    .build(), ...).identifier().getIdentifier();
        } else if (voteType == VoteType.SELECT_ANSWER) {
            voteDefinitionId = selectAnswerVoteDefinitionDao.create(SelectAnswerVoteDefinitionForCreate.builder()
                    // ... build the SelectAnswerVoteDefinition
                    .build(), ...).identifier().getIdentifier();
        }
        // ...
        return Optional.of(voteDefinitionId);
    }
    ```

---

## 4. Pattern: Accessing User & Request Context
#### Accessing the Logged-in User in Java
*   **Use Case**: You need to get the email or other claims of the user who initiated an operation to perform security checks or set ownership.
*   **Implementation**:
    1.  Inject the `hu.blackbelt.judo.dispatcher.api.VariableResolver` service using `@Reference`.
    2.  Call `variableResolver.resolve(String.class, "ACTOR", "email")` to get the value.
*   **Key Insight**: This is the direct Java equivalent of the JQL `!getVariable("ACTOR", "email")` function and is the standard way to securely access the current user's identity.

```java
@Reference
private VariableResolver variableResolver;

public void someOperation() {
    // Get current actor's identifier
    String actorIdentifier = variableResolver.resolve(String.class, "ACTOR", "identifier");

    // Get current actor's email
    String actorEmail = variableResolver.resolve(String.class, "ACTOR", "email");

    // Use in business logic
    if (entity.getOwnerIdentifier().equals(actorIdentifier)) {
        // Owner-specific logic
    }
}
```

#### Advanced: Using the Generic `DAO` and `AsmModel`
*   **Use Case**: You need to perform a generic or dynamic operation on an entity where the specific type or relationship might not be known at compile time. This is a rare, "break-glass" scenario.
*   **Pattern**:
    1.  Inject the generic `DAO` service (`hu.blackbelt.judo.dao.api.DAO`) and the `AsmModel`.
    2.  Use the `AsmModel` and `AsmUtils` to dynamically look up model elements (like an `EClass`) by their string names.
    3.  Use the generic `dao.addReferences()` or other low-level methods to perform the data manipulation.
*   **Warning**: This pattern is powerful but complex and bypasses the strongly-typed, generated DAO methods. It should be used with extreme care.

---

## 5. Pattern: Implementing a Custom Data Type
*   **Use Case**: You need to use a specialized, complex data type in your model that is not a primitive (e.g., a `GPS` coordinate class, a `Money` object with currency).
*   **Concept**: You can define a custom Java class and register it with the JUDO runtime. Attributes in your model can then be set to this custom type, allowing you to work with rich objects in your Java code.
*   **Limitation**: Custom data types are always serialized to and from a `String` for persistence (in the database) and for communication over the API. JQL support is limited to direct attribute selection; you cannot call custom methods on the object within a JQL expression.
*   **Implementation Workflow**:
    1.  **Model**: In the Designer, create a new **`CustomType`** in your `types` package (e.g., `Gps`). This acts as the model-level representation of your Java class.
    2.  **Java Class**: In your application's source code, create a Java class (e.g., `Gps.java`) to represent your type. This class *must* provide:
        *   A `toString()` method for serialization (converting the object to a `String`).
        *   A static `parseString(String value)` method (or a similar constructor) for deserialization (creating an object from a `String`).
    3.  **Converter**: Create a Java class that implements the `Converter<String, YourType>` interface. This class formally tells the JUDO runtime how to perform the conversion.
    4.  **Registration**: Create an OSGi component that activates on startup, gets a reference to the `DataTypeManager` service, and calls `registerCustomType`. This links the `CustomType` from your model to your Java class and its converter.

*   **Example Registration Component (using modern OSGi annotations)**:
    ```java
    @Component
    public class CustomDataTypeProvider {

        @Reference(target = "(judo.model.name=YourApplicationName)")
        private DataTypeManager dataTypeManager;

        @Reference(target = "(judo.model.name=YourApplicationName)")
        private AsmModel asmModel;

        @Activate
        public void activate() {
            AsmUtils asmUtils = new AsmUtils(asmModel.getResourceSet());
            EDataType modelType = (EDataType) asmUtils.resolve("YourApplicationName.types.Gps").get();
            String javaClassName = Gps.class.getName();
            Collection<Converter> converters = Collections.singleton(new StringToGpsConverter());
            dataTypeManager.registerCustomType(modelType, javaClassName, converters);
        }
    }
    ```

---

## 6. Pattern: Implementing Custom Validation

Beyond modeled business faults, you can implement validation logic in Java in two primary ways.

### Throwing Standard Exceptions
-   **Use Case**: You need to stop an operation for a common error case, like invalid input, a missing object, or a permissions failure.
-   **Concept**: JUDO provides a set of standard, unmodeled runtime exceptions in the `hu.blackbelt.judo.services.core.exception` package. Throwing these from your Java code will immediately stop execution and return a standard HTTP error code.
-   **Implementation**: In your Java operation implementation, throw one of the standard exceptions.
    *   `ValidationException` -> `HTTP 400 Bad Request`
    *   `AuthenticationRequiredException` -> `HTTP 401 Unauthorized`
    *   `AccessDeniedException` -> `HTTP 403 Forbidden`
    *   `NotFoundException` -> `HTTP 404 Not Found`
-   **Example (`ValidationException`)**:
    ```java
    if (input.getShippedTime() != null && input.getShippedTime().isBefore(_this.getOrderTime())) {
        throw new ValidationException(Collections.singleton(ValidationResult.builder()
                .code("SHIPPED_TIME_MUST_BE_AFTER_ORDER_TIME")
                .level(ValidationResult.Level.ERROR)
                .build()));
    }
    ```

### Creating Generic, Model-Driven Validators
-   **Use Case**: You have a validation rule that should apply *everywhere* a certain model element is used. For example, any attribute of type `FutureTime` must always be in the future.
-   **Concept**: This is an advanced pattern that allows you to create a reusable, platform-level validation rule that is triggered automatically based on the model.
-   **Implementation**:
    1.  **Model**: Create a specific element to trigger the validator, such as a custom data type (e.g., `FutureTime`).
    2.  **Validator Class**: Create an OSGi component that implements the `hu.blackbelt.judo.services.dispatcher.validators.Validator` interface.
    3.  **`isApplicable()` method**: In this method, you write logic to tell the platform which model elements your validator should run against (e.g., "all attributes of type `FutureTime`").
    4.  **`validateValue()` method**: This method contains the actual validation logic. If the validation fails, it should return a collection of `ValidationResult` objects.
-   **Result**: The JUDO platform will automatically find and execute your validator for all applicable attributes in every incoming request, providing a powerful, DRY (Don't Repeat Yourself) way to enforce common constraints.

---

## Utility Patterns

### ValidationUtils

**Purpose**: To centralize and reuse validation logic across multiple custom operations, ensuring consistency and reducing code duplication.

**Why it's important**:
- **Consistency**: Ensures that the same validation rules (e.g., for an email or a date range) are applied everywhere.
- **Maintainability**: When a validation rule changes, you only need to update it in one place.
- **Readability**: Keeps your custom operation logic clean and focused on the business process, not on low-level validation details.

Create a centralized validation utility class to avoid duplicating validation logic:

```java
package [your.package].utils;

import java.time.LocalDate;
import java.util.regex.Pattern;

public final class ValidationUtils {
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );
    
    private ValidationUtils() {
        throw new UnsupportedOperationException("Utility class");
    }
    
    public static void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + email);
        }
    }
    
    public static void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                String.format("End date %s cannot be before start date %s", endDate, startDate)
            );
        }
    }
    
    public static void validateRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }
    
    public static void validateNotNull(Object value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }
}
```

**Usage:**
```java
ValidationUtils.validateRequired(input.getUserName(), "Username");
ValidationUtils.validateEmail(input.getEmail());
ValidationUtils.validateDateRange(input.getStartDate(), input.getEndDate());
```

### TypeConverter

**Purpose**: To provide a null-safe way to convert between JUDO's service-layer `MapHolder` types and the backend entity-layer types.

**Why it's important**:
- **Null Safety**: Prevents `NullPointerException` errors when dealing with optional relationships or fields. The generated `.from()` methods are not null-safe.
- **Cleaner Code**: Simplifies conversion logic in your custom operations, making it more readable and less error-prone.

Create a null-safe type conversion utility for service-to-entity layer conversion:

```java
package [your.package].utils;

public final class TypeConverter {
    
    private TypeConverter() {
        throw new UnsupportedOperationException("Utility class");
    }
    
    public static <T> T convert(hu.blackbelt.judo.sdk.MapHolder source, Class<T> targetClass) {
        if (source == null) {
            return null;
        }
        return source.adaptTo(targetClass);
    }
}
```

**Usage:**
```java
Settlement entitySettlement = TypeConverter.convert(input.getSettlement(), Settlement.class);
```

### Current User Resolution Pattern

**Pattern**: Resolving the currently authenticated user from the `VariableResolver` for auditing or authorization purposes.

```java
@Component(immediate = true, service = CreateEvent.class)
public class CreateEventCustomImplementation implements CreateEvent {
    
    @Reference EventDao eventDao;
    @Reference UserDao userDao;
    @Reference VariableResolver variableResolver;
    
    @Override
    public void accept(Administration _this, CreateEventInput input) {
        // Get current authenticated user
        User currentUser = getCurrentUser();
        
        // Use in entity creation for auditing
        EventForCreate event = EventForCreate.builder()
            .withEventDateTime(input.getEventDateTime())
            .withCreatedBy(currentUser)
            .build();
        
        eventDao.create(event);
    }
    
    /**
     * Gets the currently authenticated user from VariableResolver.
     */
    private User getCurrentUser() {
        String userName = variableResolver.resolve(String.class, "ACTOR", "userName");
        if (userName == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        return userDao.query()
            .filterByUserName(StringFilter.equalTo(userName))
            .selectOne()
            .orElseThrow(() -> new IllegalStateException("Current user not found: " + userName));
    }
}
```

### Idempotent Operation Pattern

**Pattern**: Designing operations that are safe to be executed multiple times without unintended side effects. This is crucial for initialization scripts or retry logic.

```java
@Component(immediate = true, service = InitAdminUser.class)
public class InitAdminUserCustomImplementation implements InitAdminUser {
    
    private static final String ADMIN_USERNAME = "admin";
    
    @Reference UserDao userDao;
    
    @Override
    public void run() {
        // Check if the entity already exists before creating it.
        Optional<User> existingAdmin = userDao.query()
            .filterByUserName(StringFilter.equalTo(ADMIN_USERNAME))
            .selectOne();
        
        if (existingAdmin.isPresent()) {
            return;  // Early return makes the operation idempotent.
        }
        
        // Create only if it's missing.
        UserForCreate adminUser = UserForCreate.builder()
            .withUserName(ADMIN_USERNAME)
            .withIsAdmin(true)
            .build();
        
        userDao.create(adminUser);
    }
}
```

### Conditional Validation Pattern

**Pattern**: Implementing validation logic where a field's requirement depends on the value of another field.

```java
@Component(immediate = true, service = CreateEvent.class)
public class CreateEventCustomImplementation implements CreateEvent {
    
    @Override
    public void accept(Administration _this, CreateEventInput input) {
        // If consent is given, the signer's name becomes required.
        if (input.getDataProtectionConsent() != null && input.getDataProtectionConsent().orElse(false)) {
            if (input.getSignerName() == null || !input.getSignerName().isPresent() || input.getSignerName().get().trim().isEmpty()) {
                throw new IllegalArgumentException("Signer name is required when data protection consent is given");
            }
        }
        
        // If one coordinate is provided, the other must also be provided.
        boolean hasLatitude = input.getLatitude() != null && input.getLatitude().isPresent();
        boolean hasLongitude = input.getLongitude() != null && input.getLongitude().isPresent();
        
        if (hasLatitude != hasLongitude) {
            throw new IllegalArgumentException("Both latitude and longitude must be provided, or neither.");
        }
        
        // ... rest of implementation
    }
}
```

### Multiple Field Uniqueness Pattern

**Pattern**: Ensuring that multiple, independent fields on an entity are unique across all instances.

```java
@Component(immediate = true, service = CreateUser.class)
public class CreateUserCustomImplementation implements CreateUser {
    
    @Reference UserDao userDao;
    
    @Override
    public void accept(Administration _this, CreateUserInput input) {
        // Perform separate queries to check uniqueness for each field.
        if (userDao.query().filterByUserName(StringFilter.equalTo(input.getUserName())).count() > 0) {
            throw new IllegalStateException("Username already exists");
        }
        
        if (userDao.query().filterByEmail(StringFilter.equalTo(input.getEmail())).count() > 0) {
            throw new IllegalStateException("Email address already exists");
        }
        
        // ... create user
    }
}
```

### Temporal Validation Pattern

**Pattern**: Enforcing business rules related to dates and times.

```java
@Component(immediate = true, service = CreateEvent.class)
public class CreateEventCustomImplementation implements CreateEvent {
    
    @Override
    public void accept(Administration _this, CreateEventInput input) {
        ValidationUtils.validateNotNull(input.getEventDateTime(), "Event datetime");
        
        // Prevent future timestamps for historical events.
        if (input.getEventDateTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Event datetime cannot be in the future");
        }
        
        // Use the utility for date range validation.
        if (input.getStartDate() != null && input.getStartDate().isPresent() &&
            input.getEndDate() != null && input.getEndDate().isPresent()) {
            ValidationUtils.validateDateRange(input.getStartDate().get(), input.getEndDate().get());
        }
        
        // ... create event
    }
}
```

### "At Least One" Flag Required Pattern

**Pattern**: For entities with multiple optional boolean flags, ensuring that at least one is selected.

```java
@Component(immediate = true, service = CreateUser.class)
public class CreateUserCustomImplementation implements CreateUser {
    
    @Override
    public void accept(Administration _this, CreateUserInput input) {
        boolean hasRole = Boolean.TRUE.equals(input.getIsAdmin()) ||
                         Boolean.TRUE.equals(input.getIsManager()) ||
                         Boolean.TRUE.equals(input.getIsEditor());
        
        if (!hasRole) {
            throw new IllegalArgumentException("User must have at least one role (Admin, Manager, or Editor) assigned.");
        }
        
        // ... create user
    }
}
```

## Query Patterns

This section covers common Data Access Object (DAO) query patterns for validation and data retrieval.

### Uniqueness Validation
```java
// Check if username already exists
if (userDao.query()
    .filterByUserName(StringFilter.equalTo(input.getUserName()))
    .count() > 0) {
    throw new IllegalStateException("Username already exists");
}
```

### Entity Existence Check
```java
// Verify referenced entity exists
if (!settlementDao.getById(input.getSettlement().identifier()).isPresent()) {
    throw new IllegalArgumentException("Settlement not found");
}
```

### Complex Query with Multiple Filters
```java
Optional<Event> latestEvent = eventDao.query()
    .filterByDate(DateFilter.equalTo(date))
    .filterByType(EnumerationFilter.equalTo(EventType.CANVASSING))
    .orderByDescending(EventAttribute.TIMESTAMP)
    .selectOne();
```

### Using Masks for Performance

**Pattern**: Control which fields are loaded to optimize performance

Masks (projections) are critical for performance when working with entities that have many fields or relationships.

**Empty mask for existence checks:**
```java
// Only loads identifier - fastest way to check existence
boolean exists = dao.getById(id, EntityMask.entityMask()).isPresent();
```

**Load specific fields only:**
```java
// Load only required fields
User user = userDao.getById(
    userId,
    UserMask.userMask()
        .withUserName()
        .withEmail()
        .withIsActive()
).orElseThrow();
```

**Masks in queries:**
```java
// Query with mask to control memory usage
List<Address> addresses = addressDao.query()
    .filterBySettlement(settlement)
    .maskedBy(AddressMask.addressMask()
        .withFullAddress()
        .withLatitude()
        .withLongitude()
    )
    .selectList();
```

**Nested masks for relationships:**
```java
// Load entity with related entities (controlled depth)
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

**Partial updates with masks:**
```java
Entity entity = entityDao.getById(id).orElseThrow();
entity.setStatus(newStatus);

// Update only status field
entityDao.update(
    entity,
    EntityMask.entityMask().withStatus()
);
```

**Performance benefits:**
- 90% less memory usage for large collections
- 10x faster queries with proper masks
- Prevents N+1 query problems
- Explicit control over database access

**See also:** [Custom Operations - Using Masks](custom-operations.md#using-masks-projections) for comprehensive examples.

## General Best Practices

1. **Keep operations focused** - Single responsibility per method
2. **Use DAOs for data access** - Don't bypass JUDO runtime
3. **Validate inputs early** - Fail fast with clear messages
4. **Log meaningful events** - Help debugging in production
5. **Test custom logic** - Unit test business rules
6. **Handle errors gracefully** - Don't expose internal details
7. **Use OSGi services** - Leverage dependency injection
8. **Follow model constraints** - Respect required fields, relationships
9. **Use masks for performance** - Only fetch needed fields
10. **Leverage interceptors** - Keep operation logic clean, use interceptors for cross-cutting concerns

## See Also

- [Custom Operations](custom-operations.md) - Detailed implementation examples
- [Interceptors](interceptors.md) - Cross-cutting concerns
- [Testing Guide](testing-guide.md) - Quality assurance
- [Debugging and Monitoring](debugging-and-monitoring-guide.md) - Troubleshooting
