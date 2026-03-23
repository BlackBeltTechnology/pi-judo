# Debugging Integration Tests

This guide covers common issues when running JUDO integration tests and how to diagnose and fix them.

## Common Failures

### Model Loading Errors

**Symptom**: Test fails during `@BeforeAll` with model loading exceptions.

**Causes**:
- ASM artifacts not generated (run `./judo.sh build` first)
- Model name mismatch between test class and actual model
- Incompatible testkit version with the model format

**Fix**:
```bash
# Rebuild the model and application
./judo.sh build

# Verify ASM artifacts exist
ls application/app/target/classes/model/
```

### Transaction Isolation Issues

**Symptom**: Test data from one test leaks into another, causing flaky tests.

**Causes**:
- Manual transaction commit in test code
- Background threads operating outside the test transaction
- Static state shared between tests

**Fix**: Ensure tests do not commit transactions. Remove any `transactionManager.commit()` calls in test code.

### DAO Validation Errors

**Symptom**: `ValidationException` when creating test data.

**Causes**:
- Missing required fields in test fixture builders
- Constraint violations (max length, numeric range)
- Enum values not matching the model definition

**Fix**: Check the model constraints for the entity type and ensure test fixtures satisfy all requirements.

### Operation Not Found

**Symptom**: `NoSuchOperationException` when invoking a custom operation.

**Causes**:
- Operation class name does not follow the naming convention
- Custom operation file is in the wrong package
- Operation was added to the model but not yet transformed/built

**Fix**: Verify the operation file follows `<TransferObject>__<operationName>.java` naming and is in the correct package.

## Enabling SQL Logging

See the actual SQL queries being executed:

```java
@Override
protected Map<String, String> getConfiguration() {
    return Map.of("judo.runtime.logSql", "true");
}
```

## Debugging with Breakpoints

Integration tests run in the same JVM as the runtime. Set breakpoints in:

- Custom operation implementations
- Interceptor methods
- DAO implementations (for data access issues)
- Test methods themselves

## Checking Test Data State

Query the current state mid-test to understand what data exists:

```java
@Test
public void debugDataState() {
    // ... setup code ...

    // Debug: Check what orders exist
    List<OrderTO> allOrders = orderDao.query(QueryCustomizer.of(OrderTO.class));
    System.out.println("Orders in DB: " + allOrders.size());
    allOrders.forEach(o -> System.out.println("  " + o.getOrderNumber() + " - " + o.getStatus()));

    // ... rest of test ...
}
```

## Best Practices

- Always rebuild before running tests after model changes
- Use SQL logging to diagnose unexpected query behavior
- Check model constraints when fixture creation fails
- Keep tests independent to avoid ordering-dependent failures
