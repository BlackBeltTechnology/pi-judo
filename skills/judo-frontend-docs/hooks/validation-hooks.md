# Validation Hooks

## Overview

Validation hooks allow you to customize input validation for forms. These hooks enable date/datetime validation, field-specific rules, custom error messages, and complex validation logic.

## Date/DateTime Validation

### Purpose

Customize date and datetime picker constraints, such as minimum/maximum dates, disabled dates, and custom validation rules.

### Basic Implementation

```typescript
// src/custom/hooks/containerActions.tsx
import { ViewItemFormContainerHook } from '~/generated';

export const itemFormHook: ViewItemFormContainerHook = (data, editMode, storeDiff) => {
  return {
    // Date field must be in the future
    getDateFieldValidationProps: (data) => {
      return {
        minDate: new Date(), // Today
        shouldDisableDate: (date) => {
          // Disable weekends
          const day = date.getDay();
          return day === 0 || day === 6;
        }
      };
    }
  };
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { CONTAINER_HOOK_INTERFACE_KEY } from '~/generated';
import { itemFormHook } from './hooks/containerActions';

context.registerService(
  CONTAINER_HOOK_INTERFACE_KEY,
  itemFormHook,
  { component: 'ServiceItemForm' }
);
```

### Advanced Examples

#### Entity Date Range

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    // From date validation
    getFromDateValidationProps: (formData) => {
      return {
        minDate: new Date(), // Can't start in the past
        maxDate: formData.toDate ? new Date(formData.toDate) : undefined,
      };
    },

    // To date validation
    getToDateValidationProps: (formData) => {
      return {
        minDate: formData.fromDate
          ? new Date(formData.fromDate)
          : new Date(),
        shouldDisableDate: (date) => {
          // To date must be at least 7 days after from date
          if (formData.fromDate) {
            const fromDate = new Date(formData.fromDate);
            const minToDate = new Date(fromDate);
            minToDate.setDate(minToDate.getDate() + 7);
            return date < minToDate;
          }
          return false;
        }
      };
    }
  };
};
```

#### Item Within Entity Period

```typescript
export const itemFormHook: ViewItemFormContainerHook = (data, editMode, storeDiff) => {
  return {
    getDateFieldValidationProps: (formData) => {
      if (formData.entity) {
        return {
          minDate: formData.entity.fromDate
            ? new Date(formData.entity.fromDate)
            : undefined,
          maxDate: formData.entity.toDate
            ? new Date(formData.entity.toDate)
            : undefined,
          shouldDisableDate: (date) => {
            // Disable weekends if entity requires weekdays only
            if (formData.entity.weekdaysOnly) {
              const day = date.getDay();
              return day === 0 || day === 6;
            }
            return false;
          }
        };
      }
      return {};
    }
  };
};
```

#### Business Days Only

```typescript
export const formHook: ViewFormContainerHook = (data, editMode, storeDiff) => {
  const isBusinessDay = (date: Date) => {
    const day = date.getDay();
    // Not weekend
    if (day === 0 || day === 6) return false;

    // Check if it's a holiday
    const holidays = [
      '2025-01-01', // New Year
      '2025-12-25', // Christmas
      // Add more holidays
    ];

    const dateStr = date.toISOString().split('T')[0];
    return !holidays.includes(dateStr);
  };

  return {
    getDeadlineDateValidationProps: (formData) => {
      return {
        shouldDisableDate: (date) => !isBusinessDay(date),
        helperText: 'Select a business day (Mon-Fri, excluding holidays)'
      };
    }
  };
};
```

#### Time-Based Validation

```typescript
export const itemFormHook: ViewItemFormContainerHook = (data, editMode, storeDiff) => {
  return {
    getDateFieldTimeValidationProps: (formData) => {
      return {
        minDateTime: new Date(), // Must be in future
        shouldDisableTime: (value, clockType) => {
          // Disable hours outside business hours
          if (clockType === 'hours') {
            return value < 8 || value > 18; // 8 AM - 6 PM
          }
          return false;
        },
        helperText: 'Items must be scheduled between 8 AM and 6 PM'
      };
    }
  };
};
```

## Field Validation

### Purpose

Add custom validation rules for specific fields beyond date/datetime.

### Basic Implementation

```typescript
// src/custom/application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  validators: {
    'ServiceEntityForm': {
      title: (value) => {
        if (!value || value.length < 3) {
          return 'Title must be at least 3 characters';
        }
        if (value.length > 100) {
          return 'Title must be less than 100 characters';
        }
      },
    },
  },
};
```

### Advanced Examples

#### Email Validation

```typescript
export const applicationCustomizer: ApplicationCustomizer = {
  validators: {
    'ServiceUserForm': {
      email: (value) => {
        if (!value) {
          return 'Email is required';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Invalid email address';
        }
      },
    },
  },
};
```

#### Phone Number Validation

```typescript
export const applicationCustomizer: ApplicationCustomizer = {
  validators: {
    'ServiceContactForm': {
      phone: (value) => {
        if (!value) return; // Optional field

        // Remove spaces and dashes
        const cleaned = value.replace(/[\s-]/g, '');

        // Check if it's all digits
        if (!/^\d+$/.test(cleaned)) {
          return 'Phone number must contain only digits';
        }

        // Check length (example: 10 digits)
        if (cleaned.length !== 10) {
          return 'Phone number must be 10 digits';
        }
      },
    },
  },
};
```

#### URL Validation

```typescript
export const applicationCustomizer: ApplicationCustomizer = {
  validators: {
    'ServiceWebsiteForm': {
      url: (value) => {
        if (!value) return; // Optional

        try {
          new URL(value);
        } catch {
          return 'Invalid URL format';
        }
      },
    },
  },
};
```

#### Number Range Validation

```typescript
export const applicationCustomizer: ApplicationCustomizer = {
  validators: {
    'ServiceEntityForm': {
      amount: (value) => {
        if (!value) {
          return 'Amount is required';
        }

        const numValue = parseFloat(value);

        if (isNaN(numValue)) {
          return 'Amount must be a number';
        }

        if (numValue < 0) {
          return 'Amount cannot be negative';
        }

        if (numValue > 1000000) {
          return 'Amount cannot exceed $1,000,000';
        }
      },

      quantity: (value) => {
        if (!value) return; // Optional

        const numValue = parseInt(value, 10);

        if (isNaN(numValue)) {
          return 'Must be a whole number';
        }

        if (numValue < 1) {
          return 'Must be at least 1';
        }

        if (numValue > 10000) {
          return 'Maximum 10,000';
        }
      },
    },
  },
};
```

#### Conditional Validation

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    validateField: (fieldName, value, formData) => {
      // Amount required for ACTIVE entities
      if (fieldName === 'amount' && formData.statusField === 'ACTIVE') {
        if (!value) {
          return 'Amount is required for active entities';
        }
      }

      // To date required for non-DRAFT entities
      if (fieldName === 'toDate' && formData.statusField !== 'DRAFT') {
        if (!value) {
          return 'To date is required';
        }
      }

      // Details required if entity is public
      if (fieldName === 'details' && formData.isPublic) {
        if (!value || value.length < 50) {
          return 'Public entities require details of at least 50 characters';
        }
      }
    }
  };
};
```

## Async Validation

### Purpose

Validate fields by calling external APIs or performing database checks.

### Basic Implementation

**IMPORTANT**: For async validation in JUDO, you can call custom validation operations through the `context.actions` object.

```typescript
export const campaignFormHook: ViewCampaignFormContainerHook = (data, editMode, storeDiff, context) => {
  return {
    validateTitle: async (title: string) => {
      if (!title || title.length < 3) {
        return 'Title must be at least 3 characters';
      }

      try {
        // ✅ CORRECT: Call custom validation operation via context actions
        const result = await context.actions.getAction('validateTitle')({ title });

        if (result.data?.exists) {
          return 'Campaign title already exists';
        }
      } catch (error) {
        console.error('Validation error:', error);
        return 'Unable to validate title. Please try again.';
      }
    }
  };
};
```

### Advanced Examples

#### Debounced Async Validation

```typescript
import { debounce } from 'lodash';

export const campaignFormHook: ViewCampaignFormContainerHook = (data, editMode, storeDiff, context) => {
  // ✅ CORRECT: Debounce using context actions
  const checkTitleAvailability = debounce(async (title: string) => {
    return await context.actions.getAction('validateTitle')({ title });
  }, 500);

  return {
    validateTitle: async (title: string) => {
      if (!title || title.length < 3) {
        return 'Title must be at least 3 characters';
      }

      try {
        const result = await checkTitleAvailability(title);

        if (result.data?.exists) {
          return 'This campaign title is already taken';
        }
      } catch (error) {
        console.error('Validation error:', error);
      }
    }
  };
};
```

#### Related Entity Validation

```typescript
export const addressFormHook: ViewAddressFormContainerHook = (data, editMode, storeDiff, context) => {
  return {
    validateAddress: async (fullAddress: string) => {
      if (!fullAddress) {
        return 'Address is required';
      }

      try {
        // ✅ CORRECT: Use custom validation operation
        const result = await context.actions.getAction('validateAddress')({
          fullAddress,
          settlementId: data.settlement?.__identifier
        });

        if (!result.data?.isValid) {
          return result.data?.message || 'Address validation failed';
        }

        if (result.data?.qualityScore === 'LOW') {
          return 'Address is too vague. Please provide more details.';
        }
      } catch (error) {
        console.error('Address validation error:', error);
        return 'Unable to validate address. Please try again.';
      }
    }
  };
};
```

## Cross-Field Validation

### Purpose

Validate fields based on values of other fields in the form.

### Basic Implementation

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    validateForm: (formData) => {
      const errors: Record<string, string> = {};

      // From date must be before to date
      if (formData.fromDate && formData.toDate) {
        const from = new Date(formData.fromDate);
        const to = new Date(formData.toDate);

        if (from >= to) {
          errors.toDate = 'To date must be after from date';
        }
      }

      return errors;
    }
  };
};
```

### Advanced Examples

#### Amount vs Quantity Validation

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    validateForm: (formData) => {
      const errors: Record<string, string> = {};

      // Check amount per unit
      if (formData.amount && formData.quantity) {
        const costPerUnit = formData.amount / formData.quantity;

        if (costPerUnit < 10) {
          errors.amount = 'Amount too low: minimum $10 per unit';
        }

        if (costPerUnit > 1000) {
          errors.amount = 'Amount too high: maximum $1,000 per unit';
        }
      }

      return errors;
    }
  };
};
```

#### Password Confirmation

```typescript
export const userFormHook: ViewUserFormContainerHook = (data, editMode, storeDiff) => {
  return {
    validateForm: (formData) => {
      const errors: Record<string, string> = {};

      // Password strength
      if (formData.password) {
        if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        }

        if (!/[A-Z]/.test(formData.password)) {
          errors.password = 'Password must contain an uppercase letter';
        }

        if (!/[a-z]/.test(formData.password)) {
          errors.password = 'Password must contain a lowercase letter';
        }

        if (!/[0-9]/.test(formData.password)) {
          errors.password = 'Password must contain a number';
        }
      }

      // Password confirmation
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      return errors;
    }
  };
};
```

## Real-Time Validation

### Purpose

Validate as user types, providing immediate feedback.

### Basic Implementation

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    onFieldChange: (fieldName, value, formData) => {
      if (fieldName === 'title') {
        // Real-time title validation
        if (value.length < 3) {
          return { error: 'Title too short' };
        }

        if (value.length > 100) {
          return { error: 'Title too long' };
        }

        return { error: null };
      }
    }
  };
};
```

### Advanced Examples

#### Character Counter with Validation

```typescript
export const entityFormHook: ViewEntityFormContainerHook = (data, editMode, storeDiff) => {
  return {
    onFieldChange: (fieldName, value, formData) => {
      if (fieldName === 'details') {
        const length = value?.length || 0;
        const maxLength = 500;

        if (length > maxLength) {
          return {
            error: `Details are too long (${length}/${maxLength})`,
            value: value.substring(0, maxLength), // Truncate
          };
        }

        return {
          helperText: `${length}/${maxLength} characters`,
        };
      }
    }
  };
};
```

## Best Practices

### 1. Provide Clear Error Messages

```typescript
// ✅ Good - Specific message
return 'Title must be between 3 and 100 characters';

// ❌ Bad - Vague message
return 'Invalid title';
```

### 2. Validate Early

```typescript
// ✅ Good - Check if value exists first
if (!value) {
  return 'Field is required';
}

// ❌ Bad - Assume value exists
if (value.length < 3) { ... }
```

### 3. Use Async Validation Sparingly

```typescript
// ✅ Good - Debounce async calls
const debouncedCheck = debounce(checkAPI, 500);

// ❌ Bad - Call API on every keystroke
validateName: async (value) => await checkAPI(value);
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - Try/catch for API calls
try {
  await validateLocation(value);
} catch (error) {
  return 'Validation failed. Please try again.';
}

// ❌ Bad - No error handling
await validateLocation(value);
```

### 5. Protect Custom Validators

```bash
# Add to .generator-ignore
echo "src/custom/hooks/containerActions.tsx" >> .generator-ignore
```

## Complete Example

```typescript
// src/custom/hooks/containerActions.tsx
import { ViewCampaignFormContainerHook } from '~/generated';
import { debounce } from 'lodash';

export const campaignFormHook: ViewCampaignFormContainerHook = (data, editMode, storeDiff, context) => {
  // ✅ CORRECT: Debounced validation using context actions
  const checkTitleAvailability = debounce(async (title: string) => {
    return await context.actions.getAction('validateTitle')({ title });
  }, 500);

  return {
    // Date validation
    getFromDateValidationProps: (formData) => ({
      minDate: new Date(),
      maxDate: formData.toDate ? new Date(formData.toDate) : undefined,
    }),

    getToDateValidationProps: (formData) => ({
      minDate: formData.fromDate
        ? new Date(formData.fromDate)
        : new Date(),
    }),

    // Field validation
    validateTitle: async (title: string) => {
      if (!title || title.length < 3) {
        return 'Title must be at least 3 characters';
      }

      if (title.length > 100) {
        return 'Title must be less than 100 characters';
      }

      const { exists } = await checkTitleAvailability(title);
      if (exists) {
        return 'Entity title already exists';
      }
    },

    // Cross-field validation
    validateForm: (formData) => {
      const errors: Record<string, string> = {};

      if (formData.fromDate && formData.toDate) {
        const from = new Date(formData.fromDate);
        const to = new Date(formData.toDate);

        if (from >= to) {
          errors.toDate = 'To date must be after from date';
        }
      }

      return errors;
    },
  };
};
```

## Troubleshooting

### "Validation not triggering"

**Check hook registration:**
```typescript
context.registerService(
  CONTAINER_HOOK_INTERFACE_KEY,
  entityFormHook,
  { component: 'ServiceEntityForm' }
);
```

### "Async validation too slow"

**Add debouncing:**
```typescript
const debouncedCheck = debounce(async (value) => {
  return await checkAPI(value);
}, 500); // Wait 500ms after typing stops
```

### "Error message not showing"

**Return string, not throw:**
```typescript
// ✅ Good
return 'Error message';

// ❌ Bad
throw new Error('Error message');
```

## Related Documentation

- [Hook System Overview](./SKILL.md)
- [Action Hooks](./action-hooks.md)
- [Data Hooks](./data-hooks.md)
- [Development Workflow](../development-workflow.md)
