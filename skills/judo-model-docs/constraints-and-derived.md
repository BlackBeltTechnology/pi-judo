# Constraints and Derived Attributes

Constraints enforce data integrity at the model level, while derived attributes provide computed values without storing them in the database.

## Field Constraints

Constraints are applied directly on fields:

```
entity type Product {
    field String name required maxLength(100);
    field String sku required maxLength(20) pattern("[A-Z]{2}-[0-9]{6}");
    field Decimal price required precision(10) scale(2) min(0);
    field Integer stockLevel required min(0) default(0);
}
```

### Available Constraints

| Constraint       | Applies To   | Description                          |
|------------------|-------------|--------------------------------------|
| `required`       | All types   | Field must not be null               |
| `maxLength(n)`   | String      | Maximum character count              |
| `pattern(regex)` | String      | Must match regular expression        |
| `min(n)`         | Numeric     | Minimum value (inclusive)            |
| `max(n)`         | Numeric     | Maximum value (inclusive)            |
| `precision(n)`   | Decimal     | Total number of digits               |
| `scale(n)`       | Decimal     | Number of decimal places             |
| `default(value)` | All types   | Default value when not provided      |
| `minCount(n)`    | Collection  | Minimum number of items              |
| `maxCount(n)`    | Collection  | Maximum number of items              |

## Derived Attributes

Derived attributes are computed from other fields or relations:

```
entity type Order {
    field Decimal subtotal;
    field Decimal taxRate;

    derived Decimal totalAmount => self.subtotal * (1 + self.taxRate);
    derived Boolean isHighValue => self.totalAmount > 10000;
    derived Integer itemCount => self.orderItems.size();
}
```

Derived attributes:
- Are read-only (cannot be set directly)
- Are recalculated when their source data changes
- Can reference fields from related entities through navigation
- Can use arithmetic, logical, and string expressions

## Calculated Fields on Transfer Objects

Transfer objects can expose derived attributes:

```
transfer object OrderTO maps Order {
    field Decimal totalAmount <= Order.totalAmount;  // Maps derived
    field Integer itemCount <= Order.itemCount;
}
```

## Expression Language

Derived expressions support:
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `and`, `or`, `not`
- Navigation: `self.relation.field`
- Aggregation: `.size()`, `.sum(field)`, `.min(field)`, `.max(field)`
- Conditional: `if (condition) then value1 else value2`
- String: `.concat()`, `.length()`, `.toLowerCase()`

## Best Practices

- Use model-level constraints instead of validating in custom operations where possible
- Keep derived expressions simple; complex logic belongs in custom operations
- Document the business meaning of constraints alongside the model
- Test constraint violations with integration tests to verify error messages
