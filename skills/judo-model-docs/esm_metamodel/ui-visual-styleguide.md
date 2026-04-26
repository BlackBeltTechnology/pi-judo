# UI Visual Style Guide

**[◄ Back to Index](../SKILL.md)**

This document defines the visual style indicators and styling rules used throughout the ESM metamodel. These rules determine how elements are visually represented in both the designer and the generated frontend.

---

## Model Element Visual Indicators

### DataMember Visual Indicators

| Condition | Visual Effect |
|-----------|---------------|
| `required = true` | Bold label |
| `identifier = true` | Key icon |
| `memberType = DERIVED` | Italic label |
| `memberType = MAPPED` AND binding's `memberType = DERIVED` | Dashed line |
| `memberType = TRANSIENT` | Gray color |
| `memberType = MAPPED` AND binding source is read-only | Lock icon |
| `memberType = MAPPED` AND `binding` is null or invalid | Red/error color |

### RelationMember Visual Indicators

| RelationKind | Visual Style |
|--------------|--------------|
| `COMPOSITION` | Filled diamond at source |
| `AGGREGATION` | Empty diamond at source |
| `ASSOCIATION` | Simple line (no diamond) |

**Additional Relation Style Rules:**

| Condition | Visual Effect |
|-----------|---------------|
| `lower > 0` | Bold line (required relation) |
| `reverseCascadeDelete = true` | Cascade delete icon |

---

## UI Style Attributes

Common style attributes available on UI elements.

| Attribute | Type | Description | Used By |
|-----------|------|-------------|---------|
| `iconName` | String | Material icon name | All widgets |
| `variant` | Enum | Button style variant | ActionButton |
| `dialogSize` | Enum | Dialog dimensions | View, Form |
| `subTheme` | String | Sub-theme for styling | All VisualElement |

---

## Representation Components

Controls the visual representation of tabular data and reference fields.

| Value | Description | Use Case |
|-------|-------------|----------|
| `table` | Standard data table/grid | Default for collections |
| `tag` | Chip/tag display | Compact multi-select |
| `card` | Card layout | Visual item display |
| `button` | Button representation | Action-like references |

**Available on:** `TransferObjectTable`, `TabularReferenceField`

---

## Button Variants

Controls the visual style of buttons.

| Variant | Description |
|---------|-------------|
| `contained` | Filled button with background color |
| `outlined` | Button with border only |
| `text` | Text-only button with no border |

**Available on:** `ActionButton`, `buttonStyle` attribute on `TabularReferenceField`

---

## Layout Indicators

### Frame Attribute

| Value | Visual Effect |
|-------|---------------|
| `frame = true` | Render with border/card styling |
| `frame = false` | No border (flat appearance) |

**Available on:** `TransferObjectView`, `TransferObjectForm`, `Group`

### Size Indicators

| Attribute | Values | Visual Effect |
|-----------|--------|---------------|
| `col` | 1-12 | Grid column span width |
| `row` | 1+ | Row height span |
| `dialogSize` | `XS`, `SM`, `MD`, `LG`, `XL` | Dialog/modal dimensions |

---

## Typography Variants

Used for text display elements.

| Variant | Description |
|---------|-------------|
| `h1` - `h6` | Heading levels |
| `subtitle1`, `subtitle2` | Subtitles |
| `body1`, `body2` | Body text |
| `caption` | Small caption text |
| `overline` | Small uppercase text |

**Available on:** `TextField`

---

## Icon Usage

Icons use Material Design icon names and appear in various contexts:

| Context | Attribute | Description |
|---------|-----------|-------------|
| Field adornment | `DataField.iconName` | Input prefix icon |
| Button icon | `ActionButton.iconName`, `OperationForm.iconName` | Button leading icon |
| Menu icon | `MenuItem.iconName` | Menu item icon |
| Tab icon | `Group.iconName` (in TabBar) | Tab header icon |
| Column header | `DataColumn.iconName` | Column header icon |

---

## Visibility & State Indicators

### Dynamic Visibility

| Attribute | Effect |
|-----------|--------|
| `hidden = true` | Element not rendered |
| `hiddenBy` reference | Visibility controlled by DataFeature value |
| `enabledBy` reference | Enabled state controlled by DataFeature value |

### Required State

| Attribute | Effect |
|-----------|--------|
| `required = true` | Bold label, validation required |
| `requiredBy` reference | Required state controlled by DataFeature value |

---

## Table Visual Settings

| Attribute | Description | Default |
|-----------|-------------|---------|
| `checkboxSelection` | Row checkbox display | `AUTO` |
| `smallTable` | Compact/dense table mode | `false` |
| `isInlineEditable` | Enable inline editing | `false` |
| `countRows` | Show total row count | `false` |
| `actionColumnWidth` | Action column pixel width | Auto |
| `crudOperationsDisplayed` | Visible CRUD buttons | 1 |
| `transferOperationsDisplayed` | Visible transfer buttons | 0 |

---

## Filter Visual Settings

| Attribute | Description | Default |
|-----------|-------------|---------|
| `alwaysShown` | Show in toolbar | `false` |
| `range` | Enable from/to inputs | `false` |
| `multiValue` | Allow multi-select | `false` |

---

## Related Documentation

- [UI Element Reference](./ui.md) - Complete UI element documentation
- [UI Behaviour Rules](./ui-behaviour.md) - Conditional rules and validation
- [Structure Package](./structure.md) - Entity and attribute definitions
