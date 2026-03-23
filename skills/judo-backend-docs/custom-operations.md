# Custom Operations

Custom operations are the primary way to add business logic to a JUDO application. The code generator produces `.default` implementation files for every operation defined in the model. To customize behavior, create a file with the same name but without the `.default` suffix.

## The .default File Pattern

When the model defines an operation, the generator creates:

```
src/main/java/<package>/<TransferObject>__<operationName>.default
```

To override, create:

```
src/main/java/<package>/<TransferObject>__<operationName>.java
```

The build system uses the custom `.java` file when present and falls back to `.default` otherwise. Never edit `.default` files directly -- they are regenerated on every build.

## Service Operations

Service operations are bound to a transfer object and have access to the current instance. They are invoked through the REST API as actions on a specific resource.

```java
public class MyTransferObject__myOperation implements Operation<MyTransferObjectTO> {
    @Override
    public MyTransferObjectTO execute(MyTransferObjectTO input) {
        // Access DAO via injected SDK
        // Perform business logic
        // Return result or modified input
        return input;
    }
}
```

## Exported (Unbound) Operations

Exported operations are not bound to an instance. They appear as top-level API endpoints under an access point.

```java
public class MyAccessPoint__exportedOp implements ExportedOperation<InputTO, OutputTO> {
    @Override
    public OutputTO execute(InputTO input) {
        // Stateless business logic
        return result;
    }
}
```

## Dependency Injection

Custom operations receive injected dependencies through the JUDO SDK:

- **DAO instances** for data access
- **Other operation implementations** for delegation
- **Context services** for principal, locale, and transaction management

## Best Practices

- Keep custom operations focused on a single responsibility
- Use the DAO layer for all data access rather than direct queries
- Handle validation early and throw structured exceptions
- Document the operation's contract alongside the model definition
