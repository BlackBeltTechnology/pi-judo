# Navigation and Access Control Hooks

## Overview

Navigation and access control hooks manage routing, redirects, and page-level permissions. These hooks allow you to customize redirect behavior, filter access to pages, add keyboard shortcuts, and intercept navigation.

## Actor Accesses as Menu Items

**Important**: The sidebar menu structure is driven by **Actor accesses** defined in the ESM model. Each access on an Actor becomes a menu item. This is the primary navigation mechanism.

### How Menu Items are Generated

```
ESM Actor Definition:
  └── accesses (list)
        ├── access "Administration" → Menu item "Administration"
        ├── access "Reports" → Menu item "Reports"
        └── access "Settings" → Menu item "Settings"
```

The generated menu is in:
```
src/layout/Drawer/DrawerContent/Navigation/menu-items.tsx
```

### Access Control via Boolean Attributes

Each access, relation, and attribute can have visibility/enablement controlled by three boolean attributes:

| Attribute | Purpose | UI Effect |
|-----------|---------|-----------|
| `hiddenBy` | Visibility control | Element not rendered when `true` |
| `enabledBy` | Interactivity control | Element disabled when `false` |
| `requiredBy` | Validation control | Field required when `true` |

### Backend Interceptor Control

Interceptors can dynamically set boolean values on transfer objects to control frontend visibility:

```java
@Override
public AdministrationInfo preRead(AdministrationInfo input) {
    // Control what the user can see/access
    input.setCanManageUsers(userHasRole("ADMIN"));
    input.setCanViewReports(userHasPermission("reports:view"));
    return input;
}
```

The frontend then uses these values via `hiddenBy`/`enabledBy` expressions:

```xml
<!-- ESM: Relation hidden when canManageUsers is false -->
<relations name="users" target="_UserInfo"
  hiddenBy="not self.canManageUsers"/>
```

### Scope of Access Control

Access control applies to:

1. **Menu Items (Actor Accesses)**: Top-level navigation entries
2. **Relations**: Tabs, tables, and links between transfer objects
3. **Attributes**: Individual form fields/widgets

```xml
<!-- Menu access controlled -->
<accesses name="Administration" hiddenBy="not self.isAdmin"/>

<!-- Relation tab controlled -->
<relations name="sensitiveData" hiddenBy="not self.hasSecurityClearance"/>

<!-- Field widget controlled -->
<attributes name="salary" hiddenBy="not self.canViewSalary" enabledBy="self.canEditSalary"/>
```

## RedirectServiceHook

### Purpose

Customize redirect logic throughout the application. Control where users navigate after operations or when accessing certain routes.

### Basic Implementation

```typescript
// src/custom/hooks/redirectService.tsx
import { useNavigate } from 'react-router-dom';

export const RedirectServiceHook = () => {
  const navigate = useNavigate();

  return (path: string, params?: any) => {
    // Custom redirect logic
    console.log('Redirecting to:', path, params);
    navigate(path, { state: params });
  };
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { REDIRECT_SERVICE_HOOK_INTERFACE_KEY } from '~/generated';
import { RedirectServiceHook } from './hooks/redirectService';

context.registerService(
  REDIRECT_SERVICE_HOOK_INTERFACE_KEY,
  RedirectServiceHook
);
```

### Advanced Examples

#### With Query Parameters

```typescript
export const RedirectServiceHook = () => {
  const navigate = useNavigate();

  return (path: string, params?: any) => {
    // Build query string from params
    const queryParams = new URLSearchParams();

    if (params?.filter) {
      queryParams.set('filter', JSON.stringify(params.filter));
    }

    if (params?.tab) {
      queryParams.set('tab', params.tab);
    }

    const queryString = queryParams.toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;

    navigate(fullPath, { state: params });
  };
};
```

#### With Authentication Check

```typescript
import { usePrincipal } from '~/custom/hooks/usePrincipal';

export const RedirectServiceHook = () => {
  const navigate = useNavigate();
  const principal = usePrincipal();

  return (path: string, params?: any) => {
    // Check if user is authenticated
    if (!principal) {
      navigate('/login', {
        state: { returnUrl: path }
      });
      return;
    }

    // Check if user has access to path
    if (path.includes('/admin') && !principal.roles?.includes('ADMIN')) {
      navigate('/unauthorized');
      return;
    }

    navigate(path, { state: params });
  };
};
```

#### With Analytics Tracking

```typescript
export const RedirectServiceHook = () => {
  const navigate = useNavigate();

  return (path: string, params?: any) => {
    // Track navigation client-side
    console.log('Navigation:', {
      from: window.location.pathname,
      to: path,
      params,
    });

    // ℹ️ NOTE: If you need server-side tracking, implement a custom
    // operation in your backend and call it via context.actions.getAction()
    // Do NOT use direct fetch() calls

    navigate(path, { state: params });
  };
};
```

## Access Filtering

### Purpose

Control page-level access based on user roles, permissions, or custom logic. Hide or restrict access to specific pages.

### Basic Implementation

```typescript
// src/custom/components/AccessFilter.tsx
import { FC } from 'react';
import { AccessFilterComponentProps } from '~/generated';
import { Alert, Container } from '@mui/material';

export const AdminAccessFilter: FC<AccessFilterComponentProps> = ({
  principal,
  children
}) => {
  // Check if user has admin role
  if (!principal?.roles?.includes('ADMIN')) {
    return (
      <Container>
        <Alert severity="error">
          Access Denied: Administrator privileges required
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { ACCESS_FILTER_COMPONENT_INTERFACE_KEY } from '~/generated';
import { AdminAccessFilter } from './components/AccessFilter';

context.registerService<FC<AccessFilterComponentProps>>(
  ACCESS_FILTER_COMPONENT_INTERFACE_KEY,
  AdminAccessFilter,
  { component: 'ServiceUsersPage' }
);
```

### Advanced Examples

#### Permission-Based Access

```typescript
export const PermissionAccessFilter: FC<AccessFilterComponentProps> = ({
  principal,
  children,
  requiredPermission
}) => {
  const hasPermission = principal?.permissions?.includes(requiredPermission);

  if (!hasPermission) {
    return (
      <Container>
        <Alert severity="error">
          You don't have permission to access this page.
          <br />
          Required permission: {requiredPermission}
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};

// Register with specific permission
context.registerService<FC<AccessFilterComponentProps>>(
  ACCESS_FILTER_COMPONENT_INTERFACE_KEY,
  PermissionAccessFilter,
  {
    component: 'ServiceCampaignsPage',
    requiredPermission: 'campaigns:view'
  }
);
```

#### Feature Flag Access

```typescript
// ℹ️ NOTE: Feature flags should be managed through your backend model
// and accessed via principal permissions or metadata, not external API calls

export const FeatureFlagAccessFilter: FC<AccessFilterComponentProps> = ({
  principal,
  children
}) => {
  // ✅ CORRECT: Check feature flags from principal metadata
  const canAccessAdvancedFeatures = principal?.metadata?.features?.advancedReporting === true;

  if (!canAccessAdvancedFeatures) {
    return (
      <Container>
        <Alert severity="info">
          This feature is currently not available for your account.
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};
```

#### Time-Based Access

```typescript
export const TimeBasedAccessFilter: FC<AccessFilterComponentProps> = ({
  principal,
  children,
  allowedHours
}) => {
  const currentHour = new Date().getHours();
  const isAllowed = allowedHours.includes(currentHour);

  if (!isAllowed) {
    return (
      <Container>
        <Alert severity="warning">
          This page is only accessible during business hours (9 AM - 5 PM).
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};

// Register with time restriction
context.registerService<FC<AccessFilterComponentProps>>(
  ACCESS_FILTER_COMPONENT_INTERFACE_KEY,
  TimeBasedAccessFilter,
  {
    component: 'ServiceReportsPage',
    allowedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17]
  }
);
```

#### Custom Loading State

```typescript
// ℹ️ NOTE: For complex async access checks, implement a custom
// operation in your backend and call it on page load
export const AsyncAccessFilter: FC<AccessFilterComponentProps> = ({
  principal,
  children
}) => {
  // ✅ CORRECT: Access control should primarily be based on principal
  // data (roles, permissions) already loaded in the session

  // Simple role-based check (synchronous)
  const hasRequiredRole = principal?.roles?.includes('CAMPAIGN_MANAGER');

  if (!hasRequiredRole) {
    return (
      <Container>
        <Alert severity="error">
          Access Denied: Campaign Manager role required
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};

// If you truly need async access validation, use a container hook instead:
export const pageContainerHook: ViewPageContainerHook = (data, editMode, storeDiff, context) => {
  useEffect(() => {
    // ✅ CORRECT: Call custom access check operation
    context.actions.getAction('checkPageAccess')()
      .then(result => {
        if (!result.data?.canAccess) {
          context.navigate('/access-denied');
        }
      })
      .catch(error => {
        console.error('Access check failed:', error);
        context.navigate('/error');
      });
  }, []);

  return {};
};
```

## Hotkey Support

### Purpose

Add keyboard shortcuts for quick navigation and actions.

### Basic Implementation

```typescript
// src/custom/hooks/hotkeySupport.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useHotkeys = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+N: New campaign
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        navigate('/campaigns/create');
      }

      // Ctrl+Shift+S: Search
      if (event.ctrlKey && event.shiftKey && event.key === 's') {
        event.preventDefault();
        openSearchDialog();
      }

      // Ctrl+H: Home
      if (event.ctrlKey && event.key === 'h') {
        event.preventDefault();
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]);
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  hotkeys: {
    'ctrl+n': () => navigate('/entities/create'),
    'ctrl+shift+s': () => openSearchDialog(),
    'ctrl+h': () => navigate('/'),
    'ctrl+shift+e': () => navigate('/entities'),
    'ctrl+shift+i': () => navigate('/items'),
  },
};
```

### Advanced Examples

#### Context-Aware Hotkeys

```typescript
export const useContextualHotkeys = (context: string) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (context === 'entity-list') {
        // N: New entity (when on entity list)
        if (event.key === 'n' && !event.ctrlKey) {
          event.preventDefault();
          navigate('/entities/create');
        }

        // E: Export (when on entity list)
        if (event.key === 'e' && !event.ctrlKey) {
          event.preventDefault();
          exportEntities();
        }
      }

      if (context === 'entity-view') {
        // E: Edit entity (when viewing entity)
        if (event.key === 'e' && !event.ctrlKey) {
          event.preventDefault();
          navigate('edit');
        }

        // D: Delete entity
        if (event.key === 'd' && !event.ctrlKey) {
          event.preventDefault();
          deleteEntity();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [context, navigate]);
};

// Usage in component
export const EntityList: FC = () => {
  useContextualHotkeys('entity-list');
  return <div>...</div>;
};
```

#### Hotkey Help Dialog

```typescript
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';

export const HotkeyHelp: FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // ?: Show hotkey help
      if (event.key === '?' && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const hotkeys = [
    { key: 'Ctrl+N', description: 'Create new entity' },
    { key: 'Ctrl+Shift+S', description: 'Search' },
    { key: 'Ctrl+H', description: 'Go to home' },
    { key: '?', description: 'Show this help' },
  ];

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Keyboard Shortcuts</DialogTitle>
      <DialogContent>
        <List>
          {hotkeys.map(({ key, description }) => (
            <ListItem key={key}>
              <Chip label={key} size="small" sx={{ mr: 2 \}} />
              <ListItemText primary={description} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};
```

## Navigation Interception

### Purpose

Intercept navigation to add custom behavior, such as sticky parameters or confirmation dialogs.

### Basic Implementation

```typescript
// src/custom/hooks/navigationInterceptor.tsx
import { NavigationInterceptorHook } from '~/generated';

export const navigationHook: NavigationInterceptorHook = ({ stringifyPath }) => ({
  decorateNavigation: (to) => {
    // Add campaign filter to all navigations
    const currentCampaign = localStorage.getItem('selectedCampaign');

    if (currentCampaign && typeof to === 'string') {
      return `${to}?campaign=${currentCampaign}`;
    }

    return to;
  },

  onBeforeInitialLoad: () => {
    // Initialize campaign selection from URL
    const params = new URLSearchParams(window.location.search);
    const campaign = params.get('campaign');

    if (campaign) {
      localStorage.setItem('selectedCampaign', campaign);
    }
  }
});
```

### Advanced Examples

#### Unsaved Changes Warning

```typescript
export const navigationHook: NavigationInterceptorHook = ({ stringifyPath }) => {
  const hasUnsavedChanges = () => {
    return localStorage.getItem('formDirty') === 'true';
  };

  return {
    beforeNavigate: (to) => {
      if (hasUnsavedChanges()) {
        const confirmed = window.confirm(
          'You have unsaved changes. Do you want to leave?'
        );

        if (!confirmed) {
          return false; // Cancel navigation
        }

        // Clear dirty flag
        localStorage.removeItem('formDirty');
      }

      return true; // Allow navigation
    },
  };
};
```

#### Session Timeout Check

```typescript
// ℹ️ NOTE: Session management is handled by JUDO/Keycloak automatically
// The framework will redirect to login when the session expires
// You typically don't need to implement custom session checks

export const navigationHook: NavigationInterceptorHook = ({ stringifyPath }) => ({
  beforeNavigate: async (to) => {
    // Session validation is handled by the framework
    // You can add custom logic here if needed, but avoid direct API calls

    // Example: Log navigation for debugging
    console.log('Navigating to:', to);

    return true; // Allow navigation
  },
});

// If you need to check auth state, use the principal from context:
export const pageHook: ViewPageContainerHook = (data, editMode, storeDiff, context) => {
  // ✅ CORRECT: Check if user is authenticated via principal
  if (!context.principal) {
    // User not authenticated - framework will handle redirect
    console.warn('No principal found');
  }

  return {};
};
```

## Type-Safe Navigation

### Purpose

Use generated navigation helpers for type-safe routing.

### Basic Usage

```typescript
import { useJudoNavigation } from '~/generated';

export const QuickActions: FC = () => {
  const navigation = useJudoNavigation();

  const goToNewCampaign = () => {
    navigation.navigate('ServiceCampaignCreate', {
      prefill: { status: 'DRAFT' }
    });
  };

  const goToReports = () => {
    navigation.navigate('ServiceReportsTable', {
      filter: { year: 2025 }
    });
  };

  return (
    <Box>
      <Button onClick={goToNewCampaign}>New Campaign</Button>
      <Button onClick={goToReports}>View Reports</Button>
    </Box>
  );
};
```

### Advanced Examples

#### With Parameters

```typescript
const navigation = useJudoNavigation();

// Navigate to entity view with ID
navigation.navigate('ServiceEntityView', {
  id: entity.__identifier,
  tab: 'items',
});

// Navigate with filters
navigation.navigate('ServiceItemsTable', {
  filter: {
    entityId: entity.__identifier,
    statusField: 'ACTIVE',
  },
});
```

#### Dynamic Navigation

```typescript
const navigateToEntity = (entityId: string, action?: string) => {
  const routes = {
    view: 'ServiceEntityView',
    edit: 'ServiceEntityEdit',
    delete: 'ServiceEntityDelete',
  };

  const route = action ? routes[action] : routes.view;

  navigation.navigate(route, {
    id: entityId,
  });
};
```

## Best Practices

### 1. Clean Up Event Listeners

```typescript
// ✅ Good
useEffect(() => {
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);

// ❌ Bad
useEffect(() => {
  window.addEventListener('keydown', handleKeyPress);
}, []); // No cleanup
```

### 2. Prevent Default Browser Behavior

```typescript
// ✅ Good
if (event.ctrlKey && event.key === 'n') {
  event.preventDefault(); // Prevent browser's "new window"
  navigate('/campaigns/create');
}

// ❌ Bad
if (event.ctrlKey && event.key === 'n') {
  navigate('/campaigns/create'); // Browser still opens new window
}
```

### 3. Check Authentication State

```typescript
// ✅ Good
if (!principal) {
  return <Alert>Please log in</Alert>;
}

// ❌ Bad
// Assume user is always logged in
```

### 4. Protect Custom Components

```bash
# Add to .generator-ignore
echo "src/custom/hooks/redirectService.tsx" >> .generator-ignore
echo "src/custom/components/AccessFilter.tsx" >> .generator-ignore
```

## Complete Example

```typescript
// src/custom/application-customizer.tsx
import {
  ApplicationCustomizer,
  BundleContext,
  REDIRECT_SERVICE_HOOK_INTERFACE_KEY,
  ACCESS_FILTER_COMPONENT_INTERFACE_KEY
} from '~/generated';
import { RedirectServiceHook } from './hooks/redirectService';
import { AdminAccessFilter } from './components/AccessFilter';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Register redirect service
    context.registerService(
      REDIRECT_SERVICE_HOOK_INTERFACE_KEY,
      RedirectServiceHook
    );

    // Register access filter
    context.registerService<FC<AccessFilterComponentProps>>(
      ACCESS_FILTER_COMPONENT_INTERFACE_KEY,
      AdminAccessFilter,
      { component: 'ServiceUsersPage' }
    );
  }
}

export const applicationCustomizer: ApplicationCustomizer = {
  // Hotkeys
  hotkeys: {
    'ctrl+n': () => navigate('/campaigns/create'),
    'ctrl+shift+s': () => openSearchDialog(),
    'ctrl+h': () => navigate('/'),
  },
};
```

## Troubleshooting

### "Hotkeys not working"

**Check event listener:**
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey);
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### "Access filter not showing"

**Verify registration:**
```typescript
context.registerService<FC<AccessFilterComponentProps>>(
  ACCESS_FILTER_COMPONENT_INTERFACE_KEY,
  AdminAccessFilter,
  { component: 'ServiceUsersPage' } // Exact component name
);
```

### "Navigation not redirecting"

**Check navigate call:**
```typescript
const navigate = useNavigate();
console.log('Navigating to:', path);
navigate(path);
```

## Related Documentation

- [Hook System Overview](./SKILL.md)
- [Data Hooks](./data-hooks.md)
- [Action Hooks](./action-hooks.md)
- Development Workflow (see `judo-development-workflow.md-docs` skill)
