# Type System Guide

The JUDO type system bridges ESM model types and their Java representations. Understanding these mappings is essential when writing custom operations that manipulate model data.

## Primitive Type Mappings

| ESM Type      | Java Type              | Notes                                    |
|---------------|------------------------|------------------------------------------|
| `String`      | `java.lang.String`     | Max length from model constraint         |
| `Integer`     | `java.lang.Integer`    | 32-bit signed integer                    |
| `Long`        | `java.lang.Long`       | 64-bit signed integer                    |
| `Boolean`     | `java.lang.Boolean`    | Nullable, not primitive                  |
| `Date`        | `java.time.LocalDate`  | Date without time component              |
| `Timestamp`   | `java.time.LocalDateTime` | Date with time, no timezone           |
| `Time`        | `java.time.LocalTime`  | Time without date                        |
| `Decimal`     | `java.math.BigDecimal` | Precision/scale from model               |
| `Binary`      | `byte[]`               | Binary content (files, images)           |
| `Enumeration` | Generated Java enum    | One enum class per model enumeration     |

## Identifier Type

Every entity and transfer object has an `Identifier` field for its primary key. The `Identifier` type is framework-provided and wraps the underlying database identifier.

```java
Identifier id = entity.identifier();
MyEntityTO found = dao.getById(id);
```

## Enumeration Mapping

Model enumerations generate Java enums with the same members:

```java
// Model: enum OrderStatus { DRAFT, SUBMITTED, APPROVED, REJECTED }
// Generated:
public enum OrderStatus {
    DRAFT, SUBMITTED, APPROVED, REJECTED;
}
```

## Collection Types

Relations in the model map to `java.util.List<T>` in Java. Single-valued relations map to the target transfer object type directly.

## Nullability

All fields in transfer objects are nullable (object wrapper types, not primitives). The model's `required` constraint is enforced at the DAO validation layer, not at the Java type level.

## Custom Type Handling

When working with `Decimal` types, always use `BigDecimal` operations for arithmetic:

```java
BigDecimal total = price.multiply(quantity);
BigDecimal tax = total.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
```

## Timestamp Conventions

JUDO stores timestamps without timezone. The application layer is responsible for timezone conversion when presenting data to users. Use `LocalDateTime.now()` for current timestamps in custom operations.
