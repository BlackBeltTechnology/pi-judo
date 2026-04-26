# `operation` Package Reference

**[◄ Back to Index](../SKILL.md)**

This package defines the services and methods that encapsulate the application's business logic. It represents the "verbs" of the model, specifying the actions that can be performed on or with the data structures defined in the `structure` package.

---

## Element Reference

### `Operation`
Represents a single service operation or method. It defines the contract for a piece of business logic, including its inputs, outputs, and potential errors.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the operation (e.g., "deactivateCustomer"). |
| `input` | `Parameter` | `[0..1]` | The input parameter (DTO) for the operation. If absent, the operation takes no input. |
| `output` | `Parameter` | `[0..1]` | The return value (DTO) of the operation. If absent, the operation returns `void`. |
| `faults` | `Parameter` | `[0..*]` | A list of possible exceptions or errors the operation can throw, each defined by a `Parameter`. |
| `operationType`| `OperationType` Enum | `[1]` | Defines the nature of the operation: `INSTANCE` (operates on an object instance), `STATIC` (class-level operation), `INITIALIZER` (constructor), `ABSTRACT`, `MAPPED`. |
| `stateful` | Boolean | `[1]` | If `true`, the operation can modify the state of the system. If `false`, it is a query with no side effects. |
| `body` | `Script` | `[0..1]` | The implementation logic for the operation, often in a scripting language. |
| `customImplementation` | Boolean | `[1]` | If `true`, the body is provided manually. If `false`, the implementation may be generated. |


### `Parameter`
Defines an input, output, or fault for an `Operation`. It is a named, typed reference that specifies the data structure for the message part.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the parameter. |
| `target` | `TransferObjectType` | `[1]` | A reference to the DTO that defines the structure of this parameter. |
| `lower` / `upper` | Integer | `[1]` | The cardinality, allowing the parameter to be a single object (`1..1`) or a list of objects (`0..*`). |

### Enums

| Enum | Value | Description |
| :--- | :--- | :--- |
| **`OperationType`** | `INSTANCE` | An operation that is called on an instance of a `TransferObjectType`. |
| | `STATIC` | An operation that is called at the class level, without an instance. |
| | `INITIALIZER` | A special operation that acts as a constructor or factory for a `TransferObjectType`. |
| | `ABSTRACT` | Declares an operation that must be implemented by subclasses. |
| | `MAPPED` | An operation on a TO that is directly mapped from an operation on the underlying `EntityType`. |

---

## Behaviour Rules

These rules define how operation elements behave based on their context and attribute values.

### OperationType Context Constraints

The `operationType` attribute is constrained by the owner class type and mapping state.

#### In EntityType

| OperationType | Standard Mode | Advanced Mode | Notes |
|---------------|---------------|---------------|-------|
| `INSTANCE` | ✓ | ✓ | Operations on entity instances |
| `STATIC` | ✓ | ✓ | Class-level operations |
| `INITIALIZER` | ✓ | ✓ | Factory/constructor operations |
| `ABSTRACT` | ✗ | ✓ | Only in advanced mode |
| `MAPPED` | ✗ | ✗ | Not available in entities |

#### In TransferObjectType (mapped)

| OperationType | Available | Notes |
|---------------|-----------|-------|
| `INSTANCE` | ✓ | Operations on TO instances |
| `STATIC` | ✓ | Class-level operations |
| `INITIALIZER` | ✓ | Factory operations |
| `MAPPED` | ✓ | Binds to entity operation |

#### In TransferObjectType (unmapped)

| OperationType | Available | Notes |
|---------------|-----------|-------|
| `INSTANCE` | ✗ | No entity instance to operate on |
| `STATIC` | ✓ | Only static operations allowed |
| `INITIALIZER` | ✓ | Factory operations |
| `MAPPED` | ✗ | No entity to map from |

**Summary Constraints:**
- `operationType = ABSTRACT` → owner is `EntityType` AND `advanced mode = true`
- `operationType = MAPPED` → owner is `TransferObjectType` AND `mapping` is NOT null
- `operationType = INSTANCE` → owner is `EntityType` OR (owner is `TransferObjectType` AND `mapping` is NOT null)

### INITIALIZER Special Handling

The `INITIALIZER` type is internally stored as a combination of `STATIC` type with an `initializer` flag:

| User Selection | Internal State |
|----------------|----------------|
| `INITIALIZER` | `operationType = STATIC`, `initializer = true` |
| Any other type | `initializer = false` |

**On type change:**
- When `INITIALIZER` is selected: sets `initializer = true`, stores `operationType = STATIC`
- When switching from `INITIALIZER` to another type: sets `initializer = false`

### Operation Attribute Rules

| Attribute | Enabled When | Description |
|-----------|--------------|-------------|
| `body` | Always | JCL script (when `customImplementation = false`) or documentation (when `customImplementation = true`) |
| `customImplementation` | Always (in Implementation page) | `false` = JCL implementation, `true` = Java implementation (body used for documentation) |
| Edit body button | `operationType = STATIC` OR `operationType = INSTANCE` | Opens script editor |

### Operation Page Visibility

| Page | Visible When |
|------|--------------|
| Input | Always |
| Output | Always |
| Implementation | `advanced mode = true` AND (`operationType = INSTANCE` OR `operationType = STATIC`) |
| Faults | `advanced mode = true` |
| CRUD | `output` is NOT null |

### Input Parameter Attribute Rules

| Attribute | Enabled When | Description |
|-----------|--------------|-------------|
| `inputType` | Always | Reference to input TransferObjectType |
| `cardinality` | `input` is NOT null | `0..1`, `1..1`, or `0..*` |
| `rangeType` | `input` is NOT null AND `input.target` is mapped | `ANY` or `DERIVED` |
| `rangeExpression` | `rangeType = DERIVED` | JQL expression for filtering range |
| `wrapAsOptional` | `input` is NOT null AND `input.target` is NOT mapped | Wrap nulls in Optional |

**Cardinality Mapping:**

| Display | lower | upper |
|---------|-------|-------|
| `0..1` | 0 | 1 |
| `1..1` | 1 | 1 |
| `0..*` | 0 | -1 |

### Output Parameter Attribute Rules

| Attribute | Enabled When | Description |
|-----------|--------------|-------------|
| `outputType` | Always | Reference to output TransferObjectType |
| `cardinality` | `output` is NOT null | `0..1`, `1..1`, or `0..*` |

### Output CRUD Settings

When `output` is NOT null, CRUD permissions can be configured:

| Attribute | Description |
|-----------|-------------|
| `updateable` | External clients can modify instances |
| `deleteable` | External clients can delete instances |

### Mapped Operation Rules

**Visible when:** Owner is `TransferObjectType` AND `operationType = MAPPED`

| Attribute | Description |
|-----------|-------------|
| `binding` | Name of the operation in the mapped entity |

**Binding Candidates:** Compatible operations from `mapping.target` (EntityType) where `isOperationCompatible()` returns true.

### Parameter Validation Rules

| Rule | Description |
|------|-------------|
| `target` is NOT null | Parameter must have a target type |
| `name` is NOT empty | Parameter must have a name |
| `isUniqueName()` | Parameter name must be unique within the operation |

### Visual Style Indicators

| Condition | Visual Effect |
|-----------|---------------|
| `operationType = STATIC` | Static style/icon |
| `operationType = ABSTRACT` | Abstract style/icon |
| `operationType = STATIC` AND `initializer = true` | Initializer style/icon |
| `operationType = MAPPED` AND `isValidMapping() = false` | Error/invalid style |

### Context Detection Reference

| Check | True When |
|-------|-----------|
| In EntityType | Operation's container type is `EntityType` |
| In TransferObjectType | Operation's container type is `TransferObjectType` |
| Is Mapped (TO) | `TransferObjectType.mapping` is NOT null |
| Advanced Mode | `Model.advanced = true` |
| Has Valid Mapping | `operationType = MAPPED` AND `binding` references a valid operation |

---

## Related Documentation

- [Structure Package](./structure.md) - Entity and TransferObjectType definitions
- [UI Package](./ui.md) - OperationForm and UI bindings
- [UI Behaviour Rules](./ui-behaviour.md) - Operation-related UI rules
