# Architectural Patterns

This document provides a catalog of high-level architectural patterns for building robust, maintainable, and scalable JUDO applications.

## Table of Contents

- [1. Model-Driven Multi-Tenancy and Contextual Filtering](#1-model-driven-multi-tenancy-and-contextual-filtering)
- [2. The Custom Service Layer](#2-the-custom-service-layer)
- [3. State Machine Workflows](#3-state-machine-workflows)

---

## 1. Model-Driven Multi-Tenancy and Contextual Filtering

## Overview

This document describes a cohesive, end-to-end architectural pattern for implementing multi-tenancy or other forms of contextual data filtering. It connects a context-aware frontend to a model-driven backend, resulting in a secure, declarative, and highly maintainable approach to data scoping.

The core principle is that the frontend passes a context variable (like a `tenantId`) in a custom HTTP header. The backend framework then makes this variable securely available to declarative filter expressions within the data model itself. This enforces data isolation automatically and transparently, eliminating the need for developers to write repetitive filtering code in every service method.

## The End-to-End Workflow

The pattern works through a seamless flow of information from the user's browser to the database query:

1.  **Frontend: Context Propagation**
    *   The user interacts with the application in a specific context (e.g., viewing a specific tenant). The frontend maintains this context in the URL query string (e.g., `?tenantId=tenant-123`).
    *   A frontend `axios` interceptor automatically reads this context from the URL and adds it to a custom `X-Judo-RequestParameters` HTTP header on every outgoing API request.

2.  **Backend: Context Propagation**
    *   The backend framework receives the API request and parses the `X-Judo-RequestParameters` header.
    *   It populates a secure, request-scoped context map with the values from the header (e.g., `REQUEST['tenantId'] = 'tenant-123'`). This mechanism is generic and works for any key-value pairs passed in the header.

3.  **Backend: Model-Driven Filtering**
    *   The data model contains declarative expressions on entities or access rights that use a special `getVariable` function.
    *   This function accesses the values from the request-scoped context, applying the filter directly and securely at the data-access layer before any business logic is executed.

## Example Model Expression

The power of this pattern lies in the `getterExpression` within the model definition. This expression defines an access rule that is automatically enforced by the framework.

Consider a scenario where a user can only access `MyEntity` records that belong to the currently selected tenant. This is defined in the model as follows:

```xml
<accesses
    ...
    getterExpression="MyModel::entities::MyEntity!filter(e | e.tenant == MyModel::services::MyActor!getVariable('REQUEST', 'tenantId'))"
    ...
/>
```

**Breakdown:**

-   `MyModel::entities::MyEntity!filter(...)`: This specifies that the access rule applies to queries for `MyEntity`.
-   `e | e.tenant == ...`: This is the filter predicate. It dictates that the `tenant` relationship of an entity must match the context value.
-   `...getVariable('REQUEST', 'tenantId')`: This is the key to the pattern. The framework invokes this function, which securely retrieves the `tenantId` value from the `REQUEST` context (which was populated from the HTTP header). The query is then filtered based on this value.

### Rules for `accesses[*].getterExpression`

Access getters on an `ActorType` are strict; violating any rule below yields an obscure JQL-parser or ASM-validator error. All four rules apply together.

1. **The filter base must be the entity FQN**, not the TO:

    ```text
    <model>::entities::<Entity>!filter(x | …)      // ✅ ASM-valid
    <model>::services::<TO>!filter(x | …)          // ❌ ReferenceExpressionMatchesBinding
    ```

    The generator projects from the entity to the target TO automatically.

2. **`self` is not in scope.** The actor has no `self`; always iterate from the entity with a lambda variable.

3. **`accessType="DERIVED"` requires a reference-returning expression.** A boolean literal (`getterExpression="true"`) is rejected by `ReferenceBindingExpressionIsValid`. For an unrestricted "see everything" access, drop the getter and set `accessType="ALL"`.

4. **`!getVariable(...)` returns a scalar `String` only.** Compare with `==`, not `!memberOf(...)`:

    ```text
    e.<path> == <model>::types::String!getVariable('PRINCIPAL', 'partner_code')
    ```

    Primitives must be fully qualified; bare `String!getVariable(...)` fails with `Unknown symbol: String`. Multi-value claims (`Sequence<String>!getVariable(...)` does not exist in the grammar) must be consumed via a backend interceptor — see `interceptors.md` → "Backend-computed TO attribute".

When one of these rules blocks the filter you need — bipartite quantifiers, multi-value claims, external lookups — reach for the **`TRANSIENT` TO attribute + `OperationCallInterceptor`** pattern. See [Interceptors Guide](./interceptors.md), *Backend-Computed TO Attribute (JQL Escape Hatch)*.

## Connecting to Frontend Patterns

This backend pattern works in concert with frontend patterns to form the complete solution. For details on how the frontend provides the necessary context, see Advanced Patterns (see `judo-frontend-docs` skill):

-   **API Request Header Enrichment:** Explains the `axios` interceptor that adds the `X-Judo-RequestParameters` header.
-   **Navigation State Preservation:** Explains how the context in the URL is maintained across user navigation.

## Key Benefits

-   **Secure by Default:** Data scoping is enforced at the framework level based on the model definition. It is impossible for a developer to accidentally forget to apply the tenancy filter in a service method, preventing data leakage between tenants.
-   **DRY (Don't Repeat Yourself):** Multi-tenancy logic is defined once in the model instead of being repeated in every service implementation.
-   **Highly Maintainable:** If the context parameter changes (e.g., from `tenantId` to `organizationId`), the change is only required in the frontend interceptor and the model expressions, providing a single source of truth.
-   **Decoupled Architecture:** The frontend only needs to know how to provide the context; it is completely unaware of the backend's filtering implementation. The backend services remain clean and free of repetitive filtering boilerplate.

---

## 2. The Custom Service Layer

For applications with complex business logic, the most robust and scalable pattern is to create a custom service layer that is separate from the JUDO-generated operation classes.

*   **Use Case**: Your business logic is complex, involves multiple steps, is shared across several operations, or you want to maximize testability and maintainability.
*   **Pattern**: The `Operation` implementation class, generated by JUDO, is kept extremely thin. Its only responsibility is to delegate the call to a handwritten, custom "Service" class that contains the actual business logic.

*   **Implementation Workflow**:
    1.  **Model**: Define the `Operation` in the model and mark it for `Custom implementation`.
    2.  **Custom Service Interface & Implementation**: Create a new Java interface (e.g., `CommentService.java`) and its implementation (`CommentServiceImpl.java`). This class contains the "real" business logic in plain Java methods and can inject DAOs as needed.
    3.  **Delegating Operation**: The generated `Operation` implementation class simply injects your custom service and calls the appropriate method.

*   **Example**:

    **1. The thin `Operation` implementation (the "Adapter"):**
    ```java
    @Component(service = party.mkkp.edemokracia.operation.VoteUp.class)
    public class VoteUpCustomImplementation implements party.mkkp.edemokracia.operation.VoteUp {

        @Reference
        private CommentService commentService; // Inject the custom service

        @Override
        public void accept(Comment _this) {
            // Immediately delegate the work to the service layer
            commentService.voteUp(_this.identifier().getIdentifier());
        }
    }
    ```

    **2. The custom `Service` with the core logic:**
    ```java
    @Component(service = CommentService.class)
    public class CommentServiceImpl implements CommentService {

        @Reference
        private CommentDao commentDao;
        @Reference
        private UserDao userDao;

        public void voteUp(UUID commentId) {
            // The "real," complex, and testable business logic goes here.
            // e.g., check if user has already voted, update vote counts, etc.
        }
    }
    ```
*   **Key Insight**: This pattern provides a clean separation of concerns between the JUDO framework integration points (the operation classes) and your core business logic. This leads to code that is more reusable, much easier to unit test, and more maintainable in the long run.

---

## 3. State Machine Workflows

This pattern is used to manage an entity's lifecycle through a series of defined states, combining validation, data consistency, and auditing.

*   **Use Case**: You have an entity with a lifecycle (e.g., a `Product` that moves from `DRAFT` -> `FINALIZED` -> `IN_APPROVAL` -> `APPROVED`).

*   **Implementation Pattern**: The Java implementation for a state transition operation (e.g., `approveVersion()`) typically follows these steps:

    1.  **Inject Dependencies**: Use `@Reference` to inject all necessary DAO services (`ProductDao`, `TaskDao`, `EventDao`) and the `VariableResolver`.
    2.  **Guard Clause (State Validation)**: Before doing anything, load the full entity and validate its current state. Throw an exception if the operation is not valid in the current state.
    3.  **Handle Business Logic & Consistency**: Perform queries or updates needed to maintain business rules (e.g., before approving a new version, find the previously approved version and revert its state).
    4.  **Perform the State Transition**: Set the new state on the entity object (e.g., `product.setState(ProductState.APPROVED)`).
    5.  **Persist the Change**: Call the `update` method on the entity's DAO (e.g., `productDao.update(product)`).
    6.  **Update Relationships**: If the transition involves a new relationship (e.g., who approved it), use the DAO's helper methods (e.g., `productDao.setApprovedBy(product, user)`).
    7.  **Create Associated Objects**:
        *   If the transition requires another user to perform work, create a `Task` entity using its DAO and the builder pattern (`...ForCreate.builder()`).
        *   If the transition needs to be audited, create an immutable `Event` entity that records what happened, who did it, and when. This is a crucial **Event Sourcing / Auditing** sub-pattern.
