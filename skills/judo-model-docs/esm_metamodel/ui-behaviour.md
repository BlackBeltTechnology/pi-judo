# UI Element Behaviour Rules

**[Back to UI Package Reference](./ui.md)**

This document describes the behaviour rules, conditional attributes, and validation constraints for UI elements. These rules are extracted from the ESM designer definition (`esm.odesign`) and define how UI elements behave based on their context and attribute values.

---

## Table of Contents

1. [Common Behaviour Rules](#common-behaviour-rules)
2. [DataField Type-Specific Rules](#datafield-type-specific-rules)
3. [Container-Specific Rules](#container-specific-rules)
4. [Conditional Attribute Rules](#conditional-attribute-rules)
5. [Validation Rules](#validation-rules)
6. [Default Values](#default-values)

---

## Common Behaviour Rules

### Component Layout Rules

All `Component` elements (widgets placed inside containers) follow these rules:

| Attribute | Rule | Validation |
|-----------|------|------------|
| `col` | Grid column span | Must be between 1 and 12 |
| `row` | Row span | Must be greater than 0 |

### VisualElement Common Attributes

| Attribute | Description | Applies To |
|-----------|-------------|------------|
| `name` | Unique identifier within container | All elements |
| `label` | Display label (i18n key) | All elements |
| `iconName` | Material icon name | All elements |
| `customImplementation` | Marks element for custom implementation | All elements |
| `hiddenBy` | DataFeature controlling visibility | Widgets |
| `enabledBy` | DataFeature controlling enabled state | Widgets |
| `requiredBy` | DataFeature controlling required state | Widgets |

---

## DataField Type-Specific Rules

DataField widgets have different attributes available based on the bound attribute's data type.

### String Type

**Applies when:** `dataFeature.dataType` is `StringType`

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `textWidget` | `TEXT` (read-only) or `INPUT` (editable) | Always |
| `textMultiLine` | Enable multi-line input | Always |
| `textMask` | Input mask pattern | `textMultiLine = false` AND `textWidget = INPUT` |
| `isTypeAheadField` | Autocomplete from previous values | Always |
| `textCountCharacters` | Show character counter | Always |

### Enumeration Type

**Applies when:** `dataFeature.dataType` is `EnumerationType`

| Attribute | Description | Values |
|-----------|-------------|--------|
| `enumWidget` | Widget representation | `RADIO`, `COMBO`, `TOGGLE_BUTTONBAR` |

### Numeric Type

**Applies when:** `dataFeature.dataType` is `NumericType`

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `formatValue` | Apply number formatting | Always |
| `minValueBy` | DataFeature for minimum value | Widget NOT inside TableOperation |
| `maxValueBy` | DataFeature for maximum value | Widget NOT inside TableOperation |

### Date Type

**Applies when:** `dataFeature.dataType` is `DateType`

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `minValueBy` | DataFeature for minimum date | Widget NOT inside TableOperation |
| `maxValueBy` | DataFeature for maximum date | Widget NOT inside TableOperation |

### Timestamp Type

**Applies when:** `dataFeature.dataType` is `TimestampType`

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `minValueBy` | DataFeature for minimum timestamp | Widget NOT inside TableOperation |
| `maxValueBy` | DataFeature for maximum timestamp | Widget NOT inside TableOperation |

### Time Type

**Applies when:** `dataFeature.dataType` is `TimeType`

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `minValueBy` | DataFeature for minimum time | Widget NOT inside TableOperation |
| `maxValueBy` | DataFeature for maximum time | Widget NOT inside TableOperation |

### Boolean Type

**Applies when:** `dataFeature.dataType` is `BooleanType`

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `booleanWidget` | `CHECKBOX` or `COMBO` | Always |
| `valueLabelPlacement` | Label position: `DEFAULT`, `START`, `END`, `TOP`, `BOTTOM` | `booleanWidget = CHECKBOX` |

### Measured Type

**Applies when:** `dataFeature.dataType` is `MeasuredType`

No additional type-specific attributes.

### Binary Type

**Applies when:** `dataFeature.dataType` is `BinaryType`

No additional type-specific attributes (file upload widget).

---

## Container-Specific Rules

### TransferObjectView

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `titleFrom` | Title source: `LABEL` or `ATTRIBUTE` | Always |
| `titleAttribute` | DataFeature to use as title | `titleFrom == ATTRIBUTE` |
| `openInDialog` | Open view in dialog instead of page | Always |
| `dialogSize` | Dialog dimensions | `openInDialog == true` |
| `autoCloseOnSave` | Auto-close dialog after save | Always |
| `additionalMaskFeatures` | Additional features for REST queries | Always |
| `generateVisualPropertiesHook` | Generate visual properties extension point | Always |
| `generateActionsHook` | Generate actions extension point | Always |

### TransferObjectForm

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `dialogSize` | Dialog dimensions | Always |
| `autoOpenAfterCreate` | Auto-open created element after operation | Always |
| `generateVisualPropertiesHook` | Generate visual properties extension point | Always |
| `generateActionsHook` | Generate actions extension point | Always |

### TransferObjectTable

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `rowsPerPage` | Number of rows per page | Always |
| `countRows` | Show total row count | Always |
| `crudOperationsDisplayed` | Number of CRUD buttons shown | Always |
| `transferOperationsDisplayed` | Number of transfer buttons shown | Always |
| `selectorRowsPerPage` | Rows per page in selector dialogs | Always |
| `selectorDialogSize` | Size of selector dialogs | Always |
| `additionalMaskFeatures` | Additional features for REST queries | Always |
| `checkboxSelection` | Row selection mode: `ENABLED`, `DISABLED`, `AUTO` | Always |
| `isInlineEditable` | Enable inline editing | Always |
| `representationComponent` | Visual representation: `table`, `card` | Always |
| `generateVisualPropertiesHook` | Generate visual properties extension point | Always |
| `generateActionsHook` | Generate actions extension point | Always |

### TabularReferenceField

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `relationFeature` | Bound relation | Always |
| `onBlur` | Enable on-blur actions | Always |
| `smallTable` | Show all rows without pagination | Relation is **many** (`upper = -1`) AND relation is **composition** or **aggregation** |
| `isInlineEditable` | Enable inline editing | Relation is **many** (`upper = -1`) |
| `representationComponent` | Display type | Context-dependent (see below) |
| `buttonStyle` | Button style (text, contained, outlined) | `representationComponent = 'button'` |
| `rowsPerPage` | Rows per page | Relation is **many** (`upper = -1`) |
| `countRows` | Show total row count | Always |
| `crudOperationsDisplayed` | Number of CRUD buttons | Always |
| `transferOperationsDisplayed` | Number of transfer buttons | Always |
| `selectorRowsPerPage` | Rows per page in selectors | Always |
| `selectorDialogSize` | Selector dialog size | Always |
| `autocompleteRows` | Rows in autocomplete dropdown | Relation is **single** (`upper = 1`) |
| `additionalMaskFeatures` | Additional features for queries | Always |

**Representation Component Options:**
- `table` - Renders as a data table (default for many relations)
- `card` - Renders as card view
- `tag` - Renders as tag/chip list
- `button` - Renders as a navigation button (available for single relations)

**Relation Kind Operations:**
- **Composition** relations: `{create, delete}` operations
- **Aggregation** relations: `{add, remove}` operations

### Group

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `layout` | Child layout: `HORIZONTAL`, `VERTICAL` | Always |
| `frame` | Show border/card styling | Always |

---

## Conditional Attribute Rules

### OperationForm Confirmation

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `confirmationType` | `NONE`, `CONDITIONAL`, `MANDATORY` | Always |
| `confirmationMessage` | Message in confirmation dialog | `confirmationType` is NOT `NONE` |
| `confirmationCondition` | Boolean DataFeature for condition | `confirmationType = CONDITIONAL` |

**Confirmation Condition Candidates:** Only **boolean attributes** from the owner TransferObjectType are available for selection.

**Confirmation Type Behaviour:**
- `NONE` - Operation executes without confirmation
- `CONDITIONAL` - Confirmation shown when selected boolean attribute is `true`
- `MANDATORY` - Confirmation always shown before execution

### OperationForm Navigation

| Attribute | Description | Candidates |
|-----------|-------------|------------|
| `postCallAccessNavigation` | Access to navigate to after operation | Accesses with same type as operation output |

### OperationForm Hooks

| Attribute | Description | Default |
|-----------|-------------|---------|
| `generateVisualPropertiesHook` | Generate visual properties extension point | `false` |
| `generateActionsHook` | Generate actions extension point | `false` |

### TableOperation Context

| Attribute | Description | Enabled When |
|-----------|-------------|--------------|
| `isBulk` | Enable for multi-select operations | Always (table operations only) |
| `confirmationCondition` | Boolean DataFeature for condition | `isBulk = false` |
| `operationForm` | Nested form configuration | Always |

**Note:** When `isBulk = true`, `confirmationCondition` is disabled because bulk operations cannot use row-level conditions (they operate on multiple rows simultaneously).

---

## Validation Rules

### Component Grid Validation

```
col <= 12        // ERROR: "The minimum width must be less or equal to 12."
row > 0          // ERROR: "The minimum height must be greater than 0."
```

### Relation-Based Validation

For `TabularReferenceField`:

| Condition | Enabled Attributes |
|-----------|-------------------|
| `relationFeature.upper == -1` (many) | `rowsPerPage`, `isInlineEditable`, `smallTable` |
| `relationFeature.upper == 1` (single) | `autocompleteRows` |
| `relationKind == AGGREGATION or COMPOSITION` | `smallTable` |

### Context-Based Validation

| Condition | Effect |
|-----------|--------|
| Widget in TableOperation | `minValueBy`, `maxValueBy` disabled |
| Widget not in TableOperation | `minValueBy`, `maxValueBy` enabled |

---

## Default Values

### TransferObjectTable Defaults

| Attribute | Default Value |
|-----------|---------------|
| `rowsPerPage` | 10 |
| `selectorRowsPerPage` | 10 |
| `crudOperationsDisplayed` | 1 |
| `transferOperationsDisplayed` | 0 |
| `checkboxSelection` | `DISABLED` |
| `countRows` | false |
| `isInlineEditable` | false |

### TabularReferenceField Defaults

| Attribute | Default Value |
|-----------|---------------|
| `rowsPerPage` | 10 |
| `selectorRowsPerPage` | 10 |
| `autocompleteRows` | 10 |
| `crudOperationsDisplayed` | 1 |
| `transferOperationsDisplayed` | 0 |
| `smallTable` | false |
| `countRows` | false |
| `isInlineEditable` | false |

### DataField Defaults

| Attribute | Default Value |
|-----------|---------------|
| `col` | 12 |
| `row` | 1 |
| `onBlur` | false |
| `formatValue` | true |
| `textMultiLine` | false |
| `isTypeAheadField` | false |
| `textCountCharacters` | false |

### OperationForm Defaults

| Attribute | Default Value |
|-----------|---------------|
| `confirmationType` | `NONE` |
| `generateVisualPropertiesHook` | false |
| `generateActionsHook` | false |

### TransferObjectView Defaults

| Attribute | Default Value |
|-----------|---------------|
| `titleFrom` | `LABEL` |
| `openInDialog` | false |
| `autoCloseOnSave` | false |
| `dialogSize` | `UNDEFINED` |
| `generateVisualPropertiesHook` | false |
| `generateActionsHook` | false |

### TransferObjectForm Defaults

| Attribute | Default Value |
|-----------|---------------|
| `dialogSize` | `UNDEFINED` |
| `autoOpenAfterCreate` | false |
| `generateVisualPropertiesHook` | false |
| `generateActionsHook` | false |

---

## Attribute Help Text Reference

### DataField Attributes

| Attribute | Help Text |
|-----------|-----------|
| `dataFeature` | The attribute of the transfer object whose value is displayed. |
| `onBlur` | If set to true the update actions will run after leaving the widget. |
| `tooltipText` | This text will be displayed in a tooltip when the user hovers over the icon next to the input. |
| `textWidget` | This defines the type of the widget to show. If Text is selected the widget is not editable, if Input is selected the widget is editable. |
| `textMultiLine` | You can use multi-line input fields if you want users to be able to write longer messages or comments. |
| `textMask` | An input mask is a string of characters that indicates the format of valid input values. |
| `isTypeAheadField` | Typeahead fields can load previously filled data for user convenience. |
| `textCountCharacters` | Only applicable for multi-line text inputs. If set, the UI will display a counter with the number of characters in the input. |
| `enumWidget` | Sets whether radio buttons or combo box is used to list literals. |
| `formatValue` | If checked, the numeric values will be formatted in inputs. Otherwise values will be used as plain numeric values. |
| `booleanWidget` | Select a boolean widget representation. |
| `valueLabelPlacement` | Select checkbox label position. |

### OperationForm Attributes

| Attribute | Help Text |
|-----------|-----------|
| `operation` | The operation of the transfer object that will be invoked. |
| `confirmationType` | NONE - The operation is executed without prior confirmation. CONDITIONAL - A dialog will be displayed accordingly to the value of the selected boolean data. MANDATORY - A confirmation dialog will be displayed before the operation execution. |
| `confirmationMessage` | The message to display before the operation execution. |
| `confirmationCondition` | Select a boolean attribute. |
| `postCallAccessNavigation` | Navigate to access of same type of operation output instance after successful call. |
| `generateVisualPropertiesHook` | If true, the generated frontend will contain extension points where developers can implement visual behaviors. |
| `generateActionsHook` | If true, the generated frontend will support custom services where developers can implement actions manually. |

### TabularReferenceField Attributes

| Attribute | Help Text |
|-----------|-----------|
| `relationFeature` | The relation of the transfer object whose value is displayed. |
| `smallTable` | If checked, all rows in the Table will appear without any pagination controls. |
| `isInlineEditable` | Enable inline editing of table rows. |
| `representationComponent` | How the relation will be represented in UI. |
| `buttonStyle` | The navigation button style. It helps to define how it represented. For example (in material) valid values are: text, contained, outlined. |
| `rowsPerPage` | Displays the given number of rows for each table page. |
| `countRows` | If set to true, the table shows total row count. |
| `crudOperationsDisplayed` | Displays the given number of CRUD operations as button. |
| `transferOperationsDisplayed` | Displays the given number of transfer operations as button. |
| `selectorRowsPerPage` | Displays the given number of rows in selectors. |
| `autocompleteRows` | Displays the given number of rows in the autocomplete dropdown. Only available on single relation components! |
| `additionalMaskFeatures` | Additional features for table rest queries. |

### TransferObjectView Attributes

| Attribute | Help Text |
|-----------|-----------|
| `titleFrom` | Select which property should be used as Title on the generated page. |
| `titleAttribute` | If the TitleFrom attribute is set to Attribute mode, the attribute selected from this list will be displayed as the Title on the page. |
| `openInDialog` | Whether the View should open in a dialog, or a navigation to the page should occur. |
| `dialogSize` | Only applies if the open in dialog setting is set to true. |
| `additionalMaskFeatures` | Additional features for transfer object rest queries. |
| `autoCloseOnSave` | If the page is opened in a dialog, enabling this automatically closes it once the user successfully saved changes. |

### TransferObjectForm Attributes

| Attribute | Help Text |
|-----------|-----------|
| `autoOpenAfterCreate` | If the operation creates a mapped element, enabling this will automatically open the created element after the operation succeeded. |

### TransferObjectTable Attributes

| Attribute | Help Text |
|-----------|-----------|
| `checkboxSelection` | Defines whether checkbox selection should be available for the table. The mode "AUTO" is not implemented yet. |

### ActionButton Attributes

| Attribute | Help Text |
|-----------|-----------|
| `action` | SUBMIT - Invokes the operation with the parameters specified on the form. CANCEL - Exits the form without invoking any action. |

### ActionGroup Attributes

| Attribute | Help Text |
|-----------|-----------|
| `featuredActions` | The first n actions that are represented as standalone buttons, the rest of the actions of the group are added to a pop up menu button. |

### PerformableAction Attributes

| Attribute | Help Text |
|-----------|-----------|
| `actionContainer` | Select a container for the action. The action will move to either the heading of a Card, or the Page action section. |

### Common Attributes

| Attribute | Help Text |
|-----------|-----------|
| `name` | The name is used for identification of the element within its container. |
| `customImplementation` | If set to true, the given element will be marked for custom implementation. The generated code will provide abstractions for developers to provide a custom implementation. |

---

## Context Detection Rules

These rules determine attribute availability based on element context and hierarchy.

### Container Hierarchy Context

| Check | True When |
|-------|-----------|
| Widget NOT in TableOperation | Element's container chain does NOT include `TableOperation` |
| OperationForm NOT in table | `OperationForm` parent is NOT `TableOperation` |
| Is Container | Element type is `TransferObjectView`, `TransferObjectForm`, or `Group` |
| Is Tabular | Element type is `TransferObjectTable` or `TabularReferenceField` |

### TabularReferenceField Display Mode

| Check | True When |
|-------|-----------|
| Is Table Mode | `representationComponent = 'table'` |
| Is Card Mode | `representationComponent = 'card'` |
| Is Button Mode | `representationComponent = 'button'` |

**Available Representation Options:**
- Single relation (`upper = 1`): `table`, `button`, `tag`
- Many relation (`upper = -1`): `table`, `card`, `tag`

### Relation Kind Detection

| Check | True When |
|-------|-----------|
| Is Composition | `relationKind = COMPOSITION` (parent owns child lifecycle) |
| Is Aggregation | `relationKind = AGGREGATION` (shared reference, no ownership) |

### Candidate Selection Rules

| Selection | Returns |
|-----------|---------|
| Available Operations | All operations defined on the owner `TransferObjectType` |
| Navigation Accesses | `Access` elements where target type matches operation output type |
| Condition Attributes | Boolean `DataMember` attributes from owner `TransferObjectType` |
| Boolean Members | `DataMember` where `dataType` is `BooleanType` |
| Numeric Members | `DataMember` where `dataType` is `NumericType` |
| Date Members | `DataMember` where `dataType` is `DateType` |
| Timestamp Members | `DataMember` where `dataType` is `TimestampType` |
| Time Members | `DataMember` where `dataType` is `TimeType` |

### Validation Checks

| Check | True When |
|-------|-----------|
| Has DataType | `DataMember.dataType` is NOT null |
| Has Relation Target | `RelationFeature.target` is NOT null |
| Is Bulk Operation | `TableOperation.isBulk = true` |

---

## Related Documentation

- [UI Package Reference](./ui.md) - Complete UI element definitions
- [ESM Structure Package](./structure.md) - Entity and attribute definitions
- Frontend ESM-to-UI Mapping (see `judo-frontend-docs` skill) - ESM to React mapping
