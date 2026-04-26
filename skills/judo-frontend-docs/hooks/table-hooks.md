# Table Hooks

## Overview

Table hooks allow you to customize the behavior and appearance of data tables. These hooks enable row highlighting, custom columns, sidekick components (above-table UI), and column customization.

## Table Row Highlighting

### Purpose

Apply conditional background colors to table rows based on data values. Useful for visually identifying important or problematic records.

### Basic Implementation

```typescript
// src/custom/hooks/tableRowHighlighting.tsx
import { TableRowHighlightingHook } from '~/generated';
import { ServiceItemStored } from '~/generated/data-api';

export const itemHighlighting: TableRowHighlightingHook<ServiceItemStored> = () => {
  return () => ([
    {
      name: 'overdue',
      label: 'Overdue Items',
      backgroundColor: '#ffebee',
      condition: (params) => {
        const deadline = new Date(params.row.dateField);
        return deadline < new Date() && !params.row.completed;
      }
    }
  ]);
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import {
  TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
  TableRowHighlightingHook
} from '~/generated';
import { itemHighlighting } from './hooks/tableRowHighlighting';

context.registerService<TableRowHighlightingHook>(
  TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
  itemHighlighting,
  { component: 'ServiceItemsTable' }
);
```

### Advanced Examples

#### Multiple Highlighting Rules

```typescript
import { TableRowHighlightingHook } from '~/generated';
import { ServiceItemStored } from '~/generated/data-api';

export const itemHighlighting: TableRowHighlightingHook<ServiceItemStored> = () => {
  return () => ([
    {
      name: 'overdue',
      label: 'Overdue Items',
      backgroundColor: '#ffebee',
      condition: (params) => {
        const deadline = new Date(params.row.dateField);
        return deadline < new Date() && !params.row.completed;
      }
    },
    {
      name: 'today',
      label: "Today's Items",
      backgroundColor: '#e3f2fd',
      condition: (params) => {
        const itemDate = new Date(params.row.dateField);
        const today = new Date();
        return itemDate.toDateString() === today.toDateString();
      }
    },
    {
      name: 'high-priority',
      label: 'High Priority',
      backgroundColor: '#fff3e0',
      condition: (params) => params.row.priorityLevel === 'HIGH'
    },
    {
      name: 'completed',
      label: 'Completed',
      backgroundColor: '#e8f5e9',
      condition: (params) => params.row.completed === true
    }
  ]);
};
```

#### Status-Based Highlighting

```typescript
export const entityHighlighting: TableRowHighlightingHook<ServiceEntityStored> = () => {
  return () => ([
    {
      name: 'active',
      label: 'Active Entities',
      backgroundColor: '#e8f5e9',
      condition: (params) => params.row.statusField === 'ACTIVE'
    },
    {
      name: 'draft',
      label: 'Draft Entities',
      backgroundColor: '#fff9c4',
      condition: (params) => params.row.statusField === 'DRAFT'
    },
    {
      name: 'cancelled',
      label: 'Cancelled Entities',
      backgroundColor: '#ffebee',
      condition: (params) => params.row.statusField === 'CANCELLED'
    }
  ]);
};
```

#### Complex Conditions

```typescript
export const locationHighlighting: TableRowHighlightingHook<ServiceLocationStored> = () => {
  return () => ([
    {
      name: 'validated-accurate',
      label: 'Accurately Validated',
      backgroundColor: '#e8f5e9',
      condition: (params) =>
        params.row.qualityScore === 'HIGH' &&
        params.row.coordinate1 !== null &&
        params.row.coordinate2 !== null
    },
    {
      name: 'validated-approximate',
      label: 'Approximate Validation',
      backgroundColor: '#fff3e0',
      condition: (params) =>
        params.row.qualityScore === 'MEDIUM' ||
        params.row.qualityScore === 'LOW'
    },
    {
      name: 'not-validated',
      label: 'Not Validated',
      backgroundColor: '#ffebee',
      condition: (params) =>
        params.row.coordinate1 === null ||
        params.row.coordinate2 === null
    }
  ]);
};
```

## Custom Columns

### Purpose

Add custom columns to tables with custom rendering logic. Useful for computed values, status indicators, or action buttons.

### Basic Implementation

```typescript
// src/custom/hooks/columnCustomizer.tsx
import { ColumnCustomizerHook } from '~/generated';
import { GridRenderCellParams } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import { ServiceLocationStored } from '~/generated/data-api';

export const locationStatusColumn: ColumnCustomizerHook<ServiceLocationStored> = (original) => ({
  ...original,
  field: 'qualityScore',
  headerName: 'Validation Status',
  width: 180,
  renderCell: (params: GridRenderCellParams) => {
    const quality = params.row.qualityScore;
    const colorMap = {
      'HIGH': 'success',
      'MEDIUM': 'warning',
      'LOW': 'info',
      'NONE': 'error'
    };

    return (
      <Chip
        label={quality}
        color={colorMap[quality] || 'default'}
        size="small"
      />
    );
  },
});
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import {
  TABLE_COLUMN_CUSTOMIZER_HOOK_INTERFACE_KEY,
  ColumnCustomizerHook
} from '~/generated';
import { locationStatusColumn } from './hooks/columnCustomizer';

context.registerService<ColumnCustomizerHook>(
  TABLE_COLUMN_CUSTOMIZER_HOOK_INTERFACE_KEY,
  locationStatusColumn,
  { component: 'ServiceLocationsTable', column: 'qualityScore' }
);
```

### Advanced Examples

#### Action Button Column

```typescript
import { Button } from '@mui/material';
import { LocationOn } from '@mui/icons-material';

export const mapViewColumn: ColumnCustomizerHook<ServiceLocationStored> = (original) => ({
  field: 'mapView',
  headerName: 'Map',
  width: 100,
  sortable: false,
  filterable: false,
  renderCell: (params) => {
    const openMap = () => {
      const { coordinate1, coordinate2 } = params.row;
      if (coordinate1 && coordinate2) {
        window.open(
          `https://www.google.com/maps?q=${coordinate1},${coordinate2}`,
          '_blank'
        );
      }
    };

    return (
      <Button
        size="small"
        startIcon={<LocationOn />}
        onClick={openMap}
        disabled={!params.row.coordinate1 || !params.row.coordinate2}
      >
        View
      </Button>
    );
  },
});
```

#### Progress Bar Column

```typescript
import { Box, LinearProgress, Typography } from '@mui/material';

export const entityProgressColumn: ColumnCustomizerHook<ServiceEntityStored> = (original) => ({
  field: 'progress',
  headerName: 'Progress',
  width: 150,
  renderCell: (params) => {
    const total = params.row.totalItems || 0;
    const completed = params.row.completedItems || 0;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={percentage}
              color={percentage === 100 ? 'success' : 'primary'}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {Math.round(percentage)}%
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  },
});
```

#### Computed Value Column

```typescript
import { format } from 'date-fns';

export const daysUntilColumn: ColumnCustomizerHook<ServiceItemStored> = (original) => ({
  field: 'daysUntil',
  headerName: 'Days Until',
  width: 120,
  renderCell: (params) => {
    const itemDate = new Date(params.row.dateField);
    const today = new Date();
    const diff = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let color: 'error' | 'warning' | 'success' | 'default' = 'default';
    if (diff < 0) color = 'error';
    else if (diff <= 3) color = 'warning';
    else if (diff <= 7) color = 'success';

    return (
      <Chip
        label={diff < 0 ? `${Math.abs(diff)} days ago` : `${diff} days`}
        color={color}
        size="small"
      />
    );
  },
});
```

## Sidekick Components

### Purpose

Add custom UI components above tables (but within the table container). Useful for charts, statistics, filters, or quick actions.

### Basic Implementation

```typescript
// src/custom/components/EntityChartSidekick.tsx
import { FC } from 'react';
import { Paper, Typography } from '@mui/material';
import { ServiceEntityStored } from '~/generated/data-api';

interface EntityChartSidekickProps {
  data: ServiceEntityStored[];
}

export const EntityChartSidekick: FC<EntityChartSidekickProps> = ({ data }) => {
  const totalEntities = data.length;
  const activeEntities = data.filter(e => e.statusField === 'ACTIVE').length;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">Entity Overview</Typography>
      <Typography>Total: {totalEntities}</Typography>
      <Typography>Active: {activeEntities}</Typography>
    </Paper>
  );
};
```

### Registration

```typescript
// src/custom/application-customizer.tsx
import { SIDEKICK_COMPONENT_INTERFACE_KEY } from '~/generated';
import { EntityChartSidekick } from './components/EntityChartSidekick';

context.registerService<FC>(
  SIDEKICK_COMPONENT_INTERFACE_KEY,
  EntityChartSidekick,
  { component: 'ServiceEntitiesTable' }
);
```

### Advanced Examples

#### Statistics Dashboard

```typescript
import { FC, useMemo } from 'react';
import { Paper, Grid, Card, CardContent, Typography } from '@mui/material';
import { TrendingUp, CheckCircle, Schedule, Cancel } from '@mui/icons-material';

export const EntityStatsSidekick: FC<{ data: ServiceEntityStored[] }> = ({ data }) => {
  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter(e => e.statusField === 'ACTIVE').length,
    completed: data.filter(e => e.statusField === 'COMPLETED').length,
    draft: data.filter(e => e.statusField === 'DRAFT').length,
    cancelled: data.filter(e => e.statusField === 'CANCELLED').length,
  }), [data]);

  const statCards = [
    { label: 'Active', value: stats.active, icon: TrendingUp, color: '#4caf50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: '#2196f3' },
    { label: 'Draft', value: stats.draft, icon: Schedule, color: '#ff9800' },
    { label: 'Cancelled', value: stats.cancelled, icon: Cancel, color: '#f44336' },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <stat.icon sx={{ fontSize: 40, color: stat.color, mr: 2 }} />
                  <div>
                    <Typography variant="h4">{stat.value}</Typography>
                    <Typography color="text.secondary">{stat.label}</Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};
```

#### Quick Filter Sidekick

```typescript
import { FC, useState } from 'react';
import { Paper, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';

export const EntityFilterSidekick: FC<{ data: ServiceEntityStored[] }> = ({ data }) => {
  const [filter, setFilter] = useState<string>('all');

  const handleFilterChange = (event: React.MouseEvent<HTMLElement>, newFilter: string) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      // Trigger table filter
      // This would typically communicate with the table component
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Quick Filter
      </Typography>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handleFilterChange}
        size="small"
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="active">Active</ToggleButton>
        <ToggleButton value="draft">Draft</ToggleButton>
        <ToggleButton value="completed">Completed</ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
};
```

#### Chart Visualization

```typescript
import { FC, useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

export const EntityChartSidekick: FC<{ data: ServiceEntityStored[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const statusCounts = data.reduce((acc, entity) => {
      acc[entity.statusField] = (acc[entity.statusField] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [data]);

  const COLORS = {
    ACTIVE: '#4caf50',
    DRAFT: '#ff9800',
    COMPLETED: '#2196f3',
    CANCELLED: '#f44336',
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Entity Status Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#999'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};
```

## Column Width and Order

### Customize Column Width

```typescript
export const wideTitleColumn: ColumnCustomizerHook<ServiceEntityStored> = (original) => ({
  ...original,
  width: 300, // Increase width
  flex: 1,    // Or use flex for responsive width
});
```

### Hide Columns

```typescript
export const hideColumn: ColumnCustomizerHook<ServiceEntityStored> = (original) => ({
  ...original,
  hide: true,
});
```

### Make Column Non-Sortable

```typescript
export const nonSortableColumn: ColumnCustomizerHook<ServiceEntityStored> = (original) => ({
  ...original,
  sortable: false,
  filterable: false,
});
```

## Best Practices

### 1. Type Safety

```typescript
// ✅ Good - Specify data type
export const myHook: TableRowHighlightingHook<ServiceEntityStored> = () => {
  return () => ([...]);
};

// ❌ Bad - No type
export const myHook: TableRowHighlightingHook = () => {
  return () => ([...]);
};
```

### 2. Memoize Computed Values

```typescript
// ✅ Good - Use useMemo
export const StatsSidekick: FC<{ data }> = ({ data }) => {
  const stats = useMemo(() => computeStats(data), [data]);
  return <div>{stats}</div>;
};

// ❌ Bad - Recompute on every render
export const StatsSidekick: FC<{ data }> = ({ data }) => {
  const stats = computeStats(data);
  return <div>{stats}</div>;
};
```

### 3. Handle Null Values

```typescript
// ✅ Good - Check for null
renderCell: (params) => {
  if (!params.row.coordinate1 || !params.row.coordinate2) {
    return <Chip label="No Location" color="default" />;
  }
  return <Button>View Map</Button>;
}

// ❌ Bad - No null check
renderCell: (params) => {
  return <Button>View Map</Button>;
}
```

### 4. Protect Custom Files

```bash
# Add to .generator-ignore
echo "src/custom/hooks/tableRowHighlighting.tsx" >> .generator-ignore
echo "src/custom/components/EntityChartSidekick.tsx" >> .generator-ignore
```

### 5. Use Theme Colors

```typescript
// ✅ Good - Use theme colors
backgroundColor: theme.palette.error.light

// ❌ Bad - Hardcoded colors
backgroundColor: '#ffebee'
```

## Complete Example

```typescript
// src/custom/application-customizer.tsx
import {
  ApplicationCustomizer,
  BundleContext,
  TableRowHighlightingHook,
  ColumnCustomizerHook,
  TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
  TABLE_COLUMN_CUSTOMIZER_HOOK_INTERFACE_KEY,
  SIDEKICK_COMPONENT_INTERFACE_KEY
} from '~/generated';
import { itemHighlighting } from './hooks/tableRowHighlighting';
import { locationStatusColumn } from './hooks/columnCustomizer';
import { EntityChartSidekick } from './components/EntityChartSidekick';

export class DefaultApplicationCustomizer implements ApplicationCustomizer {
  async customize(context: BundleContext): Promise<void> {
    // Register row highlighting
    context.registerService<TableRowHighlightingHook>(
      TABLE_ROW_HIGHLIGHTING_HOOK_INTERFACE_KEY,
      itemHighlighting,
      { component: 'ServiceItemsTable' }
    );

    // Register custom column
    context.registerService<ColumnCustomizerHook>(
      TABLE_COLUMN_CUSTOMIZER_HOOK_INTERFACE_KEY,
      locationStatusColumn,
      { component: 'ServiceLocationsTable', column: 'qualityScore' }
    );

    // Register sidekick component
    context.registerService<FC>(
      SIDEKICK_COMPONENT_INTERFACE_KEY,
      EntityChartSidekick,
      { component: 'ServiceEntitiesTable' }
    );
  }
}
```

## Troubleshooting

### "Highlighting not applying"

**Check condition logic:**
```typescript
condition: (params) => {
  console.log('Row data:', params.row);
  return params.row.statusField === 'ACTIVE';
}
```

**Verify component name:**
```bash
grep -r "export const.*Table" src/generated/pages/
```

### "Custom column not showing"

**Check registration:**
```typescript
context.registerService<ColumnCustomizerHook>(
  TABLE_COLUMN_CUSTOMIZER_HOOK_INTERFACE_KEY,
  myColumn,
  { component: 'ServiceEntitiesTable', column: 'statusField' }
);
```

### "Sidekick component not rendering"

**Verify props:**
```typescript
export const MySidekick: FC<{ data: any[] }> = ({ data }) => {
  console.log('Sidekick data:', data);
  return <div>...</div>;
};
```

## Related Documentation

- [Hook System Overview](./SKILL.md)
- [Data Hooks](./data-hooks.md)
- [UI Hooks](./ui-hooks.md)
- [Action Hooks](./action-hooks.md)
- [Development Workflow](../development-workflow.md)
