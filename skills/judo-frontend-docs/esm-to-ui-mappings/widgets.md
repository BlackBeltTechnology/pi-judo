# ESM to UI Mapping: Widget Components

**[◄ Overview](../SKILL.md)** | **[Tables & Navigation ►](./tables-navigation.md)**

This document covers widget components that display and edit data within containers.

---

## Widget Components

### DataField (ui:DataField)

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:DataField` | `name` | Field name | Input name |
| `ui:DataField` | `label` | Label text | Input label (i18n) |
| `ui:DataField` | `iconName` | Icon | Input adornment |
| `ui:DataField` | `col` | Grid column (1-12) | Grid md prop (default: 12) |
| `ui:DataField` | `row` | Row span | Textarea rows (default: 1) |
| `ui:DataField` | `stretch` | Stretch behavior | `NONE`/`HORIZONTAL`/`VERTICAL`/`BOTH` |
| `ui:DataField` | `fit` | Fit mode | `LOOSE`/`TIGHT` |
| `ui:DataField` | `dataFeature` (ref) | Bound attribute | Data binding |
| `ui:DataField` | `onBlur` | Blur trigger | `on{Field}BlurAction` hook |
| `ui:DataField` | `tooltipText` | Tooltip | Help icon with tooltip |
| `ui:DataField` | `hiddenBy` (ref) | Dynamic visibility | DataFeature controlling hidden state |
| `ui:DataField` | `enabledBy` (ref) | Dynamic enabled | DataFeature controlling enabled state |
| `ui:DataField` | `requiredBy` (ref) | Dynamic required | DataFeature controlling required state |
| `ui:DataField` | `minValueBy` (ref) | Minimum value | DataFeature for min validation |
| `ui:DataField` | `maxValueBy` (ref) | Maximum value | DataFeature for max validation |

**Widget Type Attributes (type-specific):**

| Attribute | Applies To | Values | Frontend Effect |
|-----------|------------|--------|-----------------|
| `enumWidget` | EnumerationType | `COMBO`/`RADIO`/`TOGGLE_BUTTONBAR` | Enum input type |
| `textWidget` | StringType | `TEXT`/`INPUT` | `TEXT`=read-only, `INPUT`=editable |
| `textMultiLine` | StringType | Boolean | Enable textarea |
| `textMask` | StringType | Pattern string | Input mask (only when `textWidget=INPUT` and `textMultiLine=false`) |
| `textCountCharacters` | StringType | Boolean | Show character counter |
| `isTypeAheadField` | StringType | Boolean | Autocomplete from previous values |
| `booleanWidget` | BooleanType | `CHECKBOX`/`COMBO` | Boolean input type |
| `valueLabelPlacement` | BooleanType | `DEFAULT`/`TOP`/`START`/`BOTTOM`/`END` | Checkbox label placement (only when `booleanWidget=CHECKBOX`) |
| `formatValue` | NumericType | Boolean | Apply number formatting (default: true) |

**Type-Specific Behaviour (from ui-behaviour.md):**

| Data Type | Available Attributes | Conditional Rules |
|-----------|---------------------|-------------------|
| `StringType` | `textWidget`, `textMultiLine`, `textMask`, `isTypeAheadField`, `textCountCharacters` | `textMask` enabled only when `textMultiLine=false` AND `textWidget=INPUT` |
| `EnumerationType` | `enumWidget` | - |
| `NumericType` | `formatValue`, `minValueBy`, `maxValueBy` | `minValueBy`/`maxValueBy` disabled when in TableOperation |
| `DateType` | `minValueBy`, `maxValueBy` | `minValueBy`/`maxValueBy` disabled when in TableOperation |
| `TimestampType` | `minValueBy`, `maxValueBy` | `minValueBy`/`maxValueBy` disabled when in TableOperation |
| `TimeType` | `minValueBy`, `maxValueBy` | `minValueBy`/`maxValueBy` disabled when in TableOperation |
| `BooleanType` | `booleanWidget`, `valueLabelPlacement` | `valueLabelPlacement` enabled only when `booleanWidget=CHECKBOX` |
| `BinaryType` | - | File upload widget |
| `MeasuredType` | - | Inherits NumericType behavior |

**Inherited from `Widget`:** `onBlur`, `requiredBy`, `minValueBy`, `maxValueBy`
**Inherited from `Component`:** `col`, `row`, `stretch`, `fit`, `hiddenBy`, `enabledBy`

**Example:**
```xml
<components xsi:type="ui:DataField"
  xmi:id="_T-UiwLLKEfCE0JrRXgRyVA"
  name="fullAddress"
  label="FullAddress"
  iconName="format-size"
  col="12"
  row="1"
  onBlur="false"
  dataFeature="_60recLLBEfCC_efogf7jJg"
  enumWidget="COMBO"
  textMultiLine="false"
  textWidget="INPUT"
  formatValue="true"/>
```

### TabularReferenceField (ui:TabularReferenceField)

**Supertypes:** `Tabular` + `ReferenceField` → (`VisualElement`, `Widget` + `PerformableAction`)

A complex widget for managing relationships (to-one or to-many).

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:TabularReferenceField` | `name` | Table name | Component name |
| `ui:TabularReferenceField` | `label` | Header | Table title (i18n) |
| `ui:TabularReferenceField` | `iconName` | Icon | Header icon |
| `ui:TabularReferenceField` | `col` | Grid column (1-12) | Layout width |
| `ui:TabularReferenceField` | `relationFeature` (ref) | Bound relation | Data binding to RelationMember |
| `ui:TabularReferenceField` | `representationComponent` | Display type | `table`/`tag`/`card`/`button` |
| `ui:TabularReferenceField` | `buttonStyle` | Button style | `text`/`contained`/`outlined` (when `representationComponent=button`) |
| `ui:TabularReferenceField` | `smallTable` | Compact mode | Dense table without pagination |
| `ui:TabularReferenceField` | `checkboxSelection` | Selection mode | `AUTO`/`ENABLED`/`DISABLED` |
| `ui:TabularReferenceField` | `countRows` | Show row count | Display total row count |
| `ui:TabularReferenceField` | `isInlineEditable` | Inline editing | Enable inline row editing |
| `ui:TabularReferenceField` | `rowsPerPage` | Page size | Pagination limit (default: 10) |
| `ui:TabularReferenceField` | `selectorRowsPerPage` | Selector page size | Pagination for selector dialogs (default: 10) |
| `ui:TabularReferenceField` | `selectorDialogSize` | Selector dialog size | `UNDEFINED`/`XS`/`SM`/`MD`/`LG`/`XL` |
| `ui:TabularReferenceField` | `autocompleteRows` | Autocomplete limit | Search result limit for single relations (default: 10) |
| `ui:TabularReferenceField` | `actionColumnWidth` | Action column width | Fixed width for action column |
| `ui:TabularReferenceField` | `columns` | Column definitions | DataColumn list |
| `ui:TabularReferenceField` | `filters` | Filter controls | DataFilter list |
| `ui:TabularReferenceField` | `rowOperations` | Row actions | TableOperation list (in action column) |
| `ui:TabularReferenceField` | `tableOperations` | Table actions | TableOperation list (in toolbar) |
| `ui:TabularReferenceField` | `additionalMaskFeatures` | Extra query fields | Additional attributes for REST queries |
| `ui:TabularReferenceField` | `crudOperationsDisplayed` | CRUD button count | Number of CRUD buttons (default: 1) |
| `ui:TabularReferenceField` | `transferOperationsDisplayed` | Transfer button count | Number of transfer buttons (default: 0) |
| `ui:TabularReferenceField` | `onBlur` | Blur trigger | `on{Field}BlurAction` hook |
| `ui:TabularReferenceField` | `hiddenBy` (ref) | Dynamic visibility | DataFeature controlling hidden state |
| `ui:TabularReferenceField` | `enabledBy` (ref) | Dynamic enabled | DataFeature controlling enabled state |

**Conditional Behaviour (from ui-behaviour.md):**

| Condition | Enabled Attributes |
|-----------|-------------------|
| `relationFeature.upper == -1` (many) | `rowsPerPage`, `isInlineEditable`, `smallTable` |
| `relationFeature.upper == 1` (single) | `autocompleteRows` |
| `relationKind in (AGGREGATION, COMPOSITION)` | `smallTable` |
| `representationComponent == 'button'` | `buttonStyle` |

**Inherited from `Tabular`:** `columns`, `filters`, `rowOperations`, `tableOperations`, `countRows`, `checkboxSelection`, `isInlineEditable`, `additionalMaskFeatures`
**Inherited from `ReferenceField`:** `relationFeature`
**Inherited from `Widget`:** `onBlur`
**Inherited from `Component`:** `col`, `hiddenBy`, `enabledBy`

**Example:**
```xml
<components xsi:type="ui:TabularReferenceField"
  xmi:id="_UINekLLKEfCE0JrRXgRyVA"
  name="nationalInduvidualElectoralDistrict"
  label="NationalInduvidualElectoralDistrict"
  iconName="table_rows"
  checkboxSelection="ENABLED"
  col="12"
  relationFeature="_80D8QLLBEfCC_efogf7jJg"
  representationComponent="table"
  rowsPerPage="10"
  selectorRowsPerPage="10"
  autocompleteRows="10"/>
```

### OperationForm (ui:OperationForm)

**Supertypes:** `Container` → `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

Widget that triggers an action, bound to a specific operation. Typically renders as a button with optional dialog for input parameters. Contains nested form elements (DataFields, ActionButtons) when the operation has parameters.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:OperationForm` | `name` | Form name | Component name |
| `ui:OperationForm` | `label` | Form/button text | Button label (i18n) |
| `ui:OperationForm` | `iconName` | Icon | Button icon |
| `ui:OperationForm` | `operation` | Target operation | Operation binding |
| `ui:OperationForm` | `col` | Grid column | Layout width |
| `ui:OperationForm` | `row` | Row span | Layout height |
| `ui:OperationForm` | `disabled` | Disabled state | Static disabled |
| `ui:OperationForm` | `hidden` | Hidden state | Static hidden |
| `ui:OperationForm` | `variant` | Button style | contained/outlined/text |
| `ui:OperationForm` | `dialogSize` | Dialog dimensions | `XS`/`S`/`M`/`L`/`XL`/`UNDEFINED` |
| `ui:OperationForm` | `confirmationType` | Confirmation behavior | `NONE`/`CONDITIONAL`/`MANDATORY` |
| `ui:OperationForm` | `confirmationMessage` | Message in dialog | Confirmation dialog text |
| `ui:OperationForm` | `confirmationCondition` | Boolean DataFeature | Condition for CONDITIONAL type |
| `ui:OperationForm` | `postCallAccessNavigation` | Access navigation | Navigate to Access after success |
| `ui:OperationForm` | `autoOpenAfterCreate` | Auto-open created | Opens created element automatically |
| `ui:OperationForm` | `generateVisualPropertiesHook` | Enable visual hook | Extension point for visual properties |
| `ui:OperationForm` | `generateActionsHook` | Enable actions hook | Extension point for custom actions |
| `ui:OperationForm` | `components` | Form widgets | DataFields, ActionButtons, Groups |

**Confirmation Types:**

| Type | Frontend Effect |
|------|-----------------|
| `NONE` | Operation executes without confirmation |
| `CONDITIONAL` | Confirmation dialog shown based on boolean attribute value |
| `MANDATORY` | Confirmation dialog always shown before execution |

**Nested Form Elements:**
- `DataField` - Input fields bound to operation parameters
- `ActionButton` - Submit/Cancel buttons
- `Group` - Layout container for organizing form fields
- `TabularReferenceField` - Relation selector within form

**Example:**
```xml
<components xsi:type="ui:OperationForm"
  xmi:id="_ABC123"
  name="approveForm"
  label="Approve"
  iconName="check"
  operation="approveOperation"
  dialogSize="M"
  confirmationType="MANDATORY"
  confirmationMessage="Are you sure you want to approve?"
  col="3">
  <components xsi:type="ui:DataField" name="comment" dataFeature="comment" col="12"/>
  <components xsi:type="ui:ActionButton" name="submit" action="SUBMIT" label="Confirm"/>
  <components xsi:type="ui:ActionButton" name="cancel" action="CANCEL" label="Cancel"/>
</components>
```

### TextField (ui:TextField)

Simple unbound text display widget for static text or labels.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:TextField` | `name` | Element name | Component name |
| `ui:TextField` | `text` | Display text | Static text content |
| `ui:TextField` | `col` | Grid column | Layout width |
| `ui:TextField` | `variant` | Text style | Typography variant |

**Example:**
```xml
<components xsi:type="ui:TextField"
  xmi:id="_DEF456"
  name="infoText"
  text="Please fill in all required fields"
  col="12"/>
```

### ActionButton (ui:ActionButton)

Button for standard form actions like Submit or Cancel.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:ActionButton` | `name` | Button name | Component name |
| `ui:ActionButton` | `action` | Action type | SUBMIT / CANCEL |
| `ui:ActionButton` | `label` | Button text | Button label (i18n) |
| `ui:ActionButton` | `iconName` | Icon | Button icon |
| `ui:ActionButton` | `variant` | Button style | contained/outlined/text |

**Action Types:**

| Action | Frontend Effect |
|--------|-----------------|
| `SUBMIT` | Triggers form submission/save operation |
| `CANCEL` | Closes dialog/navigates back without saving |

### Layout Components

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:Group` | `name` | Group name | Container div |
| `ui:Group` | `layout` | Direction | HORIZONTAL/VERTICAL |
| `ui:Group` | `frame` | Border | Container styling |
| `ui:Group` | `col` | Grid column | Layout width |
| `ui:Group` | `label` | Group title | Section header |
| `ui:TabBar` | `name` | Tab container | MUI Tabs |
| `ui:TabBar` | `orientation` | Tab direction | HORIZONTAL/VERTICAL |
| `ui:TabBar` | `tabs` | Tab panels | Group list |
| Tab panel | `components` | Tab content | Tab panel content |

### Stepper (ui:Stepper)

**Supertypes:** `Container` → `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

Container that organizes child groups into a sequential wizard-style flow.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:Stepper` | `name` | Stepper name | Component name |
| `ui:Stepper` | `orientation` | Direction | HORIZONTAL/VERTICAL |
| `ui:Stepper` | `steps` | Step panels | Group list |
| `ui:Stepper` | `linear` | Linear mode | Force sequential |
| Step panel | `label` | Step title | Step header |
| Step panel | `components` | Step content | Step panel content |

### Divider (ui:Divider)

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

Visual separator element for dividing sections within a container.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:Divider` | `name` | Divider name | Component name |
| `ui:Divider` | `col` | Grid column | Layout width |
| `ui:Divider` | `row` | Row span | Layout height |

**Example:**
```xml
<components xsi:type="ui:Divider"
  xmi:id="_DIV123"
  name="sectionDivider"
  col="12"/>
```

### Placeholder (ui:Placeholder)

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

Reserved space for custom implementations or future content.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:Placeholder` | `name` | Placeholder name | Component name |
| `ui:Placeholder` | `col` | Grid column | Layout width |
| `ui:Placeholder` | `row` | Row span | Layout height |
| `ui:Placeholder` | `customImplementation` | Custom flag | Marked for custom implementation |

**Example:**
```xml
<components xsi:type="ui:Placeholder"
  xmi:id="_PH123"
  name="customSection"
  customImplementation="true"
  col="12"/>
```

### Icon (ui:Icon)

**Supertypes:** `Widget` → `Component` → `FormElement` → `VisualElement` → `NamedElement`

Standalone icon display widget.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:Icon` | `name` | Icon name | Component name |
| `ui:Icon` | `iconName` | Material icon | Icon display |
| `ui:Icon` | `col` | Grid column | Layout width |
| `ui:Icon` | `row` | Row span | Layout height |

**Example:**
```xml
<components xsi:type="ui:Icon"
  xmi:id="_ICO123"
  name="statusIcon"
  iconName="check_circle"
  col="1"/>
```

### ActionGroup (ui:ActionGroup)

**Supertypes:** `VisualElement` → `NamedElement`

Container for grouping related actions/buttons with automatic overflow handling.

| ESM Element | ESM Attribute | UI Model | Frontend Effect |
|-------------|---------------|----------|-----------------|
| `ui:ActionGroup` | `name` | Group name | Component name |
| `ui:ActionGroup` | `label` | Group label | Group header (i18n) |
| `ui:ActionGroup` | `featuredActions` | Featured count | First N actions as buttons |
| `ui:ActionGroup` | `actions` | Action list | PerformableAction list |

**Behaviour:** The first `featuredActions` actions are displayed as standalone buttons. Remaining actions are placed in a popup menu.

**Example:**
```xml
<actionGroup xsi:type="ui:ActionGroup"
  xmi:id="_AG123"
  name="pageActions"
  featuredActions="2">
  <actions xsi:type="ui:PerformableAction" name="edit" label="Edit"/>
  <actions xsi:type="ui:PerformableAction" name="delete" label="Delete"/>
  <actions xsi:type="ui:PerformableAction" name="export" label="Export"/>
</actionGroup>
```
