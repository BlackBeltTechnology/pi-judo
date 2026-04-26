# Writing E2E Tests

## Test File Structure

Tests are organized in `playwright/tests/` directory. Each test file should focus on a specific feature or page.

### Basic Test Structure

```typescript
import { test, expect, Page } from '@playwright/test';
import { TableHelper } from '../helpers/TableHelper';
import { ApiHelper } from '../helpers/ApiHelper';
import {
  navigateToAccess,
  fillPrimitiveField,
  TEST_DATA_PREFIX
} from '../helpers/utils';
import { faker } from '@faker-js/faker';

test.describe('Feature Name', () => {
  const tableHelper = new TableHelper();
  const apiHelper = new ApiHelper();

  // Optional: Shared setup function
  const prepareTest = async (page: Page, data: string): Promise<void> => {
    await apiHelper.gotoWithWait(page);
    // ... setup steps
  };

  test('Test case description', async ({ page }) => {
    // Arrange
    const testData = TEST_DATA_PREFIX + faker.string.alpha(10);

    // Act
    await prepareTest(page, testData);

    // Assert
    await expect(page.getByText(testData)).toBeVisible();
  });
});
```

## Navigation Patterns

### Navigate to Dashboard

```typescript
// Navigate to app root and wait for network idle
await apiHelper.gotoWithWait(page);
```

### Navigate to Access Table (Menu Item)

```typescript
// Click menu button and wait for list API response
await navigateToAccess(page, '󰵲 Galaxies');

// With custom regex pattern
await navigateToAccess(page, '󰵲 Entities', /.*~list$/);
```

### Navigate to View Page

```typescript
// Click on table row to open view
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByText(entityName),
  /.*~get$/
);
```

### Back Navigation

```typescript
import { backNavigation } from '../helpers/utils';

// With network wait (default)
await backNavigation(page);

// Without network wait
await backNavigation(page, '󰁍 Back', { checkNetwork: false });
```

## Form Interactions

### Text Fields

```typescript
import { fillPrimitiveField, checkPrimitiveFieldHasValue } from '../helpers/utils';

// Fill text field
await fillPrimitiveField(page, "Name *", "Test Value");

// Fill with modeled filter present (uses nth selector)
await fillPrimitiveField(page, "Magnitude", "2.34", true);

// Without back-check (faster, less safe)
await fillPrimitiveField(page, "Name", "Value", false, false);

// Verify field value
await checkPrimitiveFieldHasValue(page, "Name", "Test Value");
```

### Checkboxes

```typescript
import { fillPrimitiveCheckBox, checkCheckboxPrimitiveCheckBoxHasValue } from '../helpers/utils';

// Check/uncheck
await fillPrimitiveCheckBox(page, "Active", true);
await fillPrimitiveCheckBox(page, "Active", false);

// Verify state
await checkCheckboxPrimitiveCheckBoxHasValue(page, "Active", true);
```

### Enum Comboboxes

```typescript
import { fillEnumCombobox, checkEnumCombobox } from '../helpers/utils';

// Select option
await fillEnumCombobox(page, page, "Status", "Active");

// Verify selection
await checkEnumCombobox(page, "Status", "Active");
```

### Date Fields

```typescript
// Date format: MM/DD/YYYY HH:MM:SS
await fillPrimitiveField(page, "Discovered", '11/05/2024 12:12:12');
```

## CRUD Operations

### Create Entity (Access Table)

```typescript
import {
  navigateToAccess,
  createOnAccesList,
  fillPrimitiveField,
  submitOnAccesListCreate
} from '../helpers/utils';

// Navigate to table
await navigateToAccess(page, '󰵲 Entities');

// Open create form
await createOnAccesList(page);

// Fill form
await fillPrimitiveField(page, "Name *", entityName);

// Submit and wait for list refresh
await submitOnAccesListCreate(page);
```

### Update Entity

```typescript
import { updateAccessViewPage } from '../helpers/utils';

// Make changes to form fields
await fillPrimitiveField(page, "Name", "Updated Name");

// Save changes
await updateAccessViewPage(page);
```

### Delete Entity

```typescript
// Click delete button
await page.getByRole('button', { name: '󰗨 Delete' }).click();

// Confirm deletion
await page.getByRole('button', { name: 'Yes' }).click();
```

## Table Interactions

### Get Table Rows

```typescript
const tableHelper = new TableHelper();

// Get specific row (1-indexed)
const row = tableHelper.getRow(page, 1);

// Get all data rows (excludes header)
const rows = tableHelper.getRows(page);

// Count rows
await expect(tableHelper.getRows(page)).toHaveCount(5);
```

### Get Cell Content

```typescript
// Get cell by column data-field
const cell = tableHelper.getCell(tableHelper.getRow(page, 1), "name");

// Assert cell content
await expect(cell).toContainText("Expected Value");
await expect(cell).toHaveText("Exact Value");
```

### Assert Multiple Rows

```typescript
import { assertRows, assertRowContent } from '../helpers/utils';

// Assert multiple rows at once
await assertRows(tableHelper, page, [
  [{ cellName: 'name', textOperation: 'Contain', value: 'Entity A' }],
  [{ cellName: 'name', textOperation: 'Contain', value: 'Entity B' }],
  [{ cellName: 'name', textOperation: 'Have', value: 'Entity C' }],
]);

// Assert single row with multiple cells
await assertRowContent(tableHelper, page, 1, [
  { cellName: 'name', textOperation: 'Contain', value: 'Test' },
  { cellName: 'status', textOperation: 'Have', value: 'Active' },
  { cellName: 'active', textOperation: 'BooleanValue', value: 'true' },
]);
```

### Boolean Cell Values

```typescript
// Check boolean icon classes
await expect(
  tableHelper.getCell(row, "active").locator('> div span')
).toHaveClass('mdi mdi-check-circle JUDO-mdi-icon true');

// Boolean values: 'true', 'false', 'undefined'
```

### Select Rows

```typescript
import { selectRowsOnTable, selecAllRowsOnTable } from '../helpers/utils';

// Select specific rows by name
await selectRowsOnTable(page, page, ['Entity A', 'Entity B']);

// Select all rows
await selecAllRowsOnTable(page);
```

### Sorting

```typescript
// Click column header to sort
await apiHelper.triggerAndWait(
  page,
  page.locator('.MuiDataGrid-columnHeaderTitle', { hasText: 'Name' })
);
```

## Filtering

### Apply Filters

```typescript
import { openAddAndApplyFilters } from '../helpers/utils';

// Apply single filter
await openAddAndApplyFilters(page, apiHelper, [
  { attributeName: 'Name', startOption: 'Like', option: 'Like', value: 'Test', type: 'text' }
]);

// Apply multiple filters
await openAddAndApplyFilters(page, apiHelper, [
  { attributeName: 'Name', startOption: 'Like', option: 'Like', value: prefix, type: 'text' },
  { attributeName: 'Status', startOption: 'Equal', option: 'Equal', value: 'Active', type: 'enum' }
]);
```

### Filter Types and Options

**Text Filters:**
- `Like` - Contains substring
- `Equal` - Exact match
- `Not equal` - Does not match
- `Matches` - Regex pattern
- `Less than`, `Greater than`, `Less or equal`, `Greater or equal`

**Numeric Filters:**
- `Equal`, `Not equal`
- `Less than`, `Greater than`, `Less or equal`, `Greater or equal`
- `Is empty`, `Is not empty`

**Boolean Filters:**
- `Is empty`, `Is not empty`

**Enum Filters:**
- `Equal` - Select from dropdown

### Clear Filters

```typescript
import { openClearAndApplyFilters, clearFilters } from '../helpers/utils';

// Clear all and apply empty filter set
await openClearAndApplyFilters(page, apiHelper, 2); // 2 = current filter count

// Just clear without applying
await clearFilters(page);
```

### Multiple Filters on Same Field

```typescript
await openAddAndApplyFilters(page, apiHelper, [
  {
    attributeName: 'Name',
    startOption: 'Like',
    option: 'Like',
    value: prefix,
    type: 'text'
  },
  {
    attributeName: 'Name',
    startOption: 'Like',
    option: 'Equal',
    value: exactName,
    type: 'text',
    operationNth: 1,  // Second filter dropdown
    valueNth: 1       // Second value input
  }
]);
```

## Relation Handling

### Single Relation (Autocomplete)

```typescript
import {
  fillSingleRelationElement,
  checkSingleRelationElementHasValue,
  checkEmptySingleRelationElement,
  unsetSingleRelationElement,
  deleteSingleRelationElement,
  navigateToSingleRelation
} from '../helpers/utils';

// Select from autocomplete (triggers range API)
await fillSingleRelationElement(page, page, "Owner", "John Doe");

// Verify value
await checkSingleRelationElementHasValue(page, "Owner", "John Doe");

// Check empty
await checkEmptySingleRelationElement(page, "Owner");

// Unset relation
await unsetSingleRelationElement(page, page, "Owner", true); // true = update after

// Delete related entity
await deleteSingleRelationElement(page, page, "Owner", true);

// Navigate to related entity view
await navigateToSingleRelation(page, page, "Owner");
```

### Create Related Entity

```typescript
import { createSingleRelationElement } from '../helpers/utils';

await createSingleRelationElement(page, page, "Owner", [
  { type: 'string', name: 'Name', value: 'New Owner' },
  { type: 'numeric', name: 'Age', value: '30' },
  { type: 'boolean', name: 'Active', value: 'true' }
], true); // true = update after
```

### Attach from Selector

```typescript
import { attachOnSingelRelationElement } from '../helpers/utils';

await attachOnSingelRelationElement(
  page,
  page,
  "Owner",           // Relation name
  "Name",            // Filter attribute
  "John",            // Filter value
  true,              // Update after
  false              // onSettedElement (true if already has value)
);
```

### Collection Relations

```typescript
import {
  navigateToCollectionRelationButton,
  createCollectionRelationElement,
  bulkRemoveOnTable,
  bulkDeleteOnTable
} from '../helpers/utils';

// Navigate to relation table (button opens separate page)
await navigateToCollectionRelationButton(page, page, "Stars");

// Create in inline table
await createCollectionRelationElement(page, page, [
  { type: 'string', name: 'Name', value: 'New Star' }
]);

// Bulk remove (unlink)
await selectRowsOnTable(page, page, ['Star A', 'Star B']);
await bulkRemoveOnTable(page);

// Bulk delete
await selecAllRowsOnTable(page);
await bulkDeleteOnTable(page);
```

## Operations (Actions)

### Simple Operations (No Input/Output)

```typescript
// Click operation button
await page.getByRole('button', { name: '󰖕 Create Life' }).click();

// Or from action group menu
await page.getByRole('button', { name: '󰖚 Actions 󰅀' }).click();
await page.getByRole('menuitem', { name: '󰖕 Create Life' }).click();
```

### Operations with Input

```typescript
import { callOperationWithInput, submitOperationCall } from '../helpers/utils';

// Open operation input form
await callOperationWithInput(page, page, '󰅂 createEntity', '󰖚 Actions');

// Fill input form
await fillPrimitiveField(page, "Name", "New Entity");

// Submit
await submitOperationCall(page, page, '󰅂 Submit', /.*get$/);
```

### Operations with Mapped Input (Selector)

```typescript
// Open operation that requires selecting existing entities
await page.getByRole('button', { name: '󰅂 selectItems' }).click();

// Select from table
await page.getByRole('gridcell', { name: 'Item A' }).click();

// Submit selection
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByRole('button', { name: '󱓞 Submit' }),
  /.*get$/
);
```

### Operations with Output

```typescript
// Trigger operation
await page.getByRole('button', { name: '󰅂 getResult' }).click();
await page.getByRole('button', { name: 'Yes' }).click();

// Verify output dialog/page content
await expect(page.getByRole('textbox', { name: 'Result' })).toHaveValue('Expected');
```

### Error Handling

```typescript
// Trigger operation that fails
await page.getByRole('button', { name: '󰔎 Submit' }).click();

// Verify error dialog
await expect(page.getByRole('dialog')).toContainText('An error occurred');
await expect(page.getByRole('listitem')).toContainText('errorCode: Validation failed');

// Close error dialog
await page.getByRole('button', { name: 'Close' }).click();
```

## Dialog Handling

### Confirmation Dialogs

```typescript
// Trigger action that shows confirmation
await page.getByRole('button', { name: '󰗨 Delete' }).click();

// Confirm
await page.getByRole('button', { name: 'Yes' }).click();

// Or cancel
await page.getByRole('button', { name: 'No' }).click();
```

### Form Dialogs

```typescript
import { acceptChangesOnDialogElement } from '../helpers/utils';

// Work with dialog content
const dialog = page.getByRole('dialog');
await fillPrimitiveField(dialog, "Name", "Value");

// Submit dialog
await acceptChangesOnDialogElement(page, dialog);
```

## Waiting for API Responses

### Pattern-Based Waiting

```typescript
// Wait for any API call matching pattern
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByRole('button', { name: 'Submit' }),
  /.*~validate$/
);

// Common patterns:
// /.*~list$/     - List/table data
// /.*~get$/      - Single entity fetch
// /.*template$/  - Form template
// /.*~validate$/ - Validation
// /.*range$/     - Relation range query
```

### Navigate with Wait

```typescript
// Go to URL and wait for network idle
await apiHelper.gotoWithWait(page, '/custom-path');
```

## Test Data Management

### Use Test Prefix

```typescript
import { TEST_DATA_PREFIX } from '../helpers/utils';
import { faker } from '@faker-js/faker';

// Always prefix test data
const entityName = TEST_DATA_PREFIX + faker.string.alpha(10);
// Result: "X_TEST_AbCdEfGhIj"
```

### Generate Unique Data

```typescript
import { faker } from '@faker-js/faker';

// Strings
const name = faker.string.alpha(10);
const email = faker.internet.email();

// Numbers
const id = faker.number.int({ min: 1000, max: 1000000 });
const amount = faker.number.float({ min: 0, max: 100, precision: 0.01 });

// Dates
const date = faker.date.past().toISOString();
```

### Format Numbers for Display

```typescript
import { formatNumber } from '../helpers/utils';

const id = 1234567;
// Display format: "1,234,567"
await expect(page.getByLabel('ID')).toHaveValue(formatNumber(id));
```
