# JUDO Model Development Guide

This document is the primary reference for understanding and working with the JUDO application model. It synthesizes foundational concepts, a practical workflow for getting started, and a comprehensive catalog of advanced design patterns for solving real-world modeling problems.

## Table of Contents
1.  [**Part 1: Foundational Concepts**](#part-1-foundational-concepts)
2.  [**Part 2: The Core Modeling Workflow**](#part-2-the-core-modeling-workflow)
3.  [**Part 3: Advanced Modeling Patterns & Use Cases**](#part-3-advanced-patterns--use-cases)
4.  [**Part 4: Judo Query Language (JQL)**](#part-4-judo-query-language-jql)
5.  [**Part 5: Rules and Best Practices**](#part-5-rules-and-best-practices)

---

## Part 1: Foundational Concepts

### 1.1 The JUDO Two-Layer Architecture

JUDO models have a mandatory two-layer logical structure that promotes abstraction, security, and reusability.

*   **Domain Logic Layer**: This is the core of the application. It contains the **`EntityType`s`**, which are the classes that represent the real-world business objects and rules. This layer is the single source of truth for how data is structured, persisted, and changed.

*   **Service Layer**: This layer acts as a front-facing interface or API for the application, defined by **`TransferObjectType`s`** (TOs). It masks the underlying domain model, providing a simpler and more secure view to clients (like a UI or external systems).

> **Best Practice**: Never expose `EntityType`s directly in an `Access` link. The Service Layer (`TransferObjectType`s) should always be the entry point for any external actor.

### 1.2 Core Object-Oriented Principles

*   **Entity**: A class representing the persistent, core business objects.
*   **Attributes (`Stored` vs. `Derived`)**:
    *   A **`Stored`** attribute is a data field that is persisted in the database.
    *   A **`Derived`** attribute (or "Property") is a read-only, calculated value whose logic is defined in a `Getter expression`.
*   **Relationships (Associations)**:
    *   **Association (`-->`)**: A general "has a" reference between independent objects.
    *   **Composition (`[solid diamond]-->`)**: A strong "is part of" ownership where the child is destroyed with the parent.
    *   **Aggregation (`[hollow diamond]-->`)**: A weaker "owns a" relationship where the child can exist independently.
*   **Inheritance (`Generalization`)**: An "is-a" relationship where a subclass inherits all members from its superclass. A key rule is that **member overriding is not allowed**.

---

## Part 2: The Core Modeling Workflow

This section provides a step-by-step guide to the fundamental process of creating a simple, functional application component from scratch using the JUDO Designer.

1.  **Create a Project**: Use the "New project" icon in the Designer.
2.  **Define an Entity**: Drag the **Entity** tool from the Palette to create a core business object (e.g., `SalesPerson`).
3.  **Add Attributes**: Drag the **Attribute** tool into the entity. Set its **Attribute Type** to **`Stored`** to ensure it's saved in the database.
4.  **Modify Properties**: Use the **Properties View** to change an element's behavior (e.g., set an attribute to **`Required`**).
5.  **Generate the Default UI**: Right-click the entity and select **"Add features to representations"** to automatically create a `Table`, `Form`, and `View` for it.
6.  **Define an Actor**: Drag the **Actor** tool to create a user role (e.g., `Manager`).
7.  **Create an Access Link**: Use the **Access** tool to connect the `Actor` to the entity's `TransferObjectType`. This exposes the entity's CRUD services and creates a corresponding menu item in the UI.

---

## Part 3: Advanced Modeling Patterns & Use Cases

This section is a "cookbook" of reusable design patterns for solving common modeling problems.

### Service Layer Architecture

#### Pattern: Mapped vs. Unmapped Transfer Objects
*   **Mapped TO**: A TO that is structurally linked to a source `EntityType` via a `Mapping`. It acts as a projection or view of the underlying entity. Its members can be:
    *   **Mapped/Bound**: Directly linked to a member on the entity.
    *   **Derived/Property**: A read-only, calculated value with a `Getter expression`.
    *   **Simple/Transient**: A field that exists only on the TO for temporary UI state.
*   **Unmapped TO**: A standalone data container with no underlying entity, often used for complex inputs to an `Operation`.

#### Pattern: Purpose-Built Transfer Objects (DTOs)
*   **Use Case**: The data required for a list view is often a small subset of the data needed for a detail view.
*   **Implementation**: Create multiple TOs for the same `EntityType`: a minimal `...ListTO` for tables and a full `...DetailTO` for forms. The `Access` rule for the table view should target the `...ListTO` to avoid over-fetching data.

### Action & Operation Patterns

#### Pattern: Grouping Contextual Actions
*   **Use Case**: Displaying a group of related actions that operate on a single object's view page.
*   **Solution**: Use a `ui:ActionGroup` in a `View` to hold multiple `OperationForm` buttons.

#### Pattern: Table Actions (Bulk vs. Row)
*   **Use Case**: Defining actions that apply to multiple selected rows (bulk) or to each individual row.
*   **Solution**: In a table's definition, add actions to the `tableOperations` collection (with `isBulk="true"` for bulk) or the `rowOperations` collection.

### Security & Access Control

#### Pattern: User-Specific Data with Derived Accesses
*   **Use Case**: Ensuring a logged-in user can only see their own data (e.g., "My Orders").
*   **Solution**: On an `Access` link, set the **`Access type`** to **`Derived`** and write a **`Getter expression`** that filters data using the `!getVariable("ACTOR", "claim_name")` function.

### UI Modeling & Display Patterns

#### Pattern: Dynamic Page Titles
*   **Use Case**: Make a page title reflect the data being viewed (e.g., "John Doe" instead of "Customer").
*   **Solution**: On a View/Edit page, set the **`titleFrom`** property to **`Attribute`** and select the desired `DataMember` as the **`titleAttribute`**.

#### Pattern: Conditional UI Element Visibility
*   **Use Case**: A UI element (field, group, button) should only be visible or enabled based on other data in the form.
*   **Solution**: Use `enabledBy` or `hiddenBy` on any `ui:VisualElement`, pointing it to a `Boolean` `DataMember`.

#### Pattern: Alternative Data Representations
*   **Use Case**: Display a list as a grid of cards, chips, or an autocomplete field instead of a table.
*   **Solution**: Use the `representationComponent` attribute on a `TabularReferenceField` (e.g., `"card"`, `"tag"`, `"autocomplete"`).

### Advanced Data Modeling Patterns

#### Pattern: Polymorphism with Inheritance
*   **Use Case**: Model a base concept with several specialized types (e.g., `Pro` and `Con` are types of `Argument`).
*   **Solution**: Use `Generalization` to establish an "is-a" hierarchy between `EntityType`s. Note that inheritance between `TransferObjectType`s is not supported.

#### Pattern: Parameterized Queries
*   **Use Case**: Create a derived feature that accepts a parameter for its calculation (e.g., find all `Order`s placed after a user-specified date).
*   **Solution**: Use a `primitive query` (for attributes) or a `complex query` (for relations). This is a derived feature with an `input` (`TransferObjectType`). The `getterExpression` can access this via the `input` variable (attributes only).

---

## Part 4: Judo Query Language (JQL)

JQL is the powerful expression language used in model scripts, such as `Getter expression`s and `Operation` bodies. It provides a rich set of features for data manipulation, navigation, and logic execution.

**Key Concepts:**
-   **The `self` variable** to refer to the current object context.
-   **Navigation** across relationships using the `.` operator.
-   A library of **built-in functions** for strings, numbers, and collections, called with the `!` operator.
-   Specific handling of the **`undefined`** value.

### JQL Reference Guide

This document provides a detailed reference for JQL (Judo Query Language), the expression language used throughout JUDO models in places like `Getter expression`s and `Operation` bodies.

## 1. General Concepts

### Comments
JQL supports two types of comments:
-   **Single-line**: Begins with `//`.
-   **Multi-line**: Enclosed between `/*` and `*/`.

### `undefined` Value
`undefined` represents the absence of a value. It has special behavior in expressions:
-   **Propagation**: Any arithmetic or logical operation involving `undefined` evaluates to `undefined`. For example, `undefined + 2` results in `undefined`.
-   **Comparisons**: Logical comparisons with `undefined` always result in `undefined`, not `true` or `false`.
-   **Function Calls**: Calling a function on `undefined` results in `undefined`. For example, an `undefined` collection's `!count()` is `undefined`, not `0`.

---

## 2. Special JQL Functions

### `!getVariable(category, name)`
This powerful function retrieves request-scoped context variables. It is the primary way to access information about the currently authenticated user.

*   **`!getVariable('PRINCIPAL', 'claim_name')`**
    *   **Purpose**: To access claims directly from the JWT access token of the logged-in user.
    *   **Use Case**: Ideal for `unmapped` principal `TransferObjectType`s where the user's data is transient and comes entirely from the identity provider (e.g., Keycloak, Google, etc.).
    *   **Example**: `String!getVariable('PRINCIPAL', 'preferred_username')` retrieves the `preferred_username` claim from the JWT.

*   **`!getVariable('ACTOR', 'attribute_name')`**
    *   **Purpose**: To access attributes from the *persisted `Actor` entity* that is associated with the current user's session.
    *   **Use Case**: Used in `Derived Access` rules to filter data based on properties of the logged-in user's persisted record.
    *   **Example**: `CRM::SalesPerson!filter(sp | sp.email == String!getVariable("ACTOR", "email"))!any()` assumes the `Actor` is a `SalesPerson` and filters based on its `email` attribute.

---

## 3. Primitive Data Types

### String
Represents a text value. String literals are enclosed in single (`'`) or double (`"`) quotes.

| Operation | Result | Meaning | Example |
| :--- | :--- | :--- | :--- |
| `==` | Boolean | Case-sensitive equality comparison. | `"apple" == "apple"` is `true`. |
| `<` , `>` | Boolean | Case-insensitive ordering comparison. | `"apple" < "pear"` is `true`. |
| `+` | String | Concatenates two strings. | `"apple" + "tree"` is `"appletree"`. |
| `!length()` | Numeric | Returns the number of characters in the string. | `'apple'!length()` is `5`. |
| `!first(n)` | String | Returns the first `n` characters. | `'apple'!first(2)` is `'ap'`. |
| `!last(n)` | String | Returns the last `n` characters. | `'apple'!last(1)` is `'e'`. |
| `!position(sub)` | Numeric | Returns the 1-based index of the first occurrence of substring `sub`, or `0` if not found. | `'apple'!position('p')` is `2`. |
| `!substring(pos, len)` | String | Returns a substring of `len` characters starting from the 1-based `pos`. | `'apple'!substring(2,3)` is `'ppl'`. |
| `!lowerCase()` | String | Converts the string to lowercase. | `'ApPlE'!lowerCase()` is `'apple'`. |
| `!upperCase()` | String | Converts the string to uppercase. | `'ApPlE'!upperCase()` is `'APPLE'`. |
| `!matches(regex)` | Boolean | Returns `true` if the string matches the given regular expression. | `'apple'!matches('.*pl.')` is `true`. |
| `!like(pattern)` | Boolean | Returns `true` if the string matches the SQL-style LIKE `pattern` (`%` wildcard, `_` single char). | `'apple'!like('%pl_')` is `true`. |
| `!replace(old, new)` | String | Replaces all occurrences of `old` with `new`. | `'apple'!replace('le', 'endix')` is `'appendix'`. |
| `!trim()` | String | Removes leading and trailing whitespace. | `'   apple '!trim()` is `'apple'`. |

### Numeric
Represents numeric values. Literals are written as digits with an optional decimal point (e.g., `10`, `3.14`).

| Operation | Result | Meaning | Example |
| :--- | :--- | :--- | :--- |
| `==`, `!=`, `<`, `>`, `<=`, `>=` | Boolean | Standard numerical comparison. | `1.00 == 1` is `true`. |
| `+`, `-`, `*`, `/` | Numeric | Arithmetic operations. | `9.0 / 2` is `4.5`. |
| `mod`, `div` | Numeric | Integer modulus and division. Both arguments must have a scale of 0. | `9 mod 2` is `1`. |
| `!round()` | Numeric | Rounds a non-integer number to the nearest integer. | `7.89!round()` is `8`. |
| `-` (unary) | Numeric | Negation. | `5 + -5` is `0`. |
| `!asString()` | String | Converts the number to its string representation. | `123.45!asString()` is `"123.45"`. |

### Measured Numeric
Represents a numeric value with a unit of measure (e.g., `5 [kg]`). JUDO automatically handles unit conversions during comparisons and assignments.
-   `5 [km] == 5000 [m]` is `true`.
-   `1 [kg] + 50 [dkg]` evaluates to `1.5 [kg]` if the target's unit is `kg`.

### Boolean
Represents a logical value: `true` or `false`. JQL uses a three-valued logic system (Kleene logic) that includes `undefined`.

| Keyword | Meaning |
| :--- | :--- |
| `not` | Logical negation |
| `and` | Logical AND |
| `or` | Inclusive logical OR |
| `xor` | Exclusive logical OR |
| `implies` | Logical material implication |

### Enumeration
Represents a value from a predefined set of members. Members are referenced by `EnumerationName#MEMBER_NAME`.

| Operation | Result | Meaning |
| :--- | :--- | :--- |
| `==`, `!=` | Boolean | Equality comparison. |
| `!asString()`| String | Returns the literal name of the member as a string. |

### Date & Timestamp
-   **Date**: Represents a calendar date. Literals are delimited by backticks (e.g., `` `2024-01-01` ``).
-   **Timestamp**: Represents a point in time with a mandatory time zone. Literals are ISO-8601 strings in backticks (e.g., `` `2024-01-01T12:00:00Z` ``).

Both support standard chronological comparisons (`<`, `>`, `==`, etc.) and `!asString()`.

---

## 4. Reference Functions

These functions operate on object instances or collections of instances.

### Instance Functions
Operate on a single object instance.

| Function | Result | Meaning |
| :--- | :--- | :--- |
| `!container(type)` | Instance | Returns the container of the instance if it's part of a `COMPOSITION`. |
| `!kindof(type)` | Boolean | Returns `true` if the instance is of the given `type` or a descendant of it. |
| `!typeof(type)` | Boolean | Returns `true` only if the instance is of the exact `type` specified. |
| `!asType(type)` | Instance | Returns the instance if its type matches, otherwise `undefined`. |
| `!isDefined()` | Boolean | Returns `true` if the object is not `undefined`. |
| `!isUndefined()`| Boolean | Returns `true` if the object is `undefined`. |
| `!memberOf(coll)`| Boolean | Returns `true` if the instance is a member of the specified collection `coll`. |

### Collection Functions
Operate on a collection of object instances. The `i` in examples represents an iterator variable.

| Function | Result | Meaning & Example |
| :--- | :--- | :--- |
| `!any()` | Instance | Returns an arbitrary single instance from the collection. |
| `!contains(obj)` | Boolean | Returns `true` if the collection contains the specified `obj`. |
| `!count()` | Numeric | Returns the number of items in the collection. |
| `!empty()` | Boolean | Returns `true` if the collection has no items. |
| `!exists(i \| expr)` | Boolean | Returns `true` if the logical `expr` is true for at least one item `i`. |
| `!filter(i \| expr)` | Collection | Returns a new collection containing only items `i` for which the logical `expr` is true.<br>`self.items!filter(i \| i.price > 10)` |
| `!forAll(i \| expr)` | Boolean | Returns `true` if the logical `expr` is true for all items `i`. |
| `!sort(i \| sel [,...])`| Collection | Returns a new collection sorted by one or more selectors (`sel`). `ASC` (default) or `DESC` can be specified.<br>`self.items!sort(i \| i.price DESC, i.name)` |
| `!asCollection(type)`| Collection | Casts the collection to a collection of the specified `type`. |
| `!avg(i \| selector)` | Numeric | Returns the average value of the `selector` across the collection. |
| `!sum(i \| selector)` | Numeric | Returns the sum of the `selector` across the collection. |
| `!min(i \| selector)` | Numeric | Returns the minimum value of the `selector` across the collection. |
| `!max(i \| selector)` | Numeric | Returns the maximum value of the `selector` across the collection. |

---

## Part 5: Rules and Best Practices

### ⚠️ CRITICAL: Do Not Edit the Model File Directly
The ESM model file (`/model/northwind.model`) is complex XML (XMI) and **must not be modified by hand**. Always use the **Judo Designer** graphical modeling tool to make changes. Direct edits can corrupt the model and lead to unpredictable errors.

### Naming Conventions
*   Names are case-sensitive.
*   Allowed characters: letters (a-z, A-Z), digits (0-9), and underscores (_).
*   Must start with a letter or an underscore. Cannot end with an underscore or contain `__`.
*   Names must be unique within their container.

### General Best Practices
1.  **Start Simple**: Add complexity incrementally.
2.  **Use Clear Names**: `CanvassingEvent` is better than `Event`.
3.  **Define Relationships Carefully**: Consider cardinality and ownership (`Composition` vs. `Association`).
4.  **Use Constraints**: Use `required` and `Identifier` where applicable.
5.  **Coordinate with Team**: Model changes affect the entire application.
