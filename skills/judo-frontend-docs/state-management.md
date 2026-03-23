# State Management

JUDO's generated frontend manages state through a combination of server-state hooks, local component state, and React context. Understanding the data flow is key to writing effective customizations.

## Server State

Generated pages use hooks that wrap the JUDO API client for data fetching:

```typescript
// Generated pattern (simplified)
const { data, isLoading, error, refetch } = useMyEntityQuery({
  filter: currentFilter,
  mask: currentMask,
  pageSize: 25,
});
```

The API client handles:
- Request construction from transfer object types
- Response deserialization into typed objects
- Error transformation into structured error objects
- Automatic token refresh for authenticated requests

## Local State

Form state is managed locally within page components:

```typescript
const [formData, setFormData] = useState<MyEntityTO>(initialData);
const [isDirty, setIsDirty] = useState(false);

const handleFieldChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setIsDirty(true);
};
```

## Context Providers

JUDO provides several React context providers:

- **AuthContext** -- Current user, authentication state, login/logout
- **SnackbarContext** -- Global notification display
- **DialogContext** -- Modal dialog management
- **NavigationContext** -- Page navigation and breadcrumb state

Access these in custom components:

```typescript
const { currentUser } = useAuth();
const { showSnackbar } = useSnackbar();
const { openDialog, closeDialog } = useDialog();
```

## Data Flow Pattern

1. Page mounts and fires initial data query via generated hook
2. Server response populates component state
3. User interactions update local form state
4. On save, the API client sends the modified data to the backend
5. On success, the query hook refetches to sync server state

## Optimistic Updates

For responsive UIs, apply changes locally before server confirmation:

```typescript
const handleToggle = async (item: ItemTO) => {
  const updated = { ...item, active: !item.active };
  setLocalData(prev => prev.map(i => i.id === item.id ? updated : i));
  try {
    await apiClient.update(updated);
  } catch {
    setLocalData(prev => prev.map(i => i.id === item.id ? item : i)); // Rollback
  }
};
```

## Best Practices

- Do not duplicate server state locally -- use the generated query hooks
- Keep form state close to where it is used
- Use context providers for truly global state only
- Handle loading and error states in every data-fetching component
