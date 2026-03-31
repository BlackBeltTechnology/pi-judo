# Data Hooks

## Overview

Data hooks provide access to application data and state. These hooks allow you to retrieve information about the current user, access page/dialog data, and manage application state.

## usePrincipal Hook

### Purpose

Access the currently logged-in user's information throughout the application.

### Basic Implementation

**IMPORTANT**: The JUDO framework provides principal data through generated context. You typically access it via hook parameters, not by creating custom hooks.

```typescript
// ⚠️ NOTE: In JUDO, principal is typically accessed through hook context parameters
// Example: Using principal in a container hook

export const entityFormHook: ViewEntityFormContainerHook = (
  data,
  editMode,
  storeDiff,
  // Principal is available in the context
  context
) => {
  // Access current user info from context
  const currentUser = context.principal;

  console.log('Current user:', currentUser);
  console.log('User email:', currentUser?.email);
  console.log('User name:', currentUser?.name);

  return {};
};
```

**If you need principal data outside hooks** (e.g., in a standalone component), use the generated access service:

```typescript
import { useEffect, useState } from 'react';
import { accessServiceImpl } from '~/services/data-axios/AccessServiceImpl';
import type { ServiceUserStored } from '~/services/data-api/model/ServiceUser';

export const usePrincipal = () => {
  const [principal, setPrincipal] = useState<ServiceUserStored | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use generated service, NOT direct fetch()
    accessServiceImpl.getPrincipal()
      .then(response => {
        setPrincipal(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load principal:', error);
        setLoading(false);
      });
  }, []);

  return { principal, loading };
};
```

### Advanced Implementation with Context

```typescript
// src/custom/context/PrincipalContext.tsx
import { createContext, useContext, useState, useEffect, FC, ReactNode } from 'react';
import { accessServiceImpl } from '~/services/data-axios/AccessServiceImpl';
import type { ServiceUserStored } from '~/services/data-api/model/ServiceUser';

interface PrincipalContextType {
  principal?: ServiceUserStored;
  loading: boolean;
  error?: Error;
  refresh: () => Promise<void>;
}

const PrincipalContext = createContext<PrincipalContextType | undefined>(undefined);

export const PrincipalProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [principal, setPrincipal] = useState<ServiceUserStored>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const fetchPrincipal = async () => {
    try {
      setLoading(true);
      // ✅ CORRECT: Use generated access service
      const response = await accessServiceImpl.getPrincipal();
      setPrincipal(response.data);
      setError(undefined);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrincipal();
  }, []);

  return (
    <PrincipalContext.Provider
      value={{
        principal,
        loading,
        error,
        refresh: fetchPrincipal
      }}
    >
      {children}
    </PrincipalContext.Provider>
  );
};

// Hook implementation
export const usePrincipal = (): ServiceUserStored | undefined => {
  const context = useContext(PrincipalContext);
  if (!context) {
    throw new Error('usePrincipal must be used within PrincipalProvider');
  }
  return context.principal;
};
```

### Usage Examples

#### Display User Information

```typescript
import { usePrincipal } from '~/custom/hooks/usePrincipal';
import { Avatar, Typography, Box } from '@mui/material';

export const UserGreeting: FC = () => {
  const principal = usePrincipal();

  if (!principal) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar src={principal.avatar} alt={principal.name} />
      <div>
        <Typography variant="h6">
          Welcome, {principal.firstName} {principal.lastName}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {principal.email}
        </Typography>
      </div>
    </Box>
  );
};
```

#### Role-Based Rendering

```typescript
import { usePrincipal } from '~/custom/hooks/usePrincipal';
import { Button } from '@mui/material';

export const AdminActions: FC = () => {
  const principal = usePrincipal();

  if (!principal?.roles?.includes('ADMIN')) {
    return null;
  }

  return (
    <div>
      <Button variant="contained">Manage Users</Button>
      <Button variant="contained">System Settings</Button>
    </div>
  );
};
```

#### Conditional Features

```typescript
import { usePrincipal } from '~/custom/hooks/usePrincipal';

export const EntityList: FC = () => {
  const principal = usePrincipal();

  const canCreateEntity = principal?.permissions?.includes('entity:create');
  const canDeleteEntity = principal?.permissions?.includes('entity:delete');

  return (
    <div>
      {canCreateEntity && (
        <Button onClick={handleCreate}>Create Entity</Button>
      )}
      {/* Entity list */}
      {canDeleteEntity && (
        <Button color="error" onClick={handleDelete}>Delete</Button>
      )}
    </div>
  );
};
```

### Principal Data Structure

```typescript
interface Principal {
  __identifier: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
  avatar?: string;
  metadata?: Record<string, any>;
}
```

## useViewData Hook

### Purpose

Access and manipulate data in the current page or dialog through JUDO's hook context.

**IMPORTANT**: In JUDO, you DON'T create a `useViewData` hook yourself. Instead, view/page data is accessed through hook parameters provided by the framework.

### Accessing View Data in Hooks

```typescript
// ✅ CORRECT: Access data through hook parameters
export const entityViewHook: ViewEntityViewContainerHook = (
  data,        // ← Current view data
  editMode,
  storeDiff,
  context      // ← Context with actions, principal, etc.
) => {
  // Access current view data
  console.log('Current entity:', data);
  console.log('Entity title:', data?.title);
  console.log('Entity ID:', data?.__identifier);

  // Check if data has changed
  if (storeDiff?.current !== storeDiff?.original) {
    console.log('Data was modified');
  }

  return {};
};
```

### Refreshing View Data

Use the `actions` object provided in hook context:

```typescript
export const entityViewHook: ViewEntityViewContainerHook = (
  data,
  editMode,
  storeDiff,
  context
) => {
  const refreshData = async () => {
    try {
      // ✅ CORRECT: Use framework-provided refresh action
      await context.actions.refresh();
      console.log('Data refreshed');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  useEffect(() => {
    if (viewId) {
      refresh();
    }
  }, [viewId]);

  return { data, isLoading, error, refresh };
};
```

### Usage Examples

#### Display Page Data

```typescript
import { useViewData } from '~/custom/hooks/useViewData';
import { ServiceEntityStored } from '~/generated/data-api';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';

export const EntityStats: FC = () => {
  const { data, isLoading } = useViewData<ServiceEntityStored>();

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!data) {
    return <Typography>No data available</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{data.title}</Typography>
        <Typography>
          Items: {data.items?.length || 0}
        </Typography>
        <Typography>
          Status: {data.statusField}
        </Typography>
      </CardContent>
    </Card>
  );
};
```

#### Refresh Data

```typescript
import { useViewData } from '~/custom/hooks/useViewData';
import { Button, Alert } from '@mui/material';

export const RefreshableView: FC = () => {
  const { data, isLoading, error, refresh } = useViewData();

  return (
    <div>
      {error && (
        <Alert severity="error" onClose={() => refresh()}>
          Error loading data. Click to retry.
        </Alert>
      )}

      <Button
        onClick={refresh}
        disabled={isLoading}
      >
        {isLoading ? 'Refreshing...' : 'Refresh Data'}
      </Button>

      {/* Display data */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
```

#### Custom Data Processing

```typescript
import { useViewData } from '~/custom/hooks/useViewData';
import { ServiceItemStored } from '~/generated/data-api';
import { useMemo } from 'react';

export const ItemStatistics: FC = () => {
  const { data } = useViewData<ServiceItemStored[]>();

  const statistics = useMemo(() => {
    if (!data) return null;

    const total = data.length;
    const completed = data.filter(i => i.completed).length;
    const overdue = data.filter(i =>
      new Date(i.dateField) < new Date() && !i.completed
    ).length;

    return { total, completed, overdue };
  }, [data]);

  if (!statistics) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Typography>Total Items: {statistics.total}</Typography>
      <Typography>Completed: {statistics.completed}</Typography>
      <Typography color="error">Overdue: {statistics.overdue}</Typography>
    </div>
  );
};
```

## Combining Data Hooks

### User-Specific Data

```typescript
import { usePrincipal } from '~/custom/hooks/usePrincipal';
import { useViewData } from '~/custom/hooks/useViewData';
import { ServiceEntityStored } from '~/generated/data-api';

export const MyEntities: FC = () => {
  const principal = usePrincipal();
  const { data: entities } = useViewData<ServiceEntityStored[]>();

  const myEntities = useMemo(() => {
    if (!entities || !principal) return [];

    return entities.filter(e =>
      e.owner?.__identifier === principal.__identifier
    );
  }, [entities, principal]);

  return (
    <div>
      <Typography variant="h5">My Entities</Typography>
      {myEntities.map(entity => (
        <EntityCard key={entity.__identifier} entity={entity} />
      ))}
    </div>
  );
};
```

### Permission-Based Data Filtering

```typescript
import { usePrincipal } from '~/custom/hooks/usePrincipal';
import { useViewData } from '~/custom/hooks/useViewData';

export const FilteredDataView: FC = () => {
  const principal = usePrincipal();
  const { data, isLoading } = useViewData();

  const visibleData = useMemo(() => {
    if (!data || !principal) return [];

    // Filter based on user role
    if (principal.roles?.includes('ADMIN')) {
      return data; // Admins see everything
    }

    // Regular users see only their own data
    return data.filter(item =>
      item.createdBy === principal.__identifier
    );
  }, [data, principal]);

  return (
    <div>
      {isLoading ? (
        <CircularProgress />
      ) : (
        visibleData.map(item => <DataItem key={item.id} data={item} />)
      )}
    </div>
  );
};
```

## Custom Data Hooks

### useCurrentEntity

```typescript
// src/custom/hooks/useCurrentEntity.tsx
import { useState, useEffect } from 'react';
import { ServiceEntityStored } from '~/generated/data-api';
import { entityServiceImpl } from '~/generated/data-axios';

export const useCurrentEntity = (entityId: string) => {
  const [entity, setEntity] = useState<ServiceEntityStored>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const fetchEntity = async () => {
      try {
        setLoading(true);
        const data = await entityServiceImpl.getEntity(entityId);
        setEntity(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntity();
  }, [entityId]);

  return { entity, loading, error };
};
```

### useFilteredItems

```typescript
// src/custom/hooks/useFilteredItems.tsx
import { useState, useEffect } from 'react';
import { ServiceItemStored } from '~/generated/data-api';
import { itemServiceImpl } from '~/generated/data-axios';

interface ItemFilters {
  entityId?: string;
  statusField?: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  fromDate?: Date;
  toDate?: Date;
}

export const useFilteredItems = (filters: ItemFilters) => {
  const [items, setItems] = useState<ServiceItemStored[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await itemServiceImpl.listItems({
          page: 0,
          size: 100,
          filters: {
            entityId: filters.entityId,
            statusField: filters.statusField,
            fromDate: filters.fromDate?.toISOString(),
            toDate: filters.toDate?.toISOString(),
          }
        });
        setItems(response.data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [filters]);

  return { items, loading };
};

// Usage
const { items } = useFilteredItems({
  entityId: '12345',
  statusField: 'PENDING',
  fromDate: new Date('2024-01-01'),
});
```

## Best Practices

### 1. Type Safety

```typescript
// ✅ Good - Specify type
const { data } = useViewData<ServiceEntityStored>();

// ❌ Bad - No type
const { data } = useViewData();
```

### 2. Error Handling

```typescript
// ✅ Good - Handle errors
const { data, error } = useViewData();
if (error) {
  return <Alert severity="error">{error.message}</Alert>;
}

// ❌ Bad - Ignore errors
const { data } = useViewData();
```

### 3. Loading States

```typescript
// ✅ Good - Show loading state
const { data, isLoading } = useViewData();
if (isLoading) return <CircularProgress />;

// ❌ Bad - No loading indicator
const { data } = useViewData();
```

### 4. Memoization

```typescript
// ✅ Good - Memoize computed values
const statistics = useMemo(() => {
  return computeStats(data);
}, [data]);

// ❌ Bad - Recompute on every render
const statistics = computeStats(data);
```

### 5. Protect Custom Hooks

```bash
# Always add custom hooks to .generator-ignore
echo "src/custom/hooks/usePrincipal.tsx" >> .generator-ignore
echo "src/custom/hooks/useViewData.tsx" >> .generator-ignore
```

## Troubleshooting

### "Principal is undefined"

**Check authentication:**
```typescript
const principal = usePrincipal();
console.log('Principal:', principal);

if (!principal) {
  return <div>Please log in</div>;
}
```

### "ViewData not loading"

**Verify viewId:**
```typescript
const { data, isLoading, error } = useViewData('entityView');
console.log('Loading:', isLoading);
console.log('Error:', error);
console.log('Data:', data);
```

### "Stale data"

**Use refresh function:**
```typescript
const { data, refresh } = useViewData();

// Refresh after mutation
const handleSave = async () => {
  await saveEntity();
  refresh(); // Update view data
};
```

## Related Documentation

- [Hook System Overview](./SKILL.md)
- [UI Hooks](./ui-hooks.md)
- [Table Hooks](./table-hooks.md)
- [Action Hooks](./action-hooks.md)
- Development Workflow (see `judo-development-workflow.md-docs` skill)
