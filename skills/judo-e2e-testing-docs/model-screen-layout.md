# Model-to-Screen Layout Mapping

This document describes how JUDO UI model elements map to screen components and how to use the generated `VisualElementIds.ts` for E2E testing.

## Overview

The JUDO generator creates a UI model (`*-ui.json`) that defines:
- Application structure with navigation
- Page definitions (Form, Table, View/Edit)
- Page containers with visual elements
- Actions and operations

The generator also produces `VisualElementIds.ts` - a TypeScript file containing constants that map model element IDs to their rendered screen components.

## Navigation via Actor Accesses

**Important**: The menu structure is driven by **Actor accesses**, not by individual entity names. Each access defined on an Actor in the ESM model becomes a menu item.

### Understanding Menu Structure

The sidebar menu only shows Actor accesses, not direct entity links. For example, if an Actor has a single "Administration" access that contains multiple entity groups (Users, Campaigns, Addresses), the navigation flow is:

```
Dashboard
  └── Administration (menu item = Actor access)
        └── Tab Groups:
            ├── UsersGroup → Users table
            ├── CampaignsGroup → Campaigns, Events
            └── AddressesGroup → Addresses table
```

### Testing Navigation to Nested Entities

When testing, you must navigate through the access hierarchy:

```typescript
test('Navigate to Users table', async ({ page }) => {
  // ❌ WRONG: Looking for "Users" menu item
  // await page.getByRole('button', { name: /Users/i }).click();
  
  // ✅ CORRECT: Navigate through Actor access
  await page.getByRole('button', { name: 'Administration' }).click();
  
  // Then navigate to the Users tab within Administration
  await page.getByRole('tab', { name: 'Users' }).click();
});
```

### Access Control and Visibility

Menu items and tabs can be hidden based on `hiddenBy`, `enabledBy`, and `requiredBy` boolean attributes. Backend interceptors can dynamically control these:

```typescript
test('Verify access control hides restricted tabs', async ({ page }) => {
  // Navigate to Administration
  await page.getByRole('button', { name: 'Administration' }).click();
  
  // For users without admin role, sensitive tabs may be hidden
  // Check that the tab exists (or doesn't) based on permissions
  const sensitiveTab = page.getByRole('tab', { name: 'Sensitive Data' });
  
  // If user doesn't have permission, tab should not be visible
  await expect(sensitiveTab).not.toBeVisible();
});
```

### Dynamic Access Control Testing

When access is controlled by interceptors, test both permitted and restricted scenarios:

```typescript
test.describe('Access control', () => {
  test('Admin user sees all tabs', async ({ page }) => {
    // Login as admin (if using auth)
    await apiHelper.gotoWithWait(page);
    await page.getByRole('button', { name: 'Administration' }).click();
    
    // Admin should see all tabs
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Settings' })).toBeVisible();
  });
  
  test('Regular user sees limited tabs', async ({ page }) => {
    // Login as regular user
    await apiHelper.gotoWithWait(page);
    await page.getByRole('button', { name: 'Administration' }).click();
    
    // Regular user may not see admin-only tabs
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Settings' })).not.toBeVisible();
  });
});
```

## ID Format Structure

All element IDs follow this pattern:

```
{Actor}/(esm/_{UniqueModelId})/ElementType
```

**Components:**
- **Actor**: The actor/role context (e.g., `God`, `Admin`, `User`, `ActorWithRealm`)
- **UniqueModelId**: A unique EMF/XMI identifier from the model (e.g., `DpoUkM8xEe6U3KSieLrWmg`)
- **ElementType**: The UI component type

### Example ID Breakdown

```
God/(esm/_DpoUkM8xEe6U3KSieLrWmg)/TransferObjectFormPageContainer
│         │                          │
│         │                          └── Element type: Form page container
│         └── Unique model element ID
└── Actor name
```

## Multi-Actor Applications

JUDO supports multiple actors (user roles) with optional realm-based isolation. Each actor generates its own set of VisualElementIds with actor-specific prefixes.

### Actor Types

| Actor Type | Description | Example |
|------------|-------------|---------|
| **Anonymous** | Public access without authentication | `ActorAnon2` |
| **With Realm** | Authenticated with realm isolation | `ActorWithRealm` |
| **Same Realm** | Shares realm with another actor | `ActorWithSameRealm` |
| **Other Realm** | Separate realm from other actors | `ActorWithOtherRealm` |

### Actor-Specific IDs

Each actor has its own namespace in VisualElementIds:

```typescript
// Anonymous actor
export const ActorAnon2Dashboard = {
  _id: "ActorAnon2/(esm/_xxx)/EmptyDashboardPageContainer",
  _label: "Dashboard",
};

// Realm-based actor
export const ActorWithRealmDashboard = {
  _id: "ActorWithRealm/(esm/_xxx)/EmptyDashboardPageContainer",
  _label: "Dashboard",
};
```

### Testing Multi-Actor Scenarios

```typescript
// Import actor-specific constants
import { 
  ActorAnon2Dashboard,
  UserForAnon2TransferObject_Table 
} from '../helpers/visualElementIds/VisualElementIds';

test('Anonymous user can view public data', async ({ page }) => {
  // Navigate to anonymous dashboard
  await page.goto('/');
  await expect(page.getByTestId(ActorAnon2Dashboard._id)).toBeVisible();
  
  // Access public table
  await page.getByTestId(UserForAnon2TransferObject_Table._id);
});
```

## Page Container Types

### Dashboard Pages

Dashboards are the landing pages for actors. Two types exist:

| Type | Element Type | Description |
|------|--------------|-------------|
| Empty Dashboard | `EmptyDashboardPageContainer` | Simple landing page without widgets |
| Dashboard | `DashboardPageContainer` | Dashboard with configurable widgets |

```typescript
// Empty dashboard (no widgets)
export const ActorDashboard = {
  _id: "Actor/(esm/_xxx)/EmptyDashboardPageContainer",
  _label: "Dashboard",
};

// Dashboard with widgets would use DashboardPageContainer
```

### 1. Form Page (`TransferObjectFormPageContainer`)

Used for creating new entities.

**VisualElementIds Structure:**
```typescript
export const EntityName_Form = {
  _id: "Actor/(esm/_xxx)/TransferObjectFormPageContainer",
  _label: "EntityName Form",
  
  // Primitive fields
  name: {
    id: "Actor/(esm/_xxx)/StringTypeTextInput",
    label: "Name"
  },
  
  // Page actions
  pageActions: {
    _id: "Actor/(esm/_xxx)/TransferObjectFormButtonGroup",
    _label: "Actions",
    back: { id: "...", label: "Back" },
    create: { id: "...", label: "Create" }
  }
};
```

**Test Usage:**
```typescript
import { EntityName_Form } from '../helpers/visualElementIds/VisualElementIds';

// Access form by ID
await page.getByTestId(EntityName_Form._id);

// Fill a field
await page.getByTestId(EntityName_Form.name.id).fill('Test Name');

// Click create button
await page.getByTestId(EntityName_Form.pageActions.create.id).click();
```

### 2. Table Page (`TransferObjectTablePageContainer`)

Used for listing entities in a data grid.

**VisualElementIds Structure:**
```typescript
export const EntityName_Table = {
  _id: "Actor/(esm/_xxx)/TransferObjectTablePageContainer",
  _label: "EntityName Table",
  
  entityName_Table: {
    _id: "Actor/(esm/_xxx)/TransferObjectTableTable",
    _label: "EntityName Table",
    
    // Table columns
    name: {
      id: "Actor/(esm/_xxx)/TableColumn/(discriminator/...)",
      label: "name"
    },
    
    // Column filters
    nameFilter: {
      id: "Actor/(esm/_xxx)/TableColumnFilter/(discriminator/...)",
      label: "name"
    },
    
    // Table-level actions
    tableActions: {
      _id: "Actor/(esm/_xxx)/TransferObjectTableTableButtonGroup",
      filter: { id: "...", label: "Set Filters" },
      refresh: { id: "...", label: "Refresh" },
      export: { id: "...", label: "Export" },
      create: { id: "...", label: "Create" },
      bulkDelete: { id: "...", label: "Delete" }
    },
    
    // Row-level actions
    rowActions: {
      _id: "Actor/(esm/_xxx)/TransferObjectTableRowButtonGroup",
      view: { id: "...", label: "View" },
      remove: { id: "...", label: "Remove" },
      delete: { id: "...", label: "Delete" }
    }
  },
  
  // Page-level actions
  pageActions: {
    _id: "Actor/(esm/_xxx)/TransferObjectTableButtonGroup",
    back: { id: "...", label: "Back" },
    set: { id: "...", label: "Set" },
    add: { id: "...", label: "Add" }
  }
};
```

### 3. View/Edit Page (`TransferObjectViewPageContainer`)

Used for viewing and editing existing entities.

**VisualElementIds Structure:**
```typescript
export const EntityName_View_Edit = {
  _id: "Actor/(esm/_xxx)/TransferObjectViewPageContainer",
  _label: "EntityName View / Edit",
  
  // Primitive fields
  name: {
    id: "Actor/(esm/_xxx)/StringTypeTextInput",
    label: "Name"
  },
  
  // Embedded relations (tables within view)
  relatedItems: {
    _id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedTable",
    _label: "Related Items",
    
    // Columns
    itemName: { id: "...", label: "ItemName" },
    
    // Embedded table actions
    pageActions: {
      filter: { id: "...", label: "Set Filters" },
      create: { id: "...", label: "Create" },
      add: { id: "...", label: "Add" }
    },
    rowActions: {
      view: { id: "...", label: "View" },
      remove: { id: "...", label: "Remove" }
    }
  },
  
  // Single relation link
  singleRelation: {
    id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedLink",
    label: "Single Relation"
  },
  
  // Page actions
  pageActions: {
    _id: "Actor/(esm/_xxx)/TransferObjectViewButtonGroup",
    back: { id: "...", label: "Back" },
    refresh: { id: "...", label: "Refresh" },
    delete: { id: "...", label: "Delete" },
    cancel: { id: "...", label: "Cancel" },
    update: { id: "...", label: "Save" }
  }
};
```

## Field Element Types

### Primitive Input Types

| Model Type | Element Type Suffix | HTML Element |
|------------|---------------------|--------------|
| String | `StringTypeTextInput` | Text input |
| String (multiline) | `StringTypeTextArea` | Textarea for long text |
| String (read-only) | `StringTypeFormatted` | Formatted read-only text |
| Boolean | `BooleanTypeCheckbox` | Checkbox |
| Numeric | `NumericTypeVisualInput` | Number input |
| Double | `NumericTypeVisualInput` | Number input (decimal) |
| Date | `DateTypeInput` | Date picker |
| Timestamp | `TimestampTypeDateTimeInput` | DateTime picker |
| Time | `TimeTypeTypeTimeInput` | Time picker |
| Binary | `BinaryTypeInput` | File upload |
| Email | `StringTypeTextInput` | Email input (with validation) |
| Enumeration | `EnumerationTypeToggleButtonbar` | Toggle button group |
| Enumeration | `EnumerationTypeCombo` | Dropdown/combo box |
| Enumeration | `EnumerationTypeRadio` | Radio button group |

### Layout Visual Elements

These elements are used for page structure and layout:

| Element | Type Suffix | Description |
|---------|-------------|-------------|
| Divider | `DividerVisualElement` | Horizontal divider with optional label |
| Text Field | `TextFieldVisualElement` | Static text display |
| Placeholder | `PlaceholderVisualElement` | Empty space placeholder |
| Tab Bar | `TabBarVisualElement` | Tab container for grouped content |

```typescript
// Divider with label
divider: {
  id: "Actor/(esm/_xxx)/DividerVisualElement",
  label: "Birth data"
}

// Static text
textField: {
  id: "Actor/(esm/_xxx)/TextFieldVisualElement",
  label: "Hello"
}

// Placeholder (empty space)
placeholder: {
  id: "Actor/(esm/_xxx)/PlaceholderVisualElement",
  label: ""
}
```

### Tab Bar Component

Tab bars group related content into switchable tabs:

```typescript
tabBar: {
  _id: "Actor/(esm/_xxx)/TabBarVisualElement",
  _label: "TabBar",
  
  // Tab 1: Simple field
  firstName: {
    id: "Actor/(esm/_xxx)/StringTypeTextInput",
    label: "FirstName"
  },
  
  // Tab 2: Relation link
  topSkill: {
    id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedLink",
    label: "Top Skill"
  },
  
  // Tab 3: Embedded table
  skills: {
    _id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedTable",
    _label: "",
    // ... columns and actions
  },
  
  // Tab 4: Button to open relation page
  mentor: {
    id: "Actor/(esm/_xxx)/TabularReferenceFieldButton",
    label: "Mentor"
  },
  
  // Tab 5: Operation/action button
  action: {
    id: "Actor/(esm/_xxx)/OperationFormVisualElement",
    label: "push this button"
  }
}

### Relation Types

| Relation | Element Type Suffix | Description |
|----------|---------------------|-------------|
| Single (Link) | `TabularReferenceFieldRelationDefinedLink` | Single entity reference |
| Multiple (Table) | `TabularReferenceFieldRelationDefinedTable` | Embedded table for 1:N relations |
| Button | `TabularReferenceFieldButton` | Opens relation in new page |
| Tag/Chip | `TabularReferenceFieldRelationDefinedTable` | Relations displayed as chip/tag components |

### Relation Categories

Relations are categorized based on ownership and lifecycle:

| Category | Description | Available Actions |
|----------|-------------|-------------------|
| **Composition** | Parent owns children, cascade delete | Create, Delete, View, Edit |
| **Aggregation** | Parent references existing entities | Add, Remove, View |
| **Association** | Simple reference, no ownership | Set, Unset, View |
| **Derived** | Computed/read-only relations | Filter, Refresh, View (limited actions) |
| **Transient** | Temporary, non-persisted relations | Runtime only |

### Recursive/Self-Referential Relations

Some entities can have relations to the same entity type, creating hierarchical or tree structures:

```typescript
// Example: Argument entity with Pro and Con sub-arguments
argument: {
  _id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedTable",
  _label: "Pro Arguments",
  
  // Child arguments can have their own Pro/Con arguments
  proArguments: {
    _id: "Actor/(esm/_yyy)/TabularReferenceFieldRelationDefinedTable",
    _label: "Pro"
  },
  conArguments: {
    _id: "Actor/(esm/_zzz)/TabularReferenceFieldRelationDefinedTable", 
    _label: "Con"
  }
}
```

### Testing Recursive Relations

```typescript
test('Navigate recursive structure', async ({ page }) => {
  // Create top-level argument
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󰅂 createArgument' }),
    /.*~template$/
  );
  await page.getByRole('textbox', { name: 'Title' }).fill('Main Argument');
  await page.getByLabel('Type').click();
  await page.getByRole('option', { name: 'PRO' }).click();
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󰅂 Submit' }),
    /.*get$/
  );
  
  // View the created argument
  await page.getByRole('button', { name: '󰈈' }).first().click();
  
  // Create sub-argument within the parent
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󰅂 createArgument' }),
    /.*~template$/
  );
  await page.getByRole('textbox', { name: 'Title' }).fill('Counter Argument');
  await page.getByLabel('Type').click();
  await page.getByRole('option', { name: 'CON' }).click();
  await apiHelper.triggerAndWaitWithRegex(
    page,
    page.getByRole('button', { name: '󰅂 Submit' }),
    /.*get$/
  );
  
  // Verify nested structure
  await expect(page.getByText('Counter Argument')).toBeVisible();
});
```

### Derived Relations

Derived relations have limited action sets since they are computed:

```typescript
// Derived relation - note: no create, add, or clear actions
manyDerivedAggregationAssociation: {
  _id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedTable",
  pageActions: {
    filter: { id: "...", label: "Set Filters" },
    refresh: { id: "...", label: "Refresh" },
    bulkDelete: { id: "...", label: "Delete" }
    // No: create, add, clear, bulkRemove
  }
}
```

## Action Types

### Page Actions

Actions available at the page level:

| Action | Element Type Suffix | Purpose |
|--------|---------------------|---------|
| Back | `*BackButton` | Navigate back |
| Create | `*CreateButton` | Create new entity |
| Update | `*UpdateButton` | Save changes |
| Delete | `*DeleteButton` | Delete entity |
| Cancel | `*CancelButton` | Cancel editing |
| Refresh | `*RefreshButton` | Reload data |

### Table Actions

Actions available on data tables:

| Action | Element Type Suffix | Purpose |
|--------|---------------------|---------|
| Filter | `*FilterButton` | Open filter dialog |
| Refresh | `*RefreshButton` | Reload table data |
| Export | `*ExportButton` | Export data |
| Create | `*CreateButton` | Create new row |
| Add | `*AddSelectorButton` | Add existing entity |
| Set | `*SetSelectorButton` | Set single relation |
| Clear | `*ClearButton` | Clear selection |
| BulkRemove | `*BulkRemoveButton` | Remove selected |
| BulkDelete | `*BulkDeleteButton` | Delete selected |
| InlineCreate | `TabularReferenceTableInlineCreateButton` | Create row inline in table |

### Row Actions

Actions available per table row:

| Action | Element Type Suffix | Purpose |
|--------|---------------------|---------|
| View | `*RowViewButton` | View row details |
| Remove | `*RowRemoveButton` | Remove relation |
| Delete | `*RowDeleteButton` | Delete entity |

### Custom Operations

Custom operations defined in the model appear as action buttons:

| Element | Type Suffix | Description |
|---------|-------------|-------------|
| Operation Button | `OperationFormVisualElement` | Triggers a custom operation |
| Action Button | `ActionButtonVisualElement` | Standalone action button (Ok, Cancel) |
| Operation Call Button | `OperationFormCallButton` | Submit button for operation forms |

```typescript
// Operation button in a view page
action: {
  id: "Actor/(esm/_xxx)/OperationFormVisualElement",
  label: "Approve Skill"
}

// Standalone action buttons (e.g., Ok/Cancel in dialogs)
ok: {
  id: "Actor/(esm/_xxx)/ActionButtonVisualElement",
  label: "OK"
}
cancel: {
  id: "Actor/(esm/_xxx)/ActionButtonVisualElement", 
  label: "Cancel"
}

// Operation call/submit button with discriminator
submitButton: {
  id: "Actor/(esm/_xxx)/OperationFormCallButton/(discriminator/Actor/(esm/_yyy)/TransferObjectFormButtonGroup)",
  label: "Submit"
}
```

### Operation Forms with Input

Operations that require user input display a form before execution:

```typescript
// Operation form container
createArgument: {
  id: "Actor/(esm/_xxx)/OperationFormVisualElement",
  label: "CreateArgument"
}

// The operation form includes:
// - Input fields for operation parameters
// - A submit button (OperationFormCallButton)
// - Standard form validation
```

### Testing Operations with Input Forms

```typescript
test('Execute operation with input form', async ({ page }) => {
  // Trigger operation - waits for template to load
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󰅂 createArgument' }), 
    /.*~template$/  // Template pattern for input forms
  );
  
  // Fill operation input form
  await page.getByRole('textbox', { name: 'Title' }).fill('My Argument');
  await page.getByLabel('Type').click();
  await page.getByRole('option', { name: 'PRO' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill('Description text');
  
  // Submit operation and wait for response
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󰅂 Submit' }), 
    /.*get$/
  );
});
```

### Testing Direct Operations (No Input)

Operations without input forms execute immediately:

```typescript
test('Execute direct operations', async ({ page }) => {
  // VoteUp - no form, direct execution
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󰅂 voteUp' }), 
    /.*~get$/
  );
  
  // VoteDown
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󰅂 voteDown' }), 
    /.*~get$/
  );
  
  // Verify operation results via field values
  await expect(page.locator('input[name="voteUpCount"]')).toHaveValue('3');
  await expect(page.locator('input[name="voteDownCount"]')).toHaveValue('1');
});
```

### Table Row Operations

Operations can be defined at the table row level, appearing in a dropdown menu for each row. This allows calling custom operations on specific entities directly from the table.

```typescript
// Row operations in VisualElementIds
rowActions: {
  _id: "Actor/(esm/_xxx)/TransferObjectTableRowButtonGroup",
  _label: "Actions",
  view: {
    id: "Actor/(esm/_xxx)/TransferObjectTableRowViewButton",
    label: "View"
  },
  delete: {
    id: "Actor/(esm/_xxx)/TransferObjectTableRowDeleteButton",
    label: "Delete"
  },
  // Custom row operations
  createBouquet: {
    id: "Actor/(esm/_xxx)/OperationFormTableRowCallOperationButton/(discriminator/Actor/(esm/_yyy)/TransferObjectTable)",
    label: "CreateBouquet"
  },
  createBouquetPlan: {
    id: "Actor/(esm/_xxx)/OperationFormTableRowCallOperationButton/(discriminator/Actor/(esm/_yyy)/TransferObjectTable)",
    label: "CreateBouquetPlan"
  },
  decorateGarden: {
    id: "Actor/(esm/_xxx)/OperationFormTableRowCallOperationButton/(discriminator/Actor/(esm/_yyy)/TransferObjectTable)",
    label: "DecorateGarden"
  }
}
```

### Testing Row Operations

```typescript
test('Execute row operation from menu', async ({ page }) => {
  // Open row action menu (kebab menu icon)
  await page.getByRole('button', { name: '󰍝' }).click();
  
  // Click operation in dropdown menu
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('menuitem', { name: '󰅂 CreateBouquet' }), 
    /.*get$/
  );
  
  // Verify operation output
  await expect(page.getByLabel('Pretty')).toBeChecked();
  await expect(page.getByLabel('Decoration')).toHaveValue('ribbon');
});
```

### Embedded Table Actions

Tables embedded within view pages have their own action set:

| Action | Element Type Suffix | Purpose |
|--------|---------------------|---------|
| Filter | `TabularReferenceTableFilterButton` | Filter table data |
| Refresh | `TabularReferenceTableRefreshButton` | Reload table data |
| Export | `TabularReferenceTableExportButton` | Export table data |
| Create | `TabularReferenceTableCreateButton` | Create new entity |
| Add | `TabularReferenceTableAddSelectorOpenButton` | Open add selector |
| Clear | `TabularReferenceTableClearButton` | Clear all relations |
| BulkRemove | `TabularReferenceTableBulkRemoveButton` | Remove selected |
| BulkDelete | `TabularReferenceTableBulkDeleteButton` | Delete selected |
| View (row) | `TabularReferenceTableRowViewButton` | View row details |
| Remove (row) | `TabularReferenceTableRowRemoveButton` | Remove single row |
| Delete (row) | `TabularReferenceTableRowDeleteButton` | Delete single entity |

## Static/Menu Operations

Static operations (operations not bound to a specific entity) appear as menu buttons on the dashboard or navigation area.

### Operation Types by Input/Output

| Input Type | Output Type | Description |
|------------|-------------|-------------|
| None | None | Fire-and-forget operation |
| None | Mapped TO | Returns data to view |
| Unmapped TO | Mapped TO | Form input, returns view |
| Mapped TO | Mapped TO | Selector input, returns view |
| Entity | Entity | Entity input and output |

### Static Operation Element Types

```typescript
// Menu operation buttons
createRandomGardener: {
  id: "Actor/(esm/_xxx)/OperationMenuButton",
  label: "Create random gardener"
}
createRandomFlower: {
  id: "Actor/(esm/_xxx)/OperationMenuButton",
  label: "Create random flower"
}
createStaticGarden: {
  id: "Actor/(esm/_xxx)/OperationMenuButton",
  label: "Create static garden"
}
```

### Testing Static Operations

```typescript
test('Operation without input and output', async ({ page }) => {
  await apiHelper.gotoWithWait(page);
  
  // Trigger operation and verify HTTP 204 (no content)
  const [response] = await Promise.all([
    page.waitForResponse(resp => /.*createRandomGardener$/.test(resp.url())),
    page.getByRole('button', { name: '󰳒 Create random gardener' }).click(),
  ]);
  expect(response.status()).toBe(204);
});

test('Operation with mapped output (no input)', async ({ page }) => {
  await apiHelper.gotoWithWait(page);
  
  // Trigger operation, wait for result
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󰉊 Create random flower' }), 
    /.*get$/
  );
  
  // Verify output form is displayed
  await expect(page.getByLabel('Type')).toHaveValue('Rose');
  await expect(page.getByLabel('Colour')).toHaveValue('white static op');
});

test('Operation with unmapped input and mapped output', async ({ page }) => {
  const address = 'Test Street';
  
  await apiHelper.gotoWithWait(page);
  
  // Trigger operation to open input form
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󰳑 Create static garden' }), 
    /.*template$/
  );
  
  // Fill input form
  await page.getByRole('tab', { name: 'ATTRIBUTES' }).click();
  await page.getByLabel('Address').fill(address);
  
  // Submit and verify output
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByLabel('Address')).toHaveValue(address);
});

test('Operation with mapped input and mapped output', async ({ page }) => {
  // Trigger operation to open selector
  await page.getByRole('button', { name: '󱨟 Create static gardener' }).click();
  
  // Select input entity from table
  await page.getByRole('row', { name: 'Select row John' })
    .getByLabel('Select row').check();
  await page.getByRole('button', { name: '󱓞 Submit' }).click();
  
  // Verify transformed output
  await expect(page.getByLabel('Name')).toHaveValue('John Static Op');
});
```

## Operations with Selector Input

Some operations require selecting an existing entity as input. These open a table selector modal.

### Operation with Entity Selector

```typescript
test('Operation with entity selector input', async ({ page }) => {
  // Trigger operation to open selector
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󰅂 mownTheLawn' }), 
    /.*range$/  // 'range' endpoint loads available options
  );
  
  // Filter and select entity
  await openAddAndApplyFilters(page, apiHelper, [
    { attributeName: 'string', option: 'Like', value: 'Garden Name', type: 'text' },
  ]);
  
  await page.getByRole('gridcell', { name: 'Garden Name' }).click();
  
  // Submit selection
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󱓞 Submit' }), 
    /.*get$/
  );
  
  // Verify operation result
  await expect(page.getByText('Freshly Mowed')).toBeChecked();
});
```

### Selector Button Pattern

```typescript
// Operation selector call buttons
gardenInfoViewRELATIONSFlowersChangeTypeCallOperation: {
  id: "Actor/(esm/_xxx)/OperationFormMappedInputCallOperationSelectorCallOperationButton",
  label: "Submit"
}
```

## Operations with Confirmation Dialog

Some operations display a confirmation dialog before execution.

### Testing Conditional Dialogs

```typescript
test('Operation with conditional confirmation (condition true)', async ({ page }) => {
  // Trigger operation
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: 'GrowFlowers' }), 
    /.*range$/
  );
  
  // Select input
  await page.getByRole('gridcell', { name: gardenName }).click();
  
  // Submit triggers confirmation
  await page.getByRole('button', { name: '󱓞 Submit' }).click();
  
  // Confirm dialog appears - click Yes
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: 'Yes' }), 
    /.*get$/
  );
});

test('Operation with conditional confirmation (condition false)', async ({ page }) => {
  // Different test data that doesn't trigger confirmation
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: 'GrowFlowers' }), 
    /.*range$/
  );
  
  await page.getByRole('gridcell', { name: gardenName }).click();
  
  // Submit executes directly without confirmation
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󱓞 Submit' }), 
    /.*get$/
  );
});
```

## Inline Edit Tables

Tables can be configured for inline editing, allowing users to create and edit rows directly in the table without opening a separate form.

### Inline Create Button

```typescript
// Inline create structure in VisualElementIds
manyAggregationCompostion: {
  _id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedTable",
  inlineCreate: {
    id: "Actor/(esm/_xxx)/TabularReferenceTableInlineCreateButton",
    label: "Create"
  },
  // ... columns and other actions
}
```

### Testing Inline Edit

```typescript
import { EntityName_View_Edit } from '../helpers/visualElementIds/VisualElementIds';

test('Create and edit row inline', async ({ page }) => {
  const tableLocator = page.getByTestId(EntityName_View_Edit.relatedItems._id).first();
  
  // Click inline create button
  await page.getByRole('button', { name: '󰩵 Create' }).first().click();
  
  // Helper to get cell input for inline editing
  const getGridCellInput = (locator: Locator, row: number, cellName: string) => {
    return tableHelper.getCellInput(tableHelper.getRow(locator, row), cellName);
  };
  
  // Fill inline fields
  await getGridCellInput(tableLocator, 1, "name").fill('New Item');
  await getGridCellInput(tableLocator, 1, "dateAttr").fill('2025-12-10');
  await getGridCellInput(tableLocator, 1, "doubleAttr").fill('3.14');
  
  // Save inline edits (triggers validation)
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    tableLocator.getByLabel('Save'), 
    /.*validate$/
  );
});
```

### Inline Edit Field Types

When a table supports inline editing, fields render as editable inputs:

| Field Type | Inline Input |
|------------|--------------|
| String | Text input |
| Date | Date picker input |
| Double/Numeric | Number input |
| Email | Email input |
| Enumeration | Dropdown select |
| Boolean | Checkbox |

## Embedded Table Row Operations

Operations can be attached to rows within embedded tables on view/edit pages. These enable context-specific actions on related entities.

### Row Operation in Embedded Table

```typescript
// Row operations in embedded table
flowers: {
  _id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedTable",
  _label: "Flowers",
  rowActions: {
    _id: "Actor/(esm/_xxx)/TabularReferenceTableRowButtonGroup",
    view: { id: "...", label: "View" },
    remove: { id: "...", label: "Remove" },
    // Custom row operations
    changeColor: {
      id: "Actor/(esm/_xxx)/OperationFormTableRowCallOperationButton/(discriminator/Actor/(esm/_yyy)/TabularReferenceFieldRelationDefinedTable)",
      label: "Change Color"
    },
    changeType: {
      id: "Actor/(esm/_xxx)/OperationFormTableRowCallOperationButton/(discriminator/Actor/(esm/_yyy)/TabularReferenceFieldRelationDefinedTable)",
      label: "Change Type"
    }
  }
}
```

### Testing Embedded Table Row Operations

```typescript
import { GardenInfoView } from '../helpers/visualElementIds/VisualElementIds';

test('Call operation on embedded table row', async ({ page }) => {
  const flowersTable = page.getByTestId(GardenInfoView.flowers._id);
  
  // Open row action menu for first row
  await page.getByRole('button', { name: '󰍝' }).first().click();
  
  // Click Change Color operation
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByText('Change Color'), 
    /.*template$/
  );
  
  // Fill operation input form
  await page.getByLabel('Colour *').fill('green');
  
  // Submit operation
  await apiHelper.triggerAndWaitWithRegex(
    page, 
    page.getByRole('button', { name: '󰏘 Submit' }), 
    /.*get$/
  );
  
  // Verify table row updated
  const firstRow = tableHelper.getRow(flowersTable, 1);
  expect(tableHelper.getCell(firstRow, 'colour')).toContainText('green');
});
```

### Same Operation on Multiple Relations

An operation can be defined once but used on multiple relation tables with different discriminators:

```typescript
// Same operation on different relations
redFlowers: {
  rowActions: {
    changeColor: {
      id: "Actor/(esm/_xxx)/OperationFormTableRowCallOperationButton/(discriminator/Actor/(esm/_aaa)/TabularReferenceFieldRelationDefinedTable)",
      label: "Change Color"
    }
  }
},
flowers: {
  rowActions: {
    changeColor: {
      id: "Actor/(esm/_xxx)/OperationFormTableRowCallOperationButton/(discriminator/Actor/(esm/_bbb)/TabularReferenceFieldRelationDefinedTable)",
      label: "Change Color"
    }
  }
}
```

## Tag/Chip Components

Relations can be displayed as tag/chip components instead of tables. This is useful for displaying many-to-many relations in a compact form.

### Tag Component Structure

Tag components use the same base ID as tables but render differently:

```typescript
// Tag-based relation (rendered as chips, not table rows)
manyAggregationCompostion: {
  _id: "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedTable",
  _label: "Many Aggregation Compostion",
  
  pageActions: {
    clear: { id: "...", label: "Clear" }
  }
}
```

### Testing Tag Components

```typescript
import { EntityName_View_Edit } from '../helpers/visualElementIds/VisualElementIds';

test('Interact with tag components', async ({ page }) => {
  const tagContainer = page.getByTestId(EntityName_View_Edit.tags._id).first();
  
  // Remove a specific tag by clicking its X icon
  await tagContainer
    .getByRole('button', { name: 'Tag Name', exact: true })
    .locator('> svg')
    .click();
  
  // Add a tag via autocomplete
  const inputLocator = tagContainer.locator('input');
  await Promise.all([
    page.waitForResponse(/.*range$/),
    inputLocator.fill('Search Term')
  ]);
  await page.getByRole('option', { name: 'Option Name' }).click();
  
  // Clear all tags
  await tagContainer.getByRole('button', { name: '󰅖' }).click();
});
```

### Tag vs Table Display

| Aspect | Table Display | Tag Display |
|--------|---------------|-------------|
| Visual | Grid with columns | Horizontal chip list |
| Selection | Row selection | Click to remove |
| Adding | Add button → modal | Autocomplete input |
| Bulk actions | Toolbar buttons | Clear all button |
| Best for | Many fields per item | Simple references |

## Selected Target Pattern

When setting a single relation (1:1 or N:1), a "Set" selector opens a table to choose the target entity.

### Testing Selected Target

```typescript
test('Set single relation target', async ({ page }) => {
  // Click set button to open target selector
  await page.getByTestId(EntityName_View_Edit.singleRelation.id).click();
  
  // Or use the set action from pageActions
  await page.getByTestId(EntityName_View_Edit.relation.pageActions.set.id).click();
  
  // Select from table in modal
  await tableHelper.getCell(tableHelper.getRow(selectorTable, 1), "name").click();
  
  // Confirm selection
  await page.getByRole('button', { name: 'Set' }).click();
});
```

## Single Relation Link Actions

Single relations displayed as links (`TabularReferenceFieldRelationDefinedLink`) have a dropdown menu with multiple actions:

### Link Dropdown Menu

```typescript
// Access the link component
const linkLocator = page.getByTestId(EntityName_View_Edit.lid.id).first();

// Open dropdown menu
await linkLocator.getByRole('button', { name: '󰅀' }).click();

// Available menu actions:
// - Open selector dialog (󰌷)
await page.getByRole('menuitem', { name: '󰌷 Open selector dialog' }).click();

// - Unset element (󰌸)  
await page.getByRole('menuitem', { name: '󰌸 Unset element' }).click();

// - Delete element (󰗨)
await page.getByRole('menuitem', { name: '󰗨 Delete element' }).click();
```

### Link Direct Actions

```typescript
// View the linked entity (eye icon)
await linkLocator.getByRole('button', { name: '󰈈' }).click();

// Set via selector (link icon)
await linkLocator.getByRole('button', { name: '󰌷' }).click();

// Create new entity inline
await linkLocator.getByRole('button', { name: '󱪝' }).click();
```

### Testing Single Relation CRUD

```typescript
import { BoxSingleRelationsView } from '../helpers/visualElementIds/VisualElementIds';

test('Test single relation operations', async ({ page }) => {
  const lidLocator = page.getByTestId(BoxSingleRelationsView.lid.id).first();
  
  // Set relation via selector
  await lidLocator.getByRole('button', { name: '󰌷' }).click();
  await page.getByRole('row', { name: 'Select row Gray tiny' })
    .getByLabel('Select row').check();
  await page.getByRole('button', { name: '󱫄 Set' }).click();
  await page.getByRole('button', { name: '󰆓 Update' }).click();
  
  // Verify value is set
  await expect(page.getByRole('combobox', { name: 'Lid' })).toHaveValue('Gray');
  
  // Unset the relation
  await lidLocator.getByRole('button', { name: '󰅀' }).click();
  await page.getByRole('menuitem', { name: '󰌸 Unset element' }).click();
  
  // Verify empty
  await expect(page.getByRole('combobox', { name: 'Lid' })).toBeEmpty();
});
```

## Association Table Pattern

Inline association tables allow adding existing entities to a relation without creating new ones.

### Testing Association Tables

```typescript
test('Add existing entity to association', async ({ page }) => {
  const tableLocator = page.getByTestId(EntityName_View_Edit.associations._id);
  
  // Click add button to open selector
  await page.getByTestId(EntityName_View_Edit.associations.pageActions.add.id).click();
  
  // Select entities in the modal table
  await tableHelper.getRowCheckbox(selectorTable, 1).click();
  await tableHelper.getRowCheckbox(selectorTable, 2).click();
  
  // Confirm selection
  await page.getByRole('button', { name: 'Add' }).click();
  
  // Verify entities appear in the association table
  await expect(tableLocator).toContainText('Entity 1');
  await expect(tableLocator).toContainText('Entity 2');
});
```

## Using VisualElementIds in Tests

### Import the Constants

```typescript
import { 
  EntityName_Form,
  EntityName_Table,
  EntityName_View_Edit 
} from '../helpers/visualElementIds/VisualElementIds';
```

### Selecting Elements by data-testid

The frontend renders elements with `data-testid` attributes matching the IDs:

```typescript
// Select a form container
const form = page.getByTestId(EntityName_Form._id);

// Select a specific field
const nameField = page.getByTestId(EntityName_Form.name.id);

// Select a button
const createBtn = page.getByTestId(EntityName_Form.pageActions.create.id);
```

### Example: Testing Form Validation

```typescript
import { ReadOnlyTestSpaceShipTransferSpaceShipTransfer_Form } from '../helpers/visualElementIds/VisualElementIds';

test('Test min and max range of numeric values', async ({ page }) => {
  const Space_Ship_Transfer_Form = ReadOnlyTestSpaceShipTransferSpaceShipTransfer_Form;
  
  // Fill field with invalid value
  await page.getByLabel('Diameter').fill('1');
  
  // Check validation message appears in the field container
  await expect(page.getByTestId(Space_Ship_Transfer_Form.lenght.id))
    .toContainText('The value must be at least (5).');
});
```

### Example: Working with Tables

```typescript
import { EntityName_Table } from '../helpers/visualElementIds/VisualElementIds';

test('Filter and verify table data', async ({ page }) => {
  // Click filter button
  await page.getByTestId(EntityName_Table.entityName_Table.tableActions.filter.id).click();
  
  // Apply filter...
  
  // Click row view action (using TableHelper for MUI DataGrid)
  const row = tableHelper.getRow(page, 1);
  await tableHelper.getCell(row, "name").click();
});
```

## Naming Conventions

The VisualElementIds export names follow this pattern:

```
{FeatureGroup}{TransferObjectName}{TransferObjectName}_{PageType}
```

**Examples:**
- `BinaryTypeTestGalaxyDocumentTransferGalaxyDocumentTransfer_Form`
- `ReadOnlyTestSpaceShipTransferSpaceShipTransfer_View_Edit`
- `ViewAstronomerTransferObject_Table`
- `GodDashboard` (special case for dashboards)

**Page Types:**
- `_Form` - Create form page
- `_Table` - List/table page
- `_View_Edit` or `_View` - View/edit page

## Relation Discriminators

Table columns and filters within embedded tables include discriminators to uniquely identify them:

```
Actor/(esm/_columnId)/TableColumn/(discriminator/Actor/(esm/_tableId)/TabularReferenceFieldRelationDefinedTable)
```

This ensures columns in different embedded tables can be uniquely identified even if they have the same field name.

## Best Practices

1. **Import only what you need**: Import specific page constants rather than the entire file
2. **Use constants for reliability**: Always prefer `getByTestId()` with constants over text-based selectors
3. **Handle optional elements**: Check if elements exist before interacting with them
4. **Combine with TableHelper**: Use `TableHelper` for MUI DataGrid interactions along with IDs for actions
5. **Use ApiHelper for synchronization**: Wait for API calls to complete after button clicks

## See Also

- [Writing Tests](./writing-tests.md) - Complete guide to writing E2E tests
- [Helpers Reference](./helpers-reference.md) - TableHelper and ApiHelper documentation
- [Testing Patterns](./testing-patterns.md) - Common testing patterns
