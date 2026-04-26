---
name: judo-frontend-esm-to-ui-docs
description: ESM-to-UI mapping reference for JUDO React frontends. Covers widget mappings, table and navigation element mappings, and the ESM→UI transformation model.
disable-model-invocation: false
user-invocable: false
agent: general-purpose
---

# ESM to UI Mapping: Overview

**[◄ Frontend](../SKILL.md)** | **[Widgets ►](./widgets.md)**

This document covers the foundational mappings from ESM source elements to UI model elements.

```
ESM Source Model → UI Model (transformation) → React Frontend (code generation)
```

## Quick Reference: All UI Elements

### UI Containers (Top-Level)

| Element | Supertypes | Purpose | Generated Component |
|---------|------------|---------|---------------------|
| `TransferObjectView` | `Container` → `FormElement` → `VisualElement` | Detail/edit screen for single object | Page component |
| `TransferObjectTable` | `Tabular` → `VisualElement` | List/grid screen for multiple objects | Table component |
| `TransferObjectForm` | `Container` → `FormElement` → `VisualElement` | Operation input dialog | Dialog component |
| `Group` | `Container` + `Component` → `FormElement` → `VisualElement` | Visual grouping container | Container div |
| `TabBar` | `SwitchView` → `Component` → `FormElement` → `VisualElement` | Tabbed content container | MUI Tabs |
| `Stepper` | `SwitchView` → `Component` → `FormElement` → `VisualElement` | Wizard-style sequential flow | MUI Stepper |

### Widgets (Interactive Components)

| Element | Supertypes | Purpose | Generated Component |
|---------|------------|---------|---------------------|
| `DataField` | `Widget` → `Component` → `FormElement` → `VisualElement` | Display/edit primitive value | TextField, DatePicker, Checkbox, etc. |
| `TabularReferenceField` | `Tabular` + `ReferenceField` | Manage to-many relationship | Embedded table, tags, cards, button |
| `OperationForm` | `Widget` + `PerformableAction` → `Component` | Trigger bound operation | Action button |
| `TextField` | `Widget` → `Component` → `FormElement` → `VisualElement` | Static text display | Typography |
| `ActionButton` | `Widget` → `Component` → `FormElement` → `VisualElement` | Form submit/cancel | Submit/Cancel button |
| `Divider` | `Widget` → `Component` → `FormElement` → `VisualElement` | Visual separator | Horizontal rule |
| `Placeholder` | `Widget` → `Component` → `FormElement` → `VisualElement` | Empty space for layout | Empty div |
| `Icon` | `Widget` → `Component` → `FormElement` → `VisualElement` | Standalone icon | Material icon |
| `ActionGroup` | `Widget` + `PerformableAction` → `Component` | Group of operation buttons | Button group with overflow |

### Table-Specific Elements

| Element | Supertypes | Purpose | Generated Component |
|---------|------------|---------|---------------------|
| `DataColumn` | `Column` → `VisualElement` + `AbstractColumnReference` | Table column definition | MUI DataGrid column |
| `DataFilter` | `Filter` → `VisualElement` + `AbstractFilterReference` | Table filter control | Filter input |
| `TableOperation` | `VisualElement` | Row/table action | Action button |

### Navigation Elements

| Element | Supertypes | Purpose | Generated Component |
|---------|------------|---------|---------------------|
| `MenuItem` (Abstract) | `VisualElement` | Base class for menu items | - |
| `MenuItemAccess` | `MenuItem` → `VisualElement` | Navigation to data access | Menu item with route |
| `MenuItemOperation` | `MenuItem` → `VisualElement` | Trigger static operation | Menu item with action |
| `MenuItemGroup` | `MenuItem` → `VisualElement` | Submenu container | Collapsible menu group |

**Note:** Supertypes determine inherited attributes and behaviour rules. See ui-behaviour.md (see `judo-model-docs` skill) for detailed rules.

---

## ESM UI Elements

The ESM model contains UI definitions directly under entity types. These are not annotations but dedicated model elements in the `ui:` namespace.

### ESM UI Structure

```xml
<elements xsi:type="structure:EntityType" name="Address">
  <!-- Entity structure -->
  <attributes .../>
  <relations .../>

  <!-- UI definitions (generated based on entity) -->
  <form xmi:id="..." name="Address_Form" .../>
  <table xmi:id="..." name="Address_Table" rowsPerPage="10" .../>
  <view xmi:id="..." name="Address_View_Edit" .../>
</elements>
```

## Entity to UI Mapping

### Entity Structure

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `structure:EntityType` | `name` | `ClassType` | TypeScript interfaces |
| `structure:EntityType` | `createable` | Action availability | Create button visibility |
| `structure:EntityType` | `updateable` | Action availability | Edit capability |
| `structure:EntityType` | `deleteable` | Action availability | Delete button visibility |

### Attributes (DataMember)

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `structure:DataMember` | `name` | `attributeType.name` | Field binding |
| `structure:DataMember` | `required="true"` | `isRequired` | Required indicator |
| `structure:DataMember` | `dataType` (ref) | `dataType` | Input component type |
| `structure:DataMember` | `memberType="DERIVED"` | `isReadOnly` | Read-only field |
| `structure:DataMember` | `memberType="STORED"` | Editable | Normal input |
| `structure:DataMember` | `defaultExpression` | Default value | Pre-populated value |
| `structure:DataMember` | `getterExpression` | Derived calc | Computed field |

**Example:**
```xml
<attributes xsi:type="structure:DataMember"
  xmi:id="_ZeK4oLK0EfCC_efogf7jJg"
  name="code"
  dataType="_l_cmpjCnEeqACamZUjRFWQ"
  required="true"
  memberType="STORED"/>
```

### Relations (TwoWayRelationMember / OneWayRelationMember)

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `TwoWayRelationMember` | `lower="0"` | Optional relation | No required indicator |
| `TwoWayRelationMember` | `lower="1"` | Required relation | Required indicator |
| `TwoWayRelationMember` | `upper="1"` | Single relation | Link component |
| `TwoWayRelationMember` | `upper="-1"` | Collection | Table component |
| `TwoWayRelationMember` | `createable` | `isCreatable` | Create button |
| `TwoWayRelationMember` | `updateable` | `isUpdatable` | Edit capability |
| `TwoWayRelationMember` | `deleteable` | `isDeletable` | Delete button |
| `TwoWayRelationMember` | `relationKind` | Relation behavior | COMPOSITION/AGGREGATION/ASSOCIATION |
| `TwoWayRelationMember` | `target` (ref) | `target` | Related entity type |
| `TwoWayRelationMember` | `partner` (ref) | Inverse relation | Bidirectional binding |

**Example:**
```xml
<relations xsi:type="structure:TwoWayRelationMember"
  xmi:id="_nNhSoLK2EfCC_efogf7jJg"
  lower="0" upper="-1"
  target="_ZsevgLK2EfCC_efogf7jJg"
  name="addressEvents"
  createable="false" updateable="false" deleteable="false"
  relationKind="ASSOCIATION"
  memberType="STORED"/>
```

### CRUD Flags and UI Element Visibility

The `createable`, `updateable`, and `deleteable` attributes on relations directly control which UI elements are generated and visible:

| Flag | ESM Attribute | UI Model Property | UI Effect |
|------|---------------|-------------------|-----------|
| **C** (Create) | `createable="true"` | `isCreatable` | Create button visible in table header |
| **R** (Read) | Always available | - | Table/view/navigation always visible |
| **U** (Update) | `updateable="true"` | `isUpdatable` | Fields editable, Attach/Detach buttons visible |
| **D** (Delete) | `deleteable="true"` | `isDeletable` | Delete button visible on rows |

**UI Components by CRUD Configuration:**

| Configuration | Visible UI Elements |
|--------------|---------------------|
| `C=false, U=false, D=false` | View only: Filter, Refresh, View button on rows |
| `C=true, U=false, D=false` | Create button added |
| `C=false, U=true, D=false` | Edit fields enabled, Attach/Detach for associations |
| `C=false, U=false, D=true` | Delete button on rows |
| `C=true, U=true, D=true` | Full CRUD: all buttons visible |

**Example - Read-Only Relation (no C, U, D):**
```xml
<relations name="publicSpaceTypes"
  createable="false" updateable="false" deleteable="false"/>
```
Generated UI: Table with Filter/Refresh only, no Create/Delete buttons.

**Example - Full CRUD Relation:**
```xml
<relations name="addresses"
  createable="true" updateable="true" deleteable="true"/>
```
Generated UI: Table with Create button, editable fields, Delete button on rows.

**Association Attach/Detach (Update Flag):**

When `updateable="true"` on an ASSOCIATION relation, the UI includes:
- **Attach button**: Link existing entities to this relation
- **Detach button**: Remove link without deleting the entity

This is different from COMPOSITION relations where Delete actually removes the entity.

**Parent Flags Affect Child Operations:**

When navigating from a grid row, tag, or single relation link to a child element, the parent relation's `updateable` and `deleteable` flags determine which operations are available on the navigated element:

| Parent Flag | Child Operations Available |
|-------------|---------------------------|
| `updateable=true` | Edit fields, Attach/Detach, Update button on navigated element |
| `updateable=false` | View-only mode, no editing regardless of child's own flags |
| `deleteable=true` | Delete button visible on navigated element |
| `deleteable=false` | No delete option on navigated element |

**Example:**
```xml
<!-- Parent relation with updateable=false, deleteable=false -->
<relations name="addresses"
  createable="true" updateable="false" deleteable="false"/>
```

Even if the `Address` entity has `updateable="true"` and `deleteable="true"`, when navigating from this relation:
- User can **view** the Address details
- User **cannot edit** Address fields
- User **cannot delete** the Address
- User **cannot** attach/detach related entities on Address

**Navigation Sources Affected:**
- Grid/Table row click or view button
- Tag component click
- Single relation link click

**Runtime Override via JSON Data (`__updateable`, `__deleteable`):**

Even when the model's relation flags are `true`, the backend can disable operations on specific data instances using special JSON attributes:

| JSON Attribute | Effect |
|----------------|--------|
| `__updateable: false` | Disables edit capability for this specific record |
| `__deleteable: false` | Hides delete button for this specific record |

**Example API Response:**
```json
{
  "id": "123",
  "name": "Protected Address",
  "fullAddress": "123 Main St",
  "__updateable": false,
  "__deleteable": false
}
```

This allows the backend to dynamically control permissions per-record based on business logic (e.g., user roles, record status, ownership).

**Precedence:**
1. If model relation flag is `false` → operation disabled (cannot be overridden)
2. If model relation flag is `true` AND `__updateable`/`__deleteable` is `false` → operation disabled for that record
3. If model relation flag is `true` AND `__updateable`/`__deleteable` is `true` or not present → operation enabled

## Data Types

### Primitive Types

| ESM Type Element | ESM Attribute | UI Model | Frontend Component |
|------------------|---------------|----------|-------------------|
| `type:StringType` | `maxLength` | `StringType` | TextField |
| `type:StringType` | `maxLength > 255` | `StringType` | TextField multiline |
| `type:NumericType` | `precision`, `scale` | `NumericType` | NumericInput |
| `type:BooleanType` | - | `BooleanType` | Checkbox |
| `type:DateType` | - | `DateType` | DatePicker |
| `type:TimestampType` | - | `TimestampType` | DateTimePicker |
| `type:TimeType` | - | `TimeType` | TimePicker |
| `type:BinaryType` | `mimeTypes` | `BinaryType` | BinaryInput (file) |
| `type:EnumerationType` | `members` | `EnumerationType` | Autocomplete/Radio |

### Enumeration Members

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `type:EnumerationType` | `members` | `dataType.members` | Option list |
| Member element | `name` | Option value | Value binding |
| Member element | (i18n generated) | Label | Translated display |

## UI Definition Elements

### Form Definition (ui:form)

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `<form>` | `name` | Page/Dialog name | Component name |
| `<form>` | `label` | Title | Page title |
| `<form>` | `layout` | Layout direction | VERTICAL/HORIZONTAL |
| `<form>` | `generateActionsHook` | Hook generation | Custom actions hook |
| `<form>` | `generateVisualPropertiesHook` | Hook generation | Visual props hook |

### View Definition (ui:view)

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `<view>` | `name` | Page name | View component |
| `<view>` | `label` | Title | Page title |
| `<view>` | `titleFrom` | Title source | LABEL or ATTRIBUTE |
| `<view>` | `frame` | Frame styling | Border/container |

### Table Definition (ui:table)

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `<table>` | `name` | Table name | Table component |
| `<table>` | `label` | Header | Table title |
| `<table>` | `rowsPerPage` | `tablePageLimit` | Pagination size |
| `<table>` | `checkboxSelection` | `checkboxSelection` | Row selection (ENABLED/DISABLED) |
| `<table>` | `crudOperationsDisplayed` | Action visibility | CRUD buttons count |
| `<table>` | `transferOperationsDisplayed` | Action visibility | Transfer buttons |
| `<table>` | `generateActionsHook` | Hook generation | Custom actions |
| `<table>` | `generateVisualPropertiesHook` | Hook generation | Visual customization |

**Example:**
```xml
<table xmi:id="_HQs5ELKoEfCC_efogf7jJg"
  name="Address_Table"
  label="Address Table"
  checkboxSelection="ENABLED"
  rowsPerPage="10"
  crudOperationsDisplayed="1"
  transferOperationsDisplayed="0"/>
```

## UI Container Elements

### TransferObjectView

**Supertypes:** `Container` → `FormElement` → `VisualElement` → `NamedElement`

Container for detail/edit screens showing a single object.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:TransferObjectView` | `name` | View name | Page component name |
| `ui:TransferObjectView` | `label` | Title | Page title (i18n) |
| `ui:TransferObjectView` | `titleFrom` | Title source | `LABEL` or `ATTRIBUTE` |
| `ui:TransferObjectView` | `titleAttribute` | Title data feature | Dynamic title from attribute (when `titleFrom=ATTRIBUTE`) |
| `ui:TransferObjectView` | `openInDialog` | Dialog mode | Open as dialog instead of page |
| `ui:TransferObjectView` | `dialogSize` | Dialog dimensions | `UNDEFINED`/`XS`/`SM`/`MD`/`LG`/`XL` |
| `ui:TransferObjectView` | `autoCloseOnSave` | Auto-close behavior | Close dialog automatically after save |
| `ui:TransferObjectView` | `layout` | Layout direction | `HORIZONTAL`/`VERTICAL`/`DEFAULT` |
| `ui:TransferObjectView` | `horizontal` | Horizontal alignment | `LEFT`/`RIGHT`/`CENTER`/`SPACE_BETWEEN`/`SPACE_AROUND` |
| `ui:TransferObjectView` | `vertical` | Vertical alignment | `TOP`/`BOTTOM`/`CENTER`/`SPACE_BETWEEN`/`SPACE_AROUND` |
| `ui:TransferObjectView` | `frame` | Container style | Border/card styling |
| `ui:TransferObjectView` | `components` | Child components | Fields, groups, tabs |
| `ui:TransferObjectView` | `additionalMaskFeatures` | Extra query fields | Additional attributes for REST queries |
| `ui:TransferObjectView` | `generateActionsHook` | Hook generation | Custom actions hook |
| `ui:TransferObjectView` | `generateVisualPropertiesHook` | Hook generation | Visual properties hook |

**Conditional Behaviour (from ui-behaviour.md):**
- `dialogSize` is only effective when `openInDialog=true`
- `titleAttribute` is only effective when `titleFrom=ATTRIBUTE`

### TransferObjectTable

**Supertypes:** `Tabular` → `VisualElement` → `NamedElement`

Container for list/grid screens showing multiple objects.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:TransferObjectTable` | `name` | Table name | Table component name |
| `ui:TransferObjectTable` | `label` | Header | Table title (i18n) |
| `ui:TransferObjectTable` | `columns` | Column definitions | DataColumn list |
| `ui:TransferObjectTable` | `filters` | Filter controls | DataFilter list |
| `ui:TransferObjectTable` | `rowOperations` | Row actions | TableOperation list (in action column) |
| `ui:TransferObjectTable` | `tableOperations` | Table actions | TableOperation list (in toolbar) |
| `ui:TransferObjectTable` | `rowsPerPage` | Page size | Pagination limit (default: 10) |
| `ui:TransferObjectTable` | `selectorRowsPerPage` | Selector page size | Pagination for selector dialogs |
| `ui:TransferObjectTable` | `selectorDialogSize` | Selector dialog size | `UNDEFINED`/`XS`/`SM`/`MD`/`LG`/`XL` |
| `ui:TransferObjectTable` | `checkboxSelection` | Selection mode | `AUTO`/`ENABLED`/`DISABLED` |
| `ui:TransferObjectTable` | `countRows` | Show row count | Display total row count |
| `ui:TransferObjectTable` | `isInlineEditable` | Inline editing | Enable inline row editing |
| `ui:TransferObjectTable` | `masterDetail` | Master-detail mode | Enable master-detail view |
| `ui:TransferObjectTable` | `representationComponent` | Visual representation | `table`/`card` |
| `ui:TransferObjectTable` | `actionColumnWidth` | Action column width | Fixed width for action column |
| `ui:TransferObjectTable` | `additionalMaskFeatures` | Extra query fields | Additional attributes for REST queries |
| `ui:TransferObjectTable` | `crudOperationsDisplayed` | CRUD button count | Number of CRUD buttons shown (default: 1) |
| `ui:TransferObjectTable` | `transferOperationsDisplayed` | Transfer button count | Number of transfer buttons (default: 0) |
| `ui:TransferObjectTable` | `generateActionsHook` | Hook generation | Custom actions hook |
| `ui:TransferObjectTable` | `generateVisualPropertiesHook` | Hook generation | Visual properties hook |

**Inherited from `Tabular`:** `columns`, `filters`, `rowOperations`, `tableOperations`, `countRows`, `checkboxSelection`, `isInlineEditable`, `additionalMaskFeatures`

### TransferObjectForm

**Supertypes:** `Container` → `FormElement` → `VisualElement` → `NamedElement`

Container for operation input parameters, typically generates dialogs.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:TransferObjectForm` | `name` | Form name | Dialog component name |
| `ui:TransferObjectForm` | `label` | Title | Dialog title (i18n) |
| `ui:TransferObjectForm` | `dialogSize` | Dialog dimensions | `UNDEFINED`/`XS`/`SM`/`MD`/`LG`/`XL` |
| `ui:TransferObjectForm` | `layout` | Layout direction | `HORIZONTAL`/`VERTICAL`/`DEFAULT` |
| `ui:TransferObjectForm` | `horizontal` | Horizontal alignment | `LEFT`/`RIGHT`/`CENTER`/`SPACE_BETWEEN`/`SPACE_AROUND` |
| `ui:TransferObjectForm` | `vertical` | Vertical alignment | `TOP`/`BOTTOM`/`CENTER`/`SPACE_BETWEEN`/`SPACE_AROUND` |
| `ui:TransferObjectForm` | `frame` | Container style | Border/card styling |
| `ui:TransferObjectForm` | `components` | Child components | Input fields, groups |
| `ui:TransferObjectForm` | `autoOpenAfterCreate` | Auto-open behavior | Automatically open created element after operation |
| `ui:TransferObjectForm` | `generateActionsHook` | Hook generation | Custom actions hook |
| `ui:TransferObjectForm` | `generateVisualPropertiesHook` | Hook generation | Visual properties hook |

**Inherited from `Container`:** `layout`, `horizontal`, `vertical`, `frame`, `components`, `performableActions`
