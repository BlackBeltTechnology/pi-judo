# Transfer Objects

Transfer objects (TOs) define the data shapes exposed through the API. They control what data is visible to external consumers and how it maps to the underlying entity types.

## Mapped Transfer Objects

A mapped TO is backed by an entity type. It selects which entity fields to expose and can rename them:

```
transfer object OrderTO maps Order {
    field String orderNumber <= Order.orderNumber;
    field Date createdDate <= Order.createdDate;
    field Decimal totalAmount <= Order.totalAmount;
    // Note: isActive and lastModified are NOT exposed
}
```

The `<=` operator defines the mapping from the TO field to the entity field.

## Unmapped Transfer Objects

Unmapped TOs are not backed by entities. They serve as input/output types for operations:

```
transfer object CreateOrderInput {
    field String customerCode required;
    field String productCode required;
    field Integer quantity required min(1);
}

transfer object OrderSummaryOutput {
    field String orderNumber;
    field String statusLabel;
    field Decimal totalAmount;
}
```

## Field Mappings

Mapped TO fields can reference:
- Direct entity fields: `field String name <= Entity.name`
- Related entity fields via navigation: `field String customerName <= Order.customer.name`
- Derived attributes: `field Decimal computed <= Entity.derivedField`

## Relation Mappings

TOs can also map entity relations:

```
transfer object OrderTO maps Order {
    relation OrderItemTO[] items <= Order.orderItems;
    relation CustomerTO customer <= Order.customer;
}
```

## View Transfer Objects

View TOs are read-only mapped TOs used for list views and summaries. They typically expose fewer fields and flatten related data:

```
transfer object OrderListViewTO maps Order {
    field String orderNumber <= Order.orderNumber;
    field String customerName <= Order.customer.name;
    field String statusLabel <= Order.status.label;
}
```

## Best Practices

- Create focused TOs that expose only what the consumer needs
- Use unmapped TOs for operation inputs/outputs rather than exposing entity types directly
- Map only the fields needed for each use case (list view vs. detail view)
- Name TOs with a suffix indicating their purpose (e.g., `ListViewTO`, `FormTO`, `SummaryTO`)
