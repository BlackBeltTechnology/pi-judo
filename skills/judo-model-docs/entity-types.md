# Entity Types

Entity types are the persistent domain objects in a JUDO model. They define the data that is stored in the database and form the foundation of the data model.

## Defining an Entity Type

An entity type has a name, optional supertype, and a set of fields (attributes):

```
entity type Order {
    field String orderNumber required maxLength(32);
    field Date createdDate required;
    field Decimal totalAmount precision(12) scale(2);
    field Boolean isActive default(true);
    field Timestamp lastModified;
}
```

## Field Types

Fields use ESM primitive types:

| Type        | Description                                | Common Constraints            |
|-------------|--------------------------------------------|-------------------------------|
| `String`    | Text data                                  | `maxLength`, `pattern`        |
| `Integer`   | 32-bit integer                             | `min`, `max`                  |
| `Long`      | 64-bit integer                             | `min`, `max`                  |
| `Boolean`   | True/false                                 | `default`                     |
| `Date`      | Calendar date (no time)                    | --                            |
| `Timestamp` | Date and time                              | --                            |
| `Time`      | Time of day                                | --                            |
| `Decimal`   | Arbitrary-precision number                 | `precision`, `scale`          |
| `Binary`    | Raw binary data                            | `maxFileSize`, `mimeTypes`    |

## Field Constraints

- `required` -- Field must have a value (not null)
- `maxLength(n)` -- Maximum string length
- `pattern("regex")` -- String must match regex
- `min(n)` / `max(n)` -- Numeric range bounds
- `precision(n)` / `scale(n)` -- Decimal precision
- `default(value)` -- Default value when not specified

## Inheritance

Entity types support single inheritance:

```
entity type PremiumOrder extends Order {
    field Decimal discountRate precision(4) scale(2);
    field String loyaltyCode maxLength(16);
}
```

The subtype inherits all fields and relations from the supertype.

## Identifier

Every entity type automatically has an identifier field managed by the framework. This identifier is used for lookups and references but is not explicitly declared in the model.

## Best Practices

- Name entity types as singular nouns (Order, Customer, Product)
- Apply appropriate constraints to enforce data quality at the model level
- Use inheritance judiciously -- prefer composition through relations for complex hierarchies
- Keep entity types focused on a single domain concept
