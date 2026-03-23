# Access Points

Access points define the entry points to the application's API. They control which transfer objects and operations are visible and which actor types can access them.

## Defining an Access Point

An access point exposes a set of transfer objects and operations:

```
access point AdminAccessPoint {
    expose OrderTO[] orders;
    expose CustomerTO[] customers;

    operation OrderSummaryTO getOrderSummary(OrderFilterInput input);
}
```

## Actor Types and Access Points

Each actor type is associated with an access point:

```
actor type AdminUser maps User {
    access AdminAccessPoint;
}

actor type RegularUser maps User {
    access UserAccessPoint;
}
```

Different actor types see different slices of the application through their respective access points.

## Bound Operations

Bound operations are attached to a transfer object and operate on a specific instance:

```
transfer object OrderTO maps Order {
    operation void approve();
    operation void reject(RejectionInput input);
    operation OrderTO updateStatus(StatusChangeInput input);
}
```

These appear as actions on the REST resource (e.g., `POST /orders/{id}/approve`).

## Unbound (Exported) Operations

Unbound operations are top-level operations on the access point, not tied to any instance:

```
access point AdminAccessPoint {
    operation DashboardTO getDashboard();
    operation ReportTO generateReport(ReportInput input);
}
```

These appear as standalone endpoints (e.g., `POST /admin/generateReport`).

## Operation Signatures

Operations can have:
- **No input, no output**: `operation void doSomething()`
- **Input only**: `operation void process(InputTO input)`
- **Output only**: `operation OutputTO compute()`
- **Input and output**: `operation OutputTO transform(InputTO input)`

## Exposed Relations

Access points can expose filtered or scoped relations:

```
access point UserAccessPoint {
    expose OrderTO[] myOrders filter(order.customer == principal);
}
```

## Best Practices

- Create separate access points for each actor type with minimal required permissions
- Use bound operations for instance-specific actions
- Use unbound operations for global queries and reports
- Keep operation signatures focused -- one input, one output
- Name operations as verbs describing the action (approve, reject, generateReport)
