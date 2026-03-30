# Language-Independent E2E Testing

## Overview

When testing JUDO applications with internationalized (i18n) interfaces, tests should avoid relying on translated text labels. This ensures tests work across all locales without modification.

**Key Principle**: Prefer `data-testid`, `href` patterns, and other structural selectors over i18n labels.

## Authentication with Keycloak

When an Actor has a **principal** (authenticated user), the application requires login through Keycloak. Configure authentication using Playwright's setup projects.

### Project Configuration

```typescript
// playwright.config.ts
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

export default defineConfig({
  projects: [
    // Setup project - runs first, handles authentication
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],  // Depends on auth setup
      use: {
        storageState: authFile,  // Reuse saved session
      },
    },
  ],
});
```

### Authentication Setup File

Create `tests/auth.setup.ts`:

```typescript
import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Go to the app - will redirect to Keycloak login
  await page.goto("/");

  // Wait for Keycloak login page using language-independent id selector
  await expect(page.locator("#kc-form-login")).toBeVisible({ timeout: 10000 });

  // Fill in credentials using Keycloak's standard input ids (language-independent)
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");

  // Click sign in using Keycloak's standard button id (language-independent)
  await page.locator("#kc-login").click();

  // Wait for redirect back to app
  await expect(page).toHaveTitle(/{{ lowerCase model.name \}}/i, { timeout: 30000 });

  // Save authentication state for other tests
  await page.context().storageState({ path: authFile });
});
```

### Keycloak Standard Element IDs

Keycloak uses consistent element IDs across all themes and languages:

| Element | ID Selector | Description |
|---------|-------------|-------------|
| Login Form | `#kc-form-login` | The main login form container |
| Username | `#username` | Username/email input field |
| Password | `#password` | Password input field |
| Login Button | `#kc-login` | Submit/Sign In button |
| Registration Link | `#kc-registration` | Link to registration page |
| Forgot Password | `#kc-forgot-password` | Forgot password link |

These IDs are stable and language-independent, making them reliable for E2E tests.

### Directory Structure

```
playwright/
├── .auth/
│   └── user.json          # Generated auth state (gitignored)
├── tests/
│   ├── auth.setup.ts      # Authentication setup
│   └── *.spec.ts          # Test files (use saved auth)
└── playwright.config.ts
```

Add to `.gitignore`:
```
.auth/
```

## Language-Independent Selectors

### 1. Menu Navigation via href Pattern

Instead of matching translated menu text, use the `href` attribute:

```typescript
// BAD - Depends on locale
await page.getByRole("link", { name: "Administration" }).click();
await page.getByRole("link", { name: "ADMINISZTRÁCIÓ" }).click();

// GOOD - Language-independent href pattern
const adminLink = page.locator('a[href*="/Service/Actor/Administration/"]');
await adminLink.click();
```

**href patterns by menu type**:
- Administration: `/Service/Actor/Administration/`
- Dashboard: `/Service/Actor/Dashboard/`
- Access pages: `/Service/Actor/{PageName}/`

### 2. Tab Navigation via data-testid

Tabs have model-generated testids that are language-independent:

```typescript
// BAD - Depends on locale
await page.getByRole("tab", { name: "Campaigns" }).click();
await page.getByRole("tab", { name: "Kampányok" }).click();

// GOOD - Use testid from ESM model
const CAMPAIGNS_TAB = "Actor/(esm/_5py-ULdkEfCCLY_eLVuHZA)/GroupTab-tab";
await page.getByTestId(CAMPAIGNS_TAB).click();
```

### 3. Common Tab Testid Patterns

Tab testids follow this pattern: `Actor/(esm/_<ESM_ID>)/GroupTab-tab`

Example testids (specific to this project):
```typescript
// Top-level tabs
const CAMPAIGNS_TAB = "Actor/(esm/_5py-ULdkEfCCLY_eLVuHZA)/GroupTab-tab";
const ADDRESSES_TAB = "Actor/(esm/_sgp90LdkEfCCLY_eLVuHZA)/GroupTab-tab";
const USERS_TAB = "Actor/(esm/_nXB48LdhEfCCLY_eLVuHZA)/GroupTab-tab";

// Geographical units sub-tabs
const COUNTIES_TAB = "Actor/(esm/_7DmxQLdhEfCCLY_eLVuHZA)/GroupTab-tab";
const SETTLEMENTS_TAB = "Actor/(esm/__AzmoLdhEfCCLY_eLVuHZA)/GroupTab-tab";

// Campaign event sub-tabs
const ADDRESS_EVENTS_TAB = "Actor/(esm/_APPy4LdmEfCCLY_eLVuHZA)/GroupTab-tab";
const CANVASSING_EVENTS_TAB = "Actor/(esm/_Kx4rMLdmEfCCLY_eLVuHZA)/GroupTab-tab";
```

### 4. View/Page Container Testids

Use `TransferObjectViewVisualElement` (not `PageContainer`):

```typescript
// The main view element testid pattern
const ADMIN_VIEW_ELEMENT = "Actor/(esm/_o4nL0LcyEfCE0JrRXgRyVA)/TransferObjectViewVisualElement";

await expect(page.getByTestId(ADMIN_VIEW_ELEMENT)).toBeVisible();
```

### 5. Generated VisualElementIds

Import from the generated helpers:

```typescript
import { 
  ServiceAdmininstrationAdmininstration_View_Edit,
  ServiceAddressAddressViewEdit 
} from "../helpers/visualElementIds/VisualElementIds";

// Use for tables
const addressesTable = page.getByTestId(
  ServiceAdmininstrationAdmininstration_View_Edit.administrationTabBar.addresses._id
).first();

// Use for form fields
await expect(page.getByTestId(ServiceAddressAddressViewEdit.fullAddress.id)).toBeVisible();

// Use for action buttons
const filterButton = page.getByTestId(
  ServiceAdmininstrationAdmininstration_View_Edit.administrationTabBar.addresses.pageActions.filter.id
);
```

### 6. Handling Duplicate Testids

Some elements (especially tables in nested layouts) may have duplicate testids. Use `.first()`:

```typescript
// BAD - Strict mode violation if testid appears twice
await expect(page.getByTestId(tableId)).toBeVisible();

// GOOD - Explicitly select first match
await expect(page.getByTestId(tableId).first()).toBeVisible();
```

## When i18n Labels Are Unavoidable

Some cases require matching translated text:

### Column Headers

Column headers don't have testids. Match the actual locale text:

```typescript
// Hungarian column headers
await expect(
  page.locator('[role="columnheader"]').filter({ hasText: "Teljes cím" }).first()
).toBeVisible();

await expect(
  page.locator('[role="columnheader"]').filter({ hasText: "Település név" }).first()
).toBeVisible();
```

### Fallback: Regex for Multiple Locales

Use regex to match either English or target locale:

```typescript
// Match either English or Hungarian
await page.getByRole("tab", { name: /Settlements|Települések/i }).click();
await page.getByRole("tab", { name: /Users|Felhasználók/i }).click();
```

## Complete Navigation Example

```typescript
import { test, expect } from "@playwright/test";
import { ApiHelper } from "../helpers/ApiHelper";
import { ServiceAdmininstrationAdmininstration_View_Edit } from "../helpers/visualElementIds/VisualElementIds";

const apiHelper = new ApiHelper();

// Language-independent testids
const ADMIN_VIEW_ELEMENT = "Actor/(esm/_o4nL0LcyEfCE0JrRXgRyVA)/TransferObjectViewVisualElement";
const ADDRESSES_TAB = "Actor/(esm/_sgp90LdkEfCCLY_eLVuHZA)/GroupTab-tab";

async function navigateToAddresses(page: any) {
  // Step 1: Click Administration menu via href pattern
  const adminLink = page.locator('a[href*="/Service/Actor/Administration/"]');
  await Promise.all([
    page.waitForResponse((resp: any) => 
      resp.url().includes("/api/") && resp.status() === 200
    ),
    adminLink.click()
  ]);
  
  // Step 2: Wait for view to load
  await expect(page.getByTestId(ADMIN_VIEW_ELEMENT)).toBeVisible({ timeout: 15000 });
  
  // Step 3: Click tab via testid
  await page.getByTestId(ADDRESSES_TAB).click();
  
  // Step 4: Wait for table with .first() for duplicate testids
  await expect(
    page.getByTestId(
      ServiceAdmininstrationAdmininstration_View_Edit.administrationTabBar.addresses._id
    ).first()
  ).toBeVisible();
}

test("should navigate to addresses", async ({ page }) => {
  await apiHelper.gotoWithWait(page, "/");
  await navigateToAddresses(page);
  
  // Assert table is visible
  const table = page.getByTestId(
    ServiceAdmininstrationAdmininstration_View_Edit.administrationTabBar.addresses._id
  ).first();
  await expect(table).toBeVisible();
});
```

## Nested Tab Navigation

For pages with nested tabs (e.g., Campaigns > AddressEvents):

```typescript
const CAMPAIGNS_TAB = "Actor/(esm/_5py-ULdkEfCCLY_eLVuHZA)/GroupTab-tab";
const ADDRESS_EVENTS_TAB = "Actor/(esm/_APPy4LdmEfCCLY_eLVuHZA)/GroupTab-tab";

async function navigateToAddressEvents(page: any) {
  // Navigate to Administration
  const adminLink = page.locator('a[href*="/Service/Actor/Administration/"]');
  await Promise.all([
    page.waitForResponse((resp: any) => 
      resp.url().includes("/api/") && resp.status() === 200
    ),
    adminLink.click()
  ]);
  await expect(page.getByTestId(ADMIN_VIEW_ELEMENT)).toBeVisible({ timeout: 15000 });
  
  // Click parent tab first
  await page.getByTestId(CAMPAIGNS_TAB).click();
  
  // Then click nested tab
  await page.getByTestId(ADDRESS_EVENTS_TAB).click();
  
  // Wait for nested table
  await expect(
    page.getByTestId(
      ServiceAdmininstrationAdmininstration_View_Edit
        .administrationTabBar.campaignsTabBar.addressEvents._id
    ).first()
  ).toBeVisible();
}
```

## Discovering Testids

Use debug tests to discover actual testids on a page:

```typescript
test("debug - discover testids", async ({ page }) => {
  await apiHelper.gotoWithWait(page, "/");
  
  // Navigate to the page you want to inspect
  const adminLink = page.locator('a[href*="/Service/Actor/Administration/"]');
  await adminLink.click();
  await page.waitForTimeout(3000);
  
  // Find all elements with data-testid
  const elementsWithTestId = await page.locator("[data-testid]").all();
  
  for (const element of elementsWithTestId) {
    const testid = await element.getAttribute("data-testid");
    const tagName = await element.evaluate((el) => el.tagName);
    console.log(`${tagName}: ${testid}`);
  }
});
```

## CRUD Flags and UI Element Visibility

Relation tables in JUDO have CRUD flags (Create, Read, Update, Delete) that control which UI elements are available. When writing tests, consider these flags to avoid testing for buttons that don't exist.

### CRUD Flag Effects on UI

| Flag | Effect | UI Elements Present |
|------|--------|---------------------|
| **C** (Create) | Can create new entities | Create button visible |
| **R** (Read) | Can view entities | Table/view visible, View button on rows |
| **U** (Update) | Can modify entities | Edit fields enabled, Attach/Detach buttons for associations |
| **D** (Delete) | Can delete entities | Delete button visible on rows |

### Testing Based on CRUD Flags

**Before writing tests**, check the model's CRUD flags for the relation:

```typescript
// For a relation with full CRUD (isCreateAllowed, isUpdateAllowed, isDeleteAllowed)
test.describe("Entity with full CRUD", () => {
  test("should have create button", async ({ page }) => {
    // Only test if C flag is enabled
    await expect(createButton).toBeVisible();
  });

  test("should have delete button on rows", async ({ page }) => {
    // Only test if D flag is enabled
    await expect(deleteButton).toBeVisible();
  });

  test("should allow editing fields", async ({ page }) => {
    // Only test if U flag is enabled
    await expect(field).toBeEditable();
  });
});

// For a read-only relation (only R flag)
test.describe("Read-only Entity", () => {
  test("should display table", async ({ page }) => {
    await expect(table).toBeVisible();
  });

  // DON'T test for create/delete buttons - they won't exist!
});
```

### Common Patterns by CRUD Configuration

**Full CRUD (CRU D)** - All operations available:
```typescript
// Test create, view, edit, delete
await expect(page.getByTestId(table.pageActions.create.id)).toBeVisible();
await expect(page.getByTestId(table.pageActions.delete.id)).toBeVisible();
```

**Read-only (R)** - View only, no modifications:
```typescript
// Only test viewing - no create/update/delete buttons exist
await expect(table).toBeVisible();
await expect(page.getByTestId(table.pageActions.filter.id)).toBeVisible();
await expect(page.getByTestId(table.pageActions.refresh.id)).toBeVisible();
// Skip: create, delete, edit tests
```

**Create and Read (CR)** - Can add but not modify or delete:
```typescript
await expect(page.getByTestId(table.pageActions.create.id)).toBeVisible();
// Skip: delete, edit tests
```

**Read and Update (RU)** - Can view and modify but not create/delete:
```typescript
// Fields are editable, attach/detach available for associations
await expect(field).toBeEditable();
await expect(attachButton).toBeVisible();
await expect(detachButton).toBeVisible();
// Skip: create, delete tests
```

### Association Attach/Detach (Update Flag)

When the **U** (Update) flag is enabled for a relation, association management is available:

```typescript
// Attach/Detach buttons only visible when U flag is active
test("should have attach button for association", async ({ page }) => {
  const attachButton = page.getByTestId(relation.pageActions.attach.id);
  await expect(attachButton).toBeVisible();
});

test("should have detach button for association", async ({ page }) => {
  const detachButton = page.getByTestId(relation.pageActions.detach.id);
  await expect(detachButton).toBeVisible();
});
```

### Parent Flags Affect Navigated Child

When navigating from a grid row, tag, or single relation link to view a child element, the **parent relation's U (Update) and D (Delete) flags** determine which operations are available on the navigated page:

| Parent Flag | Child Page Behavior |
|-------------|---------------------|
| `U=true` | Edit fields, Attach/Detach, Update button available |
| `U=false` | View-only mode - no editing regardless of child's own flags |
| `D=true` | Delete button visible on navigated element |
| `D=false` | No delete option regardless of child's own flags |

**Testing Implications:**

```typescript
// If parent relation has updateable=false, navigated child is read-only
test.describe("Navigation from read-only parent", () => {
  test("should navigate to child in view-only mode", async ({ page }) => {
    // Navigate to child via grid row
    await viewButton.click();
    
    // Child fields should NOT be editable (parent U=false)
    const nameField = page.getByTestId(childView.name.id);
    await expect(nameField).toBeDisabled();  // or check for read-only state
  });

  // DON'T test for edit/save/delete buttons - they won't be functional
});

// If parent relation has updateable=true, deleteable=true
test.describe("Navigation from updatable parent", () => {
  test("should navigate to child with edit capability", async ({ page }) => {
    await viewButton.click();
    
    // Child fields should be editable (parent U=true)
    const nameField = page.getByTestId(childView.name.id);
    await expect(nameField).toBeEditable();
  });

  test("should have delete button", async ({ page }) => {
    await viewButton.click();
    
    // Delete button visible (parent D=true)
    await expect(page.getByRole("button", { name: /Delete/i })).toBeVisible();
  });
});
```

**Navigation Sources Affected:**
- Grid/Table row view button click
- Tag component click  
- Single relation link click

### Runtime Override via JSON (`__updateable`, `__deleteable`)

Even when model flags are `true`, the backend can disable operations for specific records using JSON attributes:

| JSON Attribute | Effect |
|----------------|--------|
| `__updateable: false` | Disables edit capability for this specific record |
| `__deleteable: false` | Hides delete button for this specific record |

**Testing Implications:**

When testing with specific data, be aware that some records may have these flags set dynamically:

```typescript
test("should handle record with disabled update", async ({ page }) => {
  // Navigate to a record that has __updateable: false in API response
  await viewButton.click();
  
  // Even though parent relation has U=true, this specific record is read-only
  const nameField = page.getByTestId(view.name.id);
  await expect(nameField).toBeDisabled();
});

test("should handle record with disabled delete", async ({ page }) => {
  // Navigate to a record that has __deleteable: false in API response
  await viewButton.click();
  
  // Delete button should NOT be visible for this record
  await expect(page.getByRole("button", { name: /Delete/i })).not.toBeVisible();
});
```

**Precedence:**
1. Model relation flag `false` → operation always disabled
2. Model flag `true` + `__updateable`/`__deleteable: false` → disabled for that record
3. Model flag `true` + JSON flag `true` or absent → operation enabled

### Example: Conditional Test Based on CRUD

```typescript
test.describe("Public Space Types (Read-Only)", () => {
  // This relation only has R flag - no create/delete operations
  
  test("should display table", async ({ page }) => {
    await expect(publicSpaceTypesTable).toBeVisible();
  });

  test("should have filter functionality", async ({ page }) => {
    await expect(filterButton).toBeVisible();
  });

  // No create/delete tests - buttons don't exist for read-only relations
});

test.describe("Addresses (Full CRUD)", () => {
  // This relation has CRUD flags - all operations available
  
  test("should have create button", async ({ page }) => {
    await expect(createButton).toBeVisible();
  });

  test("should have delete action on rows", async ({ page }) => {
    await expect(deleteButton).toBeVisible();
  });
});
```

## Summary: Selector Priority

1. **Best**: Generated `VisualElementIds` from helpers
2. **Good**: `href` patterns for menu links
3. **Good**: Model-based tab testids (`Actor/(esm/_...)/GroupTab-tab`)
4. **Acceptable**: Role selectors with regex for multiple locales
5. **Last resort**: Hardcoded i18n text (document which locale)

Always add `.first()` when selecting elements that might have duplicate testids in nested UI structures.
