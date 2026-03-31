# `structure` Package Reference

**[◄ Back to Index](./SKILL.md)**

The `structure` package is the core of the ESM, defining the business entities, their data structures, and how they relate to one another. This package represents the "nouns" of the application domain.

---

## Core Structural Elements

### `Class` (Abstract)
The abstract base for all complex types in the model, such as entities and transfer objects. It provides the common features of having attributes, relationships, and inheritance.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `attributes` | `DataFeature` | `[0..*]` | The list of data attributes (fields) for this class. |
| `relations` | `RelationFeature` | `[0..*]` | The list of relationships this class has with other classes. |
| `generalizations` | `Generalization`| `[0..*]` | The list of superclasses this class inherits from. |
| `createable` | Boolean | `[1]` | Specifies if instances of this class can be created. |
| `updateable` | Boolean | `[1]` | Specifies if instances can be updated. |
| `deleteable` | Boolean | `[1]` | Specifies if instances can be deleted. |

### `EntityType`
Represents a core, persistent business object with its own lifecycle and identity (e.g., `Customer`, `Product`). This is the primary element for defining the domain model.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the entity. |
| `abstract` | Boolean | `[1]` | If `true`, this entity cannot be instantiated directly and must be subclassed. |
| `constraints` | `InvariantConstraint` | `[0..*]` | A list of business rules that must always hold true for this entity. |
| `sequences` | `EntitySequence` | `[0..*]` | Defines any database sequences associated with this entity. |

### `TransferObjectType`
A Data Transfer Object (DTO) used as a data structure for service operations or UI components. It acts as a "view" or "projection" of an `EntityType` and is the primary vehicle for data exchange.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the TO (e.g., "CustomerDTO"). |
| `mapping` | `Mapping` | `[0..1]` | A reference to the `EntityType` this TO is based on, with an optional filter. |
| `operations` | `Operation` | `[0..*]` | The list of operations that can be performed on or with this TO. |
| `form` / `table` / `view` | UI Elements | `[0..1]` each | Direct references to the primary UI components defined for this TO. |

---

## Feature & Member Elements

### `DataMember`
A data-holding attribute within a `Class` (like `EntityType` or `TransferObjectType`). It represents a single piece of information, like a name or a date.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the attribute (e.g., "firstName"). |
| `dataType` | `Primitive` | `[1]` | A reference to a logical data type from the `type` package. |
| `required` | Boolean | `[1]` | If `true`, this attribute must have a value. |
| `identifier` | Boolean | `[1]` | If `true`, this attribute is part of the natural key for the entity. |
| `memberType` | `MemberType` Enum | `[1]` | Defines how the value is obtained: `STORED` (persistent), `DERIVED` (calculated), `MAPPED` (from a mapped entity), `TRANSIENT`. |
| `defaultExpression` | `DataExpression` | `[0..1]` | An expression to calculate the default value for this attribute. |

### `TwoWayRelationMember`
A bidirectional relationship between two classes, where both ends are explicitly linked and aware of each other (e.g., `Customer.orders` and `Order.customer`).

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of this end of the relation (e.g., "orders"). |
| `target` | `Class` | `[1]` | The class on the other side of the relationship (e.g., `Order`). |
| `partner` | `TwoWayRelationMember` | `[1]` | A direct link to the corresponding member on the `target` class, making the relation bidirectional. |
| `lower` / `upper` | Integer | `[1]` | The cardinality of this end of the relationship (e.g., a Customer has `0..*` orders). |
| `relationKind`| `RelationKind` Enum | `[1]` | The nature of the relationship: `ASSOCIATION` (a simple link), `COMPOSITION` (a strong "owns" relationship with cascade delete), `AGGREGATION` (a weaker "part-of" relationship). |
| `primary` | Boolean | `[1]` | In a many-to-many relationship, one side must be designated as primary to resolve ownership. |

### `OneWayRelationMember`
A unidirectional relationship from one class to another, like a simple reference or lookup where the target class has no knowledge of the source.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the relationship. |
| `target` | `Class` | `[1]` | The class being pointed to. |
| `lower` / `upper` | Integer | `[1]` | The cardinality of the relationship. |
| `relationKind`| `RelationKind` Enum | `[1]` | The nature of the relationship (`ASSOCIATION`, `COMPOSITION`, or `AGGREGATION`). |

---

## Other Structural Elements

### `Generalization`
Represents an inheritance relationship (`is-a`) between two classes, linking a subclass to a superclass.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `target` | `Class` | `[1]` | A reference to the superclass that is being inherited from. |

### `Mapping`
Links a `TransferObjectType` to an `EntityType`, defining how the DTO is projected from the underlying entity.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `target` | `EntityType` | `[1]` | The source `EntityType` for the mapping. |
| `filter` | `LogicalExpression` | `[0..1]`| An optional expression to filter the instances of the `EntityType` that are visible through this TO. |

### `InvariantConstraint`
A validation rule or business invariant that must always be true for an instance of an `EntityType`.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the constraint. |
| `expression` | `LogicalExpression` | `[1]` | The expression that must evaluate to `true` for the entity to be valid. |

### `QueryFeature` (Abstract)
The abstract base for features that can act as data queries, defining a common structure for inputs.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `input` | `TransferObjectType`| `[0..1]` | A reference to the TO that provides the input parameters for the query. |
| `isQuery` | Boolean | `[1]` | A flag indicating that this feature represents a query. |

---

## Behaviour Rules

These rules define how structural elements behave based on their context and attribute values.

### MemberType Context Constraints

The `memberType` attribute is constrained by the owner class type and mapping state.

**Class Hierarchy:**
- `Class` (abstract base)
  - `EntityType` - persistent business object
  - `TransferObjectType` - DTO, can be **mapped** (has `mapping` to entity) or **unmapped**

#### DataMember Constraints

| MemberType | EntityType | TO (mapped) | TO (unmapped) | Notes |
|------------|------------|-------------|---------------|-------|
| `STORED` | ✓ | ✗ | ✗ | Only entities persist to database |
| `DERIVED` | ✓ | ✓ | ✓ | Calculated values allowed in all |
| `MAPPED` | ✗ | ✓ | ✗ | Requires entity source to map from |
| `TRANSIENT` | ✗ | ✓ | ✓ | Temporary values, not persisted |

#### RelationMember Constraints

**Relation Hierarchy:**
- `RelationFeature` (abstract)
  - `OneWayRelationMember` - unidirectional reference
  - `TwoWayRelationMember` - bidirectional (has `partner`)

| Relation Type | EntityType | TO (mapped) | TO (unmapped) | Notes |
|---------------|------------|-------------|---------------|-------|
| `TwoWayRelationMember` | ✓ | ✗ | ✗ | Requires partner on target entity |
| `OneWayRelationMember` | ✓ | ✓ | ✓ | Simple reference |

**OneWayRelationMember MemberType:**

| MemberType | EntityType | TO (mapped) | TO (unmapped) | Notes |
|------------|------------|-------------|---------------|-------|
| `STORED` | ✓ | ✗ | ✗ | Persistent relation |
| `DERIVED` | ✓ | ✓ | ✓ | Calculated relation |
| `MAPPED` | ✗ | ✓ | ✗ | Projects relation from entity |
| `TRANSIENT` | ✗ | ✓ | ✓ | Temporary relation |

**Summary Constraints:**
- `memberType = STORED` → owner is `EntityType`
- `memberType = MAPPED` → owner is `TransferObjectType` AND `mapping` is not null
- `memberType = TRANSIENT` → owner is `TransferObjectType`
- `memberType = DERIVED` → valid in any `Class`
- `TwoWayRelationMember` → owner is `EntityType`

### DataMember Attribute Rules

| Attribute | Available When | Description |
|-----------|----------------|-------------|
| `identifier` | Container is **EntityType** AND `memberType = STORED` | Natural key field |
| `required` | Always | Field must have a value |
| `defaultExpression` | `memberType = STORED` | Default value calculation |
| `binding` | `memberType = MAPPED` | Source attribute from mapped entity |

**Context Checks:**
- **In EntityType**: Container's type is `EntityType`
- **Read-only**: `memberType = MAPPED` AND binding source is read-only

### RelationMember Rules

#### TwoWayRelationMember

| Attribute | Description |
|-----------|-------------|
| `partner` | Required - links to the opposite end of the relationship |
| `primary` | In many-to-many, designates which side owns the relationship |
| `reverseCascadeDelete` | Partner side also has cascade delete |

#### RelationKind Behaviour

| RelationKind | Visual Style | Cascade Behaviour |
|--------------|--------------|-------------------|
| `COMPOSITION` | Filled diamond | `relationKind = COMPOSITION` → parent deletion deletes children |
| `AGGREGATION` | Empty diamond | `relationKind = AGGREGATION` → reference only, no cascade |
| `ASSOCIATION` | Simple line | `relationKind = ASSOCIATION` → simple link, no ownership |

**Note:** See [UI Visual Style Guide](./ui-visual-styleguide.md) for complete visual style rules.

### TransferObjectType Rules

| Attribute | Available When | Description |
|-----------|----------------|-------------|
| `mapping.filter` | `mapping` is NOT null | Filter expression for mapped entities |
| CRUD page | `mapping` is NOT null | CRUD tab only shown for mapped TOs |

**Context Checks:**
- **Is Mapped**: `mapping` attribute is NOT null (has EntityType reference)
- **Purify**: Removes invalid references after modifications

### Context Detection Reference

| Check | True When |
|-------|-----------|
| In EntityType | Element's container type is `EntityType` |
| In TransferObjectType | Element's container type is `TransferObjectType` |
| Is Mapped (TO) | `TransferObjectType.mapping` is NOT null |
| Is Composition | `relationKind = COMPOSITION` |
| Is Aggregation | `relationKind = AGGREGATION` |
| Is Association | `relationKind = ASSOCIATION` |
| Has Valid Binding | `memberType = MAPPED` AND `binding` references a valid source |
| Is Read-Only | `memberType = MAPPED` AND source attribute cannot be modified |

---

## Related Documentation

- [UI Visual Style Guide](./ui-visual-styleguide.md) - Visual indicators and styling rules
- [UI Behaviour Rules](./ui-behaviour.md) - Conditional attributes and validation
- [Operation Package](./operation.md) - Operation and method definitions
- [Type Package](./type.md) - Data type definitions