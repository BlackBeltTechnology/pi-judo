# Other Packages Reference

**[◄ Back to Index](./SKILL.md)**

This document covers the supporting packages in the ESM metamodel: `measure`, `expression`, and `script`.

---

## `measure` Package
This package is used for models that require the handling of physical units and measurements. It allows the model to understand concepts like currency, weight, and distance, and associate them with numeric types.

| Element | Description | Key Attributes / References |
| :--- | :--- | :--- |
| **`Measure`** | Defines a physical measure or dimension (e.g., Length, Mass, Time). It acts as a container for related units. | `name` (String), `units` (`Unit`, 0..*) |
| **`Unit`** | Defines a specific unit within a `Measure` (e.g., `Meter`, `Kilogram`, `Second`). | `name` (String), `symbol` (String), `rateDividend`/`rateDivisor` (for conversions relative to a base unit) |
| **`MeasuredType`**| A specialized `NumericType` that is explicitly associated with a `Unit`. This provides strong typing for physical quantities. | `storeUnit` (`Unit`, Required) |
| **`DurationUnit`**| A specialized `Unit` for time, with predefined types like `second`, `minute`, `hour`. | `unitType` (`DurationType` Enum) |

---

## `expression` and `script` Packages
These packages define the types for embedded logic within the model. The actual values for these attributes are strings containing the expression or script code, which are interpreted by a code generator or runtime engine.

### `expression` Package
Used for simple, declarative, and often side-effect-free logic.

| Element | Description |
| :--- | :--- |
| **`LogicalExpression`** | An expression that must evaluate to `true` or `false`. It is commonly used in `InvariantConstraint`s and `Mapping` filters. |
| **`DataExpression`** | An expression that returns a primitive value. It is used for calculated (`DERIVED`) `DataMember`s to define their `getterExpression` or `defaultExpression`. |
| **`ReferenceExpression`**| An expression that returns an object or a collection of objects. It is used for derived `RelationMember`s. |

### `script` Package
Used for more complex, imperative logic that can have side effects.

| Element | Description |
| :--- | :--- |
| **`Script`** | A block of implementation code, typically written in a target-platform scripting language (e.g., a subset of Java or JavaScript). Its primary use is for the `body` of an `Operation`. |