# Theme Customization

JUDO's frontend uses Material UI (MUI) for its component library. Theme customization is done through MUI's theming system, allowing control over colors, typography, spacing, and component styles.

## Theme Configuration

The theme is defined in the application's theme file:

```typescript
// src/custom/theme/index.ts
import { createTheme } from '@mui/material/styles';

export const customTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    body1: { fontSize: '1rem' },
  },
  spacing: 8, // Base spacing unit in pixels
});
```

## Component-Level Overrides

Override styles for specific MUI components globally:

```typescript
export const customTheme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none' },
      },
      defaultProps: { variant: 'contained' },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: { border: 'none' },
      },
    },
  },
});
```

## JUDO-Specific Theming

Beyond MUI defaults, JUDO-generated components respect additional theme tokens:

- `judoPage.headerHeight` -- Page header height
- `judoTable.rowHeight` -- Default row height in data grids
- `judoForm.labelWidth` -- Label column width in form layouts

## Dark Mode

Toggle dark mode by setting the palette mode:

```typescript
palette: {
  mode: 'dark', // or 'light'
}
```

## Best Practices

- Define all customizations in one theme file for consistency
- Use theme tokens instead of inline styles in custom components
- Test the theme across all generated pages to ensure visual consistency
- Provide both light and dark mode variants when applicable
