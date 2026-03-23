# Test Patterns

This guide covers common patterns for writing effective integration tests in JUDO applications.

## Arrange-Act-Assert Pattern

```java
@Test
public void testOrderApproval() {
    // Arrange: Create test data
    OrderTO order = createTestOrder(OrderStatus.SUBMITTED);
    CustomerTO customer = createTestCustomer();
    linkOrderToCustomer(order, customer);

    // Act: Execute the operation under test
    OrderTO result = orderOperations.approve(order);

    // Assert: Verify the outcome
    assertEquals(OrderStatus.APPROVED, result.getStatus());
    assertNotNull(result.getApprovedDate());
}
```

## Creating Test Fixtures

Use the DAO to create test data:

```java
private OrderTO createTestOrder(OrderStatus status) {
    OrderTO order = OrderTO.builder()
        .orderNumber("TEST-" + UUID.randomUUID().toString().substring(0, 8))
        .status(status)
        .createdDate(LocalDate.now())
        .totalAmount(BigDecimal.valueOf(100))
        .build();

    return orderDao.create(order);
}

private CustomerTO createTestCustomer() {
    CustomerTO customer = CustomerTO.builder()
        .name("Test Customer")
        .email("test@example.com")
        .build();

    return customerDao.create(customer);
}
```

## Testing Validation Errors

```java
@Test
public void testOrderCreationWithInvalidData() {
    OrderTO invalid = OrderTO.builder()
        .orderNumber(null)  // Required field
        .totalAmount(BigDecimal.valueOf(-1))  // Must be >= 0
        .build();

    ValidationException ex = assertThrows(
        ValidationException.class,
        () -> orderDao.create(invalid)
    );

    assertTrue(ex.hasFieldError("orderNumber"));
    assertTrue(ex.hasFieldError("totalAmount"));
}
```

## Testing Custom Operations

```java
@Test
public void testBulkStatusUpdate() {
    OrderTO order1 = createTestOrder(OrderStatus.DRAFT);
    OrderTO order2 = createTestOrder(OrderStatus.DRAFT);

    BulkUpdateInput input = BulkUpdateInput.builder()
        .orderIds(List.of(order1.identifier(), order2.identifier()))
        .targetStatus(OrderStatus.SUBMITTED)
        .build();

    BulkUpdateResult result = exportedOperations.bulkUpdateStatus(input);

    assertEquals(2, result.getUpdatedCount());
    assertEquals(OrderStatus.SUBMITTED, orderDao.getById(order1.identifier()).getStatus());
}
```

## Testing with Different Principals

```java
@Test
public void testAdminCanApprove() {
    withPrincipal(adminPrincipal, () -> {
        OrderTO order = createTestOrder(OrderStatus.SUBMITTED);
        OrderTO result = orderOperations.approve(order);
        assertEquals(OrderStatus.APPROVED, result.getStatus());
    });
}

@Test
public void testRegularUserCannotApprove() {
    withPrincipal(regularUserPrincipal, () -> {
        OrderTO order = createTestOrder(OrderStatus.SUBMITTED);
        assertThrows(AccessDeniedException.class, () -> orderOperations.approve(order));
    });
}
```

## Best Practices

- Create minimal test data -- only what the test needs
- Use builder patterns for readable test setup
- Test both success and failure paths
- Verify side effects (audit logs, related entity updates)
- Name tests descriptively: `test<Action>_<Scenario>_<ExpectedResult>`
