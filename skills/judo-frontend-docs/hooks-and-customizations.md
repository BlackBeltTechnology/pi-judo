# Hooks and Customizations

Hooks are the primary mechanism for customizing generated frontend behavior. Each generated page exposes a hook interface that controls actions, validations, visibility, and data transformations.

## Hook Types

### Action Hooks

Override the behavior of buttons and actions on a page:

```typescript
export const customizeMyPageActions: MyPageActionsHook = () => ({
  postCreateAction: async (data, result) => {
    // Custom logic after creation
    showNotification('Created successfully');
  },
  preDeleteAction: async (data) => {
    // Confirmation or validation before delete
    return confirm('Are you sure?');
  },
});
```

### Mask Hooks

Control which fields are fetched from the backend:

```typescript
export const customizeMyPageMask: MyPageMaskHook = (defaultMask) => ({
  ...defaultMask,
  additionalRelation: true,  // Include extra relation data
});
```

### Visibility Hooks

Control the visibility of fields and actions:

```typescript
export const customizeMyPageVisibility: MyPageVisibilityHook = () => ({
  isFieldHidden: (fieldName, data) => {
    if (fieldName === 'internalNotes' && !data.isAdmin) return true;
    return false;
  },
});
```

## Registration

Custom hooks are registered in the customizer file:

```typescript
// src/custom/pages/myPage.customizer.ts
import { MyPageCustomizer } from '~generated/pages/myPage';

export const myPageCustomizer: MyPageCustomizer = {
  actions: customizeMyPageActions,
  mask: customizeMyPageMask,
  visibility: customizeMyPageVisibility,
};
```

The application bootstrap scans for customizer files and applies them to their corresponding generated pages.

## Best Practices

- Always spread the default values to avoid breaking generated behavior
- Keep hook implementations focused and testable
- Use TypeScript types from the generated interfaces for type safety
- Test hooks in isolation using the provided test utilities
