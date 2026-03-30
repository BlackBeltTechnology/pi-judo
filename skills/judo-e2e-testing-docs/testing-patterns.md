# E2E Testing Patterns

## Test Organization

### Feature-Based Test Files

Organize tests by feature or page:

```
tests/
├── EntityAccessTable.spec.ts      # Table page tests
├── EntityViewPage.spec.ts         # View/edit page tests
├── EntityOperations.spec.ts       # Operation tests
├── EntityFiltering.spec.ts        # Filter tests
├── RelationManagement.spec.ts     # Relation tests
└── ErrorHandling.spec.ts          # Error scenario tests
```

### Test Naming Conventions

```typescript
test.describe('Feature or Page Name', () => {
  test('Action and expected outcome', async ({ page }) => {
    // ...
  });
  
  test('String filters (eq, neq, like, matches) on Table Page', async ({ page }) => {
    // ...
  });
});
```

## Setup Patterns

### Shared Preparation Function

```typescript
test.describe('Entity Tests', () => {
  const tableHelper = new TableHelper();
  const apiHelper = new ApiHelper();

  const prepareTest = async (
    page: Page, 
    entityName: string, 
    options?: { active?: boolean }
  ): Promise<void> => {
    await apiHelper.gotoWithWait(page);
    await navigateToAccess(page, '󰵲 Entities');
    await createOnAccesList(page);
    
    await fillPrimitiveField(page, "Name *", entityName);
    if (options?.active !== undefined) {
      await fillPrimitiveCheckBox(page, "Active", options.active);
    }
    
    await submitOnAccesListCreate(page);
    await page.waitForTimeout(200);
  };

  test('Basic create', async ({ page }) => {
    const name = TEST_DATA_PREFIX + faker.string.alpha(10);
    await prepareTest(page, name);
    // ... assertions
  });
});
```

### Hierarchical Entity Setup

For testing entities with parent-child relationships:

```typescript
const prepareHierarchy = async (
  page: Page, 
  parentName: string, 
  childName: string,
  grandchildName: string
): Promise<void> => {
  await apiHelper.gotoWithWait(page);
  
  // Create parent
  await navigateToAccess(page, '󰵲 Parents');
  await createOnAccesList(page);
  await fillPrimitiveField(page, "Name *", parentName);
  await submitOnAccesListCreate(page);
  
  // Filter to find parent
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Like', value: parentName, type: 'text' }
  ]);
  
  // Navigate to parent view
  await apiHelper.triggerAndWaitWithRegex(page, page.getByText(parentName), /.*~get$/);
  await page.waitForTimeout(200);
  
  // Create child in parent
  await apiHelper.triggerAndWaitWithRegex(page, page.getByRole('button', { name: '󱪝 Create' }), /.*template$/);
  await page.getByRole('textbox', { name: 'Name' }).fill(childName);
  await apiHelper.triggerAndWaitWithRegex(page, page.getByRole('button', { name: '󰄬 Ok' }), /.*validate$/);
  await page.waitForTimeout(200);
  
  // Save parent
  await apiHelper.triggerAndWaitWithRegex(page, page.getByRole('button', { name: '󰆓 Update' }), /.*~get$/);
  
  // Navigate to child
  await page.getByText(childName).click();
  await page.waitForTimeout(200);
  
  // Create grandchild in child
  await apiHelper.triggerAndWaitWithRegex(page, page.getByRole('button', { name: '󱪝 Create' }), /.*template$/);
  await page.getByRole('textbox').fill(grandchildName);
  await apiHelper.triggerAndWaitWithRegex(page, page.getByRole('button', { name: '󰄬 Ok' }), /.*~validate$/);
  await page.waitForTimeout(200);
  
  // Save via dialog
  await apiHelper.triggerAndWaitWithRegex(page, page.getByRole('button', { name: '󰆓 Ok' }), /.*~validate$/);
  await apiHelper.triggerAndWaitWithRegex(page, page.getByRole('button', { name: '󰆓 Update' }), /.*get$/);
};
```

## CRUD Testing Patterns

### Complete CRUD Test

```typescript
test('Full CRUD lifecycle', async ({ page }) => {
  const entityName = TEST_DATA_PREFIX + faker.string.alpha(10);
  const updatedName = TEST_DATA_PREFIX + faker.string.alpha(10);
  
  await apiHelper.gotoWithWait(page);
  
  // CREATE
  await navigateToAccess(page, '󰵲 Entities');
  await createOnAccesList(page);
  await fillPrimitiveField(page, "Name *", entityName);
  await submitOnAccesListCreate(page);
  
  // READ - Verify in table
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Equal', value: entityName, type: 'text' }
  ]);
  await expect(tableHelper.getRows(page)).toHaveCount(1);
  
  // UPDATE - Navigate to view and modify
  await navigateToAnAccessListElement(page, page, entityName);
  await fillPrimitiveField(page, "Name", updatedName);
  await updateAccessViewPage(page);
  
  // Verify update
  await expect(page.getByLabel("Name")).toHaveValue(updatedName);
  
  // DELETE
  await page.getByRole('button', { name: '󰗨 Delete' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  
  // Verify deletion
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Equal', value: updatedName, type: 'text' }
  ]);
  await expect(tableHelper.getRows(page)).toHaveCount(0);
});
```

### Validation Testing

```typescript
test('Required field validation', async ({ page }) => {
  await apiHelper.gotoWithWait(page);
  await navigateToAccess(page, '󰵲 Entities');
  await createOnAccesList(page);
  
  // Try to submit without required fields
  await page.getByRole('button', { name: '󰆓 Create' }).click();
  
  // Verify validation error
  await expect(page.getByText('This field is required')).toBeVisible();
  
  // Fill required field
  await fillPrimitiveField(page, "Name *", "Valid Name");
  
  // Submit should work now
  await submitOnAccesListCreate(page);
});
```

## Filtering Test Patterns

### Comprehensive Filter Testing

```typescript
test('String filters on Access Table', async ({ page }) => {
  const prefix = TEST_DATA_PREFIX + faker.string.alpha(10);
  
  // Create test data
  const entityA = prefix + "#A";
  const entityAA = prefix + "#AA";
  const entityB = prefix + "#B";
  
  await apiHelper.gotoWithWait(page);
  await prepareTest(page, entityA);
  await prepareTest(page, entityAA);
  await prepareTest(page, entityB);
  
  await navigateToAccess(page, '󰵲 Entities');
  
  // Test LIKE filter
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Like', value: prefix, type: 'text' }
  ]);
  await expect(tableHelper.getRows(page)).toHaveCount(3);
  
  // Test EQUAL filter
  await openClearAndApplyFilters(page, apiHelper, 1);
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Equal', value: entityA, type: 'text' }
  ]);
  await expect(tableHelper.getRows(page)).toHaveCount(1);
  
  // Test NOT EQUAL filter
  await openClearAndApplyFilters(page, apiHelper, 1);
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Like', value: prefix, type: 'text' },
    { attributeName: 'Name', startOption: 'Like', option: 'Not equal', value: entityA, type: 'text', operationNth: 1, valueNth: 1 }
  ]);
  await expect(tableHelper.getRows(page)).toHaveCount(2);
  
  // Test MATCHES (regex) filter
  await openClearAndApplyFilters(page, apiHelper, 2);
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Matches', value: prefix + '#A+$', type: 'text' }
  ]);
  await expect(tableHelper.getRows(page)).toHaveCount(2);
});

test('Numeric filters', async ({ page }) => {
  const prefix = TEST_DATA_PREFIX + faker.string.alpha(10);
  
  await apiHelper.gotoWithWait(page);
  await prepareTestWithValue(page, prefix + "#1", 10);
  await prepareTestWithValue(page, prefix + "#2", 20);
  await prepareTestWithValue(page, prefix + "#3", 30);
  
  // Test Greater than
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Like', value: prefix, type: 'text' },
    { attributeName: 'Value', startOption: 'Equal', option: 'Greater than', value: '15', type: 'numeric' }
  ]);
  await expect(tableHelper.getRows(page)).toHaveCount(2);
  
  // Test Is empty
  await openClearAndApplyFilters(page, apiHelper, 2);
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Value', startOption: 'Equal', option: 'Is empty', value: '', type: 'boolean' }
  ]);
});
```

## Operation Testing Patterns

### Operations Without Input/Output

```typescript
test('Simple operation execution', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Direct button operation
  await page.getByRole('button', { name: '󰖕 Activate' }).click();
  
  // Verify state change
  await expect(page.getByLabel('Status')).toHaveValue('Active');
});

test('Operation from action group', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Open action group menu
  await page.getByRole('button', { name: '󰖚 Actions 󰅀' }).click();
  
  // Click operation
  await page.getByText('Deactivate').click();
  
  // Verify
  await expect(page.getByLabel('Status')).toHaveValue('Inactive');
});
```

### Operations With Input Form

```typescript
test('Operation with input form', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Open operation input form
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󰅂 Process' }),
    /.*template$/
  );
  
  // Fill input form
  await page.getByRole('textbox', { name: 'Reason' }).fill('Test reason');
  await page.getByLabel('Priority *').click();
  await page.getByRole('option', { name: 'High' }).click();
  
  // Submit
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󰅂 Submit' }),
    /.*get$/
  );
  
  // Verify result
  await expect(page.getByText('Processed successfully')).toBeVisible();
});
```

### Operations With Mapped Input (Selector)

```typescript
test('Operation with entity selector', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Open selector operation
  await page.getByRole('button', { name: '󰅂 assignTo' }).click();
  
  // Verify submit is disabled without selection
  await expect(page.getByRole('button', { name: '󱓞 Submit' })).toBeDisabled();
  
  // Select from table
  await page.getByRole('gridcell', { name: targetName }).click();
  
  // Submit
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󱓞 Submit' }),
    /.*get$/
  );
});
```

### Operations With Output

```typescript
test('Operation with output display', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Execute operation
  await page.getByRole('button', { name: '󰅂 calculate' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  
  // Verify output dialog content
  await expect(page.getByRole('textbox', { name: 'Result' })).toHaveValue('Expected Result');
  await expect(page.getByLabel('Total')).toHaveValue(formatNumber(expectedTotal));
});
```

## Error Handling Patterns

### Validation Errors

```typescript
test('Form validation errors', async ({ page }) => {
  await apiHelper.gotoWithWait(page);
  await navigateToAccess(page, '󰵲 Entities');
  await createOnAccesList(page);
  
  // Submit with invalid data
  await fillPrimitiveField(page, "Email", "invalid-email");
  await page.getByRole('button', { name: '󰆓 Create' }).click();
  
  // Verify inline validation
  await expect(page.getByText('Invalid email format')).toBeVisible();
});
```

### Operation Faults

```typescript
test('Operation error handling', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Trigger operation that will fail
  await page.getByRole('button', { name: '󰔎 riskyOperation' }).click();
  
  // Verify error dialog
  await expect(page.getByRole('dialog')).toContainText('An error occurred while processing your request.');
  await expect(page.getByRole('listitem')).toContainText('errorCode: VALIDATION_FAILED');
  await expect(page.getByRole('list')).toContainText('message: Invalid state');
  
  // Close error dialog
  await page.getByRole('button', { name: 'Close' }).click();
  
  // Verify we can continue
  await expect(page.getByRole('button', { name: '󰔎 riskyOperation' })).toBeEnabled();
});
```

### Multiple Error Details

```typescript
test('Multiple error details display', async ({ page }) => {
  await triggerMultipleErrors(page);
  
  await expect(page.getByRole('dialog')).toContainText('An error occurred');
  await expect(page.getByRole('list')).toContainText('field1: Error message 1');
  await expect(page.getByRole('list')).toContainText('field2: Error message 2');
  await expect(page.getByRole('list')).toContainText('code: MULTIPLE_ERRORS');
});
```

## Relation Testing Patterns

### Single Relation CRUD

```typescript
test('Single relation management', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Verify initially empty
  await checkEmptySingleRelationElement(page, "Owner");
  
  // Set via autocomplete
  await fillSingleRelationElement(page, page, "Owner", "John Doe");
  await checkSingleRelationElementHasValue(page, "Owner", "John Doe");
  
  // Save
  await updateAccessViewPage(page);
  
  // Navigate to related
  await navigateToSingleRelation(page, page, "Owner");
  await expect(page.getByLabel("Name")).toHaveValue("John Doe");
  
  // Go back
  await backNavigation(page);
  
  // Unset relation
  await unsetSingleRelationElement(page, page, "Owner", true);
  await checkEmptySingleRelationElement(page, "Owner");
});
```

### Collection Relation Testing

```typescript
test('Collection relation operations', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Verify empty table
  await expect(tableHelper.getRows(page)).toHaveCount(0);
  
  // Create items
  await createCollectionRelationElement(page, page, [
    { type: 'string', name: 'Name', value: 'Item 1' }
  ]);
  await createCollectionRelationElement(page, page, [
    { type: 'string', name: 'Name', value: 'Item 2' }
  ]);
  
  await expect(tableHelper.getRows(page)).toHaveCount(2);
  
  // Select and remove
  await selectRowsOnTable(page, page, ['Item 1']);
  await bulkRemoveOnTable(page);
  
  await expect(tableHelper.getRows(page)).toHaveCount(1);
  
  // Save
  await updateAccessViewPage(page);
});
```

## Sorting Test Pattern

```typescript
test('Table sorting', async ({ page }) => {
  const prefix = TEST_DATA_PREFIX + faker.string.alpha(10);
  
  await apiHelper.gotoWithWait(page);
  await prepareTest(page, prefix + "A");
  await prepareTest(page, prefix + "C");
  await prepareTest(page, prefix + "B");
  
  await navigateToAccess(page, '󰵲 Entities');
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'Name', startOption: 'Like', option: 'Like', value: prefix, type: 'text' }
  ]);
  
  // Default sort (usually by ID or creation)
  await assertRows(tableHelper, page, [
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "A" }],
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "C" }],
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "B" }]
  ]);
  
  // Sort ascending by name
  await apiHelper.triggerAndWait(page, page.locator('.MuiDataGrid-columnHeaderTitle', { hasText: 'Name' }));
  await assertRows(tableHelper, page, [
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "A" }],
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "B" }],
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "C" }]
  ]);
  
  // Sort descending
  await apiHelper.triggerAndWait(page, page.locator('.MuiDataGrid-columnHeaderTitle', { hasText: 'Name' }));
  await assertRows(tableHelper, page, [
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "C" }],
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "B" }],
    [{ cellName: 'name', textOperation: 'Contain', value: prefix + "A" }]
  ]);
});
```

## Conditional UI Testing

```typescript
test('Button states based on data', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Initially disabled
  await expect(page.getByRole('button', { name: '󰜃 Process' })).toBeDisabled();
  
  // Create required data
  await createCollectionRelationElement(page, page, [
    { type: 'string', name: 'Name', value: 'Required Item' }
  ]);
  
  // Now enabled
  await expect(page.getByRole('button', { name: '󰜃 Process' })).toBeEnabled();
  
  // Execute and verify disabled again
  await page.getByRole('button', { name: '󰜃 Process' }).click();
  await expect(page.getByRole('button', { name: '󰜃 Process' })).toBeDisabled();
});
```

## Dialog Flow Testing

```typescript
test('Multi-step dialog flow', async ({ page }) => {
  await prepareTest(page, entityName);
  
  // Open first dialog
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󰅂 wizard' }),
    /.*template$/
  );
  
  // Step 1
  await fillPrimitiveField(page.getByRole('dialog'), "Step1Field", "Value1");
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Step 2
  await fillPrimitiveField(page.getByRole('dialog'), "Step2Field", "Value2");
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Submit final step
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󰅂 Submit' }),
    /.*get$/
  );
  
  // Verify completion
  await expect(page.getByText('Wizard completed')).toBeVisible();
});
```
