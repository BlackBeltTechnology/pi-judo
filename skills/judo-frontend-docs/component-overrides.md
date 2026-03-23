# Component Overrides

JUDO allows developers to replace generated React components with custom implementations. This enables full control over specific parts of the UI while leaving the rest of the generated code intact.

## Override Registry

Components are registered by their generated identifier:

```typescript
// src/custom/overrides/index.ts
import { componentRegistry } from '~generated/registry';
import { CustomOrderSummary } from './CustomOrderSummary';

componentRegistry.register('Order::Summary::Panel', CustomOrderSummary);
```

## Component Identifiers

Each generated component has a unique identifier following the pattern:

```
<TransferObject>::<View>::<Element>
```

Examples:
- `Order::CreateForm::Panel` -- The main panel of the order creation form
- `Order::Table::ActionBar` -- The action bar above the order table
- `Customer::Detail::Header` -- The header section of customer detail view

## Writing Override Components

Override components receive the same props as the generated component:

```typescript
import React from 'react';
import { PanelProps } from '~generated/components/types';

export const CustomOrderSummary: React.FC<PanelProps> = ({ data, actions }) => {
  return (
    <div className="custom-summary">
      <h2>Order #{data.orderNumber}</h2>
      <p>Total: {formatCurrency(data.total)}</p>
      <button onClick={() => actions.onApprove(data)}>Approve</button>
    </div>
  );
};
```

## Partial Overrides

For minor modifications, wrap the generated component instead of replacing it entirely:

```typescript
import { GeneratedOrderPanel } from '~generated/pages/order/OrderPanel';

export const EnhancedOrderPanel: React.FC<PanelProps> = (props) => {
  return (
    <div>
      <CustomBanner message="Special order handling enabled" />
      <GeneratedOrderPanel {...props} />
    </div>
  );
};
```

## Best Practices

- Prefer hook customizations over full component overrides when possible
- Use partial overrides (wrapping) to minimize divergence from generated code
- Keep the same prop interface to ensure compatibility after regeneration
- Test override components with React Testing Library
