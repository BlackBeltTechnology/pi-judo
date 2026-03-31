# Mutations with model_cli

Mutations modify the JUDO model through the CLI. They create, update, and delete model elements including entity types, fields, relations, transfer objects, and operations.

## Creating Entity Types

```graphql
mutation {
  createEntityType(input: {
    name: "Invoice"
    fields: [
      { name: "invoiceNumber", type: "String", required: true, maxLength: 32 },
      { name: "issueDate", type: "Date", required: true },
      { name: "totalAmount", type: "Decimal", precision: 12, scale: 2 }
    ]
  }) {
    name
  }
}
```

## Adding Fields to Existing Types

```graphql
mutation {
  addField(entityType: "Invoice", input: {
    name: "dueDate"
    type: "Date"
    required: true
  }) {
    name
    fields { name type }
  }
}
```

## Creating Relations

```graphql
mutation {
  createRelation(input: {
    source: "Invoice"
    target: "Customer"
    name: "customer"
    cardinality: "SINGLE"
    required: true
  }) {
    name
    target { name }
  }
}
```

## Creating Transfer Objects

```graphql
mutation {
  createTransferObject(input: {
    name: "InvoiceTO"
    entityType: "Invoice"
    fields: [
      { name: "invoiceNumber", mapping: "Invoice.invoiceNumber" },
      { name: "issueDate", mapping: "Invoice.issueDate" },
      { name: "totalAmount", mapping: "Invoice.totalAmount" },
      { name: "customerName", mapping: "Invoice.customer.name" }
    ]
  }) {
    name
  }
}
```

## Updating Model Elements

```graphql
mutation {
  updateField(entityType: "Invoice", field: "totalAmount", input: {
    required: true
    min: 0
  }) {
    name
    required
  }
}
```

## Deleting Model Elements

```graphql
mutation {
  deleteField(entityType: "Invoice", field: "obsoleteField") {
    success
  }
}

mutation {
  deleteEntityType(name: "ObsoleteEntity") {
    success
  }
}
```

## Batch Operations

Execute multiple mutations in a single request:

```graphql
mutation {
  batch {
    createEntityType(input: { name: "LineItem", fields: [...] }) { name }
    createRelation(input: { source: "Invoice", target: "LineItem", ... }) { name }
    createTransferObject(input: { name: "LineItemTO", ... }) { name }
  }
}
```

## Creating Enumerations

```graphql
mutation {
  createEnumeration(input: {
    name: "InvoiceStatus"
    members: ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]
  }) {
    name
    members { name }
  }
}
```

## CLI Usage

```bash
model_cli --load mutate '{ createEntityType(input: { ... }) { name } }'
model_cli --load mutate --file my-mutation.graphql
```

Always validate changes after mutation by querying back the modified elements.
