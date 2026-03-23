# Testkit Setup

The `judo-runtime-core-testkit` provides the infrastructure for running integration tests against a JUDO application's backend.

## Maven Dependency

Add the testkit to your test dependencies:

```xml
<dependency>
    <groupId>hu.blackbelt.judo.runtime</groupId>
    <artifactId>judo-runtime-core-testkit</artifactId>
    <scope>test</scope>
</dependency>
```

## Test Base Class

Extend the provided test base class to get automatic runtime setup and teardown:

```java
public class OrderOperationTest extends JudoRuntimeTestBase {

    @Override
    protected String getModelName() {
        return "MyApplication";  // Matches the ESM model name
    }

    @Test
    public void testCreateOrder() {
        // Test code here
    }
}
```

## Runtime Configuration

The testkit configures an in-memory runtime with:

- **H2 database** -- In-memory SQL database for data storage
- **Model loading** -- Loads the ASM from the build output
- **SDK initialization** -- Generates and wires the SDK, DAOs, and operation implementations
- **Transaction wrapping** -- Each test method runs in a transaction that rolls back

## Custom Configuration

Override configuration methods for specific needs:

```java
@Override
protected Map<String, String> getConfiguration() {
    return Map.of(
        "judo.runtime.dialect", "h2",
        "judo.runtime.logSql", "true"
    );
}
```

## Accessing the SDK

The base class provides access to the SDK:

```java
@Test
public void testOrderCreation() {
    SDK sdk = getSdk();
    OrderDao orderDao = sdk.getDao(OrderDao.class);
    // Use DAO for test operations
}
```

## Test Lifecycle

1. `@BeforeAll` -- Runtime starts, model loads, schema creates
2. `@BeforeEach` -- Transaction begins
3. Test method executes
4. `@AfterEach` -- Transaction rolls back (test isolation)
5. `@AfterAll` -- Runtime shuts down

## Best Practices

- Let the base class handle lifecycle management
- Do not commit transactions in tests unless testing transactional behavior specifically
- Use the SDK/DAO for setup data rather than direct SQL
- Keep tests independent -- do not rely on execution order
