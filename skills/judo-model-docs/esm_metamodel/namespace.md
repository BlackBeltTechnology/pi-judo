# `namespace` Package

**[◄ Back to Index](./SKILL.md)**

The `namespace` package provides the foundational elements for structuring the entire ESM model. It contains the containers, naming conventions, and annotation mechanisms that organize all other elements.

---

## Element Reference

### `Model`
The root container for the entire ESM definition. There is only one `Model` element per project, and it serves as the entry point to the entire model hierarchy.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the model. |
| `version` | String | `[1]` | The business version of the model (e.g., "1.0.0"). |
| `metaVersion` | String | `[1]` | The version of the ESM metamodel used. |
| `elements` | `Package` | `[0..*]` | The list of top-level packages contained within the model. |
| `annotations`| `Annotation` | `[0..*]` | A list of all available annotation types defined for the model. |
| `mimeTypes` | `MimeType` | `[0..*]` | A list of MIME types used in `BinaryType` definitions throughout the model. |

### `Package`
A container for organizing model elements into logical groups, similar to a folder or a Java package. Packages can be nested to create a hierarchy.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the package. |
| `elements` | `NamespaceElement` | `[0..*]` | A list of elements contained within this package, such as `EntityType`s, `Package`s, `ActorType`s, etc. |

### `NamedElement` (Abstract)
The abstract base class for any element in the model that has a name and can be documented or annotated. Nearly every element in the ESM metamodel inherits from `NamedElement`.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The mandatory, programmatic name of the element. |
| `documentation` | String | `[0..1]` | A textual description or documentation for the element, intended for developers. |
| `appliedAnnotations`| `Annotation` | `[0..*]` | A list of annotations that are applied to this specific element. |

### `Annotation`
A mechanism for adding custom metadata to `NamedElement`s. This is used to extend the model with platform-specific or generator-specific information (e.g., `@REST`, `@Index`).

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the annotation type (e.g., "REST"). |
| `className` | String | `[0..1]` | The fully qualified class name for the annotation in a target language (e.g., Java). |
| `elements` | `NamedElement` | `[0..*]` | A reference to all the model elements that have this annotation applied to them. |

### `MimeType`
Defines a standard MIME type (e.g., `application/pdf`) for use in `BinaryType` attributes.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | `[1]` | The main type (e.g., "application"). |
| `subType` | String | `[1]` | The subtype (e.g., "pdf"). |

### `Element` (Abstract)
The ultimate base class for all model elements. It primarily provides a common root and an operation for identity comparison.

| Operation | Description |
| :--- | :--- |
| `isIdentical(other: Element)` | Returns `true` if the `other` element is the same instance as this one. |