# Theming and Styling

## Overview

The frontend uses Material-UI (MUI) theming system for consistent styling. Themes can be customized through palette configuration and applied globally or to specific components.

## Color Palette

### Light Theme

**File:** `src/theme/palette.ts`

```typescript
import { createTheme } from '@mui/material/styles';

export const paletteThemeLight = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3c4166ff',
      light: '#6a6f94',
      dark: '#25283d',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff5722',
      light: '#ff8a50',
      dark: '#c41c00',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
});
```

### Dark Theme

```typescript
export const paletteThemeDark = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    secondary: {
      main: '#f48fb1',
      light: '#ffc1e3',
      dark: '#bf5f82',
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
  },
});
```

## Customizing Theme

### Step 1: Modify Palette File

```bash
cd application/frontend-react/northwind__[actor_fqn]

# Edit theme file
vim src/theme/palette.ts
```

### Step 2: Add to .generator-ignore

```bash
# Protect from regeneration
echo "src/theme/palette.ts" >> .generator-ignore
```

### Step 3: Customize Colors

```typescript
// src/theme/palette.ts
export const paletteThemeLight = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',  // Custom primary color
    },
    secondary: {
      main: '#dc004e',  // Custom secondary color
    },
  },
});
```

### Step 4: Test Changes

```bash
# Start dev server
pnpm run dev

# Changes apply immediately via HMR
```

## Advanced Theme Customization

### Typography

```typescript
import { createTheme } from '@mui/material/styles';

export const customTheme = createTheme({
  palette: {
    // ... palette config
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    button: {
      textTransform: 'none', // Disable uppercase buttons
    },
  },
});
```

### Component Overrides

```typescript
export const customTheme = createTheme({
  palette: {
    // ... palette config
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
});
```

### Spacing and Breakpoints

```typescript
export const customTheme = createTheme({
  spacing: 8, // Default spacing unit (8px)
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});
```

## Sub-Themes for Components

Apply different themes to specific components using the application customizer.

### Configuration

```typescript
// src/custom/application-customizer.tsx
import { ApplicationCustomizer } from '~/generated';

export const applicationCustomizer: ApplicationCustomizer = {
  subThemes: {
    'ServiceEntityCard': {
      palette: {
        primary: { main: '#4caf50' },
        background: { paper: '#f1f8f4' },
      },
    },
    'ServiceItemsTable': {
      palette: {
        primary: { main: '#2196f3' },
      },
      components: {
        MuiDataGrid: {
          styleOverrides: {
            root: {
              border: 'none',
            },
          },
        },
      },
    },
  },
};
```

### Use Cases

**Entity Dashboard:**
```typescript
subThemes: {
  'ServiceEntityDashboard': {
    palette: {
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
  },
}
```

**Admin Section:**
```typescript
subThemes: {
  'ServiceUsersPage': {
    palette: {
      primary: { main: '#f44336' },
      background: { paper: '#fff3e0' },
    },
  },
}
```

## CSS-in-JS Styling

Material-UI uses Emotion for CSS-in-JS. You can use the `sx` prop or styled components.

### Using sx Prop

```typescript
import { Box, Typography } from '@mui/material';

export const CustomComponent = () => (
  <Box
    sx={{
      backgroundColor: 'primary.main',
      color: 'primary.contrastText',
      padding: 2,
      borderRadius: 1,
      '&:hover': {
        backgroundColor: 'primary.dark',
      },
    }}
  >
    <Typography variant="h6">Styled with sx</Typography>
  </Box>
);
```

### Using Styled Components

```typescript
import { styled } from '@mui/material/styles';
import { Card } from '@mui/material';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  '&:hover': {
    boxShadow: theme.shadows[6],
  },
}));

export const CustomCard = () => (
  <StyledCard>
    Content
  </StyledCard>
);
```

### Accessing Theme

```typescript
import { useTheme } from '@mui/material/styles';

export const ThemedComponent = () => {
  const theme = useTheme();
  
  return (
    <div style={{ color: theme.palette.primary.main }}>
      Themed content
    </div>
  );
};
```

## Responsive Styling

### Breakpoint-based Styling

```typescript
import { Box } from '@mui/material';

export const ResponsiveComponent = () => (
  <Box
    sx={{
      width: {
        xs: '100%',    // 0-600px
        sm: '80%',     // 600-960px
        md: '60%',     // 960-1280px
        lg: '50%',     // 1280-1920px
        xl: '40%',     // 1920px+
      },
      padding: {
        xs: 1,
        sm: 2,
        md: 3,
      },
    }}
  >
    Responsive content
  </Box>
);
```

### Using useMediaQuery

```typescript
import { useMediaQuery, useTheme } from '@mui/material';

export const AdaptiveComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {!isMobile && !isTablet && <DesktopView />}
    </div>
  );
};
```

## Dark Mode Toggle

### Implementation

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
    // This would typically update a context or state management
  };
  
  return (
    <IconButton onClick={toggleTheme} color="inherit">
      {darkMode ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
};
```

### Register in AppBar

```typescript
// src/custom/application-customizer.tsx
import { ThemeToggle } from './components/ThemeToggle';

export const applicationCustomizer: ApplicationCustomizer = {
  appBarComponents: [ThemeToggle],
};
```

## Custom Fonts

### Step 1: Add Font Files

```bash
# Create fonts directory
mkdir -p public/fonts

# Add font files
cp ~/Downloads/CustomFont.woff2 public/fonts/
```

### Step 2: Define Font Face

```typescript
// src/theme/typography.ts
import { createTheme } from '@mui/material/styles';

export const customTheme = createTheme({
  typography: {
    fontFamily: 'CustomFont, Roboto, Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'CustomFont';
          font-style: normal;
          font-weight: 400;
          src: url('/fonts/CustomFont.woff2') format('woff2');
        }
      `,
    },
  },
});
```

### Step 3: Apply Theme

```bash
# Protect from regeneration
echo "src/theme/typography.ts" >> .generator-ignore
```

## Global Styles

### Using CssBaseline

```typescript
import { CssBaseline, ThemeProvider } from '@mui/material';
import { paletteThemeLight } from './theme/palette';

export const App = () => (
  <ThemeProvider theme={paletteThemeLight}>
    <CssBaseline />
    {/* Your app components */}
  </ThemeProvider>
);
```

### Custom Global Styles

```typescript
import { GlobalStyles } from '@mui/material';

const customGlobalStyles = (
  <GlobalStyles
    styles={{
      body: {
        backgroundColor: '#fafafa',
      },
      '*::-webkit-scrollbar': {
        width: '8px',
      },
      '*::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
      },
    }}
  />
);
```

## Best Practices

1. **Use Theme Variables** - Don't hardcode colors
   ```typescript
   // Good
   sx={{ color: 'primary.main' }}
   
   // Bad
   sx={{ color: '#1976d2' }}
   ```

2. **Leverage sx Prop** - For one-off styles
   ```typescript
   <Box sx={{ mt: 2, p: 1 }}>Content</Box>
   ```

3. **Styled Components for Reusable Styles** - When used multiple times
   ```typescript
   const StyledCard = styled(Card)(({ theme }) => ({
     padding: theme.spacing(2),
   }));
   ```

4. **Consistent Spacing** - Use theme spacing units
   ```typescript
   sx={{ padding: theme.spacing(2) }} // 16px (8px * 2)
   ```

5. **Responsive Design** - Use breakpoints
   ```typescript
   sx={{
     display: { xs: 'block', md: 'flex' }
   }}
   ```

## Troubleshooting

### "Theme changes not applying"

**Clear cache and rebuild:**
```bash
rm -rf node_modules/.cache
pnpm run dev
```

### "Custom fonts not loading"

**Check font path:**
```typescript
// Font file should be in public/fonts/
src: url('/fonts/CustomFont.woff2')  // Correct
src: url('./fonts/CustomFont.woff2') // Wrong
```

### "Sub-theme not working"

**Verify component name:**
```bash
# Check generated component names
grep -r "export const" src/generated/pages/
```

**Check registration:**
```typescript
// Component name must match exactly
subThemes: {
  'ServiceEntityCard': { ... }  // Correct
  'EntityCard': { ... }         // Wrong
}
```

## Related Documentation

- [Material-UI Theming](https://mui.com/material-ui/customization/theming/)
- [Material-UI Palette](https://mui.com/material-ui/customization/palette/)
- [Material-UI Typography](https://mui.com/material-ui/customization/typography/)
- [Material-UI Breakpoints](https://mui.com/material-ui/customization/breakpoints/)
- [Development Workflow](./development-workflow.md)
- [Main README](./SKILL.md)
