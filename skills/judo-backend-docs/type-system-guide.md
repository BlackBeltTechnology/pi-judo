# Understanding JUDO's Two-Layer Type System

> [!IMPORTANT]
> **CRITICAL CONCEPT: Service Layer vs. Entity Layer**
>
> Understanding the distinction between the Service Layer and the Entity Layer is essential for writing correct and efficient backend code in JUDO. Failing to grasp this concept is the most common source of compilation errors for new developers.

## The Two Layers

The JUDO framework uses a **two-layer type system** for a clean separation of concerns:

1.  **Service Layer** (`api.[app].service.*`)
    *   **Purpose**: Represents the external API contracts. These are the types used in the inputs and outputs of your custom operations.
    *   **Location**: `application/sdk/target/generated-sources/.../service/`
    *   **Examples**: `CreateUserInput`, `Campaign`, `Address`

2.  **Entity Layer** (`api.[app]._default_transferobjecttypes.entity.*`)
    *   **Purpose**: Represents the internal database entities. These are the types used by the DAOs for persistence and queries.
    *   **Location**: `application/sdk/target/generated-sources/.../_default_transferobjecttypes/entity/`
    *   **Examples**: `UserForCreate`, `Campaign`, `Address` (Note: Names can be the same, but packages differ)

### Why Two Layers?

Both layers are generated from the same entities in your model, but they serve different purposes:
-   **Service Layer**: Provides a stable, versioned, external-facing API for clients.
-   **Entity Layer**: Represents the internal implementation, optimized for persistence and direct database interaction.
-   **Benefit**: This separation allows the internal database schema and the external API to evolve independently, providing greater flexibility and stability.

---

## Converting Between Layers

When implementing custom operations, you will frequently need to convert objects from the Service Layer (from your operation's input) to the Entity Layer (to pass to a DAO).

### Method 1: Using `.adaptTo()`

This is the most direct way to convert between layers when you already have a service layer object.

*   **Best for**: Simple conversions where you don't need to validate the existence of the entity in the database.

```java
// Service layer object from an operation's input
[your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement serviceSettlement = input.getSettlement();

// Convert it to the Entity layer type
[your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.settlement.Settlement entitySettlement =
    serviceSettlement.adaptTo([your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.settlement.Settlement.class);

// Now you can use `entitySettlement` with a DAO
SettlementForCreate settlement = SettlementForCreate.builder()
    .withCounty(entitySettlement)  // Expects Entity layer type
    .build();
```

### Method 2: Using a DAO's `getById()`

This method is preferred when you need to both convert the type *and* validate that the entity exists in the database.

*   **Best for**: Validating and converting an entity reference from an input in a single step.

```java
// Service layer object from an operation's input
[your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement serviceSettlement = input.getSettlement();

// Use the identifier from the service object to fetch the full entity layer object from the DAO
[your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.settlement.Settlement entitySettlement =
    settlementDao.getById(serviceSettlement.identifier())
        .orElseThrow(() -> new IllegalArgumentException("Settlement not found"));

// This single call validates existence AND returns the correct Entity layer type.
SettlementForCreate settlement = SettlementForCreate.builder()
    .withCounty(entitySettlement)
    .build();
```

---

## Real-World Example & Cheat Sheet

### CreateAddress Operation Example

```java
@Override
public void accept(Admininstration _this, CreateAddressInput input) {
    // `input.getSettlement()` is a Service layer type.
    // The `addressDao` expects an Entity layer type for relationships.

    // ✅ RECOMMENDED: Validate and convert with the DAO.
    Settlement entitySettlement = settlementDao.getById(input.getSettlement().identifier())
        .orElseThrow(() -> new IllegalArgumentException("Settlement not found"));

    // Create the new address using the correct Entity layer type
    AddressForCreate address = AddressForCreate.builder()
        .withFullAddress(input.getFullAddress())
        .withSettlement(entitySettlement)  // Correctly passing the Entity layer type
        .build();

    addressDao.create(address);
}
```

### Type System Cheat Sheet

```java
// ❌ WRONG - This will cause a compilation error.
// The builder expects an Entity layer type, but receives a Service layer type.
AddressForCreate address = AddressForCreate.builder()
    .withSettlement(input.getSettlement())
    .build();

// ✅ CORRECT - Using .adaptTo() for direct conversion.
AddressForCreate address = AddressForCreate.builder()
    .withSettlement(input.getSettlement().adaptTo(Settlement.class))
    .build();

// ✅ BEST PRACTICE - Using the DAO to validate and convert.
Settlement entitySettlement = settlementDao.getById(input.getSettlement().identifier())
    .orElseThrow(() -> new IllegalArgumentException("Settlement not found"));
AddressForCreate address = AddressForCreate.builder()
    .withSettlement(entitySettlement)
    .build();
```

---

## Reading Nested Collections From Input / Composition TOs

> [!IMPORTANT]
> **Generated input/composition TOs expose only *scalar* typed getters.**

For a `TransferObjectType` used as an operation **input** (or as a nested composition inside one), the generator emits typed getters (`getXxx()`) only for **scalar** attributes. **Nested collections of TOs are not exposed through a typed getter** — attempting `input.getChildren()` where `children` is a collection composition will not compile against the generated input TO.

The nested payload is still present; it travels through the generic map view of the TO:

```java
// Given: ParentInputTO with a composition 'children : ChildTO[*]'
Map<String, Object> raw = input.toMap();

@SuppressWarnings("unchecked")
List<Map<String, Object>> childMaps =
    (List<Map<String, Object>>) raw.getOrDefault("children", List.of());

List<ChildTO> children = childMaps.stream()
    .map(ChildTO::from)   // rehydrate typed TO from the map view
    .toList();
```

**Key points:**
- `toMap()` is the canonical read path for nested composition payloads on input TOs.
- Each element is a `Map<String, Object>`; rehydrate with the child TO's static `from(Map)` factory to get a typed object back.
- The same rule applies recursively: a child's own nested collections are again `List<Map<String,Object>>` under `from(...).toMap()`.
- Output/query TOs (those returned by DAOs) are unaffected — they expose typed collection getters.
- If you find yourself reaching for reflection or string-keyed casts in business code, factor the `toMap() → from(...)` hop into a small helper per parent TO to keep custom ops readable.

---

## Pro Tips for Avoiding Errors

1.  **Check Your Imports**: The most common mistake is importing the wrong package. Always double-check if you're importing from `...service.*` or `..._default_transferobjecttypes.entity.*`.
2.  **Use the DAO for Validation**: If you need to ensure an entity reference from an input is valid, always use `dao.getById()` instead of just `.adaptTo()`.
3.  **Identifiers are Universal**: The `.identifier()` method is safe to use on objects from both layers, as the identifier format is the same.
4.  **Builders Expect Entities**: Remember that `[Entity]ForCreate` and `[Entity]ForUpdate` builders *always* expect objects from the Entity Layer for relationships.
5.  **Read the Error Message**: If you see a compilation error like `"The method withX(entity.X) is not applicable for arguments (service.X)"`, it's a clear sign you need to convert from the Service Layer to the Entity Layer.

---

## See Also
- [Data Access Guide](data-access-guide.md) - For more on using DAOs and queries.
- [Custom Operations](custom-operations.md) - For examples of how this type system is used in business logic.
