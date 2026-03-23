# Relations

Relations define how entity types connect to each other. JUDO supports several relation types with different ownership and lifecycle semantics.

## Association

An association is a reference from one entity to another without ownership:

```
entity type Order {
    relation Customer customer;  // Many-to-one association
}
```

The order references a customer, but deleting the order does not delete the customer.

## Collection Association

A collection association represents a one-to-many or many-to-many reference:

```
entity type Customer {
    relation Order[] orders opposite customer;  // One-to-many
}

entity type Product {
    relation Category[] categories;  // Many-to-many
}
```

## Composition

Composition implies ownership -- the child's lifecycle is bound to the parent:

```
entity type Order {
    relation OrderItem[] items composition;  // Order owns its items
}
```

When the order is deleted, its items are automatically deleted. Items cannot exist without their parent order.

## Containment

Containment is similar to composition but also controls the physical storage:

```
entity type Invoice {
    relation InvoiceLine[] lines containment;
}
```

Contained entities are stored with their parent and cannot be independently queried.

## Opposite Relations

Bidirectional relations use the `opposite` keyword:

```
entity type Order {
    relation Customer customer;
    relation OrderItem[] items composition opposite order;
}

entity type OrderItem {
    relation Order order opposite items;
}
```

## Cardinality

- Single-valued: `relation Customer customer` -- zero or one
- Required single: `relation Customer customer required` -- exactly one
- Collection: `relation Order[] orders` -- zero or more
- Bounded collection: `relation OrderItem[] items minCount(1) maxCount(100)` -- bounded

## Relation Constraints

- `required` -- The relation must have a value
- `minCount(n)` / `maxCount(n)` -- Collection size bounds
- `opposite` -- Declares the bidirectional partner

## Best Practices

- Use composition for parent-child relationships where the child has no independent existence
- Use association for references between independent entities
- Always define opposites for bidirectional navigability
- Be explicit about cardinality constraints to enforce data integrity
