# `accesspoint` Package Reference

**[◄ Back to Index](./SKILL.md)**

This package defines the security model for the application, including user roles (actors), permissions, and access control mechanisms. It specifies *who* can do *what*.

---

## Element Reference

### `ActorType`
Defines a role or type of user/system that can interact with the application (e.g., `Administrator`, `SalesAgent`, `Customer`). It aggregates all security-related definitions for that role.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the actor role. |
| `principal` | `TransferObjectType` | `[0..1]` | A reference to the TO that holds the identifying information for this actor (e.g., a `UserAccount` TO). |
| `claims` | `Claim` | `[0..*]` | A list that defines which attributes of the `principal` are used for identity purposes (e.g., mapping the `email` attribute to the `EMAIL` claim type). |
| `accesses` | `Access` | `[0..*]` | The list of data access permissions granted to this actor. This defines what data the actor can see. |
| `menuItems` | `MenuItem` | `[0..*]` | The root of the navigation menu structure that will be visible to this actor. |
| `kind` | `ActorKind` Enum | `[1]` | The type of actor: `HUMAN` (an interactive user) or `SYSTEM` (an automated process or external system). |
| `anonymous` | Boolean | `[1]` | If `true`, this actor represents an unauthenticated guest user. |
| `managed` | Boolean | `[1]` | If `true`, the lifecycle of the principal is managed by the system (e.g., user registration). |

### `Access`
A grant of permission for an `ActorType` to access a collection of data objects. It links a role to a data set, with an optional filter.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `[1]` | The name of the access grant (e.g., "AccessMyCustomers"). |
| `target` | `TransferObjectType` | `[1]` | A reference to the TO that this rule grants access to. This is the entry point for a query. |
| `getterExpression` | `ReferenceExpression` | `[0..1]` | An optional expression to filter the data this actor is allowed to see (e.g., `self.customers` to only see customers directly related to the actor). If omitted, the actor can see all instances. |
| `createable` | Boolean | `[1]` | If `true`, the actor can create new instances of the `target`. |
| `updateable` | Boolean | `[1]` | If `true`, the actor can update instances. |
| `deleteable` | Boolean | `[1]` | If `true`, the actor can delete instances. |

### `Claim`
A declaration that maps a specific attribute on the `principal` TO to a standard security claim type. This tells an identity provider how to find key information like the user's email or username.

| Attribute / Reference | Type | Cardinality | Description |
| :--- | :--- | :--- | :--- |
| `attribute` | `DataMember` | `[1]` | A reference to the `DataMember` on the `principal` TO that holds the claim value (e.g., the `emailAddress` attribute). |
| `claimType` | `ClaimType` Enum | `[1]` | The standard type of claim this attribute represents: `EMAIL` or `USERNAME`. |

### Enums

| Enum | Value | Description |
| :--- | :--- | :--- |
| **`ActorKind`** | `HUMAN` | An interactive user operating through the UI. |
| | `SYSTEM` | An automated process, script, or external system. |
| **`ClaimType`** | `EMAIL` | The attribute represents the user's email address. |
| | `USERNAME` | The attribute represents the user's unique username. |
| **`AccessType`**| `ALL` | The access grant applies to all instances (subject to `getterExpression`). |
| | `DERIVED` | The access is derived from another source. |

---

## Behaviour Rules

These rules define how accesspoint elements behave based on their context and attribute values.

### ActorType Page Visibility

| Page | Visible When |
|------|--------------|
| Actor | Always |
| Realm | Always (different groups based on anonymous state) |
| Theme | `kind = HUMAN` |

### ActorType Attribute Rules

| Attribute | Enabled When | Description |
|-----------|--------------|-------------|
| `principal` | Read-only | Display of linked TransferObjectType |
| `kind` | Always | `HUMAN` or `SYSTEM` |
| `isActiveExpression` | Always | JQL expression returning true if actor can login |
| `anonymous` | `principal` is null OR `principal` is NOT mapped | Allow anonymous login |
| `realm` | NOT `isEffectiveAnonymous()` | Keycloak realm identifier |
| `managed` | `principal` is NOT null AND `principal` is mapped | System manages principal lifecycle |
| `claims` | NOT `isEffectiveAnonymous()` | Identity claims list |

**Theme Attributes (only when `kind = HUMAN`):**

| Attribute | Description |
|-----------|-------------|
| `defaultLanguage` | LDML format (e.g., `en-US`) |
| `applicationLogo` | Logo filename |
| `applicationIcon` | Browser tab icon |
| `applicationTitle` | Browser title and footer |
| `applicationBackgroundImage` | Global background image |
| `primaryColor` | Primary theme color (`#rrggbbaa`) |
| `secondaryColor` | Secondary theme color |
| `textPrimaryColor` | Primary text color |
| `textSecondaryColor` | Secondary text color |
| `backgroundColor` | Background color |
| `subtitleColor` | Subtitle text color |
| `paperBackgroundColor` | Paper/card background |
| `menuOrientation` | `VERTICAL` or `HORIZONTAL` |

### ActorKind Behaviour

| ActorKind | UI Generation | Theme Page |
|-----------|---------------|------------|
| `HUMAN` | Yes | Visible |
| `SYSTEM` | No | Hidden |

### Access Page Visibility

| Page | Visible When |
|------|--------------|
| Access | Always |
| CRUD | Always |

### Access Attribute Rules

| Attribute | Enabled When | Description |
|-----------|--------------|-------------|
| `name` | Always | Access grant identifier |
| `target` | Read-only | Display of target TransferObjectType |
| `accessType` | Always | `ALL` or `DERIVED` |
| `cardinality` | `accessType = DERIVED` | `0..1` or `0..*` |
| `getterExpression` | `accessType = DERIVED` | JQL expression for filtering |

### AccessType Behaviour

| AccessType | Cardinality | GetterExpression |
|------------|-------------|------------------|
| `ALL` | Fixed to `0..*` (lower=0, upper=-1) | Disabled |
| `DERIVED` | Configurable (`0..1` or `0..*`) | Enabled |

**On AccessType change:**
- When `ALL` is selected: automatically sets `lower = 0`, `upper = -1`
- When `DERIVED` is selected: cardinality becomes editable

### Access CRUD Rules

| Attribute | Enabled When | Description |
|-----------|--------------|-------------|
| `createable` | `target` is NOT abstract | Allow creating instances |
| `updateable` | Always | Allow modifying instances |
| `deleteable` | Always | Allow deleting instances |
| `exportable` | Always | Allow exporting instances |

### Claim Attribute Rules

| Attribute | Description |
|-----------|-------------|
| `attribute` | Required, selected from `principal.getAllAttributes()` |
| `claimType` | Enum: `EMAIL`, `USERNAME`, `UNDEFINED` |

**Claim Validation:**
- `attribute` is NOT null (required for OK button)

**Claim Candidates:**
- Attributes are selected from the parent `ActorType.principal.getAllAttributes()`

### Anonymous vs Authenticated Behaviour

| State | Realm Group | Claims | Managed |
|-------|-------------|--------|---------|
| `isEffectiveAnonymous() = true` | AnonymousGroup shown | Hidden | Hidden |
| `isEffectiveAnonymous() = false` | RealmGroup shown | Visible | Visible |

**`isEffectiveAnonymous()` returns true when:**
- `anonymous = true` explicitly set, OR
- `principal` is null, OR
- `principal` is NOT mapped

### Visual Style Indicators

| Condition | Visual Effect |
|-----------|---------------|
| `kind = SYSTEM` | System actor style |
| `Access.target` is NOT mapped | Warning/error style |

### Context Detection Reference

| Check | True When |
|-------|-----------|
| Is Effective Anonymous | `anonymous = true` OR `principal` is null OR `principal` is NOT mapped |
| Principal Is Mapped | `principal` is NOT null AND `principal.mapping` is NOT null |
| Target Is Abstract | `Access.target.abstract = true` |

---

## Related Documentation

- [Structure Package](./structure.md) - TransferObjectType and EntityType definitions
- [UI Package](./ui.md) - MenuItem and navigation definitions
- [Operation Package](./operation.md) - Operation access control