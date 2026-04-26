# Advanced JUDO Modeling Patterns

This document details advanced, non-obvious design patterns and concepts for the JUDO Editor Specific Model (ESM). These patterns represent a deeper understanding of the platform's capabilities and were discovered through a detailed, query-based analysis of existing application models. They go beyond the basic workflow to cover more complex architectural and security considerations.

## Table of Contents
1.  [Architectural Patterns](#1-architectural-patterns)
2.  [Security & UI Patterns](#2-security--ui-patterns)
3.  [Polymorphism Patterns](#3-polymorphism-patterns)
4.  [Advanced JQL Concepts](#4-advanced-jql-concepts)
5.  [ESM Validator-Enforced Structural Patterns](#5-esm-validator-enforced-structural-patterns)

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

### Pattern: Mapped Managed Principal with Claim Mapping
*   **Use Case**: You want the logged-in user to correspond to a **persisted row** in your domain model (e.g. a `User` entity carrying roles, permission flags, preferences, audit fields), and you want JUDO to keep that row in sync with the IdP automatically — no manual "just-in-time user provisioning" interceptor for the common case.
*   **Problem**: Without claim mapping the only way to reach identity data is the raw JWT via `USER.*`. That forces every access filter and custom op to re-derive the user row from a JWT claim (`User!filter(u | u.email == String!getVariable('USER', 'email'))!any()`), and gives you no persisted identity at all — making roles, audit, and per-user flags impossible to model.
*   **Pattern**: Combine three ESM features on the `accesspoint` side so the framework takes over provisioning and exposes the persisted row to JQL as `ACTOR.*`:
    1.  **`ActorType.principal`** points at a **mapped** `TransferObjectType` that projects the `EntityType` that stores the user row (e.g. a `User` TO mapped to `User` entity).
    2.  **`ActorType.managed = true`**. On `#_principal` the framework is *intended* to insert (first login) or update (subsequent logins) the principal row from the JWT. **In practice the auto-insert is NOT implemented in the current runtime** — see the warning below — so you must pair `managed=true` with an `AuthenticationInterceptor` that performs the first-login insert. The lookup path that consumes the row IS implemented, so once the interceptor writes it the rest of the pattern (`ACTOR.*` in JQL, etc.) works as designed.
    3.  **`ActorType.<claims>`** declares, for each standard claim (`EMAIL`, `USERNAME`), which `DataMember` on the principal TO carries it. Each referenced `DataMember` MUST be `MAPPED` (have a `binding` to an `EntityType` attribute) so the value persists through the TO into the DB.
*   **Access getters then read the persisted row.** The JQL key is the `DataMember.name` on the principal TO, not the JWT claim name — the `<claims>` element is what links them. The example below uses `EMAIL`; swap in `USERNAME` — with an `<claims claimType="USERNAME">` pointing at a `userName` / `preferredUsername` member — if that is the identifier your IdP guarantees stable.
    ```jql
    // Root access: the User row for this actor (EMAIL-keyed variant)
    MyApp::entities::User
      !filter(u | u.email == MyApp::types::String!getVariable("ACTOR", "email"))
      !any()

    // USERNAME-keyed variant, same pattern
    MyApp::entities::User
      !filter(u | u.userName == MyApp::types::String!getVariable("ACTOR", "userName"))
      !any()
    ```
    This pairs naturally with the *Fully User-Scoped Data Access* pattern above: every other access is a navigation from this root.
*   **Principal TO conventions.** The TO used as `ActorType.principal` typically carries `createable="false" updateable="false" deleteable="false"` at the outer level (no public CRUD service — the framework owns the row) and `actorType="<ActorType.id>"` as the back-link. Individual `accesses[*]` inside the actor can still grant CRUD on other TOs, including a separate `users` access targeting the same entity for administrators.
*   **Extending beyond the automatic sync.** The model-driven sync only covers the declared `<claims>` attributes. When you need more — copying a custom claim to a plain entity attribute, initialising roles from a group claim, writing an audit row — add an `AuthenticationInterceptor` on `#_principal`; it runs **before** the framework's actor lookup. See Authentication Guide (see `judo-backend-docs` skill).
*   **Verified runtime gap (judo-runtime-core-dispatcher 1.0.6.20241030 / 1.0.6.20251205).** `DefaultActorResolver.getActorByClaims` is lookup-only — it calls `dao.search(actorType, …)` and throws `AccessDeniedException("AUTHENTICATED_ENTITY_NOT_FOUND")` when the row is missing. No insertion code path exists for `managed=true` actors in these versions. The `INFO` log `"Operation failed, authenticated entity not found in database"` on every first login is the symptom. **Mitigation:** add the *Just-in-Time User Provisioning* `AuthenticationInterceptor` from the Authentication Guide (see `judo-backend-docs` skill), even for the textbook mapped + managed + `<claims>` shape. The interceptor's `authenticate()` hook runs **before** `getActorByClaims`, so inserting there satisfies the upcoming lookup.
*   **Key Insight**: `<claims>` is not just metadata for the IdP — it is what binds JQL's `ACTOR.*` category to real columns. Without a `<claims>` element the `ACTOR.*` lookup has no key; without `managed=true` there is nothing to look up because no row gets written on first login. The three features together are the minimum authoring recipe; the three actor shapes table in [Three actor shapes](./esm_metamodel/accesspoint.md#three-actor-shapes-authoring-reference) enumerates the alternatives and their trade-offs.

### Pattern: Role Flags on the Principal Entity

*   **Use Case**: A single `ActorType` covers all human users, but some users are administrators (or have any other coarse-grained role) and should see additional data, menu entries, or operations. You want the role to be **persistent, queryable, and editable through the model** rather than hard-coded to an IdP group claim.

*   **Note on notation.** Throughout this guide “`ACTOR.*`” is **category notation**, not JQL syntax. There is **no `ACTOR` mnemonic in JQL** — the actor's persisted attributes are reachable only through the typed `!getVariable` call:

    ```jql
    <Model>::types::<Type>!getVariable("ACTOR", "<memberName>")
    ```

    The result is a **scalar value** (the value of one `DataMember` on the principal TO). You cannot navigate further off it (`...isAdmin.something` is invalid). To use the actor as a *navigable entity* you must re-filter the principal `EntityType` by a unique key fetched the same way — see the *fallback form* below.

*   **Pattern** (assumes the *Managed Mapped Principal* shape — see [Three actor shapes](./esm_metamodel/accesspoint.md#three-actor-shapes-authoring-reference); this is the only shape where the `ACTOR` category is populated):
    1.  Add a `STORED` boolean attribute on the principal `EntityType` (e.g., `isAdmin`, default `false`).
    2.  Project it as a `MAPPED` `DataMember` of the principal `TransferObjectType` so the framework's actor-row sync exposes it under the `ACTOR` category at `!getVariable("ACTOR", "isAdmin")`.
    3.  Decide how the flag gets set: typically a one-time seed via an `AuthenticationInterceptor` on `#_principal` for the first admin (e.g., compare the JWT email against a bootstrap value), and an admin-only `UpdateAccess` afterwards. The flag itself is plain stored data — nothing in the framework writes it for you.

*   **Canonical role check (preferred form).** Once the flag is exposed under `ACTOR`, every authenticated-context JQL site can read it as a single typed-`getVariable` call:

    ```jql
    -- Anywhere a Boolean is expected and the request is authenticated:
    MyApp::types::Boolean!getVariable("ACTOR", "isAdmin")
    ```

    Use this form inside any boolean-valued slot — a `DERIVED` boolean attribute's `getterExpression`, an `enabledBy` / `requiredBy` source, the predicate of a `!filter` lambda, etc.

*   **Fallback form** when the `ACTOR` category is **not** available (e.g., a `claimPrincipal: true` actor without `<claims>` / `managed=true`, where only `USER` is populated). Re-derive the user row from a JWT claim, then test the flag:

    ```jql
    -- Parentheses must close the !getVariable call BEFORE the boolean conjunction.
    -- !count() is the collection-function form (leading ! is required).
    MyApp::entities::User
      !filter(u | u.userName == MyApp::types::String!getVariable("USER", "userName")
                  and u.isAdmin)
      !count() > 0
    ```

    Prefer the typed-`getVariable` `ACTOR` form whenever the actor shape supports it — the fallback issues an extra row lookup per evaluation.

*   **Wiring the flag into an `Access.getterExpression`** (admin sees all rows; non-admin sees only their own). JQL has no `if/then/else` operator — use a single `!filter` whose lambda disjuncts the role flag with the per-user clause. The `!getVariable("ACTOR", "isAdmin")` call is constant per request, so when it returns `true` the predicate admits every row:

    ```jql
    MyApp::entities::Order!filter(o |
      MyApp::types::Boolean!getVariable("ACTOR", "isAdmin")
      or o.owner.userName == MyApp::types::String!getVariable("ACTOR", "userName"))
    ```

*   **Wiring the flag into a `hiddenBy` on a `MenuItemAccess`.** `hiddenBy` must reference a **boolean `DataMember` on the principal TO** (see [UI Authoring Guide §6](./ui-authoring-guide.md)). Since `hiddenBy` hides when *true*, model the negation as a derived attribute on the principal TO itself — inside that getter `self` already **is** the actor's row, so no `!getVariable` call is needed:

    1.  Add a `DERIVED` boolean attribute `isNotAdmin` on the principal TO with `getterExpression`:

        ```jql
        not self.isAdmin
        ```

    2.  Set `hiddenBy = isNotAdmin` on every `MenuItemAccess` that should only appear for admins.

*   **Key Insight**: A role flag is just *data on the principal entity*. Once the actor shape exposes that row under the `ACTOR` category, the right primitive for any single-flag role check is one typed-`getVariable` call — not a `!filter(...)!count() > 0` re-query. Reach for the multi-flag dashboard form (next pattern) only when you have several orthogonal permission dimensions.

*   **Testing**. Every site this pattern produces has a corresponding integration-test recipe: the `isNotAdmin` derived mirror is covered by Pattern A (DAO projection), the role-scoped `Access.getterExpression` by Pattern B (dispatcher with a `JudoPrincipal`), and any `ownedByMe`-style derived flag by Pattern C. See Testing Access Rules and DERIVED Attributes (see `judo-integration-testing-docs` skill).

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

### `ACTOR` vs. `PRINCIPAL` vs. `USER` Context Variables
JQL provides **three** categories for accessing user/session data. They have critically different purposes tied to the security model, and picking the wrong one is a silent-failure class of bug (empty values at runtime, no compile error).

*   **Use `!getVariable('USER', 'claim_name')` when:**
    *   The `Actor` is declared with **`claimPrincipal: true`** (token-only actor; no persisted principal record).
    *   You want the **raw JWT claim** regardless of actor shape (e.g. `sub`, `email`, a custom scope claim).
    *   This is the **only** category that surfaces JWT claims for `claimPrincipal: true` actors — `PRINCIPAL.*` against such an actor silently returns empty.

*   **Use `!getVariable('PRINCIPAL', 'claim_name')` when:**
    *   Your user representation is **stateless and transient** via a framework-populated principal TO.
    *   The `Actor`'s `principal` is an **unmapped `TransferObjectType`** and the actor is **not** `claimPrincipal: true`.
    *   You want a value exposed by the principal TO (populated from the token by the framework, not read from the raw JWT).

*   **Use `!getVariable('ACTOR', 'attribute_name')` when:**
    *   Your user representation is **stateful and persisted**.
    *   The `Actor`'s `principal` is a **mapped `TransferObjectType`** that corresponds to a stored `EntityType`.
    *   You want to read an **attribute from the persisted entity record** (e.g., the actor's `email` or tenant id) to filter other entities.

> [!WARNING]
> **Silent-failure pitfall — access filters and audit logic**
>
> Access `Derived` filters and custom-op helpers that reference `PRINCIPAL.*` on a `claimPrincipal: true` actor compile and deploy, but evaluate to empty at runtime. Symptoms: empty result sets, `null` audit-user fields, or "access denied" despite valid tokens. Fix by switching those call sites to `USER.*`. Audit every access-filter and interceptor whenever an actor is migrated to or from `claimPrincipal: true`.

---

## 5. ESM Validator-Enforced Structural Patterns

These patterns capture rules the JUDO ESM EVL validator enforces but that neither the YAML spec vocabulary nor the CLI error messages make obvious. They surface only under the full `./judo.sh build` pipeline, and ignoring them is a large source of model-authoring churn.

### Pattern: Asymmetric bidirectional relations (AGGREGATION × ASSOCIATION)

*   **Use Case**: A parent-child relationship between two entities that must be navigable from both sides (e.g. `Partner` has many `PartnerSupportedLanguage`, and each `PartnerSupportedLanguage` points back at its `Partner`).
*   **Problem**: The UML-intuitive answer — declare both ends as `COMPOSITION` or both as `AGGREGATION` — fails EVL with *"Bidirectional association: X cannot be composition"* or *"Partner of bidirectional association: X cannot be aggregation"*.
*   **Pattern**: The **only** combination that passes is asymmetric:
    *   Owner end (the `upper ≠ 1` end, i.e. the collection side) = `AGGREGATION`
    *   Child end (the `upper = 1` end, i.e. the back-pointer) = `ASSOCIATION`
*   **Cardinality companion rule**: EVL additionally emits *"At least one reference of a bidirectional association should have lower bound with zero"*. Relax the owner-collection end (`1..*` → `0..*`); relaxing the child end breaks referential integrity.
*   **Scope**: This rule applies to **entity-to-entity** relations only. Entity `ASSOCIATION` on its own is also forbidden; on an entity, every unidirectional relation must be `AGGREGATION` or `COMPOSITION`. `ASSOCIATION` is reserved for TO-to-TO relations.

### Pattern: Derived-member self-binding

*   **Use Case**: Any `DataMember` whose `memberType` is `DERIVED`.
*   **Rule**: Every derived `DataMember` must set `binding="<self-id>"` pointing at its own `xmi:id`. EVL emits *"Derived data member X must bind itself"* otherwise.
*   **Authoring**: This is distinct from — and complements — the mandatory self-mapping on every `EntityType` (see [structure.md](./esm_metamodel/structure.md), *Mandatory self-mapping on `EntityType`*). Code generators that emit YAML→XMI must set both.

### Pattern: Mandatory UI scaffolding for operation-I/O TOs

*   **Use Case**: Any `TransferObjectType` that appears as an `Operation.input.target` or `Operation.output.target`.
*   **Rule**: EVL requires:
    *   `<form>` on any TO used as an operation **input**;
    *   `<view>` on any TO used as an operation **output**;
    *   `<table>` on any TO used as **either**.
*   **Authoring**: Even if the TO is never rendered in the UI, the structural elements must be present in the ESM. The `<form>` / `<table>` / `<view>` elements can be empty (no `<components>` / `<columns>`); fill them later. See [UI Authoring Guide](./ui-authoring-guide.md) for scaffold authoring.

### Pattern: Wrapper TO for binary operation outputs

*   **Use Case**: An `Operation` that returns binary data (`BinaryPdf10MB`, `BinaryDocx10MB`, etc.) — e.g. a PDF preview endpoint.
*   **Problem**: `Operation.output.target` accepts only `TransferObjectType` FQNs; pointing it at a `DataType` silently fails (the target stays `null` at runtime).
*   **Pattern**: Create an unmapped TO with a single `TRANSIENT` `DataMember` of the binary type, and target the operation output at that TO.

    ```yaml
    # spec fragment
    - name: PreviewPdfOutput
      kind: unmapped
      attributes:
        - { name: pdf, type: BinaryPdf10MB, memberType: transient }
    ```

### Pattern: Static operations container TO

*   **Use Case**: You want to expose a model-level ("static") operation that is not scoped to an entity instance — e.g. `reserveBarcode()`, `uploadBrandingTemplate()`.
*   **Problem**: `Operation.container` in the ESM schema accepts only a `TransferObjectType` or an `EntityType`. A bare namespace is not a valid container.
*   **Pattern**: Synthesise a single unmapped TO (conventional name: `StaticOperations`) under `<Model>::operations` and attach all static ops to it. In the service URL they appear at `/services/StaticOperations/<opName>`.

### Pattern: Attribute-level regex realized as constrained `StringType`

*   **Use Case**: An attribute needs a regex validator — e.g. `Partner.code` must match `^[A-Z0-9][A-Z0-9_-]{1,31}$`.
*   **Problem**: ESM's `DataMember` has no `regExp` property. Regex lives on `StringType`, not on the attribute that uses it.
*   **Pattern**: Create a dedicated `StringType` per constrained identifier, with both `maxLength` and `regExp`. The `DataMember` then points at this dedicated type instead of the generic `StringType{N}`.

    ```
    northwind::types::PartnerCodeType
      maxLength = 32
      regExp    = '^[A-Z0-9][A-Z0-9_-]{1,31}$'
    Partner.code : PartnerCodeType   // not StringType32
    ```

*   **Naming**: Suffix the type name with `Type` to distinguish from an entity attribute of the same stem (`PartnerCode` could be confused with an enum member; `PartnerCodeType` is unambiguous).
