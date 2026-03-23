# Querying with model_cli

The `model_cli` tool uses GraphQL to query model elements. This guide covers query patterns, introspection, and navigation.

## Basic Queries

Query entity types:

```graphql
{
  entityTypes {
    name
    fields {
      name
      type
      required
      constraints {
        maxLength
        min
        max
      }
    }
  }
}
```

Query transfer objects:

```graphql
{
  transferObjects {
    name
    mapped
    entityType {
      name
    }
    fields {
      name
      type
      mapping {
        entityField
      }
    }
  }
}
```

## Introspection

Use `__type` queries to explore the schema:

```graphql
{
  __type(name: "Order") {
    name
    kind
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

List all available types:

```graphql
{
  __schema {
    types {
      name
      kind
    }
  }
}
```

## Filtering

Filter query results by field values:

```graphql
{
  entityTypes(filter: { name: { eq: "Order" } }) {
    name
    fields {
      name
      type
    }
  }
}
```

## Navigation

Traverse relations in queries:

```graphql
{
  entityTypes(filter: { name: { eq: "Order" } }) {
    name
    relations {
      name
      target {
        name
      }
      cardinality
      composition
    }
  }
}
```

## Query for Operations

```graphql
{
  transferObjects(filter: { name: { eq: "OrderTO" } }) {
    operations {
      name
      input { name type }
      output { name type }
      bound
    }
  }
}
```

## Query for Enumerations

```graphql
{
  enumerations {
    name
    members {
      name
      ordinal
    }
  }
}
```

## CLI Usage

```bash
model_cli --load query '{ entityTypes { name } }'
model_cli --load query --file my-query.graphql
```

The `--load` flag ensures the model is loaded before executing the query.
