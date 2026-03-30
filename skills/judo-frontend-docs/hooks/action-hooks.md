# Action Hooks

## Overview

Action hooks control operations and user interactions within the application. These hooks allow you to customize container actions (form/table operations), page actions (custom button handlers), operation flow management, and enumeration filtering.

## Container Actions

### Purpose

Customize behavior of forms and tables by hooking into their lifecycle events (save, delete, validate) and providing dynamic options for dropdowns.

### Basic Implementation

```typescript
// src/custom/hooks/containerActions.tsx
import { ViewEntityFormContainerHook } from '~/generated';

export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    onSave: async (formData) => {
      // Custom save logic
      console.log('Saving entity:', formData);
      await validateEntity(formData);
      // Continue with default save
    },

    onDelete: async (id) => {
      // Custom delete confirmation
      const confirmed = window.confirm('Are you sure?');
      if (!confirmed) {
        throw new Error('Delete cancelled');
      }
      // Continue with default delete
    },
  };
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { CONTAINER_HOOK_INTERFACE_KEY } from '~/generated';
import { entityFormHook } from './hooks/containerActions';

context.registerService(
  CONTAINER_HOOK_INTERFACE_KEY,
  entityFormHook,
  { component: 'ServiceEntityForm' }
);
```

### Advanced Examples

#### Custom Validation on Save

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    onBeforeSave: async (formData) => {
      // Validate date range
      if (formData.fromDate && formData.toDate) {
        const start = new Date(formData.fromDate);
        const end = new Date(formData.toDate);

        if (start >= end) {
          throw new Error('From date must be before to date');
        }
      }

      // Check for duplicate titles
      const existingEntities = await entityService.list({
        filter: { title: formData.title }
      });

      if (existingEntities.length > 0 && !editMode) {
        throw new Error('Entity with this title already exists');
      }
    },

    onAfterSave: async (savedData) => {
      // Show success message
      showNotification('Entity saved successfully');

      // Refresh related data
      await refreshDashboard();
    },
  };
};
```

#### Conditional Delete

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    onBeforeDelete: async (id) => {
      // Check if entity has items
      const items = await itemService.list({
        filter: { entityId: id }
      });

      if (items.length > 0) {
        const confirmed = window.confirm(
          `This entity has ${items.length} items. Delete anyway?`
        );
        if (!confirmed) {
          throw new Error('Delete cancelled');
        }
      }
    },

    onAfterDelete: async (id) => {
      showNotification('Entity deleted');
      // Navigate back to list
      navigate('/entities');
    },
  };
};
```

## Enumeration Filtering

### Purpose

Dynamically filter dropdown options based on form state or other criteria.

### Basic Implementation

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    // Filter user options based on entity status
    filterUserOptions: (formData, options) => {
      if (formData.statusField === 'ACTIVE') {
        // Only show active users for active entities
        return options.filter(user => user.active === true);
      }
      return options;
    },
  };
};
```

### Advanced Examples

#### Cascading Dropdowns

```typescript
export const locationFormHook: ViewLocationFormContainerHook = (data, editMode, storeDiff) => {
  return {
    // Filter regions based on selected country
    filterRegionOptions: (formData, options) => {
      if (formData.country) {
        return options.filter(region =>
          region.countryId === formData.country.__identifier
        );
      }
      return options;
    },

    // Filter cities based on selected region
    filterCityOptions: (formData, options) => {
      if (formData.region) {
        return options.filter(city =>
          city.regionId === formData.region.__identifier
        );
      }
      return [];
    },
  };
};
```

#### Role-Based Filtering

```typescript
import { usePrincipal } from '~/custom/hooks/usePrincipal';

export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  const principal = usePrincipal();

  return {
    filterUserOptions: (formData, options) => {
      // Admins see all users
      if (principal?.roles?.includes('ADMIN')) {
        return options;
      }

      // Managers see only their team
      if (principal?.roles?.includes('MANAGER')) {
        return options.filter(user =>
          user.teamId === principal.teamId
        );
      }

      // Regular users see only themselves
      return options.filter(user =>
        user.__identifier === principal.__identifier
      );
    },
  };
};
```

## Typeahead/Autocomplete

### Purpose

Provide autocomplete suggestions for text fields, often with API calls.

### Basic Implementation

```typescript
export const locationFormHook: ViewLocationFormContainerHook = (data, editMode, storeDiff) => {
  return {
    // Autocomplete for location input
    getFullLocationOptions: async (searchText: string) => {
      if (searchText.length < 3) return [];

      // Call location validation service
      const suggestions = await locationService.search(searchText);
      return suggestions.map(s => s.fullLocation);
    },
  };
};
```

### Advanced Examples

#### API-Based Autocomplete

```typescript
export const addressFormHook: ViewAddressFormContainerHook = (data, editMode, storeDiff, context) => {
  return {
    getSettlementOptions: async (searchText: string) => {
      if (searchText.length < 2) return [];

      // ✅ CORRECT: Use getRangeAction from context to fetch related data
      const result = await context.actions.getRangeAction('settlement')({
        query: searchText,
        page: 0,
        size: 20,
      });

      return result.data.map(settlement => ({
        label: settlement.name,
        value: settlement.__identifier,
      }));
    },
  };
};
```

#### Debounced Autocomplete

```typescript
import { debounce } from 'lodash';

export const addressFormHook: ViewAddressFormContainerHook = (data, editMode, storeDiff, context) => {
  // ✅ CORRECT: Debounce using range action from context
  const debouncedSearch = debounce(async (searchText: string) => {
    return await context.actions.getRangeAction('publicSpaceName')({
      query: searchText,
      page: 0,
      size: 10,
    });
  }, 300);

  return {
    getPublicSpaceNameOptions: async (searchText: string) => {
      if (searchText.length < 3) return [];
      const result = await debouncedSearch(searchText);
      return result.data;
    },
  };
};
```

## Page Actions

### Purpose

Handle custom button clicks on pages, add custom action buttons, or override default actions.

### Basic Implementation

```typescript
// src/custom/hooks/pageActions.tsx
import { PageActionHook } from '~/generated';

export const entityPageActions: PageActionHook = () => {
  return {
    'export-data': async (context) => {
      // Custom export logic
      const data = context.getData();
      downloadCSV(data);
    },
  };
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { PAGE_ACTION_HOOK_INTERFACE_KEY } from '~/generated';
import { entityPageActions } from './hooks/pageActions';

context.registerService(
  PAGE_ACTION_HOOK_INTERFACE_KEY,
  entityPageActions,
  { page: 'ServiceEntityView' }
);
```

### Advanced Examples

#### Export to CSV

```typescript
export const entityPageActions: PageActionHook = () => {
  return {
    'export-csv': async (context) => {
      const entities = context.getData();

      // Convert to CSV
      const headers = ['Title', 'Status', 'From Date', 'To Date'];
      const rows = entities.map(e => [
        e.title,
        e.statusField,
        e.fromDate,
        e.toDate,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'entities.csv';
      a.click();
    },
  };
};
```

#### Bulk Operations

```typescript
export const entityPageActions: PageActionHook = () => {
  return {
    'bulk-activate': async (context) => {
      const selectedIds = context.getSelectedIds();

      if (selectedIds.length === 0) {
        alert('Please select entities to activate');
        return;
      }

      const confirmed = confirm(
        `Activate ${selectedIds.length} entity(ies)?`
      );

      if (!confirmed) return;

      // Activate each entity
      await Promise.all(
        selectedIds.map(id =>
          entityService.update(id, { statusField: 'ACTIVE' })
        )
      );

      // Refresh view
      context.refresh();
      showNotification(`${selectedIds.length} entities activated`);
    },

    'bulk-delete': async (context) => {
      const selectedIds = context.getSelectedIds();

      if (selectedIds.length === 0) {
        alert('Please select entities to delete');
        return;
      }

      const confirmed = confirm(
        `Delete ${selectedIds.length} entity(ies)? This cannot be undone.`
      );

      if (!confirmed) return;

      await Promise.all(
        selectedIds.map(id => entityService.delete(id))
      );

      context.refresh();
      showNotification(`${selectedIds.length} entities deleted`);
    },
  };
};
```

#### Custom Operation Action

```typescript
export const campaignPageActions: PageActionHook = () => {
  return {
    'export-to-excel': async (context) => {
      const campaign = context.getData();

      context.showNotification('Generating Excel export...');

      try {
        // ✅ CORRECT: Use getAction from context to call custom operation
        const result = await context.actions.getAction('exportToExcel')(campaign.__signedIdentifier);

        // If operation returns a download token, use it
        if (result.data?.downloadToken) {
          const blob = await context.actions.downloadFile(result.data.downloadToken, 'attachment');

          // Download file
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `campaign-${campaign.title}-export.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
        }

        context.showNotification('Export generated successfully');
      } catch (error) {
        context.showErrorDialog('Export Failed', 'Could not generate Excel export', 'error');
      }
    },
  };
};
```

## OperationFlowManager

### Purpose

Control navigation and behavior after operations (create, update, delete). Customize where users go after completing actions.

### Basic Implementation

```typescript
// src/custom/hooks/operationFlowManager.tsx
import { OperationFlowManager, OperationInput } from '~/generated';

export const customFlowManager: OperationFlowManager = {
  shouldUseCustomFlow: (input: OperationInput) => {
    // Use custom flow for create operations
    return input.operation === 'CREATE';
  },

  handleResult: (input: OperationInput) => {
    if (input.operation === 'CREATE' && input.entityType === 'Item') {
      // After creating item, navigate to item view
      return {
        actor: 'ServiceActor',
        access: 'ServiceItemsTable',
        filterRecords: {
          entityId: [{
            operator: 'equal',
            value: input.result.entityId
          }]
        }
      };
    }

    // Default behavior
    return null;
  }
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { OPERATION_FLOW_MANAGER_INTERFACE_KEY } from '~/generated';
import { customFlowManager } from './hooks/operationFlowManager';

context.registerService(
  OPERATION_FLOW_MANAGER_INTERFACE_KEY,
  customFlowManager
);
```

### Advanced Examples

#### Context-Based Navigation

```typescript
export const customFlowManager: OperationFlowManager = {
  shouldUseCustomFlow: (input) => {
    return input.operation === 'CREATE' || input.operation === 'UPDATE';
  },

  handleResult: (input) => {
    const { operation, entityType, result, context } = input;

    if (operation === 'CREATE') {
      if (entityType === 'Entity') {
        // After creating entity, go to entity view
        return {
          actor: 'ServiceActor',
          access: 'ServiceEntityView',
          id: result.__identifier,
        };
      }

      if (entityType === 'Item') {
        // After creating item, stay on entity view with items tab
        return {
          actor: 'ServiceActor',
          access: 'ServiceEntityView',
          id: result.entityId,
          tab: 'items',
        };
      }
    }

    if (operation === 'UPDATE') {
      // After update, refresh current view
      return {
        refresh: true,
      };
    }

    if (operation === 'DELETE') {
      // After delete, go back to list
      return {
        actor: 'ServiceActor',
        access: `Service${entityType}sTable`,
      };
    }

    return null;
  },
};
```

#### With Custom Messages

```typescript
export const customFlowManager: OperationFlowManager = {
  shouldUseCustomFlow: (input) => true,

  handleResult: (input) => {
    const { operation, entityType, result } = input;

    // Show custom success message
    const messages = {
      CREATE: `${entityType} created successfully`,
      UPDATE: `${entityType} updated successfully`,
      DELETE: `${entityType} deleted successfully`,
    };

    showNotification(messages[operation] || 'Operation successful');

    // Navigate based on operation
    if (operation === 'CREATE') {
      return {
        actor: 'ServiceActor',
        access: `Service${entityType}View`,
        id: result.__identifier,
      };
    }

    return null;
  },
};
```

## Best Practices

### 1. Async/Await for API Calls

```typescript
// ✅ Good
onBeforeSave: async (data) => {
  await validateData(data);
}

// ❌ Bad
onBeforeSave: (data) => {
  validateData(data); // Not awaited
}
```

### 2. Error Handling

```typescript
// ✅ Good
onSave: async (data) => {
  try {
    await customValidation(data);
  } catch (error) {
    showNotification(error.message, 'error');
    throw error; // Prevent save
  }
}

// ❌ Bad
onSave: async (data) => {
  await customValidation(data); // Errors not caught
}
```

### 3. Check Form State

```typescript
// ✅ Good
filterUserOptions: (formData, options) => {
  if (formData.status === 'ACTIVE') {
    return options.filter(u => u.active);
  }
  return options;
}

// ❌ Bad
filterUserOptions: (formData, options) => {
  return options.filter(u => u.active); // Ignores form state
}
```

### 4. Protect Custom Hooks

```bash
# Add to .generator-ignore
echo "src/custom/hooks/containerActions.tsx" >> .generator-ignore
echo "src/custom/hooks/pageActions.tsx" >> .generator-ignore
echo "src/custom/hooks/operationFlowManager.tsx" >> .generator-ignore
```

### 5. Debounce Autocomplete

```typescript
// ✅ Good - Debounced
const debouncedSearch = debounce(searchAPI, 300);

// ❌ Bad - No debouncing
getOptions: async (text) => await searchAPI(text);
```

## Complete Example

```typescript
// src/custom/application-customizer.tsx
import {
  ApplicationCustomizer,
  BundleContext,
  CONTAINER_HOOK_INTERFACE_KEY,
  PAGE_ACTION_HOOK_INTERFACE_KEY,
  OPERATION_FLOW_MANAGER_INTERFACE_KEY
} from '~/generated';
import { entityFormHook } from './hooks/containerActions';
import { entityPageActions } from './hooks/pageActions';
import { customFlowManager } from './hooks/operationFlowManager';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Register container actions
    context.registerService(
      CONTAINER_HOOK_INTERFACE_KEY,
      entityFormHook,
      { component: 'ServiceEntityForm' }
    );

    // Register page actions
    context.registerService(
      PAGE_ACTION_HOOK_INTERFACE_KEY,
      entityPageActions,
      { page: 'ServiceEntityView' }
    );

    // Register operation flow manager
    context.registerService(
      OPERATION_FLOW_MANAGER_INTERFACE_KEY,
      customFlowManager
    );
  }
}
```

## Troubleshooting

### "Hook not executing"

**Check registration:**
```typescript
console.log('Registering container hook');
context.registerService(
  CONTAINER_HOOK_INTERFACE_KEY,
  campaignFormHook,
  { component: 'ServiceCampaignForm' }
);
```

**Verify component name:**
```bash
# Check generated component names
grep -r "export const.*Form" src/generated/pages/
```

### "Filtering not working"

**Debug filter logic:**
```typescript
filterUserOptions: (formData, options) => {
  console.log('Form data:', formData);
  console.log('Options:', options);
  const filtered = options.filter(u => u.active);
  console.log('Filtered:', filtered);
  return filtered;
}
```

### "Operation flow not redirecting"

**Check return value:**
```typescript
handleResult: (input) => {
  console.log('Operation input:', input);
  const result = {
    actor: 'ServiceActor',
    access: 'ServiceCampaignView',
    id: input.result.__identifier,
  };
  console.log('Returning:', result);
  return result;
}
```

## Related Documentation

- [Hook System Overview](./SKILL.md)
- [Data Hooks](./data-hooks.md)
- [Table Hooks](./table-hooks.md)
- [Validation Hooks](./validation-hooks.md)
- [Navigation and Access](./navigation-and-access.md)
- Development Workflow (see `judo-development-workflow.md-docs` skill)
