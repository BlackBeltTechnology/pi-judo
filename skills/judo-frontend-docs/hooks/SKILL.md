---
name: judo-frontend-hooks-docs
description: Frontend hook system documentation. Covers data, UI, table, action, navigation, and validation hooks.
disable-model-invocation: false
user-invocable: false
agent: general-purpose
---

# Hook System Overview

## Introduction

The JUDO frontend uses a **hook-based customization system** that allows you to extend and modify generated behavior without editing generated code. Hooks are registered through the central `application-customizer.tsx` file and use the **Pandino** dependency injection framework.

## Core Concepts

### What Are Hooks?

Hooks are **customization points** in the generated code where you can inject your own logic. They allow you to:

- Modify component behavior
- Add custom UI elements
- Filter and transform data
- Control navigation
- Customize validation
- Override default operations

### Why Hooks?

**Benefits:**
- ✅ **No generated code edits** - All customizations in `src/custom/`
- ✅ **Upgrade-safe** - Regeneration doesn't break customizations
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Modular** - Each hook handles specific functionality
- ✅ **Maintainable** - Clear separation of concerns

**Alternative (Not Recommended):**
- ❌ Edit generated files → Build fails on checksum mismatch
- ❌ Add to `.generator-ignore` → Lose generator updates
- ❌ Template overrides → Complex to maintain

## Hook Architecture

### Pandino Service Registration

All hooks register through the **Pandino** dependency injection framework:

```typescript
// src/custom/application-customizer.tsx
import {
  ApplicationCustomizer,
  BundleContext,
  TableRowHighlightingHook,
  TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY
} from '~/generated';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Register hook with interface key
    context.registerService<TableRowHighlightingHook>(
      TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
      myHighlightingHook,
      { component: 'ServiceCanvassingEventsTable' }
    );
  }
}
```

### Key Components

**Interface Keys:**
- String identifiers for each customizable feature
- Example: `TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY`
- Exported from `~/generated`

**Service Properties:**
- Configuration objects: `{ component, column, page }`
- Filter which components the hook applies to
- Example: `{ component: 'ServiceCampaignForm', column: 'name' }`

**Hook Implementation:**
- Must be React hooks for DI support
- Follow TypeScript interfaces
- Return functions or configuration objects

**Precedence:**
- Page-level hooks override container-level hooks
- More specific hooks override general hooks

## Available Hook Categories

### 1. Data Hooks
Access and manage application data:
- `usePrincipal` - Current user information
- `useViewData` - Page/dialog data access

[Learn more →](./data-hooks.md)

### 2. UI Hooks
Customize visual components:
- AppBar extra components
- Hero and logo customization
- Footer text
- Menu manipulation

[Learn more →](./ui-hooks.md)

### 3. Table Hooks
Enhance table functionality:
- Row highlighting
- Custom columns
- Sidekick components (above-table UI)
- Column customization

[Learn more →](./table-hooks.md)

### 4. Action Hooks
Control operations and flows:
- Container actions (form/table operations)
- Page actions (custom button handlers)
- Operation flow management
- Post-operation navigation

[Learn more →](./action-hooks.md)

### 5. Navigation and Access
Manage routing and permissions:
- Redirect service
- Access filtering
- Hotkey support
- Navigation interception

[Learn more →](./navigation-and-access.md)

### 6. Validation Hooks
Customize input validation:
- Date/DateTime validation
- Field-specific rules
- Custom error messages

[Learn more →](./validation-hooks.md)

## Using .default Template Files

The generator creates `.default` template files as blueprints for customization.

### Understanding .default Files

**Important:** `.default` files (`.tsx.default`, `.ts.default`) are **compiled** by the build system.

**Two Options:**

#### Option 1: Keep .default Extension (Recommended)

```bash
# Find generated templates
find src/custom -name "*.default"

# Edit the .default file directly
vim src/custom/application-customizer.tsx.default

# File is compiled as-is - no additional steps needed
```

**Advantages:**
- ✅ No file copying needed
- ✅ Generator updates blueprint without overwriting your changes
- ✅ Clear that file originated from template

#### Option 2: Remove .default Extension

```bash
# Copy/rename to remove .default
cp src/custom/application-customizer.tsx.default src/custom/application-customizer.tsx

# Protect from regeneration
echo "src/custom/application-customizer.tsx" >> .generator-ignore

# Edit the file
vim src/custom/application-customizer.tsx
```

**Advantages:**
- ✅ Clean filenames
- ✅ Standard convention

### Example .default File

**Generated `src/custom/application-customizer.tsx.default`:**
```typescript
import { ApplicationCustomizer, BundleContext } from '~/generated';

/**
 * Default application customizer.
 * Either:
 * 1. Keep this .default file and edit it directly (recommended)
 * 2. Rename to application-customizer.tsx and add to .generator-ignore
 */
export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Register your customizations here

    // Example: Register table row highlighting
    // context.registerService<TableRowHighlightingHook>(
    //   TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
    //   myHighlightingHook,
    //   { component: 'ServiceCanvassingEventsTable' }
    // );
  }
}
```

**After customization:**
```typescript
import {
  ApplicationCustomizer,
  BundleContext,
  TableRowHighlightingHook,
  TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY
} from '~/generated';
import { canvassingEventHighlighting } from './hooks/tableRowHighlighting';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Register table row highlighting
    context.registerService<TableRowHighlightingHook>(
      TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
      canvassingEventHighlighting,
      { component: 'ServiceCanvassingEventsTable' }
    );
  }
}
```

## Common Template Patterns

| Pattern | Purpose | Recommendation |
|---------|---------|----------------|
| `*-customizer.tsx.default` | Component customization entry points | Keep .default |
| `hooks/*.tsx.default` | Custom hook implementations | Either works |
| `theme/*.ts.default` | Theme and styling customizations | Usually rename |
| `pages/*-hook-registration.tsx.default` | Page-level hook registrations | Keep .default |

## Complete Workflow Example

### Scenario: Add Table Row Highlighting

```bash
# Step 1: Check generated templates
find src/custom -name "*.default"

# Step 2: Choose approach (keeping .default is recommended)
vim src/custom/application-customizer.tsx.default

# Step 3: Create custom hook
mkdir -p src/custom/hooks
cat > src/custom/hooks/tableRowHighlighting.tsx << 'EOF'
import { TableRowHighlightingHook } from '~/generated';
import { ServiceCanvassingEventStored } from '~/generated/data-api';

export const canvassingEventHighlighting: TableRowHighlightingHook<ServiceCanvassingEventStored> = () => {
  return () => ([
    {
      name: 'overdue',
      label: 'Overdue Events',
      backgroundColor: '#ffebee',
      condition: (params) => {
        const deadline = new Date(params.row.eventDate);
        return deadline < new Date() && !params.row.completed;
      }
    }
  ]);
};
EOF

# Step 4: Register in customizer
# Edit application-customizer.tsx.default to add registration

# Step 5: Protect custom hook
echo "src/custom/hooks/tableRowHighlighting.tsx" >> .generator-ignore

# Step 6: Test
cd application/frontend-react/northwind__[actor_fqn]
pnpm run dev
```

## Hook Registration Patterns

### Single Hook Registration

```typescript
export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    context.registerService<TableRowHighlightingHook>(
      TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
      myHighlightingHook,
      { component: 'ServiceCampaignsTable' }
    );
  }
}
```

### Multiple Hooks

```typescript
export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Row highlighting
    context.registerService<TableRowHighlightingHook>(
      TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
      campaignHighlighting,
      { component: 'ServiceCampaignsTable' }
    );

    // Custom column
    context.registerService<ColumnCustomizerHook>(
      TABLE_COLUMN_CUSTOMIZER_HOOK_INTERFACE_KEY,
      statusColumn,
      { component: 'ServiceCampaignsTable', column: 'status' }
    );

    // Sidekick component
    context.registerService<FC>(
      SIDEKICK_COMPONENT_INTERFACE_KEY,
      CampaignChartSidekick,
      { component: 'ServiceCampaignsTable' }
    );
  }
}
```

### Conditional Registration

```typescript
export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Only register in production
    if (process.env.NODE_ENV === 'production') {
      context.registerService<AnalyticsHook>(
        ANALYTICS_HOOK_INTERFACE_KEY,
        analyticsHook
      );
    }

    // Feature flag based registration
    if (localStorage.getItem('betaFeatures') === 'true') {
      context.registerService<BetaFeatureHook>(
        BETA_FEATURE_HOOK_INTERFACE_KEY,
        betaFeatureHook
      );
    }
  }
}
```

## Understanding .generator-ignore

### When to Use

**Add to .generator-ignore:**
- ✅ Custom files you create from scratch
- ✅ Template files you **renamed** (removed .default)
- ✅ Generated files you **edited directly** (not preferred)

**Don't add to .generator-ignore:**
- ❌ Template files with .default extension
- ❌ Generated files you haven't modified

### Example .generator-ignore

```
# Custom application customizer (if renamed from .default)
src/custom/application-customizer.tsx

# Custom hooks (created from scratch)
src/custom/hooks/tableRowHighlighting.tsx
src/custom/hooks/usePrincipal.tsx
src/custom/hooks/useCustomAuth.tsx

# Custom components
src/custom/components/CampaignChart.tsx
src/custom/components/NotificationBell.tsx

# Theme customizations (if renamed)
src/theme/palette.ts
src/theme/typography.ts

# Directly edited generated files (not recommended)
# src/generated/pages/CustomPage.tsx
```

### Verify Protection

```bash
# Check if file is protected
grep "application-customizer.tsx" .generator-ignore

# List all protected files
cat .generator-ignore

# Test regeneration
mvn clean install
git diff src/custom/
# Should show no unwanted changes
```

## Best Practices

### 1. Prefer Hooks Over Direct Edits

```typescript
// ✅ Good - Use hook
context.registerService<TableRowHighlightingHook>(
  TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
  myHook,
  { component: 'ServiceCampaignsTable' }
);

// ❌ Bad - Edit generated file
// Editing src/generated/pages/CampaignsTable.tsx
```

### 2. Keep .default Extension

```bash
# ✅ Recommended
vim src/custom/application-customizer.tsx.default

# ⚠️ Acceptable but requires .generator-ignore
cp src/custom/application-customizer.tsx.default src/custom/application-customizer.tsx
echo "src/custom/application-customizer.tsx" >> .generator-ignore
```

### 3. Organize Custom Code

```
src/custom/
├── application-customizer.tsx.default
├── hooks/
│   ├── tableRowHighlighting.tsx
│   ├── usePrincipal.tsx
│   └── validation.tsx
├── components/
│   ├── CampaignChart.tsx
│   └── NotificationBell.tsx
└── utils/
    └── helpers.ts
```

### 4. Document Customizations

```typescript
/**
 * Highlights overdue canvassing events in red.
 *
 * Applied to: ServiceCanvassingEventsTable
 * Updated: 2024-12-15
 */
export const canvassingEventHighlighting: TableRowHighlightingHook = () => {
  return () => ([...]);
};
```

### 5. Test After Regeneration

```bash
# Always test after mvn clean install
mvn clean install
pnpm run dev
# Verify all customizations still work
```

## Troubleshooting

### "Hook not executing"

**Check registration:**
```typescript
// Verify in application-customizer.tsx.default
console.log('Registering hook');
context.registerService<TableRowHighlightingHook>(
  TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
  myHook,
  { component: 'ServiceCampaignsTable' }
);
```

**Verify component name:**
```bash
# Find correct component name in generated code
grep -r "export const.*Table" src/generated/pages/
```

### "File overwritten after build"

**Add to .generator-ignore:**
```bash
echo "src/custom/hooks/myHook.tsx" >> .generator-ignore
```

### "Type errors with hook interface"

**Import correct types:**
```typescript
// ✅ Correct
import { TableRowHighlightingHook } from '~/generated';

// ❌ Wrong
import { TableRowHighlightingHook } from '~/generated/hooks';
```

## Related Documentation

- [Data Hooks](./data-hooks.md) - usePrincipal, useViewData
- [UI Hooks](./ui-hooks.md) - AppBar, Hero, Logo, Footer
- [Table Hooks](./table-hooks.md) - Row highlighting, custom columns
- [Action Hooks](./action-hooks.md) - Container actions, operations
- [Navigation and Access](./navigation-and-access.md) - Redirects, access control
- [Validation Hooks](./validation-hooks.md) - Date/DateTime validation
- Main README (see `judo-README.md-docs` skill) - Overview and architecture
