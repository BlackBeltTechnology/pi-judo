# Integration Testing - Getting Started Guide

**Target Audience**: Beginners, new developers starting with JUDO integration tests

**Prerequisites**: Basic understanding of Java, JUnit, and the JUDO framework

For other topics, see the [Integration Testing Documentation Hub](./SKILL.md).

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Dependencies](#dependencies)
3. [Testing Fundamentals](#testing-fundamentals)
4. [Writing Your First Tests](#writing-your-first-tests)
5. [Running Tests](#running-tests)

---

## Project Structure

The integration test module follows a standard Maven project structure:

```
application/integration-test/
├── pom.xml                                    # Maven configuration
├── src/
│   └── test/
│       ├── java/
│       │   └── [your/package]/[yourmodel]/integration/
│       │       ├── dao/                       # DAO-layer tests
│       │       │   ├── EntityDaoTest.java
│       │       │   └── ...
│       │       ├── service/                   # Service-layer tests
│       │       │   ├── EntityServiceTest.java
│       │       │   └── ...
│       │       ├── custom/                    # Custom operation tests
│       │       │   ├── CreateOperationTest.java
│       │       │   └── ...
│       │       └── utils/                     # Test utilities
│       │           ├── VariableResolverMockHelper.java
│       │           ├── AddressTestFixtures.java
│       │           └── ...
│       └── resources/
│           └── logback-test.xml               # Test logging configuration
└── .classpath                                 # Eclipse project configuration
```

### Key Directories

- **`dao/`**: Tests for Data Access Objects - direct database operations
- **`service/`**: Tests for service-layer operations - business logic with type conversions
- **`custom/`**: Tests for custom operations (computed attributes, event handlers, validations)
- **`utils/`**: Reusable test fixtures and helper classes

---

## Dependencies

### Core JUDO Dependencies

```xml
<dependency>
    <groupId>hu.blackbelt.judo.runtime</groupId>
    <artifactId>judo-runtime-core-guice-testkit</artifactId>
    <version>${judo-runtime-core-version}</version>
    <scope>test</scope>
</dependency>
```

This provides:
- `@JudoTest` annotation
- `JudoTestFixture` for accessing DAOs
- Transaction management utilities

### Project Dependencies

```xml
<dependency>
    <groupId>[your.package]</groupId>
    <artifactId>[yourmodel]-model</artifactId>
    <version>${project.version}</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>[your.package]</groupId>
    <artifactId>[yourmodel]-service</artifactId>
    <version>${project.version}</version>
    <scope>test</scope>
</dependency>
```

### Testing Dependencies

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>
```

### Logging Dependencies

```xml
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <scope>test</scope>
</dependency>
```

### Maven Surefire Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.5</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
            <include>**/*IntegrationTest.java</include>
        </includes>
    </configuration>
</plugin>
```

---

## Testing Fundamentals

### The `@JudoTest` Annotation

All JUDO integration tests must be annotated with `@JudoTest`. This annotation:

1. **Sets up the test environment**: Initializes JUDO runtime, DAOs, and dependency injection
2. **Manages transactions**: Controls how transactions are handled during tests
3. **Truncates tables**: Optionally cleans up database tables between tests

### Basic Test Structure

```java
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoRuntimeExtension;
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTest;
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTestFixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

import static org.junit.jupiter.api.Assertions.*;

@JudoTest
public class MyFirstIntegrationTest {

    @RegisterExtension
    static JudoRuntimeExtension judoRuntimeExtension = new JudoRuntimeExtension();

    @Test
    public void testSomething(JudoTestFixture fixture) {
        // Your test code here
        // fixture.getInjector() provides access to DAOs and services
    }
}
```

### `@JudoTest` Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `transaction` | `TransactionHandling` | `AUTO_ROLLBACK` | Controls transaction behavior |
| `truncateTables` | `boolean` | `true` | Whether to truncate tables before each test |

### Transaction Handling Modes

The `transaction` parameter accepts the following values:

#### 1. `AUTO_ROLLBACK` (Default)

```java
@JudoTest(transaction = TransactionHandling.AUTO_ROLLBACK)
public class MyTest {
    // Transactions automatically roll back after each test
}
```

**Behavior**:
- Transaction starts before test method
- Transaction rolls back after test method (success or failure)
- Database remains clean between tests

**Use when**:
- You want test isolation
- You don't need to verify post-commit behavior
- Most common mode for unit-style integration tests

#### 2. `AUTO_COMMIT`

```java
@JudoTest(transaction = TransactionHandling.AUTO_COMMIT)
public class MyTest {
    // Transactions automatically commit after each test
}
```

**Behavior**:
- Transaction starts before test method
- Transaction commits after successful test
- Transaction rolls back only on test failure

**Use when**:
- You need to verify data persistence
- Testing cascading operations
- Verifying post-commit triggers

**Warning**: Requires manual cleanup or `truncateTables = true`

#### 3. `MANUAL`

```java
@JudoTest(transaction = TransactionHandling.MANUAL)
public class MyTest {
    @Test
    public void testWithManualControl(JudoTestFixture fixture) {
        fixture.begin();
        try {
            // Your test logic
            fixture.commit();
        } catch (Exception e) {
            fixture.rollback();
            throw e;
        }
    }
}
```

**Behavior**:
- No automatic transaction management
- You control `begin()`, `commit()`, and `rollback()`

**Use when**:
- Testing complex multi-transaction scenarios
- Verifying transaction boundary behavior
- Testing error recovery

#### 4. `NONE`

```java
@JudoTest(transaction = TransactionHandling.NONE)
public class MyTest {
    // No transaction management at all
}
```

**Behavior**:
- No transactions created by framework
- Each DAO/service operation may run in its own transaction

**Use when**:
- Testing read-only operations
- Testing transaction-less operations
- Performance testing without transaction overhead

**Warning**: Many operations will fail without transactions

### Table Truncation Behavior

```java
@JudoTest(truncateTables = true)  // Default
public class MyTest {
    // All tables are truncated before EACH test method
}

@JudoTest(truncateTables = false)
public class MyTest {
    // Tables are NOT truncated - data persists between tests
}
```

**When to disable truncation**:
- Tests require expensive setup data
- Testing data migration scenarios
- Debugging - want to inspect data after test

**Warning**: Disabling truncation can cause test interdependencies

---

## Writing Your First Tests

### Pattern 1: Simple DAO Test

This is the simplest integration test pattern - testing Data Access Object operations directly.

```java
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoRuntimeExtension;
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTest;
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTestFixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.User;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.UserDao;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.UserForCreate;

import static org.junit.jupiter.api.Assertions.*;

@JudoTest
public class UserDaoTest {

    @RegisterExtension
    static JudoRuntimeExtension judoRuntimeExtension = new JudoRuntimeExtension();

    @Test
    public void testCreateUser(JudoTestFixture fixture) {
        // 1. Get the DAO from the fixture
        UserDao userDao = fixture.newInstance(UserDao.class);

        // 2. Create a new entity using the ForCreate builder
        User createdUser = userDao.create(UserForCreate.builder()
                .withUserName("testuser")
                .withEmail("admin@example.com")
                .withIsActive(true)
                .build());

        // 3. Verify the creation
        assertNotNull(createdUser);
        assertNotNull(createdUser.identifier());
        assertEquals("testuser", createdUser.getUserName());
        assertEquals("admin@example.com", createdUser.getEmail());
        assertTrue(createdUser.getIsActive());

        // 4. Verify it's in the database
        assertTrue(userDao.getById(createdUser.identifier()).isPresent());
    }

    @Test
    public void testUpdateUser(JudoTestFixture fixture) {
        UserDao userDao = fixture.newInstance(UserDao.class);

        // Create initial entity
        User user = userDao.create(UserForCreate.builder()
                .withUserName("original")
                .withEmail("admin@example.com")
                .withIsActive(true)
                .build());

        // Update the entity
        user.setEmail("admin@example.com");
        userDao.update(user);

        // Verify the update
        User fetched = userDao.getById(user.identifier()).orElseThrow();
        assertEquals("admin@example.com", fetched.getEmail());
    }

    @Test
    public void testDeleteUser(JudoTestFixture fixture) {
        UserDao userDao = fixture.newInstance(UserDao.class);

        // Create entity
        User user = userDao.create(UserForCreate.builder()
                .withUserName("todelete")
                .withEmail("admin@example.com")
                .withIsActive(true)
                .build());

        // Delete it
        userDao.delete(user);

        // Verify deletion
        assertFalse(userDao.getById(user.identifier()).isPresent());
    }
}
```

**Key Points**:
- Use `fixture.newInstance(DaoClass.class)` to get DAOs
- Use `EntityForCreate.builder()` to create entities
- Use `identifier()` to get entity identifiers for queries
- Default `AUTO_ROLLBACK` transaction cleans up after each test

---

### Pattern 2: Testing Custom Operations with ReferenceInjector

When testing custom operations (business logic), you need to instantiate the custom implementation class with its dependencies injected.

```java
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoRuntimeExtension;
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTest;
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTestFixture;
import hu.blackbelt.osgi.api.ReferenceInjector;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.User;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.UserDao;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.UserForCreate;
import [your.package].[yourmodel].api.[yourmodel]._default_services.entity.complexentity.ComplexEntityForCreate;
import [your.package].[yourmodel].service.[yourmodel]._default_services.entity.complexentity.CreateComplexEntityCustomImplementation;

import static org.junit.jupiter.api.Assertions.*;

@JudoTest
public class CreateComplexEntityTest {

    @RegisterExtension
    static JudoRuntimeExtension judoRuntimeExtension = new JudoRuntimeExtension();

    @Test
    public void testCreateComplexEntity(JudoTestFixture fixture) {
        // 1. Get required DAOs
        UserDao userDao = fixture.newInstance(UserDao.class);

        // 2. Create prerequisite entities
        User user = userDao.create(UserForCreate.builder()
                .withUserName("testuser")
                .withEmail("admin@example.com")
                .withIsActive(true)
                .build());

        // 3. Instantiate custom operation with dependency injection
        CreateComplexEntityCustomImplementation createOperation =
            ReferenceInjector.resolve(
                CreateComplexEntityCustomImplementation.class,
                fixture.getInjector()
            );

        // 4. Create the input transfer object
        ComplexEntityForCreate input = ComplexEntityForCreate.builder()
                .withSomeField("test value")
                .withRelatedUser(user)
                .build();

        // 5. Execute the custom operation
        createOperation.customCall(input);

        // 6. Verify the result
        // (Verification depends on what the operation does)
    }
}
```

**Key Points**:
- Use `ReferenceInjector.resolve(CustomClass.class, fixture.getInjector())` to instantiate custom operations
- ReferenceInjector handles OSGi `@Reference` injection automatically
- Create all prerequisite entities before calling custom operations
- Custom operations may modify the input or create new entities

---

### Pattern 3: Manual Transaction Control

For complex scenarios requiring multiple transaction boundaries:

```java
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoRuntimeExtension;
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTest;
import hu.blackbelt.judo.runtime.core.jsl.fixture.JudoTestFixture;
import hu.blackbelt.judo.runtime.core.jsl.fixture.TransactionHandling;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.User;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.UserDao;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.UserForCreate;

import static org.junit.jupiter.api.Assertions.*;

@JudoTest(transaction = TransactionHandling.MANUAL)
public class MultiTransactionTest {

    @RegisterExtension
    static JudoRuntimeExtension judoRuntimeExtension = new JudoRuntimeExtension();

    @Test
    public void testMultipleTransactions(JudoTestFixture fixture) {
        UserDao userDao = fixture.newInstance(UserDao.class);

        // Transaction 1: Create user
        fixture.begin();
        User user1 = null;
        try {
            user1 = userDao.create(UserForCreate.builder()
                    .withUserName("user1")
                    .withEmail("admin@example.com")
                    .withIsActive(true)
                    .build());
            fixture.commit();
        } catch (Exception e) {
            fixture.rollback();
            throw e;
        }

        // Verify user1 is persisted
        fixture.begin();
        try {
            assertTrue(userDao.getById(user1.identifier()).isPresent());
            fixture.commit();
        } catch (Exception e) {
            fixture.rollback();
            throw e;
        }

        // Transaction 2: Create second user
        fixture.begin();
        try {
            User user2 = userDao.create(UserForCreate.builder()
                    .withUserName("user2")
                    .withEmail("admin@example.com")
                    .withIsActive(true)
                    .build());
            fixture.commit();

            // Both users should exist
            fixture.begin();
            assertEquals(2, userDao.query().selectList().size());
            fixture.commit();
        } catch (Exception e) {
            fixture.rollback();
            throw e;
        }
    }

    @Test
    public void testRollbackBehavior(JudoTestFixture fixture) {
        UserDao userDao = fixture.newInstance(UserDao.class);

        // Transaction that will be rolled back
        fixture.begin();
        try {
            userDao.create(UserForCreate.builder()
                    .withUserName("rollbackuser")
                    .withEmail("admin@example.com")
                    .withIsActive(true)
                    .build());

            // Intentionally rollback
            fixture.rollback();
        } catch (Exception e) {
            fixture.rollback();
            throw e;
        }

        // Verify user was NOT persisted
        fixture.begin();
        try {
            assertEquals(0, userDao.query().selectList().size());
            fixture.commit();
        } catch (Exception e) {
            fixture.rollback();
            throw e;
        }
    }
}
```

**Key Points**:
- Always wrap operations in `begin()` / `commit()` / `rollback()` blocks
- Use try-catch to ensure rollback on exceptions
- Each transaction boundary is explicit and controlled
- Useful for testing transaction isolation and consistency

---

## Running Tests

### Run All Integration Tests

```bash
mvn clean test -pl application/integration-test
```

### Run Specific Test Class

```bash
mvn clean test -pl application/integration-test -Dtest=UserDaoTest
```

### Run Specific Test Method

```bash
mvn clean test -pl application/integration-test -Dtest=UserDaoTest#testCreateUser
```

### Run with Debug Logging

Edit `src/test/resources/logback-test.xml`:

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="DEBUG">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

Then run:

```bash
mvn clean test -pl application/integration-test
```

### Skip Tests During Build

```bash
mvn clean install -DskipTests
```

---

## Next Steps

Now that you understand the basics, explore more advanced topics:

- **[Type Safety Guide](./type-safety.md)**: Deep dive into Entity vs Service layer types and `adaptTo()` conversions
- **[Advanced Patterns](./advanced-patterns.md)**: VariableResolver mocking, Optional field handling, entity reference validation
- **[Best Practices](./best-practices.md)**: Patterns, anti-patterns, and maintainable test design

Return to the [Integration Testing Documentation Hub](./SKILL.md) for the complete overview.
