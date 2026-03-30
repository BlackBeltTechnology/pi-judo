# Advanced JUDO Modeling Patterns

This document details advanced, non-obvious design patterns and concepts for the JUDO Editor Specific Model (ESM). These patterns represent a deeper understanding of the platform's capabilities and were discovered through a detailed, query-based analysis of existing application models. They go beyond the basic workflow to cover more complex architectural and security considerations.

## Table of Contents
1.  [Architectural Patterns](#1-architectural-patterns)
2.  [Security & UI Patterns](#2-security--ui-patterns)
3.  [Polymorphism Patterns](#3-polymorphism-patterns)
4.  [Advanced JQL Concepts](#4-advanced-jql-concepts)

---

## 1. Architectural Patterns

### Pattern: The View Model (Dashboard)
*   **Use Case**: You need to build a complex UI screen or dashboard that displays multiple, contextually-linked collections of data that do not represent a single, persistent entity. For example, a screen that shows "My Active Reservations," "My Past Reservations," and "Upcoming Company Holidays" all at once.
*   **Problem**: A simple `TransferObjectType` mapped 1:1 to a single `Entity` is insufficient to represent such a screen, as the data comes from multiple sources and has different filtering logic.
*   **Pattern**:
    1.  Create simple, data-focused `TransferObjectType`s that represent the individual items to be displayed (e.g., `UserReservation`, `Holiday`). These often have few or no relations of their own.
    2.  Create a higher-level, **unmapped** `TransferObjectType` that represents the entire view or screen (e.g., `UserReservationPanel`). This acts as the "View Model."
    3.  Define all the contextual relationships on this View Model TO. These are almost always **`DERIVED`** relations, each with its own `Getter expression` to fetch and filter its specific data set (e.g., `activeReservations`, `pastReservations`).
    4.  The main `Access` link for the actor then targets this high-level View Model (`UserReservationPanel`), not the individual data TOs.
*   **Key Insight**: This pattern decouples the UI's structure from the domain model's structure. It allows you to create purpose-built screens by creating a transient "view model" that aggregates and filters data from multiple sources, presenting it in exactly the way the UI needs it, without requiring a direct mapping to a single database entity. This was observed in the `ParkHere.model`.

### Pattern: Fully User-Scoped Data Access
*   **Use Case**: In a multi-user application, you need to strictly enforce that a user can only see data directly related to their own user entity (e.g., "My Profile," "My Orders").
*   **Pattern**: The entire accessible data graph for a user role is made `Derived` and is rooted in that user's own single entity instance.
    1.  **Root Access**: Create a `Derived` `Access` link for the `ActorType` with a cardinality of `0..1`. The `getterExpression` for this access finds the single `User` entity corresponding to the logged-in actor. This is the root of the user's "world".
        ```jql
        // Getter for the 'dashboard' or 'profile' access
        MySystem::User!filter(u | u.email == String!getVariable("ACTOR", "email"))!any()
        ```
    2.  **Subsequent Accesses**: Define all other `Access` links for this actor to navigate from this root object.
        ```jql
        // Getter for the 'myOrders' access, navigating from the user object
        MySystem::User!filter(u | u.email == String!getVariable("ACTOR", "email"))!any().orders
        ```
*   **Key Insight**: This architectural pattern, seen in `SimpleOrderManagement.model`, ensures total data isolation. The user is effectively "jailed" within the object graph rooted at their own user entity. It is a fundamentally more secure architecture than applying filters to global data sets.

---

## 2. Security & UI Patterns

### Pattern: Dynamic Menu System for Multi-Level Permissions & Tenancy
*   **Use Case**: You have a single user role (e.g., `AccountActor`) but need to show different menu items based on their specific permissions (e.g., Super Admin vs. regular Admin) or their current context (e.g., which "Organization" tenant they have selected).
*   **Pattern**:
    1.  Define a single, comprehensive `ActorType` with `Access` links to *all* potentially visible data sets.
    2.  On the `Actor`'s `principal` `TransferObjectType`, define a set of **`DERIVED` boolean attributes** that act as state flags (e.g., `isSuperAdmin`, `isOrganizationSelected`). The `getterExpression` for these flags contains the logic to determine the user's status.
    3.  Model the entire menu structure using `MenuItemAccess` elements.
    4.  Use the **`hiddenBy`** property on each `MenuItemAccess` to link its visibility to one of the boolean state flags.
*   **Key Insight**: This pattern, observed in `Ubives.model` and `Alba.model`, centralizes complex permission and UI state logic onto the main `principal` object. The UI (e.g., the navigation menu) then declaratively binds to this state, dynamically showing or hiding entire sections of the application based on the user's role and context, without requiring multiple actor definitions.

---

## 3. Polymorphism Patterns

### Pattern: Platform-Managed Polymorphic Creation
*   **Use Case**: You have an `Access` link to a collection of an abstract base type (e.g., `VoteDefinition`), and you want the UI's "Create" button to allow the user to choose which concrete subtype to create (e.g., "Create Yes/No Vote" or "Create Rating Vote").
*   **Pattern**: This is an implicit, convention-based pattern handled by the JUDO platform.
    1.  **Model**: Define an abstract base `EntityType` (e.g., `VoteDefinition`).
    2.  **Model**: Define several concrete `EntityType`s that `Generalize` (inherit from) the base type.
    3.  **Model**: The `Access` link in the service layer targets the *abstract base `TransferObjectType`*.
*   **Key Insight**: The developer does not need to write a special "factory" `Operation` or custom UI code. When the user clicks the auto-generated "Create" button, the JUDO frontend framework introspects the model, finds all the concrete, instantiable subtypes of the abstract target, and automatically presents the user with a choice. This "zero-code" pattern was observed in the `edemokracia.model`.

### Pattern: Differentiating Polymorphic Types in the UI
*   **Use Case**: In a UI list containing mixed subtypes (e.g., `Pro` and `Con` arguments), you need to visually distinguish between them.
*   **Pattern**: The model enables this by providing distinct UI metadata entry points (`View` definitions) for each concrete subtype.
    *   **Model-Driven (Preferred)**: Set distinct properties like `iconName` or `subTheme` on the `View` definition of each concrete `TransferObjectType` (`ProTO`, `ConTO`). The UI generator can use these explicit hints to render each item differently.
    *   **Code-Driven**: If the model provides no visual hints, the frontend code can inspect the `__typename` of each object at runtime and apply styling or render different components accordingly.
*   **Key Insight**: The model makes this possible by allowing each concrete subtype to have its own unique UI metadata. This was analyzed in the `DebateTest.model`.

---

## 4. Advanced JQL Concepts

### `ACTOR` vs. `PRINCIPAL` Context Variables
JQL provides two functions for accessing user data. They have critically different purposes tied to the security model.

*   **Use `!getVariable('PRINCIPAL', 'claim_name')` when:**
    *   Your user representation is **stateless and transient**.
    *   The `Actor`'s `principal` is an **unmapped `TransferObjectType`**.
    *   You want to get a **claim directly from the JWT access token** (e.g., `preferred_username`, a custom `avatar_url`). The data is not persisted in your application's database.

*   **Use `!getVariable('ACTOR', 'attribute_name')` when:**
    *   Your user representation is **stateful and persisted**.
    *   The `Actor`'s `principal` is a **mapped `TransferObjectType`** that corresponds to a stored `EntityType`.
    *   You want to get an **attribute from the persisted entity record** that is associated with the current user's session (e.g., their `email` to filter other entities).