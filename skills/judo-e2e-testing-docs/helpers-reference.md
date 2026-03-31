# Helper Utilities Reference

## Overview

The E2E project includes generated helper utilities in `playwright/helpers/`. These utilities simplify common testing patterns for JUDO-generated frontends.

## ApiHelper

Located at: `helpers/ApiHelper.ts`

Handles API request synchronization to ensure tests wait for backend responses.

### Constructor

```typescript
const apiHelper = new ApiHelper();
```

The ApiHelper automatically constructs the base API regex from `APP_URL` environment variable.

### Methods

#### `gotoWithWait(page: Page, url?: string): Promise<any>`

Navigate to a URL and wait for network to become idle.

```typescript
// Navigate to app root
await apiHelper.gotoWithWait(page);

// Navigate to specific path
await apiHelper.gotoWithWait(page, '/custom-path');
```

#### `triggerAndWait(page: Page, locator: Locator): Promise<any>`

Click a locator and wait for any API response matching the base URL pattern.

```typescript
await apiHelper.triggerAndWait(page, page.getByRole('button', { name: 'Submit' }));
```

#### `triggerAndWaitWithRegex(page: Page, locator: Locator, regex: RegExp): Promise<any>`

Click a locator and wait for API response matching specific pattern.

```typescript
// Wait for list endpoint
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByRole('button', { name: '󰵲 Entities' }),
  /.*~list$/
);

// Wait for get endpoint
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByText('Entity Name'),
  /.*~get$/
);

// Wait for validation
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByRole('button', { name: '󰄬 Ok' }),
  /.*~validate$/
);
```

#### `triggerAndWaitWithAction(page: Page, promise: Promise<void>, regex: RegExp): Promise<any>`

Execute a promise and wait for API response matching pattern.

```typescript
// Wait for autocomplete range API while typing
await apiHelper.triggerAndWaitWithAction(
  page,
  page.getByRole('combobox', { name: 'Owner' }).fill('John'),
  /.*range$/
);
```

### Common API Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| `/.*~list$/` | List/table data | Navigate to table page |
| `/.*~get$/` | Single entity fetch | Open view page, after update |
| `/.*template$/` | Form template | Open create form |
| `/.*~validate$/` | Validation | Submit form |
| `/.*range$/` | Relation range query | Autocomplete, selector |
| `/.*create$/` | Create entity | After create form submit |
| `/.*update$/` | Update entity | After update |
| `/.*delete$/` | Delete entity | After delete |

## TableHelper

Located at: `helpers/TableHelper.ts`

Provides utilities for interacting with MUI DataGrid tables.

### Constructor

```typescript
const tableHelper = new TableHelper();
```

### Methods

#### `getRow(page: Page | Locator, nth: number): Locator`

Get a specific row by index (0-indexed, where 0 is header row).

```typescript
// Get first data row (row 1, after header)
const firstRow = tableHelper.getRow(page, 1);

// Get second data row
const secondRow = tableHelper.getRow(page, 2);

// Within a dialog
const dialogRow = tableHelper.getRow(page.getByRole('dialog'), 1);
```

#### `getRows(page: Page | Locator): Locator`

Get all data rows (excludes header, uses `aria-selected="false"` selector).

```typescript
// Count rows
await expect(tableHelper.getRows(page)).toHaveCount(5);

// Iterate rows
const rows = tableHelper.getRows(page);
const count = await rows.count();
```

#### `getCell(locator: Page | Locator, cellName: string): Locator`

Get a cell by column data-field name.

```typescript
const row = tableHelper.getRow(page, 1);
const nameCell = tableHelper.getCell(row, "name");
const statusCell = tableHelper.getCell(row, "status");

// Assert content
await expect(nameCell).toContainText("Expected");
await expect(statusCell).toHaveText("Active");
```

#### `getCellInput(locator: Locator, cellName: string): Locator`

Get input element within a cell (for inline editing).

```typescript
const row = tableHelper.getRow(page, 1);
const input = tableHelper.getCellInput(row, "name");
await input.fill("New Value");
```

#### `getSortButton(page: Page | Locator, cellName: string): Locator`

Get the sort button for a column.

```typescript
const sortButton = tableHelper.getSortButton(page, "name");
await sortButton.click();
```

### Cell Data-Field Names

Cell names correspond to the attribute names in the model (camelCase):

| Model Attribute | Cell Name |
|----------------|-----------|
| `name` | `"name"` |
| `createdAt` | `"createdAt"` |
| `isActive` | `"isActive"` |

## Utils Module

Located at: `helpers/utils.ts`

Comprehensive utility functions for common E2E operations.

### Constants

#### `TEST_DATA_PREFIX`

```typescript
export const TEST_DATA_PREFIX = 'X_TEST_';
```

Use this prefix for all test data to easily identify and clean up.

### Type Definitions

```typescript
type ElementNameType = string | RegExp;
type FilterType = 'text' | 'numeric' | 'boolean' | 'enum';
type RowType = string;

interface RelationCreateElement {
  type: 'string' | 'numeric' | 'date' | 'boolean' | 'single';
  name: ElementNameType;
  value: string;
}

interface AddFilterSpec {
  attributeName: ElementNameType;
  startOption: string;
  option: string;
  value: string;
  type?: FilterType;
  operationNth?: number;   // For multiple filters on same field
  valueNth?: number;       // For multiple filters on same field
}

interface CellAssertData {
  cellName: string;
  textOperation: 'Contain' | 'Have' | 'BooleanValue';
  value: string;
}

interface BackNavigationOptions {
  checkNetwork?: boolean;  // Default: true
  regexExp?: RegExp;       // Default: /.*get$/
}
```

### Number Formatting

#### `formatNumber(input: number | string): string`

Format number with US locale (comma separators).

```typescript
formatNumber(1234567);    // "1,234,567"
formatNumber("1234.56");  // "1,234.56"
```

### Navigation Functions

#### `navigateToAccess(page, menuLabel, regexExp?)`

Navigate to an access table via menu button.

```typescript
await navigateToAccess(page, '󰵲 Galaxies');
await navigateToAccess(page, '󰵲 Users', /.*~list$/);
```

#### `navigateToAnAccessListElement(page, locator, cellName, regexExp?)`

Click on a table cell to navigate to view page.

```typescript
await navigateToAnAccessListElement(page, page, 'Entity Name');
```

#### `navigateToCollectionRelationButton(page, locator, name)`

Navigate to a relation's table page via button.

```typescript
await navigateToCollectionRelationButton(page, page, "Stars");
```

#### `navigateToSingleRelation(page, locator, name)`

Navigate to a single relation's view page.

```typescript
await navigateToSingleRelation(page, page, "Owner");
```

#### `backNavigation(page, backButton?, options?)`

Navigate back.

```typescript
await backNavigation(page);
await backNavigation(page, '󰁍 Back', { checkNetwork: false });
```

### Form Functions

#### Primitive Fields

```typescript
// Fill field
await fillPrimitiveField(page, "Name *", "Value");
await fillPrimitiveField(page, "Amount", "100", true);  // hasModeledFilter
await fillPrimitiveField(page, "Name", "Value", false, false);  // no backCheck

// Clear field
await clearPrimitiveField(page, "Name", "");

// Check value
await checkPrimitiveFieldHasValue(page, "Name", "Expected");
```

#### Checkboxes

```typescript
await fillPrimitiveCheckBox(page, "Active", true);
await fillPrimitiveCheckBox(page, "Active", false);
await checkCheckboxPrimitiveCheckBoxHasValue(page, "Active", true);
```

#### Enum Comboboxes

```typescript
await fillEnumCombobox(page, page, "Status", "Active");
await checkEnumCombobox(page, "Status", "Active");
await checkEnumComboboxOptions(page, page, "Status", ["Active", "Inactive"]);
```

### CRUD Functions

#### Create

```typescript
await createOnAccesList(page);
await createOnAccesList(page, page, '󱪝 Create', /.*template$/);
await submitOnAccesListCreate(page);
```

#### Update

```typescript
await updateAccessViewPage(page);
await updateAccessViewPage(page, '󰆓 Update', /.*get$/);
```

### Filter Functions

#### `openFilter(page, clear?, number?, nth?)`

Open filter panel.

```typescript
await openFilter(page);
await openFilter(page, true);  // Clear existing filters
await openFilter(page, false, 3);  // Shows "(3)" in button
```

#### `addFilter(page, attributeName, startOption, option, value, type?, operationNth?, valueNth?)`

Add a single filter (low-level).

#### `applyFilters(page, apiHelper, count, doWait?)`

Apply current filters.

```typescript
await applyFilters(page, apiHelper, 2);  // 2 filters
```

#### `openAddAndApplyFilters(page, apiHelper, filters, doWait?, whichFilter?)`

Complete filter workflow.

```typescript
await openAddAndApplyFilters(page, apiHelper, [
  { attributeName: 'Name', startOption: 'Like', option: 'Like', value: 'Test', type: 'text' },
  { attributeName: 'Age', startOption: 'Equal', option: 'Greater than', value: '18', type: 'numeric' }
]);
```

#### `openClearAndApplyFilters(page, apiHelper, filtersPresent, doWait?, whichFilter?)`

Clear existing filters.

```typescript
await openClearAndApplyFilters(page, apiHelper, 2);
```

#### `clearFilters(page)`

Clear filters without applying.

### Assertion Functions

#### `assertRows(tableHelper, page, rows)`

Assert multiple rows.

```typescript
await assertRows(tableHelper, page, [
  [{ cellName: 'name', textOperation: 'Contain', value: 'A' }],
  [{ cellName: 'name', textOperation: 'Have', value: 'B' }]
]);
```

#### `assertRowContent(tableHelper, page, rowNum, data)`

Assert single row.

```typescript
await assertRowContent(tableHelper, page, 1, [
  { cellName: 'name', textOperation: 'Contain', value: 'Test' },
  { cellName: 'active', textOperation: 'BooleanValue', value: 'true' }
]);
```

#### `assertCellContent(tableHelper, page, rowNum, data)`

Assert single cell.

### Relation Functions

#### Single Relations

```typescript
// Set via autocomplete
await fillSingleRelationElement(page, page, "Owner", "John");

// Verify
await checkSingleRelationElementHasValue(page, "Owner", "John");
await checkEmptySingleRelationElement(page, "Owner");

// Unset
await unsetSingleRelationElement(page, page, "Owner", true);

// Delete related
await deleteSingleRelationElement(page, page, "Owner", true);

// Create new
await createSingleRelationElement(page, page, "Owner", [
  { type: 'string', name: 'Name', value: 'New Owner' }
], true);

// Attach from selector
await attachOnSingelRelationElement(page, page, "Owner", "Name", "John", true);

// Open selector dialog
await openSingleRelationSelector(page, page, "Owner");
```

#### Collection Relations

```typescript
// Create in table
await createCollectionRelationElement(page, page, [
  { type: 'string', name: 'Name', value: 'New Item' }
]);

// Open create dialog
await openCollectionRelationElementCreate(page, page);
await openCollectionRelationElementCreate(page, page, '󱪝 Add');

// Submit create
await submitCollectioRelationElementCreate(page, page);

// Accept dialog changes
await acceptChangesOnDialogElement(page);
```

### Table Selection Functions

```typescript
// Select specific rows
await selectRowsOnTable(page, page, ['Item A', 'Item B']);

// Select all
await selecAllRowsOnTable(page);

// Bulk operations
await bulkRemoveOnTable(page);
await bulkDeleteOnTable(page);
```

### Operation Functions

#### `callOperationWithInput(page, locator, name, groupName?)`

Open operation input form.

```typescript
// Direct operation button
await callOperationWithInput(page, page, '󰅂 createEntity');

// From action group menu
await callOperationWithInput(page, page, '󰅂 createEntity', '󰖚 Actions');
```

#### `submitOperationCall(page, locator?, submitButton?, regExp?)`

Submit operation.

```typescript
await submitOperationCall(page);
await submitOperationCall(page, page, '󰅂 Submit', /.*get$/);
```

### Helper Functions

#### `proccessRelationElement(page, locator, element)`

Process a single relation field based on type.

```typescript
await proccessRelationElement(page, dialog, {
  type: 'string',
  name: 'Name',
  value: 'Test'
});
```

## VisualElementIds

Located at: `helpers/visualElementIds/VisualElementIds.ts`

Generated constants for UI element identifiers. These map to model element IDs.

### Structure

```typescript
export const EntityNamePageType = {
  _id: "Actor/(esm/_abc123)/PageContainer",
  _label: "Entity Name Form",
  fieldName: {
    id: "Actor/(esm/_def456)/StringTypeTextInput",
    label: "Field Name"
  },
  relationName: {
    _id: "Actor/(esm/_ghi789)/RelationTable",
    _label: "Relation Name",
    column1: {
      id: "Actor/(esm/_jkl012)/TableColumn",
      label: "Column 1"
    },
    pageActions: {
      create: {
        id: "Actor/(esm/_mno345)/CreateButton",
        label: "Create"
      }
    }
  },
  pageActions: {
    back: {
      id: "Actor/(esm/_pqr678)/BackButton",
      label: "Back"
    },
    update: {
      id: "Actor/(esm/_stu901)/UpdateButton",
      label: "Save"
    }
  }
};
```

### Usage

```typescript
import { EntityNameForm } from '../helpers/visualElementIds/VisualElementIds';

// Use element IDs for precise selection
await page.locator(`[data-id="${EntityNameForm.fieldName.id}"]`).fill('Value');

// Or use labels
await page.getByLabel(EntityNameForm.fieldName.label).fill('Value');
```

### Benefits

1. **Model Traceability**: IDs link back to model elements
2. **Refactoring Safety**: If model changes, IDs update automatically
3. **Precise Selection**: Target exact elements without ambiguity
4. **Documentation**: Labels serve as readable identifiers
