---
name: judo-model-esm-metamodel-docs
description: ESM metamodel reference for JUDO. Covers namespace, type, structure, operation, accesspoint, UI, UI-behaviour, and UI-visual-styleguide packages with element-level attribute and constraint definitions.
disable-model-invocation: false
user-invocable: false
model: inherit
context: fork
agent: general-purpose
---

# ESM Metamodel Documentation Index

Welcome to the detailed documentation for the Editor Specific Model (ESM) metamodel. This documentation is structured to be easily parsed and navigated by agentic LLM coders, providing a clear and modular breakdown of every component in the `esm.ecore` definition.

The ESM is a high-level, platform-independent model that defines the complete structure, behavior, and user interface of an application. It serves as a single source of truth from which code, documentation, and other artifacts can be generated.

## Metamodel Packages

The metamodel is organized into several distinct packages, each responsible for a different aspect of the application's definition. Please select a package below to view its detailed element reference.

*   [**`namespace` Package](./namespace.md)
    *   **Purpose**: Foundational elements for model organization, naming, and structure (e.g., `Model`, `Package`).

*   [**`type` Package](./type.md)
    *   **Purpose**: Logical, platform-independent data types (e.g., `StringType`, `NumericType`, `EnumerationType`).

*   [**`structure` Package](./structure.md)
    *   **Purpose**: The core business domain model, including entities, attributes, and relationships (e.g., `EntityType`, `DataMember`, `TwoWayRelationMember`).

*   [**`operation` Package](./operation.md)
    *   **Purpose**: Service definitions, methods, and their parameters (e.g., `Operation`, `Parameter`).

*   [**`accesspoint` Package](./accesspoint.md)
    *   **Purpose**: Security model, including user roles (actors), permissions, and access control (e.g., `ActorType`, `Access`).

*   [**`ui` Package](./ui.md)
    *   **Purpose**: User interface definitions, including forms, tables, fields, and their direct binding to the data and operation models (e.g., `TransferObjectView`, `DataField`, `OperationForm`).
    *   **Authoring workflow**: For composing these elements into Form / Table / View scaffolds, see [UI Authoring Guide](../ui-authoring-guide.md).

*   [**UI Visual Style Guide**](./ui-visual-styleguide.md)
    *   **Purpose**: Visual style indicators and styling rules for model elements and UI components.

*   [**Other Packages (`measure`, `expression`, `script`)**](./other.md)
    *   **Purpose**: Supporting packages for handling physical units of measure, embedded expressions, and implementation scripts.

## Cross-Cutting References

*   [**Generator Reserved Names**](./generator-reserved-names.md)
    *   **Purpose**: Relation/attribute names that collide with methods emitted by the frontend/service generators (e.g. `template` on a `createable` TO). Avoid these at modelling time to prevent downstream `TS2393 Duplicate function implementation` errors.
