# Test Scenarios

This guide covers common e2e test scenarios for JUDO applications, organized by functionality.

## CRUD Workflows

### Create

```typescript
test('create a new order', async ({ authenticatedPage: page }) => {
  const orderList = new OrderListPage(page);
  await orderList.goto();
  await orderList.clickAction('create');

  const orderForm = new OrderFormPage(page);
  await orderForm.fillForm({
    orderNumber: 'ORD-001',
    customerName: 'Test Customer',
    totalAmount: '250.00',
  });
  await orderForm.submit();

  // Verify the order appears in the list
  await orderList.goto();
  await expect(orderList.table).toContainText('ORD-001');
});
```

### Read and Navigate

```typescript
test('view order details', async ({ authenticatedPage: page }) => {
  const orderList = new OrderListPage(page);
  await orderList.goto();
  await orderList.clickRow(0);

  const orderDetail = new OrderDetailPage(page);
  await expect(orderDetail.getFieldValue('orderNumber')).resolves.toBeTruthy();
  await expect(orderDetail.getFieldValue('status')).resolves.toBeTruthy();
});
```

### Update

```typescript
test('edit an existing order', async ({ authenticatedPage: page }) => {
  const orderDetail = new OrderDetailPage(page);
  await orderDetail.gotoOrder(testOrderId);
  await orderDetail.clickAction('edit');

  await orderDetail.setFieldValue('totalAmount', '500.00');
  await orderDetail.submit();

  await expect(orderDetail.getFieldValue('totalAmount')).resolves.toBe('500.00');
});
```

### Delete

```typescript
test('delete an order', async ({ authenticatedPage: page }) => {
  const orderList = new OrderListPage(page);
  await orderList.goto();
  const initialCount = await orderList.getRowCount();

  await orderList.clickRow(0);
  const orderDetail = new OrderDetailPage(page);
  await orderDetail.clickAction('delete');

  // Confirm deletion dialog
  await page.click('[data-testid="dialog-confirm-delete"] [data-testid="action-confirm"]');
  await orderList.waitForPageLoad();

  expect(await orderList.getRowCount()).toBe(initialCount - 1);
});
```

## Custom Operation Scenarios

```typescript
test('approve an order', async ({ authenticatedPage: page }) => {
  const orderDetail = new OrderDetailPage(page);
  await orderDetail.gotoOrder(submittedOrderId);

  await orderDetail.clickAction('approve');
  await orderDetail.waitForPageLoad();

  await expect(orderDetail.getFieldValue('status')).resolves.toBe('APPROVED');
});
```

## Validation Scenarios

```typescript
test('shows validation errors for required fields', async ({ authenticatedPage: page }) => {
  const orderForm = new OrderFormPage(page);
  await orderForm.gotoCreate();
  await orderForm.submit();

  const error = await orderForm.getValidationError('orderNumber');
  expect(error).toContain('required');
});
```

## Table Filtering

```typescript
test('filter orders by status', async ({ authenticatedPage: page }) => {
  const orderList = new OrderListPage(page);
  await orderList.goto();
  await orderList.filterByColumn('status', 'APPROVED');

  const rows = await orderList.getRowCount();
  expect(rows).toBeGreaterThan(0);
});
```
