# `ui` Package Reference

**[◄ Back to Index](../SKILL.md)**

This package defines the user interface in a declarative way. Its elements create a direct and strong binding to the data models in the `structure` package and the business logic in the `operation` package. A UI generator can use this model to create a complete, functional user interface.

**This file is the per-element reference.** For the **composition / authoring workflow** — how to assemble `<form>`, `<table>`, `<view>` scaffolds on a `TransferObjectType`, the `xsi:type` rules for abstract containments, data binding, layout, and end-to-end wiring onto an `ActorType` menu — see [UI Authoring Guide](../ui-authoring-guide.md).

---

## Quick Reference: All UI Elements

| Category | Elements |
|----------|----------|
| **Containers** | `TransferObjectView`, `TransferObjectTable`, `TransferObjectForm`, `Group`, `TabBar`, `Stepper` |
| **Widgets** | `DataField`, `TabularReferenceField`, `OperationForm`, `TextField`, `ActionButton`, `Divider`, `Placeholder`, `Icon`, `ActionGroup` |
| **Table Elements** | `DataColumn`, `DataFilter`, `TableOperation` |
| **Navigation** | `MenuItemAccess`, `MenuItemOperation`, `MenuItemGroup` |
| **Abstract Base** | `VisualElement`, `Container`, `Component`, `Widget`, `FormElement`, `Tabular`, `SwitchView`, `ReferenceField`, `Column`, `Filter`, `MenuItem`, `PerformableAction` |

## Supertype Quick Reference

| Element | Supertypes (→ indicates inheritance) |
|---------|--------------------------------------|
| `TransferObjectView` | `Container` → `FormElement` → `VisualElement` |
| `TransferObjectForm` | `Container` → `FormElement` → `VisualElement` |
| `TransferObjectTable` | `Tabular` → `VisualElement` |
| `Group` | `Container` + `Component` → `FormElement` → `VisualElement` |
| `TabBar` | `SwitchView` → `Component` → `FormElement` → `VisualElement` |
| `Stepper` | `SwitchView` → `Component` → `FormElement` → `VisualElement` |
| `DataField` | `Widget` → `Component` → `FormElement` → `VisualElement` |
| `TextField` | `Widget` → `Component` → `FormElement` → `VisualElement` |
| `ActionButton` | `Widget` → `Component` → `FormElement` → `VisualElement` |
| `Divider` | `Widget` → `Component` → `FormElement` → `VisualElement` |
| `Placeholder` | `Widget` → `Component` → `FormElement` → `VisualElement` |
| `Icon` | `Widget` → `Component` → `FormElement` → `VisualElement` |
| `OperationForm` | `Widget` + `PerformableAction` → `Component` → `FormElement` → `VisualElement` |
| `ActionGroup` | `Widget` + `PerformableAction` → `Component` → `FormElement` → `VisualElement` |
| `TabularReferenceField` | `Tabular` + `ReferenceField` → `VisualElement` + (`Widget` + `PerformableAction`) |
| `DataColumn` | `Column` → `VisualElement` + `AbstractColumnReference` |
| `DataFilter` | `Filter` → `VisualElement` + `AbstractFilterReference` |
| `TableOperation` | `VisualElement` |
| `MenuItemAccess` | `MenuItem` → `VisualElement` |
| `MenuItemOperation` | `MenuItem` → `VisualElement` |
| `MenuItemGroup` | `MenuItem` → `VisualElement` |

**Note:** Use this table to determine which behaviour rules from [ui-behaviour.md](./ui-behaviour.md) apply to each element.

---

## UI Containers

Top-level elements or containers that structure a screen or a part of a screen.

### TransferObjectView

**Supertypes:** `Container` → `FormElement` → `VisualElement` → `NamedElement`

The main container for a detail screen, used to view or edit a single object.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the view |
| `label` | String | Display title (i18n key) |
| `titleFrom` | Enum | Source for title: `LABEL` (static) or `ATTRIBUTE` (from data) |
| `titleAttribute` | Reference | DataFeature to use as title when `titleFrom=ATTRIBUTE` |
| `dialogSize` | Enum | Dialog dimensions: `UNDEFINED`, `XS`, `SM`, `MD`, `LG`, `XL` |
| `openInDialog` | Boolean | Open view in dialog instead of page |
| `autoCloseOnSave` | Boolean | Automatically close dialog after save |
| `layout` | Enum | Child layout: `HORIZONTAL`, `VERTICAL`, `DEFAULT` |
| `frame` | Boolean | Whether to render with border/card styling |
| `horizontal` | Enum | Horizontal alignment |
| `vertical` | Enum | Vertical alignment |
| `components` | Component[0..*] | Child components (fields, groups, tabs) |
| `additionalMaskFeatures` | DataFeature[0..*] | Additional features to include in data mask |
| `generateActionsHook` | Boolean | Generate custom actions hook |
| `generateVisualPropertiesHook` | Boolean | Generate visual properties hook |

### TransferObjectTable

**Supertypes:** `Tabular` → `VisualElement` → `NamedElement`

The main container for a screen showing a list, grid, or cards of objects.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the table |
| `label` | String | Display header (i18n key) |
| `columns` | DataColumn[0..*] | Column definitions |
| `filters` | Filter[0..*] | Filter controls |
| `rowOperations` | TableOperation[0..*] | Row-level actions |
| `tableOperations` | TableOperation[0..*] | Table-level actions (in toolbar) |
| `rowsPerPage` | Integer | Default pagination size (default: 10) |
| `selectorRowsPerPage` | Integer | Pagination size for selector dialogs |
| `selectorDialogSize` | Enum | Size for selector dialogs |
| `checkboxSelection` | Enum | Row selection: `AUTO`, `ENABLED`, `DISABLED` |
| `masterDetail` | Boolean | Enable master-detail view |
| `representationComponent` | String | Visual representation: `table`, `tag`, `card` |
| `countRows` | Boolean | Show total row count |
| `isInlineEditable` | Boolean | Enable inline editing in table |
| `actionColumnWidth` | Integer | Width of the action column |
| `crudOperationsDisplayed` | Integer | Number of CRUD buttons to show (default: 1) |
| `transferOperationsDisplayed` | Integer | Number of transfer buttons to show (default: 0) |
| `additionalMaskFeatures` | DataFeature[0..*] | Additional features to include in data mask |
| `generateActionsHook` | Boolean | Generate custom actions hook |
| `generateVisualPropertiesHook` | Boolean | Generate visual properties hook |

### TransferObjectForm

**Supertypes:** `Container` → `FormElement` → `VisualElement` → `NamedElement`

A container for an operation's input parameters, often used to generate dialogs.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the form |
| `label` | String | Dialog title (i18n key) |
| `dialogSize` | Enum | Dialog dimensions: `UNDEFINED`, `XS`, `SM`, `MD`, `LG`, `XL` |
| `layout` | Enum | Layout direction: `HORIZONTAL`, `VERTICAL`, `DEFAULT` |
| `frame` | Boolean | Whether to render with border/card styling |
| `horizontal` | Enum | Horizontal alignment |
| `vertical` | Enum | Vertical alignment |
| `components` | Component[0..*] | Child components (input fields, groups) |
| `autoOpenAfterCreate` | Boolean | Auto-open view after create completes |
| `generateActionsHook` | Boolean | Generate custom actions hook |
| `generateVisualPropertiesHook` | Boolean | Generate visual properties hook |

### Group

**Supertypes:** `Container` + `Component` → `FormElement` → `VisualElement` → `NamedElement`

A generic container for visually grouping other components within a view or form.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the group |
| `label` | String | Group header (i18n key) |
| `layout` | Enum | Layout direction: `HORIZONTAL`, `VERTICAL` |
| `frame` | Boolean | Whether to render with border |
| `col` | Integer | Grid column span (1-12) |
| `components` | Component[0..*] | Child components |
| `hidden` | Boolean | Whether group is hidden by default |

### TabBar

**Supertypes:** `SwitchView` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

Container that organizes child Groups into a set of tabs.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the tab bar |
| `orientation` | Enum | Tab direction: `HORIZONTAL`, `VERTICAL` |
| `tabs` | Group[0..*] | Tab panels (each Group becomes a tab) |

**Tab Panel Attributes** (on child Group):

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | String | Tab label (i18n key) |
| `iconName` | String | Tab icon |
| `components` | Component[0..*] | Tab content |

### Stepper

**Supertypes:** `SwitchView` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

Container that organizes child Groups into a sequential wizard-style flow.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the stepper |
| `orientation` | Enum | Stepper direction: `HORIZONTAL`, `VERTICAL` |
| `linear` | Boolean | Force sequential navigation (no step skipping) |
| `steps` | Group[0..*] | Step panels (each Group becomes a step) |

**Step Panel Attributes** (on child Group):

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | String | Step label (i18n key) |
| `optional` | Boolean | Whether step can be skipped |
| `components` | Component[0..*] | Step content |

---

## UI Components & Widgets

Individual controls that a user interacts with. They are almost always directly bound to a feature from the `structure` or `operation` models.

### DataField

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

A widget for displaying/editing a single primitive value (e.g., text box, checkbox, date picker).

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the field |
| `label` | String | Field label (i18n key) |
| `dataFeature` | Reference | Bound to `structure:DataMember` |
| `iconName` | String | Input adornment icon |
| `col` | Integer | Grid column span (1-12) |
| `row` | Integer | Row span (for textarea) |
| `stretch` | Enum | Stretch behavior: `NONE`, `HORIZONTAL`, `VERTICAL`, `BOTH` |
| `fit` | Enum | Fit mode: `LOOSE`, `TIGHT` |
| `hiddenBy` | Reference | DataFeature controlling visibility |
| `enabledBy` | Reference | DataFeature controlling enabled state |
| `requiredBy` | Reference | DataFeature controlling required state |
| `minValueBy` | Reference | DataFeature for minimum value |
| `maxValueBy` | Reference | DataFeature for maximum value |
| `onBlur` | Boolean | Generate blur event handler |
| `tooltipText` | String | Tooltip text |

**Widget Type Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `enumWidget` | Enum | Enum display: `COMBO`, `RADIO`, `TOGGLE_BUTTONBAR` |
| `textWidget` | Enum | Text display: `TEXT`, `INPUT` |
| `textMultiLine` | Boolean | Enable multiline for text |
| `textMask` | String | Input mask pattern |
| `textCountCharacters` | Boolean | Show character counter |
| `booleanWidget` | Enum | Boolean display: `CHECKBOX`, `COMBO` |
| `formatValue` | Boolean | Apply number formatting |
| `isTypeAheadField` | Boolean | Enable autocomplete/typeahead |
| `valueLabelPlacement` | Enum | Label placement: `TOP`, `START`, `BOTTOM`, `END`, `DEFAULT` |

### TabularReferenceField

**Supertypes:** `Tabular` + `ReferenceField` → (`VisualElement`, `Widget` + `PerformableAction`) → `NamedElement`

A complex widget for managing a to-many relationship (e.g., master-detail grid, multi-select chip field).

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the field |
| `label` | String | Field/table header (i18n key) |
| `relationFeature` | Reference | Bound to `structure:RelationMember` |
| `iconName` | String | Header icon |
| `col` | Integer | Grid column span (1-12) |
| `representationComponent` | String | Display type: `table`, `tag`, `card`, `button` |
| `buttonStyle` | String | Button style (when `representationComponent=button`) |
| `smallTable` | Boolean | Compact/dense table mode |
| `checkboxSelection` | Enum | Row selection: `AUTO`, `ENABLED`, `DISABLED` |
| `countRows` | Boolean | Show total row count |
| `isInlineEditable` | Boolean | Enable inline editing in table |
| `rowsPerPage` | Integer | Table pagination size (default: 10) |
| `selectorRowsPerPage` | Integer | Selector dialog pagination size (default: 10) |
| `selectorDialogSize` | Enum | Size for selector dialogs |
| `autocompleteRows` | Integer | Autocomplete result limit (default: 10) |
| `actionColumnWidth` | Integer | Width of the action column |
| `columns` | DataColumn[0..*] | Column definitions |
| `filters` | Filter[0..*] | Filter controls |
| `rowOperations` | TableOperation[0..*] | Row-level actions |
| `tableOperations` | TableOperation[0..*] | Table-level actions |
| `additionalMaskFeatures` | DataFeature[0..*] | Additional features to include in data mask |
| `crudOperationsDisplayed` | Integer | Number of CRUD buttons (default: 1) |
| `transferOperationsDisplayed` | Integer | Number of transfer buttons (default: 0) |

### OperationForm

**Supertypes:** `Widget` + `PerformableAction` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

A widget that triggers an action (e.g., a button). It's bound to a specific operation.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier for the button |
| `label` | String | Button text (i18n key) |
| `operation` | String | Target operation name |
| `iconName` | String | Button icon |
| `col` | Integer | Grid column span (1-12) |
| `hiddenBy` | Reference | DataFeature controlling visibility |
| `enabledBy` | Reference | DataFeature controlling enabled state |
| `tooltipText` | String | Tooltip text for the button |
| `confirmationType` | Enum | Confirmation behavior: `NONE`, `CONDITIONAL`, `MANDATORY` |
| `confirmationMessage` | String | Message shown in confirmation dialog |
| `confirmationCondition` | Reference | DataFeature for conditional confirmation |
| `postCallAccessNavigation` | Reference | Access to navigate to after operation |
| `generateActionsHook` | Boolean | Generate custom actions hook |
| `generateVisualPropertiesHook` | Boolean | Generate visual properties hook |

**Binding:** Bound to `operation:Operation` by name.

### TextField

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

A simple, unbound text display widget for static text or labels.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier |
| `text` | String | Static display text |
| `col` | Integer | Grid column span (1-12) |
| `variant` | Enum | Typography variant |

**Note:** This element is NOT bound to data - it displays static text only.

### ActionButton

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

A button for standard form actions like Submit or Cancel.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier |
| `action` | Enum | Action type: `SUBMIT`, `CANCEL` |
| `label` | String | Button text (i18n key) |
| `iconName` | String | Button icon |
| `variant` | Enum | Button style: `contained`, `outlined`, `text` |

**Action Types:**

| Action | Description |
|--------|-------------|
| `SUBMIT` | Triggers form submission/save operation |
| `CANCEL` | Closes dialog/navigates back without saving |

### Divider

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

A horizontal divider/separator widget for visual separation between UI sections.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier |
| `label` | String | Optional divider label (i18n key) |
| `iconName` | String | Optional icon |
| `col` | Integer | Grid column span (1-12) |

**Note:** This element renders as a visual separator line, optionally with a centered label.

### Placeholder

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

An empty space placeholder widget for layout purposes.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier |
| `col` | Integer | Grid column span (1-12) |
| `row` | Integer | Row span |

**Note:** This element reserves space in the layout without rendering visible content. Useful for alignment.

### Icon

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

A standalone icon display widget.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier |
| `iconName` | String | Material icon name |
| `col` | Integer | Grid column span (1-12) |

**Note:** Displays a single icon without additional text or interaction.

### ActionGroup

**Supertypes:** `Widget` + `PerformableAction` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

A container widget for grouping multiple operation buttons together.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Unique identifier |
| `label` | String | Group label (i18n key) |
| `iconName` | String | Group icon |
| `col` | Integer | Grid column span (1-12) |
| `actions` | OperationForm[0..*] | Contained operation buttons |
| `featuredActions` | Integer | Number of actions to show prominently (rest in dropdown) |
| `hiddenBy` | Reference | DataFeature that controls visibility |
| `enabledBy` | Reference | DataFeature that controls enabled state |

**Note:** Useful for grouping related actions with overflow menu behavior.

---

## Table-Specific Elements

Elements used exclusively within a `TransferObjectTable` or `TabularReferenceField`.

### DataColumn

**Supertypes:** `Column` → `VisualElement` + `AbstractColumnReference` → `NamedElement`

A column within a table, displaying a single attribute for each row.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Column identifier |
| `label` | String | Column header (i18n key) |
| `dataFeature` | Reference | Bound to `structure:DataMember` |
| `width` | String | Column width (CSS value, e.g., "100px", "20%") |
| `visible` | Boolean | Whether column is visible (default: true) |
| `sort` | Enum | Default sort direction: `NONE`, `ASC`, `DESC` |
| `sortPrecedence` | Integer | Sort priority for multi-column sorting (default: 0) |
| `formatValue` | Boolean | Apply value formatting (default: true) |
| `columnReference` | Reference | Reference to another column definition |

**Binding:** Bound to `structure:DataMember`.

**XMI gotcha — `columns` is typed as the abstract `Column`.** Unlike `form` / `table` / `view` (concrete containments), each `<columns>` child must carry `xsi:type="ui:DataColumn"` (or `ui:RelationColumn`) and the root `<namespace:Model>` must declare `xmlns:ui="http://blackbelt.hu/judo/meta/esm/ui"`. Otherwise the loader fails with *"Class 'Column' is not found or is abstract"*. The same rule applies to every containment typed by an abstract supertype (`AbstractColumnReference`, `Filter`, `MenuItem`).

**TS2393 symptom reminder.** `error TS2393: Duplicate function implementation` on the generated service means a relation is named identically to a generator-emitted factory method. See [Generator Reserved Names](./generator-reserved-names.md).

### RelationColumn

**Supertypes:** `Column` → `VisualElement` + `AbstractColumnReference` → `NamedElement`

A column within a table that displays a value navigated through a relation — the visible cell shows a scalar **on the related TO**, while the column itself is bound through a `RelationMember` so the framework can format / link the cell.

| Attribute | Type | Required | Description |
|---|---|---|---|
| `name` | String | yes | Column identifier |
| `label` | String | no | Column header (i18n key) |
| `relationFeature` | Reference | **yes** (lower=1) | Bound to a `structure:OneWayRelationMember` or `TwoWayRelationMember` on the row TO |
| `dataFeatureOfRelationFeature` | Reference | **yes** (lower=1) | Bound to a `structure:DataMember` on the **target** of `relationFeature`. The cell shows this attribute's value. |
| `width` | String | no | Column width (CSS value) |
| `visible` | Boolean | no | Default: true |
| `sort` | Enum | no | `NONE` / `ASC` / `DESC` |
| `sortPrecedence` | Integer | no | Sort priority for multi-column sort |
| `formatValue` | Boolean | no | Apply value formatting (default: true) |

**Both `relationFeature` AND `dataFeatureOfRelationFeature` are required**. Setting only `relationFeature` will pass CLI mutation validation (because the GraphQL Create input doesn't enforce it) but will fail the **build-time ESM validator** with:

> *Diagnostic ERROR … The required feature 'dataFeatureOfRelationFeature' of 'RelationColumnImpl@…' must be set*

Fix on an existing element:

```bash
judo_cli update -f "RelationColumn::<name>" -s dataFeatureOfRelationFeature=<package>::<TargetTO>.<scalarAttr>
```

**Frontend codegen warning — do not place `RelationColumn` on a *top-level* `TransferObjectTable`.** When a `RelationColumn` lives directly on the table backing an `Access` / menu entry, the React generator emits broken row-type generics in the list screen (observed symptom: dangling `View<X>Stored` references such as `ViewGalaxyStored` → `error TS2304: Cannot find name 'ViewGalaxyStored'`). Two clean alternatives:

1. **Show the related value in the detail screen.** Place a `TabularReferenceField` (with `representationComponent="button"` for to-one or `"table"` for to-many) inside the TO's `<view>` instead of a `RelationColumn` on the `<table>`.
2. **Flatten the related value to a scalar.** Add a `DERIVED` `DataMember` (e.g. `partnerName <- partner.name`) on the row TO and use a plain `DataColumn` bound to it. This works on top-level tables.

Reserve `RelationColumn` for tables embedded inside a detail screen (`TabularReferenceField`'s columns), where navigation semantics are expected and the codegen path is safe. See [ui-authoring-guide.md §14 Anti-patterns](../ui-authoring-guide.md) for the full rationale.

### DataFilter

**Supertypes:** `Filter` → `VisualElement` + `AbstractFilterReference` → `NamedElement`

A filter control for a table, allowing users to search or narrow down results.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Filter identifier |
| `label` | String | Filter label (i18n key) |
| `dataFeature` | Reference | Bound to `structure:DataMember` |
| `defaultOperation` | Enum | Default filter operation type |
| `col` | Integer | Grid column span (1-12, default: 12) |
| `row` | Integer | Row span (default: 1) |
| `fit` | Enum | Fit mode: `LOOSE`, `TIGHT` |
| `stretch` | Enum | Stretch behavior: `NONE`, `HORIZONTAL`, `VERTICAL`, `BOTH` |
| `range` | Boolean | Enable range filter (from/to, default: false) |
| `multiValue` | Boolean | Allow multiple values (default: false) |
| `alwaysShown` | Boolean | Show filter in toolbar (default: false) |
| `filterReference` | Reference | Reference to another filter definition |

**Filter Operations (FilterOperationType):**

| Type | Description | Use Case |
|------|-------------|----------|
| `EQUAL` | Exact match | IDs, codes |
| `NOT_EQUAL` | Not equal | Exclusion filters |
| `IS_EMPTY` | Is null/empty | Missing values |
| `IS_NOT_EMPTY` | Has value | Presence check |
| `LESS` | Less than | Maximum values |
| `LESS_OR_EQUAL` | Less than or equal | Maximum inclusive |
| `GREATER` | Greater than | Minimum values |
| `GREATER_OR_EQUAL` | Greater than or equal | Minimum inclusive |
| `LIKE` | Pattern match/contains | Text search |

**Binding:** Bound to `structure:DataMember`.

### TableOperation

**Supertypes:** `VisualElement` → `NamedElement`

An action that can be performed on table rows (row-level or table-level operations).

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Operation identifier |
| `label` | String | Button text (i18n key) |
| `iconName` | String | Button icon |
| `operation` | Reference | Bound to `operation:Operation` |
| `operationForm` | OperationForm | Contained operation form configuration |
| `isBulk` | Boolean | Enable for multi-select operations |

**Note:** TableOperations can be placed in either `rowOperations` (for row-level actions) or `tableOperations` (for table-level actions) on TransferObjectTable/TabularReferenceField.

**Binding:** Bound to `operation:Operation`.

---

## Navigation Elements

Elements that define the application's navigation structure. `MenuItem` is an abstract base class with two concrete implementations: `MenuItemAccess` (navigation to data) and `MenuItemOperation` (static operation trigger).

### MenuItem (Abstract)

**Supertypes:** `VisualElement` → `NamedElement`

Abstract base class for all menu items. Defines common attributes shared by concrete menu item types.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Menu item identifier |
| `label` | String | Display text (i18n key) |
| `iconName` | String | Menu icon |
| `hidden` | Boolean | Whether item is hidden by default |
| `hiddenBy` | Reference | DataFeature that dynamically controls visibility |
| `enabledBy` | Reference | DataFeature that dynamically controls enabled state |
| `menuGroup` | Reference | Parent MenuItemGroup (if nested) |

### MenuItemAccess

**Supertypes:** `MenuItem` → `VisualElement` → `NamedElement`

A menu item that navigates to a data access point (table/view screen).

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Menu item identifier |
| `label` | String | Display text (i18n key) |
| `iconName` | String | Menu icon |
| `access` | Reference | Link to `accesspoint:Access` |
| `hidden` | Boolean | Whether item is hidden |
| `hiddenBy` | Reference | DataFeature for dynamic visibility |
| `enabledBy` | Reference | DataFeature for dynamic enabled state |

**Binding:** Bound to `accesspoint:Access` - clicking navigates to the data table/view.

### MenuItemOperation

**Supertypes:** `MenuItem` → `VisualElement` → `NamedElement`

A menu item that triggers a static (unbound) operation directly from the menu.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Menu item identifier |
| `label` | String | Display text (i18n key) |
| `iconName` | String | Menu icon |
| `targetOperation` | Reference | Link to `operation:Operation` |
| `targetAccess` | Reference | Optional access for post-operation navigation |
| `targetTransferObjectType` | Reference | TransferObject for operation context |
| `operationForm` | OperationForm | Contained operation form configuration |
| `hidden` | Boolean | Whether item is hidden |
| `hiddenBy` | Reference | DataFeature for dynamic visibility |
| `enabledBy` | Reference | DataFeature for dynamic enabled state |

**Binding:** Bound to `operation:Operation` - clicking triggers the operation (may open input form first).

### MenuItemGroup

**Supertypes:** `MenuItem` → `VisualElement` → `NamedElement`

A container for creating sub-menus within the main navigation.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Group identifier |
| `label` | String | Submenu header (i18n key) |
| `iconName` | String | Submenu icon |
| `menuItems` | MenuItem[0..*] | Nested menu items (Access or Operation) |
| `hidden` | Boolean | Whether group is hidden |
| `hiddenBy` | Reference | DataFeature for dynamic visibility |
| `enabledBy` | Reference | DataFeature for dynamic enabled state |

---

## Common Attributes

These attributes are shared across multiple UI elements.

### Layout Attributes

| Attribute | Type | Description | Used By |
|-----------|------|-------------|---------|
| `col` | Integer | Grid column span (1-12) | All widgets |
| `row` | Integer | Row span | DataField |
| `layout` | Enum | Direction: `HORIZONTAL`, `VERTICAL` | Group, Form |
| `frame` | Boolean | Border/card styling | View, Group |

### Visibility Attributes

| Attribute | Type | Description | Used By |
|-----------|------|-------------|---------|
| `hidden` | Boolean | Hide element | All elements |
| `disabled` | Boolean | Disable element | Interactive elements |

### Style Attributes

| Attribute | Type | Description | Used By |
|-----------|------|-------------|---------|
| `iconName` | String | Material icon name | All widgets |
| `variant` | Enum | Style variant | Buttons |
| `dialogSize` | Enum | Dialog size | View, Form |

### Hook Generation Attributes

| Attribute | Type | Description | Used By |
|-----------|------|-------------|---------|
| `generateActionsHook` | Boolean | Generate `use{Container}Actions` hook | View, Table, Form |
| `generateVisualPropertiesHook` | Boolean | Generate `use{Container}VisualProps` hook | View, Table, Form |
| `onBlur` | Boolean | Generate `on{Field}BlurAction` handler | DataField |

---

## Enumerations

### Layout

Controls the arrangement direction of child components in containers.

| Value | Description |
|-------|-------------|
| `HORIZONTAL` | Arrange children horizontally (row) |
| `VERTICAL` | Arrange children vertically (column) |
| `DEFAULT` | Use parent's layout direction |

### DialogSize

Controls the size of dialog/modal windows.

| Value | Description |
|-------|-------------|
| `UNDEFINED` | No size constraint specified |
| `XS` | Extra small dialog |
| `SM` | Small dialog |
| `MD` | Medium dialog |
| `LG` | Large dialog |
| `XL` | Extra large dialog |

### CheckboxSelection

Controls row selection behavior in tables.

| Value | Description |
|-------|-------------|
| `AUTO` | Automatic based on context |
| `ENABLED` | Show row checkboxes |
| `DISABLED` | Hide row checkboxes |

### TitleFrom

Determines the source of a view's title.

| Value | Description |
|-------|-------------|
| `LABEL` | Use static label as title |
| `ATTRIBUTE` | Use data attribute value as title |

### EnumWidget

Controls the display of enumeration fields.

| Value | Description |
|-------|-------------|
| `COMBO` | Dropdown/autocomplete selector |
| `RADIO` | Radio button group |
| `TOGGLE_BUTTONBAR` | Toggle button bar |

### TextWidget

Controls the display of text fields.

| Value | Description |
|-------|-------------|
| `TEXT` | Static text display (read-only) |
| `INPUT` | Editable text input |

### BooleanWidget

Controls the display of boolean fields.

| Value | Description |
|-------|-------------|
| `CHECKBOX` | Standard checkbox |
| `COMBO` | Dropdown with Yes/No options |

### Action

Standard form action types.

| Value | Description |
|-------|-------------|
| `SUBMIT` | Form submission/save action |
| `CANCEL` | Form cancel/close action |

### Justify

Flex container main-axis alignment.

| Value | Description |
|-------|-------------|
| `DEFAULT` | Use parent's justify setting |
| `START` | Align items to start |
| `END` | Align items to end |
| `CENTER` | Center items |
| `SPACE_BETWEEN` | Distribute with space between |
| `SPACE_AROUND` | Distribute with space around |

### Align

Flex container cross-axis alignment.

| Value | Description |
|-------|-------------|
| `DEFAULT` | Use parent's align setting |
| `STRETCH` | Stretch to fill |
| `START` | Align to start |
| `END` | Align to end |
| `CENTER` | Center alignment |

### Horizontal

Horizontal alignment within container.

| Value | Description |
|-------|-------------|
| `LEFT` | Left alignment |
| `RIGHT` | Right alignment |
| `CENTER` | Center alignment |
| `SPACE_BETWEEN` | Space between items |
| `SPACE_AROUND` | Space around items |

### Vertical

Vertical alignment within container.

| Value | Description |
|-------|-------------|
| `TOP` | Top alignment |
| `BOTTOM` | Bottom alignment |
| `CENTER` | Center alignment |
| `SPACE_BETWEEN` | Space between items |
| `SPACE_AROUND` | Space around items |

### Stretch

Component stretch behavior.

| Value | Description |
|-------|-------------|
| `NONE` | No stretching |
| `HORIZONTAL` | Stretch horizontally |
| `VERTICAL` | Stretch vertically |
| `BOTH` | Stretch in both directions |

### Fit

Component fit mode within its container.

| Value | Description |
|-------|-------------|
| `LOOSE` | Standard spacing/padding |
| `TIGHT` | Reduced spacing/padding |

### Padding

Padding behavior.

| Value | Description |
|-------|-------------|
| `YES` | Include padding |
| `NO` | No padding |

### Placement

Label/value placement for form fields.

| Value | Description |
|-------|-------------|
| `TOP` | Label above value |
| `START` | Label at start (left) |
| `BOTTOM` | Label below value |
| `END` | Label at end (right) |
| `DEFAULT` | Use default placement |

### TabOrientation

Tab bar orientation.

| Value | Description |
|-------|-------------|
| `HORIZONTAL` | Tabs arranged horizontally |
| `VERTICAL` | Tabs arranged vertically |

### MenuOrientation

Menu orientation.

| Value | Description |
|-------|-------------|
| `VERTICAL` | Vertical menu layout |
| `HORIZONTAL` | Horizontal menu layout |

### ConfirmationType

Operation confirmation behavior.

| Value | Description |
|-------|-------------|
| `NONE` | No confirmation required |
| `CONDITIONAL` | Confirm based on condition |
| `MANDATORY` | Always require confirmation |

### ColumnSort

Default column sort direction.

| Value | Description |
|-------|-------------|
| `NONE` | No sorting |
| `ASC` | Ascending order |
| `DESC` | Descending order |

### FilterOperationType

Filter comparison operations.

| Value | Description |
|-------|-------------|
| `EQUAL` | Equals |
| `NOT_EQUAL` | Not equals |
| `IS_EMPTY` | Is null/empty |
| `IS_NOT_EMPTY` | Is not null/empty |
| `LESS` | Less than |
| `LESS_OR_EQUAL` | Less than or equal |
| `GREATER` | Greater than |
| `GREATER_OR_EQUAL` | Greater than or equal |
| `LIKE` | Pattern match (contains) |

### RepresentationComponent

Controls the visual representation of tabular data.

| Value | Description |
|-------|-------------|
| `table` | Standard data table/grid |
| `tag` | Chip/tag display |
| `card` | Card layout |
| `button` | Button representation |

---

## Element Hierarchy

### Class Inheritance

```
VisualElement (abstract)
├── FormElement (abstract)
│   ├── Container (abstract)
│   │   ├── TransferObjectView
│   │   ├── TransferObjectForm
│   │   └── Group
│   └── Component (abstract)
│       ├── Widget (abstract)
│       │   ├── DataField
│       │   ├── TextField
│       │   ├── ActionButton
│       │   ├── Divider
│       │   ├── Placeholder
│       │   ├── Icon
│       │   ├── ActionGroup
│       │   ├── OperationForm
│       │   └── ReferenceField (abstract)
│       │       └── TabularReferenceField
│       └── SwitchView (abstract)
│           ├── TabBar
│           └── Stepper
├── Tabular (abstract)
│   ├── TransferObjectTable
│   └── TabularReferenceField
├── Column (abstract)
│   └── DataColumn
├── Filter (abstract)
│   └── DataFilter
├── TableOperation
└── MenuItem (abstract)
    ├── MenuItemAccess
    ├── MenuItemOperation
    └── MenuItemGroup
```

### Containment Hierarchy

```
TransferObjectView
├── Group
│   ├── DataField
│   ├── TabularReferenceField
│   ├── OperationForm
│   ├── TextField
│   ├── ActionButton
│   ├── Divider
│   ├── Placeholder
│   ├── Icon
│   ├── ActionGroup
│   │   └── OperationForm[0..*]
│   └── Group (nested)
├── TabBar
│   └── Group (as tab)
└── Stepper
    └── Group (as step)

TransferObjectTable
├── DataColumn[0..*]
├── DataFilter[0..*]
├── TableOperation[0..*] (row operations)
└── TableOperation[0..*] (table operations)

TransferObjectForm
├── Group
│   ├── DataField
│   ├── TextField
│   ├── ActionButton
│   ├── Divider
│   └── Placeholder
└── TabBar / Stepper

ActorType.menuItems
├── MenuItemAccess
├── MenuItemOperation
│   └── OperationForm
└── MenuItemGroup
    ├── MenuItemAccess
    ├── MenuItemOperation
    └── MenuItemGroup (nested)
```

---

## Abstract Base Classes

### VisualElement

Root abstract class for all UI elements.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Element identifier |
| `label` | String | Display label (i18n key) |
| `iconName` | String | Icon name |
| `customImplementation` | Boolean | Use custom implementation |
| `subTheme` | String | Sub-theme for styling |

### Container

Abstract base for elements that contain other components.

| Attribute | Type | Description |
|-----------|------|-------------|
| `layout` | Layout | Child arrangement direction |
| `components` | Component[0..*] | Contained child components |
| `horizontal` | Horizontal | Horizontal alignment |
| `vertical` | Vertical | Vertical alignment |
| `frame` | Boolean | Show border/card styling |
| `performableActions` | PerformableAction[0..*] | Associated actions |

### Component

Abstract base for elements that can be placed within containers.

| Attribute | Type | Description |
|-----------|------|-------------|
| `col` | Integer | Grid column span (1-12) |
| `row` | Integer | Row span |
| `stretch` | Stretch | Stretch behavior |
| `fit` | Fit | Fit mode |
| `hiddenBy` | Reference | DataFeature controlling visibility |
| `enabledBy` | Reference | DataFeature controlling enabled state |

### Widget

Abstract base for interactive/data-bound components.

| Attribute | Type | Description |
|-----------|------|-------------|
| `onBlur` | Boolean | Generate blur handler |
| `requiredBy` | Reference | DataFeature controlling required state |
| `minValueBy` | Reference | DataFeature for min value |
| `maxValueBy` | Reference | DataFeature for max value |

### PerformableAction

Abstract interface for elements that can trigger actions.

| Attribute | Type | Description |
|-----------|------|-------------|
| `actionContainer` | Container | Parent container reference |

---

## Related Documentation

- [UI Behaviour Rules](./ui-behaviour.md) - Conditional attributes, validation rules, and default values
- [ESM Structure Package](./structure.md) - Entity and attribute definitions
- [ESM Operation Package](./operation.md) - Operation definitions
- [ESM Accesspoint Package](./accesspoint.md) - Actor and access definitions
- Frontend ESM-to-UI Mapping (see `judo-frontend-docs` skill) - ESM to React mapping
