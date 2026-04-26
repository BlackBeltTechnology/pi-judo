# XMI ID Traceability Guide

This document explains the mechanisms by which JUDO maintains traceability from a model element in the Designer to the various artifacts in the generated models (`psm`, `asm`, `ui`, etc.) and runtime components.

## The Core Role of `xmi:id`

Every element created in a JUDO model—including entities, attributes, relations, and operations—is assigned a unique identifier called an `xmi:id`.

**Key Characteristics:**

1.  **Machine-Generated UUID**: The `xmi:id` is a randomly generated, universally unique identifier (e.g., `_WhYIAFnHEeyr1rjBvgyGCg`). It is **not** a human-readable identifier.
2.  **Permanent and Stable**: Once assigned, an element's `xmi:id` **never changes**. This stability is the cornerstone of all traceability mechanisms.

## Traceability Mechanisms Overview

Traceability is achieved through two primary methods that serve different purposes:

1.  **Derived ID Strings**: For logical identification within the generated application (especially in the PSM, ASM and UI layers), a hierarchical string-based identifier is created. This format encodes the path from the source ESM element to the final generated artifact.
2.  **Model-to-Model `href` Linking**: During the model transformation process (ESM -> PSM -> ASM), elements in a derived model maintain a direct, machine-readable link back to their source element. This is the "Golden Thread" of traceability for the generator.

---

## 1. Derived Traceability ID Strings

These structured strings are the primary way to trace a specific generated artifact back through the layers to its origin in the ESM.

### PSM (Platform Specific Model) Format

The first transformation step from the ESM to the PSM establishes the base pattern.

-   **Pattern**: `(esm/{esm_xmi_id})/{psm_transformation_rule}`
-   **Description**:
    -   `{esm_xmi_id}`: The original `xmi:id` of the source element in the Enterprise Specific Model.
    -   `{psm_transformation_rule}`: The name of the transformation rule that creates the PSM element (e.g., `MappedTransferObjectType`).
-   **Example**:
    -   **ESM ID**: `_6v5sILLBEfCC_efogf7jJg`
    -   **PSM ID**: `(esm/_6v5sILLBEfCC_efogf7jJg)/MappedTransferObjectType`

### ASM (Architecture Specific Model) Format

The ASM builds upon the PSM identifier, nesting the PSM ID within it.

-   **Pattern**: `(psm/{psm_id})/{asm_transformation_rule}`
-   **Description**:
    -   `{psm_id}`: The full traceability ID of the source element from the PSM.
    -   `{asm_transformation_rule}`: The name of the transformation rule that creates the ASM element (e.g., `MappedTransferObject`).
-   **Example**:
    -   **PSM ID**: `(esm/_6v5sILLBEfCC_efogf7jJg)/MappedTransferObjectType`
    -   **ASM ID**: `(psm/(esm/_6v5sILLBEfCC_efogf7jJg)/MappedTransferObjectType)/MappedTransferObject`

### RDBMS (Relational Database Management System) Format

The RDBMS layer follows the same nesting pattern, tracing back to the ASM from which it was generated.

-   **Pattern**: `(asm/{asm_id})/{rdbms_transformation_rule}`
-   **Description**:
    -   `{asm_id}`: The full traceability ID of the source element from the ASM.
    -   `{rdbms_transformation_rule}`: The name of the transformation rule that creates the RDBMS artifact (e.g., `Table`).
-   **Example**:
    -   **ASM ID**: `(psm/(esm/_j6jX8LK0EfCC_efogf7jJg)/EntityType)/EntityClass`
    -   **RDBMS ID**: `(asm/(psm/(esm/_j6jX8LK0EfCC_efogf7jJg)/EntityType)/EntityClass)/Table`

### UI (User Interface) Format

UI identifiers are scoped by an Actor and trace directly back to a source ESM element.

#### Standard UI Element Format

-   **Pattern**: `{actor_name}/(esm/{esm_xmi_id})/{ui_transformation_rule}`
-   **Description**:
    -   `{actor_name}`: The name of the Actor under which the UI element is defined.
    -   `{esm_xmi_id}`: The `xmi:id` of the source ESM element for the UI component.
    -   `{ui_transformation_rule}`: The name of the transformation rule that creates the UI component (e.g., `ClassType`).
-   **Example**:
    -   **Traceability String**: `Actor/(esm/_6v5sILLBEfCC_efogf7jJg)/ClassType`

#### Discriminated UI Element Format

This format is used for UI elements whose behavior or appearance is specialized based on another element (a "discriminator"). This is common for actions or filters within tables or views.

-   **Pattern**: `{actor_name}/(esm/{primary_esm_id})/{primary_ui_transformation_rule}/(discriminator/{d_actor_name}/(esm/{d_esm_id})/{d_ui_transformation_rule})`
-   **Description**:
    -   This pattern joins the primary UI element's ID with a nested discriminator ID.
    -   `{primary_esm_id}` / `{primary_ui_transformation_rule}`: The ID and transformation rule of the main component (e.g., a table filter action).
    -   `{d_esm_id}` / `{d_ui_transformation_rule}`: The ID and transformation rule of the discriminating element that specifies the context (e.g., the view page definition).
-   **Example**:
    -   **Traceability String**: `Actor/(esm/_CN6GsLdgEfCE0JrRXgRyVA)/TabularReferenceTableFilterAction/(discriminator/Actor/(esm/_BKai0LczEfCE0JrRXgRyVA)/AccessViewPageDefinition)`

---

## 2. Model-to-Model `href` Linking

This mechanism is used internally by the model transformation engine. It ensures that every element in a generated model (`psm.model`, `ui.model`, etc.) has a direct reference to the element it was created from.

### The `href` Format

The source reference is an `href` attribute whose format is the key to this system:

`[source_model_filename]#[source_xmi_id]`

**Example from a generated `psm.model` or `ui.model`:**

```xml
<!-- A new element with its own new xmi:id -->
<elements xsi:type="psm:PsmEntity" xmi:id="_aBcDeFgHiJkLmNoPqRsTuV" name="User">

  <!-- The "Golden Thread": a direct reference back to the source ESM element -->
  <source href="SimpleOrderManagement.model#_WhYIAFnHEeyr1rjBvgyGCg"/>

</elements>
```

This `href` link is the definitive, machine-level record of traceability between model files.
