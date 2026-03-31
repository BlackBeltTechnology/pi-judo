# UI Model to Frontend Mapping

This document describes the comprehensive mapping between JUDO UI model elements (JSON) and the generated React frontend components. Use this reference when customizing the frontend, understanding generated code, or implementing hooks.

## Overview

The JUDO code generation pipeline works as follows:

```
ESM Model (.model)
    ↓
UI Model JSON (*-ui.json)
    ↓
React Components (pages, containers, components)
```

The UI model JSON is the intermediate representation that drives frontend generation. Each element in the JSON maps to specific React components and structures.

## UI Model JSON Structure

The UI model JSON file is located at:
```
application/frontend-react/model/{project}-ui.json
```

### Top-Level Structure

```json
{
  "eClass": "http://blackbelt.hu/judo/meta/ui#//Application",
  "@id": "Actor/(esm/_xxx)/Application",
  "name": "Actor",
  "navigationController": { ... },
  "pages": [ ... ],
  "containers": [ ... ],
  "dataElements": [ ... ],
  "enumerationTypes": [ ... ]
}
```

| Field | Description | Maps To |
|-------|-------------|---------|
| `name` | Actor/application name | Frontend module name prefix |
| `navigationController` | Navigation menu structure | Drawer/sidebar menu items |
| `pages` | Page definitions | Route pages (`src/pages/`) |
| `containers` | Page container definitions | Container components (`src/containers/`) |
| `dataElements` | Data types and relations | TypeScript interfaces, service methods |
| `enumerationTypes` | Enum definitions | TypeScript enums |

## Element ID Format

All UI model elements follow a consistent ID pattern:

```
{Actor}/(esm/_{UniqueModelId})/{ElementType}
```

**Components:**
- **Actor**: The actor/role context (e.g., `Actor`, `Admin`, `Customer`)
- **UniqueModelId**: A unique EMF/XMI identifier (e.g., `DpoUkM8xEe6U3KSieLrWmg`)
- **ElementType**: The component type suffix

### Example ID Breakdown

```
Actor/(esm/_vbQOQIF3Ee-M3fhNedgt-g)/RelationFeatureView
│         │                          │
│         │                          └── Element type: Relation View Page
│         └── Unique model element ID
└── Actor name
```

## ID to data-testid Mapping

The element IDs from the UI model are directly mapped to `data-testid` attributes in the generated React components:

```typescript
// UI Model JSON
"@id": "Actor/(esm/_iryugIF2Ee-M3fhNedgt-g)/TransferObjectViewPageContainer"

// Generated React Component
<Grid data-testid="Actor/(esm/_iryugIF2Ee-M3fhNedgt-g)/TransferObjectViewPageContainer">
```

This allows for:
- E2E testing with Playwright using `page.getByTestId()`
- Debugging and inspecting elements
- Custom styling based on `data-testid`

## Page Container Types

### 1. EmptyDashboardPageContainer

The default landing page for an actor without pre-defined widgets.

**UI Model:**
```json
{
  "@id": "Actor/(esm/_xxx)/EmptyDashboardPageDefinition",
  "name": "Actor::DashboardPage",
  "dashboard": true,
  "container": {
    "eClass": "http://blackbelt.hu/judo/meta/ui#//PageContainer",
    "$ref": "Actor/(esm/_xxx)/EmptyDashboardPageContainer"
  }
}
```

**Generated React:**
```
src/pages/Dashboard/index.tsx
src/containers/Dashboard/EmptyDashboard*.tsx
```

**data-testid:**
```
Actor/(esm/_xxx)/EmptyDashboardPageContainer
```

### 2. TransferObjectFormPageContainer

Used for creating new entities (CREATE forms).

**UI Model:**
```json
{
  "@id": "Actor/(esm/_xxx)/AccessFormPageDefinition",
  "name": "Actor::entity::AccessFormPage",
  "container": {
    "$ref": "Actor/(esm/_xxx)/TransferObjectFormPageContainer"
  },
  "openInDialog": true,
  "dialogSize": "XL"
}
```

**Generated React:**
```
src/containers/{Entity}/{Entity}_Form/*.tsx
```

**data-testid Pattern:**
```
Actor/(esm/_xxx)/TransferObjectFormPageContainer
```

**Key Properties:**
- `openInDialog`: If `true`, form opens in a modal dialog
- `dialogSize`: Modal size (`XS`, `SM`, `MD`, `LG`, `XL`)

### 3. TransferObjectTablePageContainer

Used for listing entities in a data grid (READ/LIST).

**UI Model:**
```json
{
  "@id": "Actor/(esm/_xxx)/AccessTablePageDefinition",
  "name": "Actor::entity::AccessTablePage",
  "container": {
    "$ref": "Actor/(esm/_xxx)/TransferObjectTablePageContainer"
  }
}
```

**Generated React:**
```
src/containers/{Entity}/{Entity}_Table/*.tsx
src/containers/{Entity}/{Entity}_Table/components/{Entity}_TableComponent/*.tsx
```

**data-testid Pattern:**
```
Actor/(esm/_xxx)/TransferObjectTablePageContainer
Actor/(esm/_xxx)/TransferObjectTableTable
```

### 4. TransferObjectViewPageContainer

Used for viewing/editing existing entities (UPDATE/VIEW).

**UI Model:**
```json
{
  "@id": "Actor/(esm/_xxx)/AccessViewPageDefinition",
  "name": "Actor::entity::AccessViewPage",
  "container": {
    "$ref": "Actor/(esm/_xxx)/TransferObjectViewPageContainer"
  }
}
```

**Generated React:**
```
src/containers/{Entity}/{Entity}_View_Edit/*.tsx
src/containers/{Entity}/{Entity}_View_Edit/components/*.tsx
```

**data-testid Pattern:**
```
Actor/(esm/_xxx)/TransferObjectViewPageContainer
Actor/(esm/_xxx)/TransferObjectViewVisualElement
```

## Visual Element Types (Field Inputs)

### Primitive Input Mappings

| Model Type | Element Type Suffix | React Component | HTML Element |
|------------|---------------------|-----------------|--------------|
| String | `StringTypeTextInput` | `TextField` | `<input type="text">` |
| String (multiline) | `StringTypeTextArea` | `TextField multiline` | `<textarea>` |
| String (read-only) | `StringTypeFormatted` | Typography/span | `<span>` |
| Boolean | `BooleanTypeCheckbox` | `Checkbox` | `<input type="checkbox">` |
| Numeric | `NumericTypeVisualInput` | `NumericInput` | `<input type="number">` |
| Double | `NumericTypeVisualInput` | `NumericInput` | `<input type="number">` |
| Date | `DateTypeInput` | `DatePicker` | MUI DatePicker |
| Timestamp | `TimestampTypeDateTimeInput` | `DateTimePicker` | MUI DateTimePicker |
| Time | `TimeTypeTypeTimeInput` | `TimePicker` | MUI TimePicker |
| Binary | `BinaryTypeInput` | `FileInput` | File upload |
| Email | `StringTypeTextInput` | `TextField` | `<input type="email">` |
| Enumeration | `EnumerationTypeToggleButtonbar` | `ToggleButtonGroup` | Toggle buttons |
| Enumeration | `EnumerationTypeCombo` | `Select` | Dropdown |
| Enumeration | `EnumerationTypeRadio` | `RadioGroup` | Radio buttons |

### Example TextField Generation

**UI Model (StringTypeTextInput):**
```json
{
  "@id": "Actor/(esm/_2u6pIIF3Ee-M3fhNedgt-g)/StringTypeTextInput",
  "name": "field",
  "label": "Field"
}
```

**Generated React:**
```tsx
<TextField
  name="field"
  data-testid="Actor/(esm/_2u6pIIF3Ee-M3fhNedgt-g)/StringTypeTextInput"
  label={t('Entity.View.field', { defaultValue: 'Field' })}
  value={data.field ?? ''}
  disabled={isLoading}
  error={!!validation.get('field')}
  helperText={validation.get('field')}
  onChange={(event) => storeDiff('field', event.target.value)}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <MdiIcon path="format-size" />
      </InputAdornment>
    ),
  \}}
/>
```

### Layout Visual Elements

| Element | Type Suffix | Description |
|---------|-------------|-------------|
| Divider | `DividerVisualElement` | Horizontal divider with optional label |
| Text Field | `TextFieldVisualElement` | Static text display |
| Placeholder | `PlaceholderVisualElement` | Empty space placeholder |
| Tab Bar | `TabBarVisualElement` | Tab container for grouped content |

## Relation Element Types

### Single Relation (Link)

**Element Type:** `TabularReferenceFieldRelationDefinedLink`

Displays a single entity reference with autocomplete/selector.

**UI Model:**
```json
{
  "@id": "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedLink",
  "name": "singleRelation",
  "label": "Single Relation"
}
```

**Generated React:**
Autocomplete component with view/set/unset actions.

### Multiple Relation (Table)

**Element Type:** `TabularReferenceFieldRelationDefinedTable`

Displays a table of related entities with CRUD actions.

**UI Model:**
```json
{
  "@id": "Actor/(esm/_xxx)/TabularReferenceFieldRelationDefinedTable",
  "name": "manyRelation",
  "label": "Many Relation"
}
```

**Generated React:**
DataGrid component with toolbar actions and row actions.

### Relation Button

**Element Type:** `TabularReferenceFieldButton`

Opens relation in a new page/dialog.

## Action Definition Types

### Page-Level Actions

| Action Definition | Element Type Suffix | Description |
|-------------------|---------------------|-------------|
| BackActionDefinition | `*BackButton` | Navigate back |
| CreateActionDefinition | `*CreateButton` | Create new entity |
| UpdateActionDefinition | `*UpdateButton` | Save changes |
| DeleteActionDefinition | `*DeleteButton` | Delete entity |
| CancelActionDefinition | `*CancelButton` | Cancel editing |
| RefreshActionDefinition | `*RefreshButton` | Reload data |
| GetTemplateActionDefinition | `*GetTemplateButton` | Get blank template |

### Table Actions

| Action Definition | Element Type Suffix | Description |
|-------------------|---------------------|-------------|
| FilterActionDefinition | `*FilterButton` | Open filter dialog |
| RefreshActionDefinition | `*RefreshButton` | Reload table |
| ExportActionDefinition | `*ExportButton` | Export data |
| OpenCreateFormActionDefinition | `*CreateButton` | Open create form |
| OpenAddSelectorActionDefinition | `*AddSelectorButton` | Open add selector |
| OpenSetSelectorActionDefinition | `*SetSelectorButton` | Open set selector |
| ClearActionDefinition | `*ClearButton` | Clear selection |
| BulkRemoveActionDefinition | `*BulkRemoveButton` | Remove selected |
| BulkDeleteActionDefinition | `*BulkDeleteButton` | Delete selected |
| InlineCreateRowActionDefinition | `TabularReferenceTableInlineCreateButton` | Inline row create |

### Row Actions

| Action Definition | Element Type Suffix | Description |
|-------------------|---------------------|-------------|
| OpenPageActionDefinition | `*RowViewButton` | View row details |
| RemoveActionDefinition | `*RowRemoveButton` | Remove relation |
| RowDeleteActionDefinition | `*RowDeleteButton` | Delete entity |

### Custom Operations

| Element Type | Description |
|--------------|-------------|
| `OperationFormVisualElement` | Custom operation button |
| `OperationFormCallButton` | Operation submit button |
| `OperationFormTableRowCallOperationButton` | Row-level custom operation |
| `OperationMenuButton` | Static/menu operation button |
| `ActionButtonVisualElement` | Standalone action (Ok, Cancel) |

## File Path Generation Patterns

### Page Files

**Factory Expression:** `#getPagesForRouting(#application)`

**Path Pattern:**
```
src/pages/{PagePath}/index.tsx
src/pages/{PagePath}/context.tsx
```

**Example:**
```
// UI Model: "name": "TagContainerTransfer::manyAssociationAssociation::RelationViewPage"
// Generated Path:
src/pages/TagContainerTransfer/ManyAssociationAssociation/RelationViewPage/index.tsx
```

### Container Files

**Factory Expression:** `#application.pageContainers`

**Path Pattern:**
```
src/containers/{ContainerPath}/{ContainerComponentName}.tsx
src/containers/{ContainerPath}/{ContainerComponentName}PageContainer.tsx
src/containers/{ContainerPath}/{ContainerComponentName}DialogContainer.tsx
src/containers/{ContainerPath}/components/{ComponentName}/index.tsx
```

**Example:**
```
// UI Model: "name": "TagContainerTransfer::TagContainerTransfer_View_Edit"
// Generated Paths:
src/containers/TagContainerTransfer/TagContainerTransfer_View_Edit/
├── TagContainerTransferTagContainerTransfer_View_Edit.tsx
├── TagContainerTransferTagContainerTransfer_View_EditPageContainer.tsx
├── TagContainerTransferTagContainerTransfer_View_EditDialogContainer.tsx
└── components/
    ├── TagContainerTransferTagContainerTransfer_View_EditManyAssociationComponent/
    │   └── index.tsx
    └── ...
```

### Component Naming Convention

The generated component names follow this pattern:

```
{TransferObjectName}{ViewType}{RelationName}Component
```

**Examples:**
- `TagContainerTransferTagContainerTransfer_View_EditManyAggregationAssociationComponent`
- `TransferObjectBTransferObject_ViewManyRelationComponent`

## Navigation Controller and Actor Accesses

The navigation menu is driven by the **Actor's accesses**. Each access defined on an Actor in the ESM model becomes a menu item in the sidebar. The menu structure is generated into `navigationController`:

**ESM Actor Access Definition:**
```xml
<elements xsi:type="accesspoint:ActorType" name="Actor" realm="MYAPP" principal="_UserEntity">
  <!-- Each access becomes a menu item -->
  <accesses name="Administration" target="_AdministrationInfo"/>
  <accesses name="Reports" target="_ReportsInfo"/>
</elements>
```

**UI Model:**
```json
{
  "navigationController": {
    "@id": "Actor/(esm/_xxx)/NavigationController",
    "name": "Actor::NavigationController",
    "items": [
      {
        "@id": "Actor/(esm/_xxx)/AccessMenuNavigationItemView",
        "name": "Actor::Administration::NavigationItem",
        "label": "Administration",
        "target": {
          "$ref": "Actor/(esm/_xxx)/AccessViewPageDefinition"
        }
      }
    ]
  }
}
```

**Generated React:**
```
src/layout/Drawer/DrawerContent/Navigation/menu-items.tsx
```

Each Actor access maps to a menu entry in the sidebar drawer. The access target determines the page type (Table, View, Form).

### Access Control Attributes

Access visibility and behavior can be controlled via three boolean attributes that work together:

| Attribute | Purpose | Effect when `true` |
|-----------|---------|-------------------|
| `hiddenBy` | Visibility control | Element is completely hidden from UI |
| `enabledBy` | Interactivity control | Element is enabled (clickable/editable) |
| `requiredBy` | Validation control | Field value is required |

These attributes can be:
1. **Static** - Set directly on the model element
2. **Dynamic** - Controlled by backend interceptors at runtime

**ESM Access with Control Attributes:**
```xml
<accesses name="Administration"
  target="_AdministrationInfo"
  hiddenBy="self.user.role != 'ADMIN'"
  enabledBy="self.user.isActive"/>
```

### Interceptor-Driven Access Control

Backend interceptors can dynamically modify access control by setting boolean attributes on transfer objects. The frontend reads these attributes and applies visibility/enablement rules.

**Backend Interceptor Example:**
```java
@Override
public AdministrationInfo preRead(AdministrationInfo input) {
    // Control access visibility based on user permissions
    input.setCanManageUsers(hasPermission("users:manage"));
    input.setCanManageCampaigns(hasPermission("campaigns:manage"));
    return input;
}
```

**ESM Transfer Object with Control Attributes:**
```xml
<elements xsi:type="structure:TransferObjectType" name="AdministrationInfo">
  <!-- Boolean attributes for access control -->
  <attributes name="canManageUsers" memberType="DERIVED"
    getterExpression="false" primitiveType="_BooleanType"/>
  <attributes name="canManageCampaigns" memberType="DERIVED"
    getterExpression="false" primitiveType="_BooleanType"/>

  <!-- Relations controlled by boolean attributes -->
  <relations name="users" target="_UserInfo"
    hiddenBy="not self.canManageUsers"/>
  <relations name="campaigns" target="_CampaignInfo"
    hiddenBy="not self.canManageCampaigns"/>
</elements>
```

### Access Control on Relations

The same `hiddenBy`, `enabledBy`, and `requiredBy` attributes apply to relations between transfer objects:

```xml
<relations name="sensitiveData"
  target="_SensitiveDataInfo"
  hiddenBy="not self.hasSecurityClearance"
  enabledBy="self.isVerified"/>
```

When a relation has `hiddenBy` set to `true`:
- The relation table/link is not rendered
- Navigation buttons to the relation are hidden
- Tab entries for the relation are removed

### Access Control on Attributes (Screen Widgets)

Transfer object attributes mapped as screen widgets also support these control attributes:

```xml
<attributes name="salary"
  primitiveType="_NumericType"
  hiddenBy="not self.canViewSalary"
  enabledBy="self.canEditSalary"
  requiredBy="self.isSalaryMandatory"/>
```

**Generated React Behavior:**
```tsx
// The generated component checks these boolean values
{!data.hiddenBy && (
  <TextField
    name="salary"
    disabled={!data.enabledBy}
    required={data.requiredBy}
    // ...
  />
)}
```

### UI Behavior Summary

| Scenario | Menu Item | Relation Tab | Field Widget |
|----------|-----------|--------------|--------------|
| `hiddenBy=true` | Not shown in menu | Tab not rendered | Field not rendered |
| `enabledBy=false` | Visible but greyed out | Table read-only | Field disabled |
| `requiredBy=true` | N/A | N/A | Required validation |

## Data Element Types

### ClassType

Represents entity types:

```json
{
  "eClass": "http://blackbelt.hu/judo/meta/ui#//data/ClassType",
  "@id": "Actor/(esm/_xxx)/Actor",
  "name": "Actor"
}
```

### RelationType

Represents relationships between entities:

```json
{
  "eClass": "http://blackbelt.hu/judo/meta/ui#//data/RelationType",
  "@id": "Actor/(esm/_xxx)/RelationType",
  "name": "manyRelation",
  "target": { "$ref": "..." },
  "isCollection": true,
  "isAssociation": true
}
```

**Relation Properties:**
- `isCollection`: true = 1:N, false = 1:1
- `isAssociation`: true = aggregation/association, false = composition
- `isDerived`: true = computed/read-only relation

## Page Definition Properties

| Property | Type | Description |
|----------|------|-------------|
| `openInDialog` | boolean | Opens page in modal dialog |
| `dialogSize` | string | Dialog size: XS, SM, MD, LG, XL |
| `dashboard` | boolean | Is this a dashboard page |
| `generateActionsHook` | boolean | Generate actions hook for customization |
| `isSelector` | boolean | Is this a selector page |
| `isRelationSelector` | boolean | Is this a relation selector page |

## Action References

Actions in page definitions reference action definitions from containers:

```json
{
  "actions": [
    {
      "@id": "Actor/(esm/_xxx)/RelationFeatureViewBackAction",
      "name": "Entity::relation::Back",
      "actionDefinition": {
        "eClass": "http://blackbelt.hu/judo/meta/ui#//BackActionDefinition",
        "$ref": "Actor/(esm/_yyy)/TransferObjectViewBackActionDefinition"
      },
      "isMenuAction": false
    }
  ]
}
```

**Key Properties:**
- `actionDefinition`: Reference to the action type definition
- `targetPageDefinition`: For navigation actions, the target page
- `ownerDataElement`: The data element this action operates on
- `isMenuAction`: If true, action appears in a dropdown menu

## Discriminators in IDs

When the same element type appears in multiple contexts (e.g., a column in multiple tables), discriminators are added:

```
Actor/(esm/_columnId)/TableColumn/(discriminator/Actor/(esm/_tableId)/TabularReferenceFieldRelationDefinedTable)
```

This ensures unique identification for elements that could otherwise have duplicate paths.

## Container Hook Registration

Each container generates a hook interface for customization:

**Generated Hook Interface Key:**
```typescript
export const TAG_CONTAINER_TRANSFER_TAG_CONTAINER_TRANSFER_VIEW_EDIT_CONTAINER_ACTIONS_HOOK_INTERFACE_KEY =
  'TagContainerTransferTagContainerTransfer_View_EditContainerHook';
```

**Usage in Container:**
```typescript
const { service: customContainerHook } =
  useTrackService<TagContainerTransferTagContainerTransfer_View_EditContainerHook>(
    `(${OBJECTCLASS}=${TAG_CONTAINER_TRANSFER_TAG_CONTAINER_TRANSFER_VIEW_EDIT_CONTAINER_ACTIONS_HOOK_INTERFACE_KEY})`
  );
const containerActions = customContainerHook?.(data, editMode, storeDiff) || {};
```

## Service Generation

For each page and relation, services are generated:

**Path Pattern:**
```
src/services/data-axios/{Entity}ServiceImpl.ts
src/services/data-axios/{Entity}ServiceFor{Relation}Impl.ts
```

**Example:**
```typescript
// TagContainerTransferServiceForManyAssociationAssociationImpl
class TagContainerTransferServiceForManyAssociationAssociationImpl {
  refresh(target, queryCustomizer) { ... }
  validateUpdate(target, selected) { ... }
  update(target, selected) { ... }
  delete(selected) { ... }
}
```

## Best Practices

### Finding Element IDs

1. **From UI Model JSON**: Search for element by name or type
2. **From Generated Code**: Look for `data-testid` attributes
3. **From Browser DevTools**: Inspect element to find `data-testid`

### Customization Points

1. **Container Actions Hook**: Override/extend action behavior
2. **Page Actions Hook**: Customize page-level operations
3. **Field Disabled/Required/Readonly Hooks**: Control field states
4. **Custom Components**: Register via Pandino DI

### Testing with Element IDs

```typescript
// Using data-testid in Playwright
const element = page.getByTestId('Actor/(esm/_xxx)/StringTypeTextInput');
await element.fill('test value');

// Using VisualElementIds constant
import { EntityName_Form } from '../helpers/visualElementIds/VisualElementIds';
await page.getByTestId(EntityName_Form.fieldName.id).fill('test');
```

## ESM to UI Model Mapping

The ESM (Editor Specific Model) is the source model that gets transformed into the UI model JSON. Understanding how ESM attributes affect the generated UI is critical for customization.

### ESM Relation Types and UI Actions

The ESM relation member types directly control which UI actions are generated:

#### memberType Values

| ESM memberType | Description | UI Actions Generated |
|----------------|-------------|---------------------|
| `MAPPED` | Direct mapping to entity relation | Full CRUD based on flags |
| `DERIVED` | Computed/read-only relation | No Create, limited Update/Delete |
| `TRANSIENT` | Temporary/non-persisted | View only, no CRUD actions |
| (null/absent) | Direct entity relation | Based on entity CRUD flags |

**Example ESM definitions:**

```xml
<!-- MAPPED relation - full CRUD -->
<relations xsi:type="structure:OneWayRelationMember"
  name="manyAssociationAssociation"
  memberType="MAPPED"
  createable="true" updateable="true" deleteable="true"
  binding="_J7AJ4M7uEe27c5LD4UmIwA" />

<!-- DERIVED relation - no create action -->
<relations xsi:type="structure:OneWayRelationMember"
  name="manyDerivedAssociationAssociation"
  memberType="DERIVED"
  updateable="true" deleteable="true"
  getterExpression="self.manyAssociationB" />

<!-- TRANSIENT relation - view only -->
<relations xsi:type="structure:OneWayRelationMember"
  name="manyTransient"
  memberType="TRANSIENT"
  relationKind="AGGREGATION"
  rangeExpression="Entity!filter(...)" />
```

**Generated UI Actions per memberType:**

| memberType | RelationFeatureForm | RelationFeatureTable | Create Actions | Delete Actions |
|------------|---------------------|----------------------|----------------|----------------|
| MAPPED | Yes | Yes with Create | InlineCreate, AddSelector | RowDelete, BulkDelete |
| DERIVED | No | Yes without Create | None | RowDelete, BulkDelete |
| TRANSIENT | No | View-only | None | None |

### ESM CRUD Flags on Relations

The `createable`, `updateable`, and `deleteable` flags on ESM relations control UI action generation:

```xml
<relations xsi:type="structure:OneWayRelationMember"
  name="items"
  createable="true"   <!-- Enables Create button, InlineCreateRow -->
  updateable="true"   <!-- Enables Update action in view page -->
  deleteable="true"   <!-- Enables RowDelete, BulkDelete -->
  memberType="MAPPED"
  binding="_xxx" />
```

| ESM Flag | UI Element Generated |
|----------|---------------------|
| `createable="true"` | `OpenCreateFormActionDefinition`, `InlineCreateRowActionDefinition`, `OpenAddSelectorActionDefinition` |
| `updateable="true"` | `UpdateActionDefinition` on view pages |
| `deleteable="true"` | `RowDeleteActionDefinition`, `BulkDeleteActionDefinition`, `DeleteActionDefinition` |

### ESM relationKind Values

The `relationKind` attribute affects UI representation and available actions:

| ESM relationKind | Description | UI Behavior |
|------------------|-------------|-------------|
| (null/absent) | Association | Link selector, Add/Remove actions |
| `AGGREGATION` | Owned collection | Add/Remove/Create actions |
| `COMPOSITION` | Strongly owned | Create/Delete, no Remove (cascade) |

**Example:**
```xml
<!-- Association - uses selector to add existing entities -->
<relations name="tags" relationKind="AGGREGATION" memberType="MAPPED" />

<!-- Composition - creates new entities inline -->
<relations name="orderItems" relationKind="COMPOSITION" memberType="MAPPED" />
```

### ESM Cardinality (lower/upper)

The `lower` and `upper` bounds control single vs. multiple relation UI:

| ESM lower | ESM upper | UI Component |
|-----------|-----------|--------------|
| 0 | 1 | Single link (Autocomplete) |
| 1 | 1 | Required single link |
| 0 | null/unbounded | Table (multiple) |
| 1 | null/unbounded | Table with min 1 requirement |

**Example:**
```xml
<!-- Single optional -->
<relations upper="1" name="singleAssociation" />

<!-- Single required -->
<relations lower="1" upper="1" name="singleRequired" />

<!-- Multiple (unbounded) -->
<relations name="manyAssociation" />
```

### ESM Two-Way Relations

Two-way relations use `partner` attribute:

```xml
<relations xsi:type="structure:TwoWayRelationMember"
  name="customer"
  lower="1" upper="1"
  target="_CustomerEntity"
  partner="_ordersRelation" />

<relations xsi:type="structure:TwoWayRelationMember"
  name="orders"
  target="_OrderEntity"
  partner="_customerRelation"
  primary="true" />  <!-- Primary side owns the relationship -->
```

The `primary="true"` side typically gets the table view with CRUD actions.

### ESM Entity Type Flags

Entity-level flags affect all transfer objects mapped to that entity:

```xml
<elements xsi:type="structure:EntityType"
  name="Order"
  createable="true"   <!-- Entity can be created -->
  updateable="true"   <!-- Entity can be updated -->
  deleteable="true">  <!-- Entity can be deleted -->
```

### ESM Operations to UI Actions

ESM operations generate UI operation forms and buttons:

#### Operation Types

| ESM operationType | UI Element | Location |
|-------------------|------------|----------|
| `MAPPED` | `ui:OperationForm` | View page, Table row |
| `STATIC` | `ui:MenuItemOperation` | Actor menu |
| (bound, no type) | `ui:OperationForm` | Entity view/form |

**Example ESM:**
```xml
<!-- Bound operation on entity -->
<operations name="approve" customImplementation="false" body="...">
  <output upper="1" target="_StatusInfo" name="output"/>
</operations>

<!-- Static menu operation -->
<operations name="createReport" operationType="STATIC">
  <output lower="1" upper="1" target="_ReportInfo" name="output"/>
</operations>
```

**Generated UI:**
```json
{
  "@id": "Actor/(esm/_xxx)/OperationForm",
  "name": "approve",
  "label": "Approve",
  "operation": "approve"
}
```

#### Operation Input/Output

Operations with inputs generate operation forms with submit dialogs:

```xml
<operations name="createBouquet">
  <input upper="1" target="_BouquetRequest" name="input"/>
  <output upper="1" target="_Bouquet" name="output"/>
</operations>
```

This generates:
- Operation button in view/table
- Input form dialog (if input is defined)
- Result display (if output is defined)

### ESM UI Annotations

ESM models can include direct UI hints in embedded `ui:` elements:

#### OperationForm with Confirmation

```xml
<components xsi:type="ui:OperationForm"
  name="createGarden"
  label="CreateGarden"
  operation="createGarden"
  confirmationMessage="Do you really want to create a new Garden?"
  confirmationType="MANDATORY"/>
```

| confirmationType | Behavior |
|------------------|----------|
| `MANDATORY` | Always shows confirmation dialog |
| `CONDITIONAL` | Shows dialog based on condition |
| (absent) | No confirmation |

#### ActionGroup

Groups multiple operations under a single button:

```xml
<components xsi:type="ui:ActionGroup"
  name="actionGroup"
  label="Create Matter"
  iconName="flare"
  featuredActions="2">  <!-- Number of actions visible before menu -->
```

#### ActionButton

Standalone action buttons with custom behavior:

```xml
<components xsi:type="ui:ActionButton"
  name="submit" label="Create" col="4"/>
<components xsi:type="ui:ActionButton"
  name="cancel" label="Cancel" col="4" action="CANCEL"/>
```

### ESM Attribute Types to UI Fields

| ESM Type | UI Component Generated |
|----------|----------------------|
| `type:StringType` | TextField, TextArea |
| `type:NumericType` | NumericInput |
| `type:BooleanType` | Checkbox, Switch |
| `type:DateType` | DatePicker |
| `type:TimestampType` | DateTimePicker |
| `type:TimeType` | TimePicker |
| `type:EnumerationType` | Select, RadioGroup, ToggleButtons |
| `type:BinaryType` | FileUpload |

#### Attribute Flags

```xml
<attributes xsi:type="structure:DataMember"
  name="email"
  required="true"           <!-- Field validation -->
  defaultExpression="..."   <!-- Initial value -->
  memberType="MAPPED"       <!-- MAPPED or DERIVED -->
  getterExpression="..."/>  <!-- For DERIVED: computation expression -->
```

### ESM Actor Types

Actor types define access points and available menus:

```xml
<elements xsi:type="accesspoint:ActorType"
  name="Customer"
  realm="MYAPP"
  principal="_UserEntity">
  <accesses name="orders" target="_OrderInfo"/>
  <accesses name="profile" target="_ProfileInfo"/>
</elements>
```

This generates:
- Navigation menu items for each `accesses`
- Actor-specific page routes
- Role-based access control

### ESM to UI Traceability

UI model IDs preserve ESM element IDs for traceability:

```
ESM: xmi:id="_fK52IM7uEe27c5LD4UmIwA" (OneWayRelationMember)
  ↓
UI: "@id": "Actor/(esm/_fK52IM7uEe27c5LD4UmIwA)/RelationFeatureTable"
  ↓
React: data-testid="Actor/(esm/_fK52IM7uEe27c5LD4UmIwA)/RelationFeatureTable"
```

This allows:
1. Finding UI elements from ESM definitions
2. Tracing generated code back to model elements
3. Creating hooks/customizations targeting specific model elements

### Customization Decision Tree

When deciding how to customize UI behavior, consider the ESM source:

1. **Change relation CRUD?** → Modify ESM `createable`/`updateable`/`deleteable` flags
2. **Change relation type?** → Modify ESM `memberType` (MAPPED/DERIVED/TRANSIENT)
3. **Change cardinality?** → Modify ESM `lower`/`upper` bounds
4. **Add custom operation?** → Add ESM operation element
5. **Keep ESM, customize UI?** → Implement frontend hook

## See Also

- [Frontend Development Guide](./SKILL.md) - Overview and project structure
- [Hook System](./hooks/SKILL.md) - Customization via hooks
- E2E Testing (see `judo-e2e-testing-docs` skill) - Testing with element IDs
- Model Development (see `judo-model-docs` skill) - ESM model changes
