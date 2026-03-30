# ESM to UI Mapping: Tables & Navigation

**[◄ Widgets](./widgets.md)** | **[Overview](./SKILL.md)**

This document covers table elements, navigation, transformation tracing, and advanced topics.

---

## Table-Specific Elements

These elements are used exclusively within `TransferObjectTable` or `TabularReferenceField`.

### DataColumn (ui:DataColumn)

**Supertypes:** `Column` → `VisualElement` → `NamedElement`

A column within a table displaying a single attribute for each row.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:DataColumn` | `name` | Column name | Column identifier |
| `ui:DataColumn` | `label` | Header text | Column header (i18n) |
| `ui:DataColumn` | `iconName` | Column icon | Header icon |
| `ui:DataColumn` | `dataFeature` | Bound attribute | Data binding |
| `ui:DataColumn` | `width` | Column width | Fixed pixel width |
| `ui:DataColumn` | `flex` | Flex value | Responsive width |
| `ui:DataColumn` | `sortable` | Allow sorting | Sort icon visibility |
| `ui:DataColumn` | `defaultSort` | Initial sort | `ASC`/`DESC`/`NONE` |
| `ui:DataColumn` | `filterable` | Allow filtering | Filter in column menu |
| `ui:DataColumn` | `hidden` | Hidden state | Column not displayed |
| `ui:DataColumn` | `align` | Text alignment | `LEFT`/`CENTER`/`RIGHT` |
| `ui:DataColumn` | `isPinnable` | Allow pinning | Pin column to left/right |
| `ui:DataColumn` | `formatValue` | Apply formatting | Format numeric values |
| `ui:DataColumn` | `customImplementation` | Custom column | Extension point for custom rendering |

**Default Sort Values:**

| Value | Frontend Effect |
|-------|-----------------|
| `ASC` | Ascending sort on initial load |
| `DESC` | Descending sort on initial load |
| `NONE` | No initial sort (default) |

**Example:**
```xml
<columns xsi:type="ui:DataColumn"
  xmi:id="_GHI789"
  name="nameColumn"
  label="Name"
  dataFeature="_nameAttribute"
  width="200"
  sortable="true"
  defaultSort="ASC"
  isPinnable="true"/>
```

### DataFilter (ui:DataFilter)

**Supertypes:** `VisualElement` → `NamedElement`

Filter control for a table, allowing users to search or narrow down results.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:DataFilter` | `name` | Filter name | Filter identifier |
| `ui:DataFilter` | `label` | Filter label | Filter label (i18n) |
| `ui:DataFilter` | `iconName` | Filter icon | Input icon |
| `ui:DataFilter` | `dataFeature` | Bound attribute | Filter target |
| `ui:DataFilter` | `filterOperationType` | Filter mode | Comparison type |
| `ui:DataFilter` | `placeholder` | Input hint | Placeholder text |
| `ui:DataFilter` | `defaultValue` | Initial value | Pre-filled filter |
| `ui:DataFilter` | `hidden` | Hidden state | Filter not displayed |
| `ui:DataFilter` | `col` | Grid column | Filter width in grid |

**Filter Operation Types:**

| Type | Frontend Effect |
|------|-----------------|
| `EQUALS` | Exact match filter |
| `NOT_EQUALS` | Not equal filter |
| `LESS_THAN` | Less than comparison |
| `LESS_OR_EQUAL` | Less than or equal |
| `GREATER_THAN` | Greater than comparison |
| `GREATER_OR_EQUAL` | Greater than or equal |
| `LIKE` | Contains/partial match |
| `NOT_LIKE` | Does not contain |
| `RANGE` | From/to range filter |
| `ENUMERATION` | Dropdown selection |
| `BOOLEAN` | Checkbox/toggle |

**Example:**
```xml
<filters xsi:type="ui:DataFilter"
  xmi:id="_JKL012"
  name="statusFilter"
  label="Status"
  dataFeature="_statusAttribute"
  filterOperationType="ENUMERATION"
  col="4"/>
```

### TableOperation (ui:TableOperation)

**Supertypes:** `PerformableAction` → `VisualElement` → `NamedElement`

An action that can be performed on table rows (row-level operations) or as bulk operations.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:TableOperation` | `name` | Operation name | Action identifier |
| `ui:TableOperation` | `label` | Button text | Action label (i18n) |
| `ui:TableOperation` | `iconName` | Icon | Action icon |
| `ui:TableOperation` | `operation` | Target operation | Operation binding |
| `ui:TableOperation` | `isBulk` | Bulk scope | Enable for multi-select |
| `ui:TableOperation` | `variant` | Button style | contained/outlined/text |
| `ui:TableOperation` | `hiddenBy` | Hidden condition | DataFeature controlling visibility |
| `ui:TableOperation` | `enabledBy` | Enabled condition | DataFeature controlling enabled state |
| `ui:TableOperation` | `operationForm` | Nested form | Form configuration for parameters |
| `ui:TableOperation` | `confirmationType` | Confirmation | `NONE`/`CONDITIONAL`/`MANDATORY` |
| `ui:TableOperation` | `confirmationMessage` | Confirmation text | Message in confirmation dialog |
| `ui:TableOperation` | `confirmationCondition` | Confirmation condition | Boolean DataFeature |

**Context:** TableOperations are placed in either `rowOperations` or `tableOperations` container:
- `rowOperations` - Appears in row action menu, operates on single row
- `tableOperations` - Appears in table toolbar, can be bulk operations

**Example:**
```xml
<rowOperations xsi:type="ui:TableOperation"
  xmi:id="_MNO345"
  name="deleteAction"
  label="Delete"
  iconName="delete"
  operation="deleteOperation"
  confirmationType="MANDATORY"
  confirmationMessage="Delete this record?"/>

<tableOperations xsi:type="ui:TableOperation"
  xmi:id="_BLK456"
  name="bulkExport"
  label="Export Selected"
  iconName="download"
  operation="exportOperation"
  isBulk="true"/>
```

### RelationColumn (ui:RelationColumn)

**Supertypes:** `Column` → `VisualElement` → `NamedElement`

A column within a table displaying a relation (link to related entity).

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:RelationColumn` | `name` | Column name | Column identifier |
| `ui:RelationColumn` | `label` | Header text | Column header (i18n) |
| `ui:RelationColumn` | `iconName` | Column icon | Header icon |
| `ui:RelationColumn` | `relationFeature` | Bound relation | Relation binding |
| `ui:RelationColumn` | `width` | Column width | Fixed pixel width |
| `ui:RelationColumn` | `flex` | Flex value | Responsive width |
| `ui:RelationColumn` | `sortable` | Allow sorting | Sort icon visibility |
| `ui:RelationColumn` | `hidden` | Hidden state | Column not displayed |
| `ui:RelationColumn` | `align` | Text alignment | `LEFT`/`CENTER`/`RIGHT` |
| `ui:RelationColumn` | `attributePath` | Display path | Attribute to show from related entity |
| `ui:RelationColumn` | `customImplementation` | Custom column | Extension point |

**Example:**
```xml
<columns xsi:type="ui:RelationColumn"
  xmi:id="_REL123"
  name="customerColumn"
  label="Customer"
  relationFeature="_customerRelation"
  attributePath="name"
  width="200"/>
```

---

## Navigation Elements

These elements define the application's navigation structure.

### MenuItem (ui:MenuItem) - Abstract

**Supertypes:** `VisualElement` → `NamedElement`

Abstract base class for menu items. Use concrete subclasses `MenuItemAccess` or `MenuItemOperation`.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:MenuItem` | `name` | Menu item name | Route identifier |
| `ui:MenuItem` | `label` | Display text | Menu label (i18n) |
| `ui:MenuItem` | `iconName` | Icon | Menu icon |
| `ui:MenuItem` | `hidden` | Hidden state | Not displayed |
| `ui:MenuItem` | `order` | Sort order | Menu position |

### MenuItemAccess (ui:MenuItemAccess)

**Supertypes:** `MenuItem` → `VisualElement` → `NamedElement`

Menu item that navigates to an Access (data table/view).

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:MenuItemAccess` | `name` | Menu item name | Route identifier |
| `ui:MenuItemAccess` | `label` | Display text | Menu label (i18n) |
| `ui:MenuItemAccess` | `iconName` | Icon | Menu icon |
| `ui:MenuItemAccess` | `access` | Target access | Link to data table/view |
| `ui:MenuItemAccess` | `hidden` | Hidden state | Not displayed |
| `ui:MenuItemAccess` | `order` | Sort order | Menu position |

**Example:**
```xml
<menuItems xsi:type="ui:MenuItemAccess"
  xmi:id="_PQR678"
  name="customersMenu"
  label="Customers"
  iconName="people"
  access="_customersAccess"
  order="1"/>
```

### MenuItemOperation (ui:MenuItemOperation)

**Supertypes:** `MenuItem` → `VisualElement` → `NamedElement`

Menu item that triggers a static operation.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:MenuItemOperation` | `name` | Menu item name | Action identifier |
| `ui:MenuItemOperation` | `label` | Display text | Menu label (i18n) |
| `ui:MenuItemOperation` | `iconName` | Icon | Menu icon |
| `ui:MenuItemOperation` | `targetOperation` | Target operation | Static operation binding |
| `ui:MenuItemOperation` | `hidden` | Hidden state | Not displayed |
| `ui:MenuItemOperation` | `order` | Sort order | Menu position |

**Example:**
```xml
<menuItems xsi:type="ui:MenuItemOperation"
  xmi:id="_OPR678"
  name="syncMenu"
  label="Sync Data"
  iconName="sync"
  targetOperation="_syncOperation"
  order="5"/>
```

### MenuItemGroup (ui:MenuItemGroup)

**Supertypes:** `MenuItem` → `VisualElement` → `NamedElement`

A container for creating sub-menus within the main navigation.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:MenuItemGroup` | `name` | Group name | Submenu identifier |
| `ui:MenuItemGroup` | `label` | Display text | Submenu header (i18n) |
| `ui:MenuItemGroup` | `iconName` | Icon | Submenu icon |
| `ui:MenuItemGroup` | `items` | Child items | Nested MenuItem list |
| `ui:MenuItemGroup` | `hidden` | Hidden state | Not displayed |
| `ui:MenuItemGroup` | `order` | Sort order | Menu position |
| `ui:MenuItemGroup` | `collapsed` | Initial state | Collapsed by default |
| `ui:MenuItemGroup` | `orientation` | Menu direction | `HORIZONTAL`/`VERTICAL` |

**Example:**
```xml
<menuItems xsi:type="ui:MenuItemGroup"
  xmi:id="_STU901"
  name="settingsMenu"
  label="Settings"
  iconName="settings"
  order="10">
  <items xsi:type="ui:MenuItemAccess" name="usersMenu" label="Users" access="_usersAccess"/>
  <items xsi:type="ui:MenuItemAccess" name="rolesMenu" label="Roles" access="_rolesAccess"/>
</menuItems>
```

---

## Transformation Tracing

UI model elements contain ESM xmi:id references in their IDs:

```
UI Element ID: Actor/(esm/_ZeK4oLK0EfCC_efogf7jJg)/AttributeType
                     └── ESM xmi:id reference ──┘
```

### Tracing Example

**Goal:** Trace `code` attribute from ESM to frontend

1. **ESM Source** (`model/{{ lowerCase model.name \}}.model`):
```xml
<elements xsi:type="structure:EntityType" name="Campaign">
  <attributes xsi:type="structure:DataMember"
    xmi:id="_ZeK4oLK0EfCC_efogf7jJg"
    name="code"
    required="true"/>
</elements>
```

2. **UI Model** (`application/frontend-react/model/{{ lowerCase model.name \}}-ui.model`):
```xml
<attributes xmi:id="Actor/(esm/_ZeK4oLK0EfCC_efogf7jJg)/AttributeType"
  name="code"
  isRequired="true"/>
```

3. **Generated Frontend** (TextField with required validation)

## ESM Annotations

ESM supports annotations that can be applied to Access elements. Annotations are defined at the model root level and referenced by elements.

### Annotation Definition (ESM)

Annotations are defined at the model root level in `model/{{ lowerCase model.name \}}.model`:

```xml
<annotations xmi:id="_08mnIGStEeuRaM6aPF_6_w"
  name="dashboard"
  className="hu.blackbelt.judo.meta.esm.accesspoint.Access"/>
<annotations xmi:id="_yVrvIGUkEeuRaM6aPF_6_w"
  name="profile"
  className="hu.blackbelt.judo.meta.esm.accesspoint.Access"/>
```

### Available Annotation Types in This Project

| Annotation Name | className | Purpose |
|----------------|-----------|---------|
| `dashboard` | `hu.blackbelt.judo.meta.esm.accesspoint.Access` | Marks access as dashboard entry point |
| `profile` | `hu.blackbelt.judo.meta.esm.accesspoint.Access` | Marks access as user profile entry |

**Note:** These annotations are defined in the model but are currently **not applied to any elements** in the {{ lowerCase model.name \}} project.

### How Annotations Would Be Used

When annotations are applied, elements reference them via `annotations` attribute:

```xml
<!-- Hypothetical usage - not present in current model -->
<accesses xmi:id="..."
  name="someAccess"
  annotations="_08mnIGStEeuRaM6aPF_6_w"
  .../>
```

### Transformation to UI Model

ESM annotations become `availableAnnotations` in the UI model:

```xml
<availableAnnotations xmi:id="Actor/(esm/_08mnIGStEeuRaM6aPF_6_w)/Annotation" name="dashboard"/>
<availableAnnotations xmi:id="Actor/(esm/_yVrvIGUkEeuRaM6aPF_6_w)/Annotation" name="profile"/>
```

When elements have annotations, they would appear as:
```xml
<relations xmi:id="..."
  annotations="Actor/(esm/_08mnIGStEeuRaM6aPF_6_w)/Annotation"
  .../>
```

### Frontend Usage

When annotations are applied to elements, they are passed to components:

```tsx
<ComponentProxy
  ...
  annotations={['dashboard']}  // Array of annotation names
>
```

Helper functions for working with annotations:
- `getAnnotationNamesForElement(element)` - Get all annotation names for an element

## Hook Generation

| ESM Attribute | Generated Hook | Purpose |
|---------------|----------------|---------|
| `generateActionsHook="true"` | `use{Container}Actions` | [Custom action implementations](hooks/action-hooks.md#generated-action-hooks) |
| `generateVisualPropertiesHook="true"` | `use{Container}VisualProps` | [Dynamic visibility/enabled](hooks/ui-hooks.md#visual-property-hooks) |
| Widget `onBlur="true"` | `on{Field}BlurAction` | Field blur event handler |

## Supertype Inheritance and Behaviour

Understanding the supertype hierarchy is essential for determining which attributes are available on each element and what behaviour is inherited.

### Inheritance Hierarchy

```
NamedElement
├── VisualElement
│   ├── FormElement
│   │   ├── Component
│   │   │   ├── Widget
│   │   │   │   ├── DataField
│   │   │   │   ├── ReferenceField
│   │   │   │   │   └── TabularReferenceField (also extends Tabular)
│   │   │   │   ├── Divider
│   │   │   │   ├── Placeholder
│   │   │   │   ├── Icon
│   │   │   │   └── Container
│   │   │   │       ├── Group
│   │   │   │       ├── TabBar
│   │   │   │       ├── Stepper
│   │   │   │       ├── TransferObjectForm
│   │   │   │       └── OperationForm
│   │   │   └── Page
│   │   │       ├── TransferObjectView
│   │   │       └── TransferObjectTable (also extends Tabular)
│   │   └── ActionButton
│   ├── Column
│   │   ├── DataColumn
│   │   └── RelationColumn
│   ├── DataFilter
│   ├── PerformableAction
│   │   └── TableOperation
│   ├── ActionGroup
│   └── MenuItem
│       ├── MenuItemAccess
│       ├── MenuItemOperation
│       └── MenuItemGroup
└── Tabular (mixin)
    ├── TransferObjectTable
    └── TabularReferenceField
```

### Inherited Attributes by Supertype

| Supertype | Inherited Attributes |
|-----------|---------------------|
| `NamedElement` | `name` |
| `VisualElement` | `label`, `iconName`, `customImplementation` |
| `FormElement` | (marker interface) |
| `Component` | `col`, `row`, `hiddenBy`, `enabledBy`, `requiredBy` |
| `Widget` | `onBlur` |
| `Container` | `components` (child widgets) |
| `Page` | `actionGroup`, `additionalMaskFeatures`, `generateVisualPropertiesHook`, `generateActionsHook` |
| `Tabular` | `columns`, `filters`, `rowOperations`, `tableOperations`, `countRows`, `checkboxSelection`, `isInlineEditable` |
| `ReferenceField` | `relationFeature` |
| `PerformableAction` | `operation`, `confirmationType`, `confirmationMessage`, `confirmationCondition` |

### Behaviour Implications

1. **Components** (`col`, `row`): Grid layout positioning with 12-column grid
2. **Widgets** (`onBlur`): Can trigger update actions on blur
3. **Containers** (`components`): Can contain nested UI elements
4. **Pages** (`actionGroup`): Have page-level actions and toolbar
5. **Tabular** (`columns`, `filters`): Support tabular data display with filtering and sorting
6. **PerformableAction** (`confirmationType`): Can show confirmation dialogs

### Type-Specific Behaviour

DataField behaviour varies based on the bound attribute's data type:
- **StringType**: `textWidget`, `textMultiLine`, `textMask`, `isTypeAheadField`
- **EnumerationType**: `enumWidget` (RADIO/COMBO/TOGGLE_BUTTONBAR)
- **NumericType**: `formatValue`, `minValueBy`, `maxValueBy`
- **BooleanType**: `booleanWidget` (CHECKBOX/COMBO), `valueLabelPlacement`
- **DateType/TimestampType/TimeType**: `minValueBy`, `maxValueBy`

See UI Element Behaviour Rules (see `judo-model-docs` skill) for complete conditional rules.

---

## Related Documentation

- UI Element Behaviour Rules (see `judo-model-docs` skill) - Conditional attribute rules and validation
- ESM UI Package Reference (see `judo-model-docs` skill) - Complete UI element definitions
- Transformation Pipeline (see `judo-model-docs` skill) - Model transformation flow
- ESM Concepts (see `judo-model-docs` skill) - ESM metamodel concepts
- Use `judo-model-cli` skill for model queries and tracing
