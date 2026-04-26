# UI Hooks

## Overview

UI hooks allow you to customize the visual appearance and layout of the application. These hooks enable you to add custom components to the AppBar, customize the hero section, modify the logo, and change footer text.

## AppBar Extra Components

### Purpose

Add custom components to the application's AppBar (top navigation bar), such as notification bells, user menus, theme toggles, or quick action buttons.

### Basic Implementation

```typescript
// src/custom/components/NotificationBell.tsx
import { FC } from 'react';
import { IconButton, Badge } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

export const NotificationBell: FC = () => {
  const notificationCount = 4; // Replace with actual logic

  const handleClick = () => {
    // Open notifications panel
    console.log('Open notifications');
  };

  return (
    <IconButton color="inherit" onClick={handleClick}>
      <Badge badgeContent={notificationCount} color="error">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { ApplicationCustomizer } from '~/generated';
import { NotificationBell } from './components/NotificationBell';

export const applicationCustomizer: ApplicationCustomizer = {
  appBarComponents: [NotificationBell],
};
```

### Advanced Examples

#### User Profile Menu

```typescript
// src/custom/components/UserProfileMenu.tsx
import { FC, useState } from 'react';
import { IconButton, Menu, MenuItem, Avatar, Typography } from '@mui/material';
import { usePrincipal } from '~/custom/hooks/usePrincipal';

export const UserProfileMenu: FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const principal = usePrincipal();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Implement logout logic
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} color="inherit">
        <Avatar
          src={principal?.avatar}
          alt={principal?.name}
          sx={{ width: 32, height: 32 }}
        />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem disabled>
          <Typography variant="body2">
            {principal?.firstName} {principal?.lastName}
          </Typography>
        </MenuItem>
        <MenuItem onClick={() => { /* Navigate to profile */ }}>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { /* Navigate to settings */ }}>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};
```

#### Theme Toggle

```typescript
// src/custom/components/ThemeToggle.tsx
import { FC, useState } from 'react';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

export const ThemeToggle: FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    // Implement theme switching logic
    // Update theme context or local storage
    localStorage.setItem('theme', darkMode ? 'light' : 'dark');
  };

  return (
    <IconButton onClick={toggleTheme} color="inherit">
      {darkMode ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
};
```

#### Quick Search

```typescript
// src/custom/components/QuickSearch.tsx
import { FC, useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export const QuickSearch: FC = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const searchResults = [
    // Replace with actual search logic
    { id: '1', title: 'Campaign A', type: 'campaign' },
    { id: '2', title: 'Event B', type: 'event' },
  ];

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <SearchIcon />
      </IconButton>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search campaigns, events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <List>
            {searchResults.map(result => (
              <ListItem key={result.id} button>
                <ListItemText
                  primary={result.title}
                  secondary={result.type}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

#### Multiple AppBar Components

```typescript
// src/custom/application-customizer.tsx
import { NotificationBell } from './components/NotificationBell';
import { ThemeToggle } from './components/ThemeToggle';
import { QuickSearch } from './components/QuickSearch';
import { UserProfileMenu } from './components/UserProfileMenu';

export const applicationCustomizer: ApplicationCustomizer = {
  appBarComponents: [
    QuickSearch,
    NotificationBell,
    ThemeToggle,
    UserProfileMenu,
  ],
};
```

## Hero and Logo Customization

### Purpose

Customize the hero section (landing page banner) and application logo.

### Hero Customization

```typescript
// src/custom/application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  hero: {
    backgroundImage: '/images/custom-hero.jpg',
    title: '[Your Application Name]',
    subtitle: '[Application Purpose]',
    backgroundColor: '#1976d2',
    textColor: '#ffffff',
    height: '400px',
  },
};
```

### Logo Customization

```typescript
// src/custom/application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  logo: {
    src: '/images/custom-logo.svg',
    alt: '[Your Application] Logo',
    width: '180px',
    height: '50px',
  },
};
```

### Combined Hero and Logo

```typescript
// src/custom/application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  hero: {
    backgroundImage: '/images/hero-background.jpg',
    title: '[Your Application Name]',
    subtitle: '[Your Application Tagline]',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    height: '500px',
    overlay: true, // Add dark overlay over background image
    overlayOpacity: 0.3,
  },
  logo: {
    src: '/images/logo.svg',
    alt: '[Your Application Name]',
    width: '200px',
    height: '60px',
    onClick: () => {
      // Custom click handler
      window.location.href = '/';
    },
  },
};
```

### Custom Hero Component

For more complex hero customization, create a custom component:

```typescript
// src/custom/components/CustomHero.tsx
import { FC } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

export const CustomHero: FC = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h2" gutterBottom>
          Welcome to [Your Application Name]
        </Typography>
        <Typography variant="h5" paragraph>
          [Description of your application's purpose and benefits]
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            sx={{
              mr: 2,
              backgroundColor: 'white',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              }
            }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            Learn More
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

// Register in application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  heroComponent: CustomHero,
};
```

## Footer Text

### Purpose

Customize the footer text displayed at the bottom of the application.

### Basic Implementation

```typescript
// src/custom/application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  footerText: '© 2025 [Your Application Name]',
};
```

### With HTML

```typescript
// src/custom/application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  footerText: '© 2025 [Your Application Name] | <a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Service</a>',
};
```

### Dynamic Footer

```typescript
// src/custom/components/CustomFooter.tsx
import { FC } from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

export const CustomFooter: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} [Your Application Name]
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="/privacy" color="inherit" underline="hover">
              Privacy Policy
            </Link>
            <Link href="/terms" color="inherit" underline="hover">
              Terms of Service
            </Link>
            <Link href="/contact" color="inherit" underline="hover">
              Contact
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// Register in application-customizer.tsx
export const applicationCustomizer: ApplicationCustomizer = {
  footerComponent: CustomFooter,
};
```

## Menu Manipulation

### Purpose

Modify the generated navigation menu structure.

### Adding Menu Items

```typescript
// src/custom/hooks/menuCustomizer.tsx
import { MenuItemsCustomizerHook, MenuItem } from '~/generated';

export const customMenuHook: MenuItemsCustomizerHook = () => (menuItems) => {
  // Add custom menu item
  const reportsItem: MenuItem = {
    label: 'Reports',
    icon: 'assessment',
    path: '/reports',
    children: [
      { label: 'Entity Report', path: '/reports/entity' },
      { label: 'Item Report', path: '/reports/item' },
      { label: 'Performance Report', path: '/reports/performance' },
    ]
  };

  // Insert after specific item
  const insertIndex = menuItems.findIndex(item => item.label === 'Entities');

  return [
    ...menuItems.slice(0, insertIndex + 1),
    reportsItem,
    ...menuItems.slice(insertIndex + 1)
  ];
};
```

### Removing Menu Items

```typescript
export const customMenuHook: MenuItemsCustomizerHook = () => (menuItems) => {
  // Remove specific items
  return menuItems.filter(item =>
    item.label !== 'Debug' && item.label !== 'Admin'
  );
};
```

### Reordering Menu Items

```typescript
export const customMenuHook: MenuItemsCustomizerHook = () => (menuItems) => {
  // Define custom order
  const order = ['Dashboard', 'Entities', 'Items', 'Reports', 'Settings'];

  return menuItems.sort((a, b) => {
    const aIndex = order.indexOf(a.label);
    const bIndex = order.indexOf(b.label);

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
};
```

### Role-Based Menu

```typescript
import { usePrincipal } from '~/custom/hooks/usePrincipal';

export const customMenuHook: MenuItemsCustomizerHook = () => (menuItems) => {
  const principal = usePrincipal();

  // Filter menu based on roles
  return menuItems.filter(item => {
    // Admin-only items
    if (item.label === 'Users' || item.label === 'Settings') {
      return principal?.roles?.includes('ADMIN');
    }

    // Manager-only items
    if (item.label === 'Reports') {
      return principal?.roles?.includes('MANAGER') ||
             principal?.roles?.includes('ADMIN');
    }

    // Default: show item
    return true;
  });
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { MENU_ITEMS_CUSTOMIZER_HOOK_INTERFACE_KEY } from '~/generated';
import { customMenuHook } from './hooks/menuCustomizer';

context.registerService<MenuItemsCustomizerHook>(
  MENU_ITEMS_CUSTOMIZER_HOOK_INTERFACE_KEY,
  customMenuHook
);
```

## Best Practices

### 1. Keep Components Small

```typescript
// ✅ Good - Small, focused component
export const NotificationBell: FC = () => {
  return <IconButton><Badge>...</Badge></IconButton>;
};

// ❌ Bad - Too much logic in one component
export const MegaComponent: FC = () => {
  // 200 lines of code
};
```

### 2. Use Consistent Styling

```typescript
// ✅ Good - Use theme colors
<IconButton color="inherit">

// ❌ Bad - Hardcoded colors
<IconButton sx={{ color: '#ffffff' }}>
```

### 3. Handle Loading States

```typescript
// ✅ Good
export const UserMenu: FC = () => {
  const principal = usePrincipal();

  if (!principal) {
    return <CircularProgress size={24} />;
  }

  return <Avatar src={principal.avatar} />;
};
```

### 4. Protect Custom Components

```bash
# Add to .generator-ignore
echo "src/custom/components/NotificationBell.tsx" >> .generator-ignore
echo "src/custom/components/UserProfileMenu.tsx" >> .generator-ignore
```

### 5. Test Responsiveness

```typescript
// Use Material-UI breakpoints
import { useMediaQuery, useTheme } from '@mui/material';

export const ResponsiveMenu: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? <MobileMenu /> : <DesktopMenu />;
};
```

## Complete Example

```typescript
// src/custom/application-customizer.tsx
import { ApplicationCustomizer, BundleContext } from '~/generated';
import { NotificationBell } from './components/NotificationBell';
import { ThemeToggle } from './components/ThemeToggle';
import { UserProfileMenu } from './components/UserProfileMenu';
import { CustomFooter } from './components/CustomFooter';
import { customMenuHook } from './hooks/menuCustomizer';
import { MENU_ITEMS_CUSTOMIZER_HOOK_INTERFACE_KEY } from '~/generated';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Register AppBar components
    context.registerService(
      APPBAR_COMPONENTS_INTERFACE_KEY,
      [NotificationBell, ThemeToggle, UserProfileMenu]
    );

    // Register menu customizer
    context.registerService(
      MENU_ITEMS_CUSTOMIZER_HOOK_INTERFACE_KEY,
      customMenuHook
    );
  }
}

export const applicationCustomizer: ApplicationCustomizer = {
  // Hero configuration
  hero: {
    backgroundImage: '/images/hero.jpg',
    title: '[Your Application Name]',
    subtitle: '[Application Purpose]',
  },

  // Logo configuration
  logo: {
    src: '/images/logo.svg',
    alt: '[Your Application Name]',
    width: '200px',
  },

  // AppBar components
  appBarComponents: [
    NotificationBell,
    ThemeToggle,
    UserProfileMenu,
  ],

  // Footer component
  footerComponent: CustomFooter,
};
```

## Troubleshooting

### "AppBar component not showing"

**Verify registration:**
```typescript
// Check application-customizer.tsx
appBarComponents: [NotificationBell]
```

**Check import:**
```typescript
import { NotificationBell } from './components/NotificationBell';
```

### "Logo not displaying"

**Verify file path:**
```bash
ls -la public/images/logo.svg
# File should exist
```

**Check configuration:**
```typescript
logo: {
  src: '/images/logo.svg',  // Path relative to public/
  alt: 'Logo',
}
```

### "Menu changes not applying"

**Verify hook registration:**
```typescript
context.registerService<MenuItemsCustomizerHook>(
  MENU_ITEMS_CUSTOMIZER_HOOK_INTERFACE_KEY,
  customMenuHook
);
```

## Related Documentation

- [Hook System Overview](./SKILL.md)
- [Data Hooks](./data-hooks.md)
- [Table Hooks](./table-hooks.md)
- [Theming](../theming.md)
- [Development Workflow](../development-workflow.md)
