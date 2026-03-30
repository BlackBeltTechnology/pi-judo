# Backend Testing Guide

## Overview

This guide provides an overview of testing strategies for custom backend code in a JUDO application. It covers both unit testing with mocks and the execution of integration tests.

For a comprehensive guide on writing integration tests, including detailed examples and advanced patterns, please refer to the main Integration Testing Guide (see `judo-integration-testing-docs` skill).

## Table of Contents

- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)

---

## Unit Testing

Unit tests for custom operations should be small, focused, and use mocks to isolate the specific logic being tested. This ensures that tests are fast and not dependent on external systems like a database.

The recommended stack is **JUnit 5** with **Mockito**.

**Example: Unit Testing a Custom Operation**

```java
@ExtendWith(MockitoExtension.class)
class ToggleStatusCustomImplementationTest {

    @Mock
    private EntityDao entityDao;

    @Mock
    private AccessValidationDao accessValidationDao;

    @Mock
    private VariableResolver variableResolver;

    @InjectMocks
    private ToggleStatusCustomImplementation implementation;

    @Test
    void testToggleStatus_preventsSelfModification() {
        Entity entity = new Entity();
        entity.setIdentifier("entity@example.com");

        when(variableResolver.resolve(String.class, "ACTOR", "identifier"))
            .thenReturn("entity@example.com");

        implementation.accept(entity);

        // Verify that the update method was never called, isolating the security check.
        verify(entityDao, never()).update(any());
    }

    @Test
    void testToggleStatus_validatesMinimumRequiredEntities() {
        Entity entity = new Entity();
        entity.setIdentifier("entity@example.com");
        entity.setStatus(true);

        when(variableResolver.resolve(String.class, "ACTOR", "identifier"))
            .thenReturn("admin@example.com");
        when(entityDao.getById(any())).thenReturn(Optional.of(entity));
        when(entityDao.update(any())).thenReturn(entity);
        when(accessValidationDao.queryActiveEntitiesWithAtLeastManagementPermission())
            .thenReturn(Optional.of(false));

        // Assert that the correct exception is thrown when the business rule is violated.
        assertThrows(IllegalStateException.class, () -> {
            implementation.accept(entity);
        });
    }
}
```

## Integration Testing

Integration tests provide a way to test your custom operations against a real (in-memory) database, ensuring that your logic, DAO interactions, and the JUDO runtime all work together correctly.

For a complete guide on how to set up, write, and run integration tests, please see the **Integration Testing Guide (see `judo-integration-testing-docs` skill)**.

### Running Integration Tests

You can run the full suite of integration tests by activating the `integration-tests` Maven profile.

```bash
# From the project root
mvn clean install -Pintegration-tests
```

---

## See Also

- Integration Testing Guide (see `judo-integration-testing-docs` skill) - The main, comprehensive guide for integration testing.
- [Debugging and Monitoring Guide](debugging-and-monitoring-guide.md) - For debugging and monitoring your application.
- [Custom Operations](custom-operations.md) - For the business logic you will be testing.
