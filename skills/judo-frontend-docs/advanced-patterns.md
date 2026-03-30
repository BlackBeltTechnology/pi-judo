# Advanced Frontend Patterns

This document covers advanced customization patterns identified from production JUDO applications. These patterns extend beyond standard development workflows and demonstrate sophisticated techniques for complex requirements.

## Table of Contents

- [Dimension Parameters Component System](#dimension-parameters-component-system)
- [Error Interceptor Pattern](#error-interceptor-pattern)
- [Pure State Transformation Functions](#pure-state-transformation-functions)
- [IMaskInput Integration](#imaskinput-integration)
- [Cascade Loading Pattern](#cascade-loading-pattern)
- [PostRefresh Action Hook](#postrefresh-action-hook)
- [Inline Dialog Creation Pattern](#inline-dialog-creation-pattern)
- [Table Row Highlighting System](#table-row-highlighting-system)
- [Custom Component Replacement](#custom-component-replacement)
- [Configuration Patterns](#configuration-patterns)

---

## Dimension Parameters Component System

### Overview

A generic, reusable component system for rendering dynamic parameter groups with support for multi-line tables, type-aware rendering, and inline editing.

### Use Cases

- Dynamic form fields based on configuration
- Multi-row parameter tables with add/delete operations
- Type-specific input rendering (text, number, select, date)
- Read-only vs edit mode switching

### Implementation

#### Component Interface

```typescript
interface DimensionParametersComponentProps<T, R> {
  dimensionGroups: Array<T> | undefined | null;
  onValueChange: (identifier: string, propertyName: keyof R, value: any) => void;
  onRowAdd: (groupIdentifier: string, templateParameters: Array<R>) => void;
  onRowDelete: (groupIdentifier: string, rowIdentifier: string) => void;
  editMode?: boolean;
  readOnly?: boolean;
}
```

#### Type-Aware Rendering

```typescript
const renderParameterValue = (
  parameter: ParameterType,
  editMode: boolean,
  onValueChange: (id: string, prop: string, value: any) => void
) => {
  const { __identifier, parameterType, name, value } = parameter;

  if (!editMode) {
    return <Typography>{value || '-'}</Typography>;
  }

  switch (parameterType) {
    case 'TEXT':
      return (
        <TextField
          value={value || ''}
          onChange={(e) => onValueChange(__identifier, 'value', e.target.value)}
          fullWidth
        />
      );

    case 'NUMBER':
      return (
        <TextField
          type="number"
          value={value || ''}
          onChange={(e) => onValueChange(__identifier, 'value', parseFloat(e.target.value))}
          fullWidth
        />
      );

    case 'SELECT':
      return (
        <Select
          value={value || ''}
          onChange={(e) => onValueChange(__identifier, 'value', e.target.value)}
          fullWidth
        >
          {parameter.options?.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      );

    case 'DATE':
      return (
        <DatePicker
          value={value ? new Date(value) : null}
          onChange={(date) => onValueChange(__identifier, 'value', date?.toISOString())}
        />
      );

    default:
      return <Typography>{value || '-'}</Typography>;
  }
};
```

#### Multi-Line Table Support

```typescript
const DimensionParametersComponent = <T extends Group, R extends Parameter>({
  dimensionGroups,
  onValueChange,
  onRowAdd,
  onRowDelete,
  editMode = false,
  readOnly = false,
}: DimensionParametersComponentProps<T, R>) => {
  return (
    <Box>
      {dimensionGroups?.map((group) => (
        <Box key={group.__identifier} mb={3}>
          <Typography variant="h6">{group.name}</Typography>

          {group.multiLine ? (
            // Multi-line table layout
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {group.rows?.[0]?.parameters?.map((param) => (
                      <TableCell key={param.__identifier}>{param.name}</TableCell>
                    ))}
                    {editMode && !readOnly && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.rows?.map((row) => (
                    <TableRow key={row.__identifier}>
                      {row.parameters?.map((param) => (
                        <TableCell key={param.__identifier}>
                          {renderParameterValue(param, editMode, onValueChange)}
                        </TableCell>
                      ))}
                      {editMode && !readOnly && (
                        <TableCell>
                          <IconButton
                            onClick={() => onRowDelete(group.__identifier, row.__identifier)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            // Single-line parameter list
            <Grid container spacing={2}>
              {group.parameters?.map((param) => (
                <Grid item xs={12} sm={6} key={param.__identifier}>
                  <Box>
                    <Typography variant="caption">{param.name}</Typography>
                    {renderParameterValue(param, editMode, onValueChange)}
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}

          {editMode && !readOnly && group.multiLine && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => onRowAdd(group.__identifier, group.templateParameters)}
            >
              Add Row
            </Button>
          )}
        </Box>
      ))}
    </Box>
  );
};
```

### Integration Example

```typescript
const EntityViewPage = () => {
  const [data, setData] = useState<EntityStored>();

  const handleValueChange = (
    identifier: string,
    propertyName: keyof ParameterInput,
    value: any
  ) => {
    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        dimensionGroups: onValueChangeHelper(
          identifier,
          propertyName,
          value,
          prev.dimensionGroups
        ),
      };
    });
  };

  const handleRowAdd = (groupIdentifier: string, templateParameters: ParameterInput[]) => {
    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        dimensionGroups: onRowAddHelper(
          groupIdentifier,
          templateParameters,
          prev.dimensionGroups
        ),
      };
    });
  };

  const handleRowDelete = (groupIdentifier: string, rowIdentifier: string) => {
    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        dimensionGroups: onRowDeleteHelper(
          groupIdentifier,
          rowIdentifier,
          prev.dimensionGroups
        ),
      };
    });
  };

  return (
    <DimensionParametersComponent
      dimensionGroups={data?.dimensionGroups}
      onValueChange={handleValueChange}
      onRowAdd={handleRowAdd}
      onRowDelete={handleRowDelete}
      editMode={isEditMode}
      readOnly={isReadOnly}
    />
  );
};
```

---

## Error Interceptor Pattern

### Overview

Custom error handling system that intercepts specific error types and provides tailored user feedback without modifying core error handling logic.

### Use Cases

- Custom handling for validation errors (422)
- Business rule violation messages
- Graceful degradation for network errors
- Context-specific error transformations

### Implementation

#### Hook Registration

```typescript
// src/custom/application-customizer.tsx
import { BundleContext } from '@pandino/pandino-api';
import { ERROR_HANDLER_HOOK_INTERFACE_KEY } from '@judo/web-react';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    registerErrorHandlerInterceptorHook(context);
  }
}
```

#### Error Interceptor Hook

```typescript
// src/custom/hooks/error-handler-interceptor.ts
import { ErrorHandlerInterceptorHook, ErrorHandlingOption } from '@judo/web-react';

export function registerErrorHandlerInterceptorHook(context: BundleContext): void {
  const hook: ErrorHandlerInterceptorHook = () => {
    return {
      shouldInterceptError: (error: any, options?: ErrorHandlingOption<any>) => {
        // Intercept validation errors (HTTP 422)
        if (error.response?.status === 422) {
          return true;
        }

        // Intercept business errors (HTTP 400 with specific structure)
        if (error.response?.status === 400 && error.response?.data?.code) {
          return true;
        }

        return false;
      },

      interceptError: (
        error: any,
        options?: ErrorHandlingOption<any>,
        payload?: any,
        dataPath?: string
      ) => {
        const { response } = error;

        // Handle validation errors
        if (response?.status === 422) {
          const validationErrors = response.data?.validationResults || [];

          if (validationErrors.length > 0) {
            const errorMessages = validationErrors
              .map((result: ValidationResult) => result.message)
              .join('\n');

            // Show custom snackbar
            options?.showErrorDialog?.(
              'Validation Error',
              errorMessages,
              'warning'
            );

            // Prevent default error handling
            return true;
          }
        }

        // Handle business errors
        if (response?.status === 400 && response?.data?.code) {
          const { code, title, details } = response.data;

          options?.showErrorDialog?.(
            title || 'Business Rule Violation',
            details || `Error code: ${code}`,
            'error'
          );

          return true;
        }

        // Let default handler process other errors
        return false;
      },
    };
  };

  context.registerService<ErrorHandlerInterceptorHook>(
    ERROR_HANDLER_HOOK_INTERFACE_KEY,
    hook
  );
}
```

#### Validation Result Type

```typescript
interface ValidationResult {
  location: string;  // Field path
  code: string;      // Error code
  message: string;   // Translated error message
}

interface BusinessError {
  code: string;
  title: string;
  details: string;
}
```

### Integration with Backend Errors

The interceptor works seamlessly with backend validation and business errors:

```java
// Backend: Throwing validation errors
List<ValidationResult> validationResults = new ArrayList<>();
validationResults.add(
    ExceptionUtils.createValidationResult(
        "dateField",
        i18n.future_date_not_allowed()
    )
);
throw ExceptionUtils.createValidationException(validationResults);

// Backend: Throwing business errors
throw ExceptionUtils.createBusinessException(
    i18n.operation_failed(),
    i18n.entity_must_be_active()
);
```

---

## Pure State Transformation Functions

### Overview

Immutable state transformation utilities that enable predictable state updates in React components without side effects.

### Use Cases

- Complex nested state updates
- Maintaining immutability in reducers
- Reusable state transformation logic
- Testing state transitions

### Implementation

#### Helper Functions

```typescript
// src/custom/hooks/utils/state-transformer.ts

/**
 * Updates a parameter value in nested dimension groups structure
 * Returns new array with immutable updates
 */
export function onValueChangeOnView(
  identifier: string,
  propertyName: keyof ParameterInput,
  value: any,
  dimensionGroups: DimensionGroupInput[],
): DimensionGroupInput[] {
  return dimensionGroups.map((group) => {
    // Handle multi-line groups with rows
    if (group.multiLine && group.rows) {
      const newRows = group.rows.map((row) => {
        const newParameters = row.parameters!.map((param) => {
          if (param.__identifier === identifier) {
            return { ...param, [propertyName]: value };
          }
          return param;
        });
        return { ...row, parameters: newParameters };
      });
      return { ...group, rows: newRows };
    }

    // Handle single-line groups with parameters
    if (group.parameters) {
      const newParameters = group.parameters.map((param) => {
        if (param.__identifier === identifier) {
          return { ...param, [propertyName]: value };
        }
        return param;
      });
      return { ...group, parameters: newParameters };
    }

    return group;
  });
}

/**
 * Adds a new row to a multi-line dimension group
 */
export function onRowAddOnView(
  groupIdentifier: string,
  templateParameters: ParameterInput[],
  dimensionGroups: DimensionGroupInput[],
): DimensionGroupInput[] {
  return dimensionGroups.map((group) => {
    if (group.__identifier === groupIdentifier && group.multiLine) {
      const newRow: RowInput = {
        __identifier: crypto.randomUUID(),
        parameters: templateParameters.map((template) => ({
          ...template,
          __identifier: crypto.randomUUID(),
          value: null,
        })),
      };

      return {
        ...group,
        rows: [...(group.rows || []), newRow],
      };
    }
    return group;
  });
}

/**
 * Deletes a row from a multi-line dimension group
 */
export function onRowDeleteOnView(
  groupIdentifier: string,
  rowIdentifier: string,
  dimensionGroups: DimensionGroupInput[],
): DimensionGroupInput[] {
  return dimensionGroups.map((group) => {
    if (group.__identifier === groupIdentifier && group.multiLine) {
      return {
        ...group,
        rows: group.rows?.filter((row) => row.__identifier !== rowIdentifier) || [],
      };
    }
    return group;
  });
}

/**
 * Resets all parameter values in dimension groups
 */
export function resetParameterValues(
  dimensionGroups: DimensionGroupInput[],
): DimensionGroupInput[] {
  return dimensionGroups.map((group) => {
    if (group.multiLine && group.rows) {
      return {
        ...group,
        rows: group.rows.map((row) => ({
          ...row,
          parameters: row.parameters!.map((param) => ({
            ...param,
            value: null,
          })),
        })),
      };
    }

    if (group.parameters) {
      return {
        ...group,
        parameters: group.parameters.map((param) => ({
          ...param,
          value: null,
        })),
      };
    }

    return group;
  });
}
```

#### Usage in Components

```typescript
const EntityEditPage = () => {
  const [data, setData] = useState<EntityStored>();

  const handleValueChange = (
    identifier: string,
    propertyName: keyof ParameterInput,
    value: any
  ) => {
    setData((prev) => {
      if (!prev?.dimensionGroups) return prev;

      return {
        ...prev,
        dimensionGroups: onValueChangeOnView(
          identifier,
          propertyName,
          value,
          prev.dimensionGroups
        ),
      };
    });
  };

  const handleReset = () => {
    setData((prev) => {
      if (!prev?.dimensionGroups) return prev;

      return {
        ...prev,
        dimensionGroups: resetParameterValues(prev.dimensionGroups),
      };
    });
  };

  return (
    <>
      <DimensionParametersComponent
        dimensionGroups={data?.dimensionGroups}
        onValueChange={handleValueChange}
        editMode
      />
      <Button onClick={handleReset}>Reset</Button>
    </>
  );
};
```

### Benefits

- **Immutability**: All transformations return new objects/arrays
- **Predictability**: Pure functions with no side effects
- **Testability**: Easy to unit test without mocking
- **Reusability**: Functions can be used across multiple components
- **Type Safety**: Full TypeScript support with generics

---

## IMaskInput Integration

### Overview

Integration pattern for IMask library to provide structured data input with masking, validation, and formatting.

### Use Cases

- Phone number formatting
- Date input masking
- Currency formatting
- Custom number formats
- Pattern-based text input

### Installation

```bash
npm install imask react-imask
```

### Implementation

#### Custom IMask Component

```typescript
// src/custom/components/masked-input.tsx
import React from 'react';
import { IMaskInput } from 'react-imask';
import { TextField, TextFieldProps } from '@mui/material';

interface MaskedInputProps {
  mask: string | RegExp | any;
  maskOptions?: any;
  onAccept?: (value: string, mask: any) => void;
  textFieldProps?: Omit<TextFieldProps, 'onChange' | 'value'>;
  value?: string;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  maskOptions = {},
  onAccept,
  textFieldProps,
  value,
}) => {
  return (
    <IMaskInput
      mask={mask}
      {...maskOptions}
      value={value}
      onAccept={onAccept}
      unmask={false}
      inputRef={(el: any) => el}
      overwrite
    >
      {(inputProps: any) => (
        <TextField
          {...textFieldProps}
          {...inputProps}
        />
      )}
    </IMaskInput>
  );
};
```

#### Phone Number Masking

```typescript
import { MaskedInput } from '~/custom/components/masked-input';

const PhoneInput = ({ value, onChange, ...props }) => {
  return (
    <MaskedInput
      mask="+{1} (000) 000-0000"
      value={value}
      onAccept={(maskedValue) => onChange(maskedValue)}
      textFieldProps={{
        label: 'Phone Number',
        fullWidth: true,
        ...props,
      }}
    />
  );
};
```

#### Currency Input

```typescript
const CurrencyInput = ({ value, onChange, ...props }) => {
  return (
    <MaskedInput
      mask={Number}
      maskOptions={{
        scale: 2,
        thousandsSeparator: ',',
        padFractionalZeros: true,
        normalizeZeros: true,
        radix: '.',
        mapToRadix: ['.'],
        min: 0,
        max: 999999999.99,
      }}
      value={value}
      onAccept={(maskedValue, maskInstance) => {
        onChange(maskInstance.unmaskedValue);
      }}
      textFieldProps={{
        label: 'Amount',
        fullWidth: true,
        InputProps: {
          startAdornment: '$',
        },
        ...props,
      }}
    />
  );
};
```

#### Date Input with Custom Format

```typescript
const DateInput = ({ value, onChange, ...props }) => {
  return (
    <MaskedInput
      mask="00/00/0000"
      maskOptions={{
        lazy: false,
        blocks: {
          DD: {
            mask: IMask.MaskedRange,
            from: 1,
            to: 31,
            maxLength: 2,
          },
          MM: {
            mask: IMask.MaskedRange,
            from: 1,
            to: 12,
            maxLength: 2,
          },
          YYYY: {
            mask: IMask.MaskedRange,
            from: 1900,
            to: 2999,
            maxLength: 4,
          },
        },
      }}
      value={value}
      onAccept={(maskedValue) => {
        // Convert MM/DD/YYYY to ISO date
        const [month, day, year] = maskedValue.split('/');
        if (month && day && year && year.length === 4) {
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          onChange(isoDate);
        }
      }}
      textFieldProps={{
        label: 'Date',
        fullWidth: true,
        placeholder: 'MM/DD/YYYY',
        ...props,
      }}
    />
  );
};
```

#### Custom Pattern Input

```typescript
// Social Security Number
const SSNInput = ({ value, onChange, ...props }) => {
  return (
    <MaskedInput
      mask="000-00-0000"
      value={value}
      onAccept={(maskedValue) => onChange(maskedValue)}
      textFieldProps={{
        label: 'SSN',
        fullWidth: true,
        type: 'password',
        ...props,
      }}
    />
  );
};

// Credit Card
const CreditCardInput = ({ value, onChange, ...props }) => {
  return (
    <MaskedInput
      mask="0000 0000 0000 0000"
      value={value}
      onAccept={(maskedValue) => onChange(maskedValue)}
      textFieldProps={{
        label: 'Credit Card',
        fullWidth: true,
        ...props,
      }}
    />
  );
};
```

### Hook Integration

Register masked inputs as custom components:

```typescript
// src/custom/application-customizer.tsx
export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Replace generated TextField with MaskedInput for phone fields
    context.registerService(
      CUSTOM_ATTRIBUTE_RENDERER_HOOK_INTERFACE_KEY,
      {
        shouldRender: (owner: any, attributeName: string) => {
          return attributeName === 'phoneNumber';
        },
        render: (owner: any, attributeName: string, value: any, editMode: boolean) => {
          return editMode ? (
            <PhoneInput
              value={value}
              onChange={(val) => owner.setFieldValue(attributeName, val)}
            />
          ) : (
            <Typography>{value}</Typography>
          );
        },
      },
      { component: 'EntityEditPage' }
    );
  }
}
```

---

## Cascade Loading Pattern

### Overview

Pattern for triggering dependent data loads when a field loses focus (blur event), commonly used for cascading dropdowns or dependent field updates.

### Use Cases

- Cascading dropdowns (Country → State → City)
- Auto-loading related data
- Real-time validation with server lookup
- Dependent field calculations

### Implementation

#### Blur Action Hook

```typescript
// src/custom/hooks/cascade-loading-hook.ts
import { BlurActionHook } from '@judo/web-react';

export function createCascadeLoadingHook(
  ownerAttributeName: string,
  targetRelation: string,
  loadAction: (context: any) => Promise<void>
): BlurActionHook<any> {
  return {
    onBlurAction: async (
      data: any,
      editMode: boolean,
      storeDiff: any,
      context: any
    ) => {
      // Only trigger in edit mode
      if (!editMode) return;

      // Check if the attribute has changed
      const currentValue = data?.[ownerAttributeName];
      const previousValue = storeDiff?.original?.[ownerAttributeName];

      if (currentValue && currentValue !== previousValue) {
        await loadAction(context);
      }
    },
  };
}
```

#### Registration

```typescript
// src/custom/application-customizer.tsx
import { BLUR_ACTION_HOOK_INTERFACE_KEY } from '@judo/web-react';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Country → State cascade
    const countryBlurHook = createCascadeLoadingHook(
      'country',
      'states',
      async (hookContext) => {
        const { data, actions } = hookContext;

        if (data.country) {
          // Clear dependent fields
          actions.setFieldValue('state', null);
          actions.setFieldValue('city', null);

          // Load states for selected country
          const states = await actions.getRangeAction('states')({
            countryId: data.country.__signedIdentifier,
          });

          actions.setFieldValue('statesOptions', states.data);
        }
      }
    );

    context.registerService(
      BLUR_ACTION_HOOK_INTERFACE_KEY,
      countryBlurHook,
      {
        component: 'AddressFormComponent',
        attribute: 'country',
      }
    );

    // State → City cascade
    const stateBlurHook = createCascadeLoadingHook(
      'state',
      'cities',
      async (hookContext) => {
        const { data, actions } = hookContext;

        if (data.state) {
          // Clear dependent field
          actions.setFieldValue('city', null);

          // Load cities for selected state
          const cities = await actions.getRangeAction('cities')({
            stateId: data.state.__signedIdentifier,
          });

          actions.setFieldValue('citiesOptions', cities.data);
        }
      }
    );

    context.registerService(
      BLUR_ACTION_HOOK_INTERFACE_KEY,
      stateBlurHook,
      {
        component: 'AddressFormComponent',
        attribute: 'state',
      }
    );
  }
}
```

#### Auto-Loading Related Data

```typescript
// Load pricing when product is selected
const productBlurHook: BlurActionHook<OrderItemStored> = {
  onBlurAction: async (data, editMode, storeDiff, context) => {
    if (!editMode || !data.product) return;

    const { actions } = context;

    try {
      // Fetch product details with pricing
      const productDetails = await actions.getAction('product')();

      // Auto-fill price and tax rate
      actions.setFieldValue('unitPrice', productDetails.data.basePrice);
      actions.setFieldValue('taxRate', productDetails.data.taxRate);

      // Calculate total
      const quantity = data.quantity || 1;
      const total = productDetails.data.basePrice * quantity;
      actions.setFieldValue('total', total);

    } catch (error) {
      console.error('Failed to load product details:', error);
    }
  },
};
```

#### Server-Side Validation on Blur

```typescript
// Validate email availability using custom validation operation
const emailBlurHook: BlurActionHook<ServiceUserStored> = {
  onBlurAction: async (data, editMode, storeDiff, context) => {
    if (!editMode || !data.email) return;

    const { actions, showErrorDialog } = context;

    // Only check if email changed
    if (data.email === storeDiff?.original?.email) return;

    try {
      // ✅ CORRECT: Use custom validation operation via context actions
      const result = await actions.getAction('validateEmail')({ email: data.email });

      if (!result.data?.available) {
        showErrorDialog(
          'Email Already Registered',
          'This email address is already in use. Please use a different email.',
          'warning'
        );
        actions.setFieldError('email', 'Email already exists');
      } else {
        actions.setFieldError('email', undefined);
      }
    } catch (error) {
      console.error('Email validation failed:', error);
    }
  },
};
```

---

## PostRefresh Action Hook

### Overview

Hook that executes after data refresh operations, commonly used to synchronize UI state with server-side validation or computed fields.

### Use Cases

- Displaying server-computed validation results
- Showing server-calculated totals
- Refreshing dependent UI elements
- Syncing status indicators

### Implementation

#### Hook Registration

```typescript
// src/custom/application-customizer.tsx
import { POST_REFRESH_ACTION_HOOK_INTERFACE_KEY } from '@judo/web-react';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    const postRefreshHook: PostRefreshActionHook<EntityStored> = {
      postRefreshAction: async (data, storeDiff, context) => {
        // Hook logic here
      },
    };

    context.registerService(
      POST_REFRESH_ACTION_HOOK_INTERFACE_KEY,
      postRefreshHook,
      { component: 'EntityViewPage' }
    );
  }
}
```

#### Display Server Validation Results

```typescript
const validationPostRefreshHook: PostRefreshActionHook<OrderStored> = {
  postRefreshAction: async (data, storeDiff, context) => {
    const { actions, showErrorDialog, showSuccessSnackbar } = context;

    // Check if server added validation messages
    if (data.validationResults && data.validationResults.length > 0) {
      const errorMessages = data.validationResults
        .map((result) => `${result.field}: ${result.message}`)
        .join('\n');

      showErrorDialog(
        'Validation Errors',
        errorMessages,
        'warning'
      );

      // Set field-level errors
      data.validationResults.forEach((result) => {
        actions.setFieldError(result.field, result.message);
      });
    } else {
      // Clear previous validation errors
      actions.clearFieldErrors();
      showSuccessSnackbar('Data validated successfully');
    }
  },
};
```

#### Update Calculated Fields

```typescript
const calculationPostRefreshHook: PostRefreshActionHook<InvoiceStored> = {
  postRefreshAction: async (data, storeDiff, context) => {
    const { actions } = context;

    // Server may have calculated totals, taxes, discounts
    // Update UI to reflect server calculations

    if (data.subtotal !== storeDiff?.original?.subtotal) {
      // Subtotal changed on server
      console.log('Subtotal updated by server:', data.subtotal);
    }

    if (data.taxAmount !== storeDiff?.original?.taxAmount) {
      // Tax recalculated
      console.log('Tax recalculated by server:', data.taxAmount);
    }

    // Trigger any dependent UI updates
    actions.triggerRecalculation?.();
  },
};
```

#### Status Synchronization

```typescript
const statusPostRefreshHook: PostRefreshActionHook<WorkflowEntityStored> = {
  postRefreshAction: async (data, storeDiff, context) => {
    const { showInfoSnackbar } = context;

    // Check if status changed on server (e.g., workflow progression)
    if (data.status !== storeDiff?.original?.status) {
      showInfoSnackbar(`Status changed to: ${data.status}`);

      // Update UI elements based on status
      const isLocked = data.status === 'APPROVED' || data.status === 'ARCHIVED';
      context.actions.setReadOnly?.(isLocked);
    }

    // Check if approval date was set
    if (data.approvedAt && !storeDiff?.original?.approvedAt) {
      showInfoSnackbar(`Approved by ${data.approvedBy?.name} on ${data.approvedAt}`);
    }
  },
};
```

#### Refresh Dependent Tables

```typescript
const dependentDataPostRefreshHook: PostRefreshActionHook<ParentEntityStored> = {
  postRefreshAction: async (data, storeDiff, context) => {
    const { actions } = context;

    // If parent entity changed, refresh child tables
    if (data.__version !== storeDiff?.original?.__version) {
      // Refresh all relation tables
      await Promise.all([
        actions.refreshTable?.('childEntities'),
        actions.refreshTable?.('relatedItems'),
        actions.refreshTable?.('attachments'),
      ]);
    }
  },
};
```

---

## Inline Dialog Creation Pattern

### Overview

Pattern for creating and associating nested objects without navigating away from the current page, using modal dialogs.

### Use Cases

- Creating new addresses inline when editing user
- Adding new products while creating order
- Quick creation of lookup values
- Multi-step form flows within dialogs

### Implementation

#### Dialog Hook

```typescript
// src/custom/hooks/inline-create-dialog-hook.ts
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export interface InlineCreateDialogConfig<T> {
  title: string;
  FormComponent: React.ComponentType<{
    data: T;
    validation: any;
    onDataChange: (data: T) => void;
    editMode: boolean;
  }>;
  createAction: (data: T) => Promise<T>;
  onSuccess: (created: T) => void;
  defaultData: () => T;
}

export function useInlineCreateDialog<T>(config: InlineCreateDialogConfig<T>) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T>(config.defaultData());
  const [validation, setValidation] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => {
    setData(config.defaultData());
    setValidation({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const created = await config.createAction(data);
      config.onSuccess(created);
      handleClose();
    } catch (error: any) {
      if (error.response?.data?.validationResults) {
        const errors: any = {};
        error.response.data.validationResults.forEach((result: any) => {
          errors[result.location] = result.message;
        });
        setValidation(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const DialogComponent = () => (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogContent>
        <config.FormComponent
          data={data}
          validation={validation}
          onDataChange={setData}
          editMode
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={isSubmitting}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );

  return {
    open: handleOpen,
    Dialog: DialogComponent,
  };
}
```

#### Usage Example

```typescript
// src/pages/user-edit.tsx
import { useInlineCreateDialog } from '~/custom/hooks/inline-create-dialog-hook';
import { AddressFormComponent } from '~/components/address-form';

const UserEditPage = () => {
  const [userData, setUserData] = useState<UserStored>();

  const addressDialog = useInlineCreateDialog({
    title: 'Create New Address',
    FormComponent: AddressFormComponent,
    createAction: async (addressData) => {
      return await judoService.createAddress(addressData);
    },
    onSuccess: (createdAddress) => {
      // Associate address with user
      setUserData((prev) => ({
        ...prev!,
        address: createdAddress,
      }));
    },
    defaultData: () => ({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    }),
  });

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Address</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addressDialog.open}
              variant="outlined"
              size="small"
            >
              Create New Address
            </Button>
          </Box>
        </Grid>

        {userData?.address && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography>{userData.address.street}</Typography>
                <Typography>
                  {userData.address.city}, {userData.address.state} {userData.address.zipCode}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <addressDialog.Dialog />
    </>
  );
};
```

#### Multi-Step Inline Creation

```typescript
const orderItemDialog = useInlineCreateDialog({
  title: 'Add Order Item',
  FormComponent: ({ data, validation, onDataChange, editMode }) => {
    const [step, setStep] = useState(0);

    return (
      <Box>
        {step === 0 && (
          <ProductSelectionStep
            value={data.product}
            onChange={(product) => {
              onDataChange({ ...data, product });
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <QuantityPriceStep
            data={data}
            validation={validation}
            onChange={onDataChange}
          />
        )}
      </Box>
    );
  },
  createAction: async (itemData) => {
    return await judoService.createOrderItem(itemData);
  },
  onSuccess: (createdItem) => {
    setOrderData((prev) => ({
      ...prev!,
      items: [...(prev!.items || []), createdItem],
    }));
  },
  defaultData: () => ({
    product: null,
    quantity: 1,
    unitPrice: 0,
  }),
});
```

---

## Table Row Highlighting System

### Overview

Declarative system for applying conditional styling to table rows based on data values or custom logic.

### Use Cases

- Highlighting overdue items
- Color-coding by status
- Warning indicators for thresholds
- Priority-based styling

### Implementation

#### Hook Interface

```typescript
// src/custom/hooks/table-row-highlighting.ts
import { TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY } from '@judo/web-react';

export interface TableRowHighlightingHook<T> {
  shouldHighlight: (row: T, index: number) => boolean;
  getHighlightStyle: (row: T, index: number) => React.CSSProperties;
}
```

#### Registration

```typescript
// src/custom/application-customizer.tsx
export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Highlight overdue tasks
    const overdueHighlightHook: TableRowHighlightingHook<TaskStored> = {
      shouldHighlight: (row) => {
        if (!row.dueDate || row.status === 'COMPLETED') return false;
        const dueDate = new Date(row.dueDate);
        const today = new Date();
        return dueDate < today;
      },
      getHighlightStyle: (row) => ({
        backgroundColor: '#ffebee',
        borderLeft: '4px solid #f44336',
      }),
    };

    context.registerService(
      TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
      overdueHighlightHook,
      { component: 'TaskTableComponent' }
    );

    // Highlight by status
    const statusHighlightHook: TableRowHighlightingHook<OrderStored> = {
      shouldHighlight: (row) => true, // Always apply style
      getHighlightStyle: (row) => {
        switch (row.status) {
          case 'PENDING':
            return { backgroundColor: '#fff3e0' };
          case 'PROCESSING':
            return { backgroundColor: '#e3f2fd' };
          case 'COMPLETED':
            return { backgroundColor: '#e8f5e9' };
          case 'CANCELLED':
            return { backgroundColor: '#fce4ec' };
          default:
            return {};
        }
      },
    };

    context.registerService(
      TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
      statusHighlightHook,
      { component: 'OrderTableComponent' }
    );
  }
}
```

#### Priority-Based Highlighting

```typescript
const priorityHighlightHook: TableRowHighlightingHook<IssueStored> = {
  shouldHighlight: (row) => row.priority === 'CRITICAL' || row.priority === 'HIGH',
  getHighlightStyle: (row) => {
    if (row.priority === 'CRITICAL') {
      return {
        backgroundColor: '#ffebee',
        borderLeft: '4px solid #d32f2f',
        fontWeight: 'bold',
      };
    }
    if (row.priority === 'HIGH') {
      return {
        backgroundColor: '#fff3e0',
        borderLeft: '4px solid #f57c00',
      };
    }
    return {};
  },
};
```

#### Threshold-Based Highlighting

```typescript
const inventoryHighlightHook: TableRowHighlightingHook<ProductStored> = {
  shouldHighlight: (row) => {
    const stockLevel = row.currentStock / row.maxStock;
    return stockLevel <= 0.2; // 20% or less
  },
  getHighlightStyle: (row) => {
    const stockLevel = row.currentStock / row.maxStock;

    if (stockLevel === 0) {
      return {
        backgroundColor: '#ffebee',
        color: '#c62828',
        fontWeight: 'bold',
      };
    }
    if (stockLevel <= 0.1) {
      return {
        backgroundColor: '#fff3e0',
        color: '#e65100',
      };
    }
    if (stockLevel <= 0.2) {
      return {
        backgroundColor: '#fffde7',
        color: '#f57f17',
      };
    }

    return {};
  },
};
```

#### Alternating Row Colors with Highlights

```typescript
const ratingHighlightHook: TableRowHighlightingHook<RatingStored> = {
  shouldHighlight: (row, index) => true,
  getHighlightStyle: (row, index) => {
    const baseStyle = index % 2 === 0
      ? { backgroundColor: '#fafafa' }
      : { backgroundColor: '#ffffff' };

    if (row.score >= 4.5) {
      return {
        ...baseStyle,
        borderLeft: '4px solid #4caf50',
      };
    }

    if (row.score <= 2.0) {
      return {
        ...baseStyle,
        borderLeft: '4px solid #f44336',
      };
    }

    return baseStyle;
  },
};
```

---

## Custom Component Replacement

### Overview

Complete replacement of generated UI components with custom implementations while maintaining JUDO integration.

### Use Cases

- Complex custom layouts
- Third-party component integration
- Specialized visualizations
- Custom interaction patterns

### Implementation

#### Component Replacement Hook

```typescript
// src/custom/hooks/component-replacement.ts
import { CUSTOM_COMPONENT_HOOK_INTERFACE_KEY } from '@judo/web-react';

export interface CustomComponentHook {
  shouldReplace: (componentName: string, context: any) => boolean;
  getComponent: (componentName: string, context: any) => React.ComponentType<any>;
}
```

#### Registration

```typescript
// src/custom/application-customizer.tsx
import { CustomDashboard } from '~/custom/components/custom-dashboard';
import { CustomGanttChart } from '~/custom/components/custom-gantt-chart';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    const componentReplacementHook: CustomComponentHook = {
      shouldReplace: (componentName) => {
        return componentName === 'DashboardViewComponent' ||
               componentName === 'ProjectTimelineComponent';
      },
      getComponent: (componentName) => {
        switch (componentName) {
          case 'DashboardViewComponent':
            return CustomDashboard;
          case 'ProjectTimelineComponent':
            return CustomGanttChart;
          default:
            throw new Error(`No custom component for ${componentName}`);
        }
      },
    };

    context.registerService(
      CUSTOM_COMPONENT_HOOK_INTERFACE_KEY,
      componentReplacementHook
    );
  }
}
```

#### Custom Dashboard Example

```typescript
// src/custom/components/custom-dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';

export const CustomDashboard: React.FC<any> = ({ actions, data }) => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await actions.getMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Sales</Typography>
            <Typography variant="h3">
              ${metrics?.totalSales?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Active Orders</Typography>
            <Typography variant="h3">
              {metrics?.activeOrders || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Sales by Category</Typography>
            {metrics?.salesByCategory && (
              <PieChart
                series={[
                  {
                    data: metrics.salesByCategory.map((item: any) => ({
                      id: item.category,
                      value: item.amount,
                      label: item.category,
                    })),
                  },
                ]}
                height={300}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Monthly Revenue</Typography>
            {metrics?.monthlyRevenue && (
              <BarChart
                xAxis={[{ scaleType: 'band', data: metrics.monthlyRevenue.map((m: any) => m.month) }]}
                series={[{ data: metrics.monthlyRevenue.map((m: any) => m.revenue) }]}
                height={400}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
```

#### Custom Gantt Chart Example

```typescript
// src/custom/components/custom-gantt-chart.tsx
import React from 'react';
import { Gantt, Task } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

export const CustomGanttChart: React.FC<any> = ({ data, actions }) => {
  const tasks: Task[] = data?.tasks?.map((task: any) => ({
    start: new Date(task.startDate),
    end: new Date(task.endDate),
    name: task.name,
    id: task.__signedIdentifier,
    type: 'task',
    progress: task.progress || 0,
    dependencies: task.dependencies?.map((d: any) => d.__signedIdentifier) || [],
  })) || [];

  const handleTaskChange = async (task: Task) => {
    try {
      await actions.updateTask({
        __signedIdentifier: task.id,
        startDate: task.start.toISOString(),
        endDate: task.end.toISOString(),
        progress: task.progress,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Project Timeline
      </Typography>
      {tasks.length > 0 ? (
        <Gantt
          tasks={tasks}
          onDateChange={handleTaskChange}
          onProgressChange={handleTaskChange}
          viewMode="Day"
        />
      ) : (
        <Typography>No tasks to display</Typography>
      )}
    </Box>
  );
};
```

#### Integration with JUDO Actions

Custom components receive JUDO context and actions:

```typescript
interface CustomComponentProps {
  // Current data
  data: any;

  // JUDO actions
  actions: {
    refresh: () => Promise<void>;
    getAction: (actionName: string) => (...args: any[]) => Promise<any>;
    getRangeAction: (relationName: string) => (...args: any[]) => Promise<any>;
    setFieldValue: (field: string, value: any) => void;
    setFieldError: (field: string, error?: string) => void;
  };

  // Navigation
  navigate: (path: string) => void;

  // Dialogs
  showErrorDialog: (title: string, message: string, severity?: string) => void;
  showSuccessSnackbar: (message: string) => void;
  showInfoSnackbar: (message: string) => void;

  // Other context
  editMode: boolean;
  validation: Record<string, string>;
  storeDiff: { original: any; current: any };
}
```

---

## Configuration Patterns

### Overview

Centralized configuration for timing, defaults, and behavior customization.

### Use Cases

- Debounce/throttle timing
- Default page sizes
- Retry configurations
- Feature flags
- API endpoints

### Implementation

#### Configuration File

```typescript
// src/custom/config/app-config.ts

export const AppConfig = {
  // Timing configurations
  timing: {
    debounceMs: 300,
    throttleMs: 1000,
    autoSaveDelayMs: 2000,
    tooltipDelayMs: 500,
    snackbarDurationMs: 3000,
  },

  // Table configurations
  table: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    maxSelectableRows: 1000,
  },

  // Validation configurations
  validation: {
    minPasswordLength: 8,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  },

  // API configurations
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },

  // Feature flags
  features: {
    enableAdvancedSearch: true,
    enableBulkOperations: true,
    enableExport: true,
    enableRealTimeUpdates: false,
  },

  // UI preferences
  ui: {
    defaultTheme: 'light',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm:ss',
    currencySymbol: '$',
    decimalPlaces: 2,
  },
};

export type AppConfigType = typeof AppConfig;
```

#### Using Configuration in Hooks

```typescript
// src/custom/hooks/debounced-search-hook.ts
import { useDebouncedCallback } from 'use-debounce';
import { AppConfig } from '~/custom/config/app-config';

export function useDebouncedSearch(searchFn: (query: string) => Promise<void>) {
  const debounced = useDebouncedCallback(
    searchFn,
    AppConfig.timing.debounceMs
  );

  return debounced;
}
```

#### Environment-Specific Configuration

```typescript
// src/custom/config/app-config.ts
const getEnvironmentConfig = () => {
  const env = import.meta.env.MODE;

  switch (env) {
    case 'production':
      return {
        api: {
          baseUrl: 'https://api.production.com',
          timeout: 30000,
          retryAttempts: 3,
        },
        features: {
          enableAdvancedSearch: true,
          enableRealTimeUpdates: true,
        },
        logging: {
          level: 'error',
        },
      };

    case 'staging':
      return {
        api: {
          baseUrl: 'https://api.staging.com',
          timeout: 30000,
          retryAttempts: 2,
        },
        features: {
          enableAdvancedSearch: true,
          enableRealTimeUpdates: true,
        },
        logging: {
          level: 'warn',
        },
      };

    default: // development
      return {
        api: {
          baseUrl: 'http://localhost:8080/api',
          timeout: 60000,
          retryAttempts: 1,
        },
        features: {
          enableAdvancedSearch: true,
          enableRealTimeUpdates: false,
        },
        logging: {
          level: 'debug',
        },
      };
  }
};

export const AppConfig = {
  ...baseConfig,
  ...getEnvironmentConfig(),
};
```

#### Configuration Hook

```typescript
// src/custom/hooks/use-config.ts
import { useContext, createContext } from 'react';
import { AppConfig, AppConfigType } from '~/custom/config/app-config';

const ConfigContext = createContext<AppConfigType>(AppConfig);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConfigContext.Provider value={AppConfig}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  return useContext(ConfigContext);
};

// Usage in components
const MyComponent = () => {
  const config = useConfig();

  const handleSearch = useDebouncedCallback(
    async (query: string) => {
      // Search logic
    },
    config.timing.debounceMs
  );

  return <TextField onChange={(e) => handleSearch(e.target.value)} />;
};
```

#### Dynamic Configuration Updates

```typescript
// src/custom/config/config-manager.ts
import { create } from 'zustand';
import { AppConfig, AppConfigType } from './app-config';

interface ConfigStore {
  config: AppConfigType;
  updateConfig: (updates: Partial<AppConfigType>) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: AppConfig,

  updateConfig: (updates) =>
    set((state) => ({
      config: {
        ...state.config,
        ...updates,
      },
    })),

  resetConfig: () =>
    set({ config: AppConfig }),
}));

// Usage
const SettingsPage = () => {
  const { config, updateConfig } = useConfigStore();

  const handleThemeChange = (theme: string) => {
    updateConfig({
      ui: {
        ...config.ui,
        defaultTheme: theme,
      },
    });
  };

  return (
    <Select value={config.ui.defaultTheme} onChange={(e) => handleThemeChange(e.target.value)}>
      <MenuItem value="light">Light</MenuItem>
      <MenuItem value="dark">Dark</MenuItem>
    </Select>
  );
};
```

---

## Best Practices

### General Guidelines

1. **Immutability**: Always use immutable update patterns (spread operators, map/filter/reduce)
2. **Type Safety**: Leverage TypeScript generics for reusable components
3. **Error Handling**: Implement comprehensive error boundaries and fallbacks
4. **Performance**: Use React.memo, useMemo, useCallback for expensive operations
5. **Testing**: Write unit tests for pure transformation functions
6. **Documentation**: Document complex patterns with inline comments

### Hook Registration Best Practices

1. **Specificity**: Use precise component filters to avoid unintended side effects
2. **Async Handling**: Always handle promise rejections in async hooks
3. **Cleanup**: Implement cleanup logic for subscriptions and timers
4. **Dependencies**: Declare all dependencies in useEffect hooks

### Component Patterns

1. **Composition**: Prefer composition over inheritance
2. **Single Responsibility**: Each component should have one clear purpose
3. **Prop Drilling**: Use context or state management for deep prop passing
4. **Lazy Loading**: Code-split large components with React.lazy()

### State Management

1. **Colocation**: Keep state as close as possible to where it's used
2. **Derived State**: Compute derived values instead of storing them
3. **Normalization**: Normalize nested data structures for easier updates
4. **Optimistic Updates**: Update UI immediately, rollback on errors

---

## Action and Logic Hooks

This section describes patterns for customizing UI behavior at a fine-grained level, such as overriding action logic and dynamically filtering dropdowns. These hooks are typically enabled via the **Model-Driven "Opt-In"** pattern.

### Page and Container Action Hooks

-   **Overview:** Overrides the business logic of actions (button clicks, lifecycle events) at either a generic "container" level or a more specific "page" level (which takes precedence).
-   **Implementation:** An action hook is registered (e.g., for `VIEW_GALAXY_VIEW_CONTAINER_ACTIONS_HOOK_INTERFACE_KEY`). The hook returns an object with implementations for specific action methods, like `postRefreshAction`.

### Dynamic Enumeration Filtering

-   **Overview:** Dynamically filters the list of options in a dropdown field based on the current values of other fields in the same form.
-   **Implementation:** A container action hook provides a `filter<FieldName>Options` method. This method receives the current form `data` and the original `options` array and returns a new, filtered array of options to display.

---

## Advanced Theming and Rendering

These patterns provide fine-grained control over the look and feel of the application, allowing for customizations that go far beyond a global theme.

### Component-Scoped Theming (Sub-Themes)

-   **Overview:** Applies a unique set of styling overrides (a "sub-theme") to a specific component or a distinct part of the component tree.
-   **Implementation:** A `SubThemeHook` is registered with a unique name. This hook returns a theme fragment with `styleOverrides` for specific MUI components. A `<SubThemeWrapper name="...">` component is then used in the UI to apply these targeted styles.

### Table Column Customization

-   **Overview:** Replaces the default rendering of a specific table column with a custom component, ideal for displaying icons, badges, or complex data.
-   **Implementation:** A `ColumnCustomizerHook` is registered, targeted at a specific `component` (table name) and `column`. The hook returns a new column definition, typically overriding the `renderCell` function.

---

## Layout and Navigation Customization

These patterns focus on high-level customization of the application's layout, navigation behavior, and context management.

### Table "Sidekick" Component

-   **Overview:** Injects a custom React component directly above a specific table, commonly used for creating custom filter UIs or charts.
-   **Implementation:** A custom component is registered as a "sidekick" for a specific table. It receives `SidekickComponentProps`, including an `onFiltersChange` callback that allows it to control the filtering of the table below it.

### Dynamic Menu Customization

-   **Overview:** Programmatically modifies the main application navigation menu at runtime.
-   **Implementation:** A `MenuItemsCustomizerHook` receives the generated `menuItems` array and returns a new, modified array, allowing for items to be added, removed, or reordered.

### Context-Aware Multi-Tenancy Patterns

These patterns work together to create a context-aware frontend, which is essential for multi-tenancy. The frontend becomes responsible for maintaining the user's context (e.g., the currently selected tenant) and communicating it to the backend with every request.

-   **API Request Header Enrichment:** Uses an `axios` request interceptor to enrich every outgoing API request with the current context (e.g., a `tenantId` read from the URL). The interceptor injects a custom `X-Judo-RequestParameters` HTTP header, which the backend then uses for model-driven filtering.
-   **Navigation State Preservation:** Uses a `NavigationInterceptor` to automatically preserve URL query parameters (like `tenantId`) across all page navigations, ensuring the user's context is never lost.

_For a complete picture of how these frontend patterns enable secure, backend data filtering, see Architectural Patterns (see `judo-backend-docs` skill)._

## Related Documentation

- [Frontend Hooks Overview](./hooks/SKILL.md)
- [Data Hooks](./hooks/data-hooks.md)
- [Table Hooks](./hooks/table-hooks.md)
- [Action Hooks](./hooks/action-hooks.md)
- [Validation Hooks](./hooks/validation-hooks.md)
- [Theming](./theming.md)
- [i18n](./i18n.md)
