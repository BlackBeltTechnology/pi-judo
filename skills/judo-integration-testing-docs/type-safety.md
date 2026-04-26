# Integration Testing - Entity vs Service Layer Type Safety

**Part of**: [Integration Testing Documentation](./SKILL.md)

**Target Audience**: Intermediate developers facing compilation errors with type mismatches

**Prerequisites**: Understanding of basic JUDO integration testing (see [Getting Started Guide](./getting-started.md))

---

## Quick Navigation

- [Back to Main Hub](./SKILL.md)
- [The Two Type Layers](#the-two-type-layers)
- [adaptTo() Pattern](#the-solution-adaptto-pattern)
- [Advanced Mapping Scenarios](#advanced-mapping-scenarios)
- [Quick Decision Tree](#quick-decision-tree)

---

## Overview

**CRITICAL**: JUDO uses a **two-layer type system** that must not be mixed. Understanding this distinction is essential for writing integration tests that compile correctly.

When writing integration tests, you will often:
1. Create prerequisite entities using **DAOs** (entity layer)
2. Pass those entities as parameters to **custom operations** (service layer)

**This causes type mismatches** because DAOs return entity layer objects, but service inputs expect service layer types.

---

## The Two Type Layers

JUDO generates two separate type hierarchies:

### 1. Entity Layer
**Package**: `api.*._default_transferobjecttypes.entity.*`

**Used by**: DAOs for persistence operations

**Represents**: Direct database representation

**Package pattern**:
```
[your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.<entityname>
```

**Example**:
```
[your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.User
```

### 2. Service Layer
**Package**: `api.*.service.*`

**Used by**: Custom operations for inputs/outputs

**Represents**: External API contracts

**Package pattern**:
```
[your.package].[yourmodel].api.[yourmodel].service.<servicename>
```

**Example**:
```
[your.package].[yourmodel].api.[yourmodel].service.user.User
```

---

## Pre-Generation Checklist

**Before generating any integration test**, always check:

### Step 1: Identify the Operation Type

```java
// Is it a DAO operation?
EntityDao.create(EntityForCreate.builder()...) // Returns ENTITY layer object

// Or a custom operation?
CustomOperation.accept(ServiceInput.builder()...) // Expects SERVICE layer objects
```

### Step 2: Check Parameter Types in Service Layer

Open the service input builder and verify parameter types:

```bash
# Find the service input class
find application/sdk/target/generated-sources -name "*Input.java"
```

**Examine the builder methods:**
```java
// Service layer input class
public class CreateChildEntityInputBuilder {
    // This expects SERVICE layer ParentEntity!
    public CreateChildEntityInputBuilder withParent(
        [your.package].[yourmodel].api.[yourmodel].service.user.User parent
    ) { ... }
}
```

### Step 3: Check What DAOs Return

```java
// Entity layer DAO
UserDao userDao = ...;
User user = userDao.create(...);
// Returns: [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.User
```

### Step 4: Identify Type Mismatch

```java
// ❌ WRONG - Type mismatch!
User user = userDao.create(...);  // Entity layer
CreateChildEntityInput input = CreateChildEntityInput.builder()
    .withParent(user)  // Expects service layer - COMPILATION ERROR!
    .build();
```

---

## The Solution: adaptTo() Pattern

Use the `.adaptTo()` method to convert entity layer objects to service layer types:

```java
// ✅ CORRECT - Adapt entity to service layer
User entityUser = userDao.create(...);  // Entity layer

CreateChildEntityInput input = CreateChildEntityInput.builder()
    .withParent(entityUser.adaptTo(
        [your.package].[yourmodel].api.[yourmodel].service.user.User.class
    ))  // Service layer type
    .build();
```

---

## Common Type Conversions

| Entity Layer DAO | Service Layer Input | Adaptation Required |
|------------------|---------------------|---------------------|
| `UserDao.create()` → Entity User | `CreateInput.withUser()` → Service User | ✅ Yes |
| `AddressDao.create()` → Entity Address | `CreateInput.withAddress()` → Service Address | ✅ Yes |
| `CampaignDao.create()` → Entity Campaign | `CreateInput.withCampaign()` → Service Campaign | ✅ Yes |
| `SettlementDao.create()` → Entity Settlement | `CreateInput.withSettlement()` → Service Settlement | ✅ Yes |

---

## Step-by-Step Type Safety Verification

### Step 1: Analyze the Custom Operation

```java
// What is the operation signature?
public class CreateAddressCustomImplementation implements ... {
    public void accept(EntityIdentifier context, CreateAddressInput input) {
        // Input type: CreateAddressInput (service layer)
    }
}
```

### Step 2: Check Input Builder Types

```bash
# Find the input class
ls application/sdk/target/generated-sources/.../service/createaddressinput/

# Read CreateAddressInput.java
# Note all parameter types in builder methods
```

Example findings:
```java
public CreateAddressInputBuilder {
    public CreateAddressInputBuilder withCode(Long code) { }          // Primitive - OK
    public CreateAddressInputBuilder withName(String name) { }        // Primitive - OK
    public CreateAddressInputBuilder withSettlement(
        [your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement settlement
    ) { }  // SERVICE LAYER TYPE - Requires adaptation!
}
```

### Step 3: Identify Prerequisites

For each service layer type parameter:
1. What entity do I need to create first?
2. Which DAO creates it?
3. What type does that DAO return?

Example:
```java
// Need: service.settlement.Settlement
// Create with: SettlementDao.create()
// Returns: _default_transferobjecttypes.entity.settlement.Settlement
// Solution: Use .adaptTo()
```

### Step 4: Generate Test with Correct Types

```java
@Test
void testCreateAddress(JudoTestFixture fixture) {
    // 1. Get DAOs
    SettlementDao settlementDao = fixture.newInstance(SettlementDao.class);

    // 2. Create prerequisite entities (entity layer)
    Settlement entitySettlement = settlementDao.create(SettlementForCreate.builder()
        .withName("Budapest")
        .build());

    // 3. Get custom operation
    CreateAddressCustomImplementation createAddress =
        ReferenceInjector.resolve(
            CreateAddressCustomImplementation.class,
            fixture.getInjector()
        );

    // 4. Create service input with adapted types (service layer)
    CreateAddressInput input = CreateAddressInput.builder()
        .withPostalCode("1234")
        .withSettlement(entitySettlement.adaptTo(  // ✅ Adapt entity to service
            [your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement.class
        ))
        .build();

    // 5. Execute operation
    createAddress.accept(null, input);

    // 6. Verify using DAO (entity layer)
    AddressDao addressDao = fixture.newInstance(AddressDao.class);
    assertEquals(1, addressDao.query().selectList().size());
}
```

---

## Optional Type Handling

**IMPORTANT**: Check if the service layer input expects `Optional` types or raw values.

### Bad Pattern (Unnecessary Optional Wrapping)

```java
// ❌ WRONG - Service input doesn't expect Optional
CreateCampaignInput input = CreateCampaignInput.builder()
    .withStartDate(Optional.of(startDate))  // Compilation error!
    .build();
```

### Correct Pattern

```java
// ✅ CORRECT - Service input expects raw LocalDate
CreateCampaignInput input = CreateCampaignInput.builder()
    .withStartDate(startDate)  // Direct value
    .build();
```

### Good Pattern (Entity Layer Returns Optional)

```java
// Entity layer may return Optional for nullable fields
Address address = addressDao.create(...);

// ✅ CORRECT - Unwrap Optional when verifying
assertTrue(address.getOptionalField().isPresent());
assertEquals("expected_value", address.getOptionalField().get());
```

---

## Enum Type Handling

Always import and use the generated enum types, not strings:

```java
// ❌ WRONG - String instead of enum
CreateUserInput input = CreateUserInput.builder()
    .withRole("ADMIN")  // Compilation error!
    .build();

// ✅ CORRECT - Import and use enum
import [your.package].[yourmodel].api.[yourmodel].entity.userrole.UserRole;

CreateUserInput input = CreateUserInput.builder()
    .withRole(UserRole.ADMIN)  // Correct!
    .build();
```

---

## Quick Reference: Type Safety Checklist

Before writing any integration test:

- [ ] **Identify all prerequisite entities** needed for the operation
- [ ] **Check each service input parameter type** in the generated builder
- [ ] **Determine which DAOs create those entities** (entity layer)
- [ ] **Plan `.adaptTo()` calls** for all entity-to-service conversions
- [ ] **Verify Optional handling** - raw values vs Optional wrapping
- [ ] **Check for enum types** - import and use generated enums
- [ ] **Verify primitive types** - use Long literals (`1L`) for ID fields
- [ ] **Test compilation** before writing test logic

---

## Debugging Type Mismatches

If you encounter compilation errors:

```
The method withSettlement(service.settlement.Settlement)
is not applicable for the arguments (_default_transferobjecttypes.entity.settlement.Settlement)
```

**Analysis:**
1. **Parameter name**: `withSettlement`
2. **Expected type**: `service.settlement.Settlement` (service layer)
3. **Provided type**: `_default_transferobjecttypes.entity.settlement.Settlement` (entity layer)
4. **Solution**: Add `.adaptTo([your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement.class)`

---

## Examples by Complexity

### Simple (No Prerequisites)

```java
// CreatePostalCode - no relationship parameters
CreatePostalCodeInput input = CreatePostalCodeInput.builder()
    .withCode("1234")  // String - OK
    .build();
```

### Medium (One Prerequisite)

```java
// CreateAddress - requires Settlement
Settlement entitySettlement = settlementDao.create(...);  // Entity layer

CreateAddressInput input = CreateAddressInput.builder()
    .withPostalCode("1234")
    .withSettlement(entitySettlement.adaptTo(  // Adapt to service layer
        [your.package].[yourmodel].api.[yourmodel].service.settlement.Settlement.class
    ))
    .build();
```

### Complex (Multiple Prerequisites)

```java
// CreatePollingStation - requires Address, SettlementElectoralDistrict
Settlement settlement = settlementDao.create(...);
Address address = addressDao.create(...);
SettlementElectoralDistrict district = districtDao.create(...);

CreatePollingStationInput input = CreatePollingStationInput.builder()
    .withNumber(12L)
    .withAddress(address.adaptTo(  // Adapt each reference
        [your.package].[yourmodel].api.[yourmodel].service.address.Address.class
    ))
    .withSettlementElectoralDistrict(district.adaptTo(
        [your.package].[yourmodel].api.[yourmodel].service.settlementelectoraldistrict.SettlementElectoralDistrict.class
    ))
    .build();
```

---

## Advanced Mapping Scenarios

### When adaptTo() Is Not Enough

**CRITICAL**: Sometimes `.adaptTo()` alone cannot solve type compatibility issues because:

1. **Derived values** - Service layer may have computed/calculated fields not in entity layer
2. **Aggregated entities** - Service layer may combine multiple entities into one representation
3. **Different field sets** - Entity and service layers may have different available properties
4. **View projections** - Service layer may be a subset or superset of entity data

In these cases, you need to **fetch via DAO using the entity's identifier** to get the correct representation.

### The Problem: Non-Adaptable Types

```java
// Scenario: Entity has fields that service layer doesn't expose, or vice versa
EntityLayer entityObj = entityDao.create(...);

// ❌ This may fail or lose data
ServiceLayer serviceObj = entityObj.adaptTo(ServiceLayer.class);
// Some fields might be null or missing!
```

### The Solution: Read-by-ID Pattern

**Principle**: If both entity and service layers are mapped to the same underlying entity, you can use the DAO to fetch the data in the correct form.

```java
// 1. Create entity via DAO (entity layer)
EntityType entity = entityDao.create(EntityForCreate.builder()
    .withField("value")
    .build());

// 2. Get the entity's identifier
EntityTypeIdentifier entityId = entity.identifier();

// 3. Fetch via DAO - this gives you the full entity representation
EntityType fullEntity = entityDao.getById(entityId)
    .orElseThrow(() -> new AssertionError("Entity should exist"));

// 4. Now adapt to service layer with complete data
ServiceLayerType serviceObj = fullEntity.adaptTo(ServiceLayerType.class);
```

---

## When to Use Read-by-ID Pattern

Use `dao.getById(entity.identifier())` when:

| Scenario | Why Read-by-ID Is Needed |
|----------|--------------------------|
| **Lazy-loaded relationships** | Entity might not have relationships fully initialized |
| **Database-generated fields** | Auto-increment IDs, timestamps, defaults not in builder |
| **Computed/derived fields** | Fields calculated by database triggers or stored procedures |
| **Complex mappings** | Entity-service mapping involves transformations |
| **Aggregations** | Service layer aggregates data from multiple entities |
| **View projections** | Service layer is subset/superset of entity fields |
| **After mutations** | Entity might be stale after DAO operations |

---

## Common Workflow: Create + Fetch + Adapt

**Standard pattern for complex mappings:**

```java
@Test
void testComplexMapping(JudoTestFixture fixture) {
    // 1. Get DAOs
    AddressDao addressDao = fixture.newInstance(AddressDao.class);
    PollingStationDao pollingStationDao = fixture.newInstance(PollingStationDao.class);

    // 2. Create prerequisites (entity layer)
    Address address = addressDao.create(AddressForCreate.builder()
        .withPostalCode("1234")
        .build());

    // 3. Create main entity with relationships (entity layer)
    PollingStation pollingStation = pollingStationDao.create(PollingStationForCreate.builder()
        .withNumber(12L)
        .withAddress(address)  // Entity layer relationship
        .build());

    // 4. RE-FETCH via DAO to get complete entity with all relationships loaded
    PollingStation fullPollingStation = pollingStationDao.getById(pollingStation.identifier())
        .orElseThrow(() -> new AssertionError("Entity should exist"));

    // 5. Adapt to service layer (now has all data)
    [your.package].[yourmodel].api.[yourmodel].service.pollingstation.PollingStation servicePollingStation =
        fullPollingStation.adaptTo(
            [your.package].[yourmodel].api.[yourmodel].service.pollingstation.PollingStation.class
        );

    // 6. Use in service input
    CustomOperationInput input = CustomOperationInput.builder()
        .withPollingStation(servicePollingStation)
        .build();

    // 7. Execute operation
    customOperation.accept(null, input);
}
```

---

## Debugging Mapping Issues

If `.adaptTo()` fails or produces incorrect results:

### Step 1: Verify Both Layers Exist

```bash
# Check entity layer
find application/sdk/target/generated-sources -path "*_default_transferobjecttypes/entity/*" -name "User.java"

# Check service layer
find application/sdk/target/generated-sources -path "*/service/*" -name "User.java"
```

### Step 2: Compare Field Definitions

```java
// Entity layer
public class EntityLayerUser {
    private Long id;
    private String userName;
    private LocalDateTime createdAt;  // Auto-generated
}

// Service layer
public class ServiceLayerUser {
    private Long id;
    private String userName;
    // No createdAt - internal field not exposed
}
```

### Step 3: Identify Missing/Different Fields

- **Missing in service**: Internal/audit fields (createdAt, modifiedAt, version)
- **Missing in entity**: Computed fields (fullName, displayName, aggregations)
- **Different types**: Relationships using different layer types
- **Different names**: Field name mappings (e.g., `userName` vs `username`)

### Step 4: Use Read-by-ID for Complete Data

```java
// If you see NullPointerException or missing data after adaptTo():
Entity entity = dao.create(...);

// ❌ Don't adapt immediately
ServiceEntity service = entity.adaptTo(ServiceEntity.class);  // Might be incomplete

// ✅ Re-fetch first
Entity fullEntity = dao.getById(entity.identifier()).orElseThrow();
ServiceEntity service = fullEntity.adaptTo(ServiceEntity.class);  // Complete data
```

---

## Key Takeaways

1. **adaptTo() works for simple mappings** where entity and service layers have identical structure
2. **Read-by-ID ensures complete data** - always fetch after create if using complex mappings
3. **Relationships need loading** - initial entity might have lazy-loaded relationships
4. **Database-generated fields** - timestamps, IDs, defaults only present after fetch
5. **Service layer may aggregate** - combining multiple entities requires full data
6. **When in doubt, re-fetch** - it's safer and ensures data completeness

---

## Quick Decision Tree

```
Do you need to pass entity data to a service operation?
├─ Is it a simple entity with no relationships?
│  └─ Use: entity.adaptTo(ServiceType.class)
│
├─ Does it have relationships or computed fields?
│  └─ Use: dao.getById(entity.identifier()).orElseThrow()
│           .adaptTo(ServiceType.class)
│
└─ Are you getting NullPointerException or missing data?
   └─ Always re-fetch: dao.getById().orElseThrow().adaptTo()
```

---

## Next Steps

**If you're done here**, return to the [Main Hub](./SKILL.md)

**If you need help with**:
- [Getting started with tests](./getting-started.md)
- [Advanced patterns](./advanced-patterns.md)
- [Best practices](./best-practices.md)

---

**Last Updated**: 2025-11-02
