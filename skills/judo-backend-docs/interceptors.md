# Operation Call Interceptors Guide

> [!IMPORTANT]
> This guide covers `OperationCallInterceptor` for intercepting business logic operations. For handling user authentication events, please see the [Authentication Guide](authentication-guide.md).

## Advanced Interceptor Patterns

The JUDO framework provides two types of interceptors, `OperationCallInterceptor` and `AuthenticationInterceptor`, which can be used to implement a variety of powerful, cross-cutting patterns.

### Data Denormalization and Aggregation

This pattern uses an `OperationCallInterceptor` to denormalize and aggregate data, which is a common technique to optimize read performance. By pre-calculating and storing aggregated values, the application can avoid complex and potentially slow queries when retrieving data for display.

**Example**

An interceptor like `MyEntityUpdateInterceptor` can be used to listen for updates on `MyEntity`. In the `postCall` hook, it can query for related `Tag` entities, aggregate their names into a comma-separated string, and save that string to a `tagsAggregated` field on `MyEntity`.

```java
// From a hypothetical MyEntityUpdateInterceptor.java
@Override
public Object postCall(EOperation operation, Object parameterPayload, Object returnPayload) throws InterceptorCallBusinessException {
    if (parameterPayload instanceof UpdateInstanceCall.UpdateInstanceCallPayload updateInstanceCallPayload) {
        UUID identifier = updateInstanceCallPayload.getInstance().getAs(UUID.class, "__identifier");
        MyEntity entity = myEntityDao.getById(identifier, MyEntityMask.mask()
                .withTagsAggregated()
        ).orElseThrow();

        String tagsAggregated = myEntityDao.queryTags(entity).selectList().stream()
                                      .map(Tag::getName).sorted().collect(Collectors.joining(", "));
        
        if (!entity.getTagsAggregated().orElse("").equals(tagsAggregated)) {
            entity.setTagsAggregated(tagsAggregated);
            myEntityDao.update(entity, MyEntityMask.mask());
        }
    }
    return OperationCallInterceptor.super.postCall(operation, parameterPayload, returnPayload);
}
```

### Decoupled Service Creation (CQRS-like Pattern)

This pattern uses an `OperationCallInterceptor` to trigger the creation of a resource in a different service or bounded context when an operation is performed. This promotes loose coupling between services.

**Example**

An interceptor like `UserProfileCreateInterceptor` can intercept the creation of a `UserProfile`. In the `preCall` hook, it can take the profile data, transform it, and create a `WelcomeJourney` object using a different DAO. By returning `true` from `ignoreDecoratedCall()`, it prevents the original `UserProfile` from being created directly, effectively replacing the operation.

```java
// From a hypothetical UserProfileCreateInterceptor.java
public Object preCall(EOperation operation, Object parameterPayload) throws InterceptorCallBusinessException {
    if (parameterPayload instanceof CreateInstanceCall.CreateInstanceCallPayload createInstanceCallPayload) {
        UserProfile profile = UserProfile.from(createInstanceCallPayload.getInput());
        
        WelcomeJourneyForCreate create = WelcomeJourneyForCreate.builder()
                .withEmail(profile.getEmail())
                .withStage(WelcomeStage.STARTED)
                .build();

        welcomeJourneyDao.create(create);
    }
    return createInstanceCallPayload;
}

public boolean ignoreDecoratedCall() {
    return true;
}
```



### Derived State Calculation and Enforcement

This pattern uses a pair of `OperationCallInterceptor` instances to manage derived data based on a single "source of truth" field (e.g., an enumeration). One interceptor (`_refresh`) calculates derived fields on read, and the other (`_update`) enforces data consistency on write.

**Example**

- **Refresh Interceptor:** On a `_refresh` operation for a `LocatedItem` entity, the `postCall` hook inspects if a `country`, `state`, or `city` relationship exists. Based on this, it sets a `LocationScope` enum and derived boolean flags like `isCountryScope`. This simplifies UI logic.

- **Update Interceptor:** On an `_update` operation, the `postCall` hook reads the `LocationScope` enum sent from the client. If the scope is `COUNTRY`, it ensures any `state` and `city` relationships on the entity are nullified before saving, guaranteeing data integrity.



## Overview

`OperationCallInterceptor` is a powerful mechanism for implementing cross-cutting concerns that apply to business logic operations. They allow you to execute custom code **before** (`preCall`) and **after** (`postCall`) a modeled operation is invoked.

Common use cases include:
- **Auditing**: Creating a log of who performed what action and when.
- **Payload Manipulation**: Modifying input data before an operation or transforming the result after.
- **Side Effects**: Triggering other operations or external service calls in response to an event.
- **Complex Validation**: Enforcing business rules that involve multiple entities or external state.

### OperationCallInterceptor Interface

JUDO provides the `OperationCallInterceptor` interface for intercepting model operations:

```java
public interface OperationCallInterceptor {
    String getName();
    Collection<EOperation> getOperations(AsmModel asmModel);
    Object preCall(EOperation operation, Object parameterPayload);
    Object postCall(EOperation operation, Object parameterPayload, Object returnPayload);
}
```

## Interceptor Component Registration

**Required annotation properties:**

```java
@Component(property = { "judo.model.name=northwind" })
public class MyInterceptor implements OperationCallInterceptor {
    // Implementation
}
```

**Why `property = { "judo.model.name=northwind" }`?**
- Binds interceptor to specific JUDO model
- Runtime uses this to match interceptors to operations
- Multiple models can coexist with different interceptors

## Example 1: Simple Logging Interceptor

**Pattern**: Log all intercepted operations

```java
@Component(property = { "judo.model.name=northwind" })
public class LogOperationCallInterceptor implements OperationCallInterceptor {

    private static final Logger log = LoggerFactory.getLogger(LogOperationCallInterceptor.class);

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    // Commented-out getOperations() means: intercept ALL operations
    // Uncomment and implement to intercept specific operations only

    @Override
    public Object preCall(EOperation operation, Object parameterPayload) {
        String operationFQName = AsmUtils.getOperationFQName(operation);
        log.info("*** ⬇️ INTERCEPTED OPERATION ⬇️ ***");
        log.info(operationFQName);
        log.info("*** ⬆️ INTERCEPTED OPERATION ⬆️ ***");
        return OperationCallInterceptor.super.preCall(operation, parameterPayload);
    }
}
```

**Key patterns:**
- `@Component(property = { "judo.model.name=northwind" })` - Required for operation interceptors
- No `getOperations()` implementation = intercept ALL operations
- `AsmUtils.getOperationFQName()` - Get fully qualified operation name
- `preCall()` - Executed before operation logic

## Example 2: Selective Operation Interception (Create)

**Pattern**: Intercept specific operation and execute post-operation logic

```java
@Component(property = { "judo.model.name=northwind" })
public class EntityCreateInterceptor implements OperationCallInterceptor {

    @Reference EntityDao entityDao;
    @Reference RecalculateRelatedData recalculateRelatedData;

    private AsmUtils asmUtils;
    private List<EOperation> interceptedOperations;

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public Collection<EOperation> getOperations(AsmModel asmModel) {
        if (interceptedOperations == null) {
            if (asmUtils == null) {
                asmUtils = new AsmUtils(asmModel.getResourceSet());
            }

            // Specify exact operation to intercept by FQN
            EOperation createOperation =
                    asmUtils.resolveOperation("northwind.services.ServiceContext#_createInstanceEntities")
                            .orElseThrow();

            interceptedOperations = List.of(createOperation);
        }
        return interceptedOperations;
    }

    @Override
    public Object postCall(EOperation operation, Object parameterPayload, Object returnPayload) {
        // Extract input payload
        Payload inputPayload = ((CreateInstanceCall.CreateInstanceCallPayload) parameterPayload).getInput();
        
        // Convert to typed input
        [package.path.to.your.entity].Entity input =
                [package.path.to.your.entity].Entity.from(inputPayload);

        // Get created entity ID from return payload
        Serializable entityIdentifier = getIdOf(returnPayload);
        Entity entity = entityDao.getById(entityIdentifier, EntityMask.entityMask().withIdentifier()).orElseThrow();

        // Create related entities
        EntityLocation newLocation = entityDao.createEntityLocations(entity,
                EntityLocationForCreate.builder()
                        .withPostalCode(input.getForm_primaryLocationPostalCode())
                        .withCity(input.getForm_primaryLocationCity())
                        .withAddressLine(input.getForm_primaryLocationAddressLine())
                        .build(),
                EntityLocationMask.entityLocationMask());
        entityDao.setPrimaryEntityLocation(entity, newLocation);

        EntityContact newContact = entityDao.createEntityContacts(entity,
                EntityContactForCreate.builder()
                        .withContactValue(input.getForm_primaryContact())
                        .withContactType(input.getForm_primaryContactType())
                        .build(),
                EntityContactMask.entityContactMask());
        entityDao.setPrimaryEntityContact(entity, newContact);

        EntityDetail newDetail = entityDao.createEntityDetails(entity,
                EntityDetailForCreate.builder()
                        .withDetailValue(entity.getIdentifier())
                        .build(),
                EntityDetailMask.entityDetailMask());
        entityDao.setPrimaryEntityDetail(entity, newDetail);

        // Execute other custom operations
        try {
            recalculateRelatedData.accept(entity);
        } catch (GenericOperationErrorException e) {
            throw new RuntimeException(e);
        }

        return OperationCallInterceptor.super.postCall(operation, parameterPayload, returnPayload);
    }
}
```

**Key patterns demonstrated:**
- **Selective interception**: `getOperations()` returns specific operations
- **Operation FQN format**: `[model_name].services.[ServiceName]#_createInstance[EntityName]` (for create operations)
- **Lazy initialization**: Cache `interceptedOperations` and `asmUtils`
- **Post-call processing**: Extract created entity ID and perform additional setup
- **Payload casting**: Cast to specific payload type (`CreateInstanceCallPayload`)
- **Creating related entities**: Use relationship DAO methods
- **Calling other operations**: Reference and invoke other custom operations

## Example 3: Update Interceptor with Batch Processing

**Pattern**: Intercept update and process multiple related entities

```java
@Component(property = { "judo.model.name=northwind" })
public class AccessRoleUpdateInterceptor implements OperationCallInterceptor {

    @Reference EntityDao entityDao;
    @Reference RecalculateRelatedData recalculateRelatedData;

    private AsmUtils asmUtils;
    private List<EOperation> interceptedOperations;

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public Collection<EOperation> getOperations(AsmModel asmModel) {
        if (interceptedOperations == null) {
            if (asmUtils == null) {
                asmUtils = new AsmUtils(asmModel.getResourceSet());
            }

            // Intercept update operation
            interceptedOperations = Stream.of(
                    "northwind.services.entity_service.AccessRole#_updateInstancenorthwind_services_entity_service_AccessRole"
            ).map(asmUtils::resolveOperation).map(Optional::orElseThrow).toList();
        }
        return interceptedOperations;
    }

    @Override
    public Object postCall(EOperation operation, Object parameterPayload, Object returnPayload) {
        if (parameterPayload instanceof UpdateInstanceCall.UpdateInstanceCallPayload) {
            // When role is updated, recalculate related data for ALL entities
            List<Entity> entities = entityDao.query().maskedBy(EntityMask.entityMask()).selectList();
            for (Entity entity : entities) {
                try {
                    recalculateRelatedData.accept(entity);
                } catch (GenericOperationErrorException e) {
                    throw new RuntimeException(e);
                }
            }
        }

        return OperationCallInterceptor.super.postCall(operation, parameterPayload, returnPayload);
    }
}
```

**Key patterns demonstrated:**
- **Update operation FQN**: `#_updateInstance[FullEntityFQN]`
- **Payload type check**: `instanceof UpdateInstanceCallPayload`
- **Batch processing**: Query and process all related entities
- **Cascading updates**: Propagate changes to dependent entities

## Example 4: Pre-Call Payload Manipulation

**Pattern**: Modify input payload before operation execution

```java
@Component(property = { "judo.model.name=northwind" })
public class ParentEntityCreateInterceptor implements OperationCallInterceptor {

    @Reference ChildEntityDao childEntityDao;
    @Reference ParentEntityDao parentEntityDao;
    @Reference LocationService locationService;

    private AsmUtils asmUtils;
    private List<EOperation> interceptedOperations;

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public Collection<EOperation> getOperations(AsmModel asmModel) {
        if (interceptedOperations == null) {
            if (asmUtils == null) {
                asmUtils = new AsmUtils(asmModel.getResourceSet());
            }

            EOperation parentEntityCreateOperation =
                    asmUtils.resolveOperation("northwind.services.ServiceContext#_createInstanceParentEntities")
                            .orElseThrow();

            interceptedOperations = List.of(parentEntityCreateOperation);
        }
        return interceptedOperations;
    }

    @Override
    public Object preCall(EOperation operation, Object parameterPayload) {
        Payload input = ((CreateInstanceCallPayload) parameterPayload).getInput();

        // Validate input before operation
        if (!input.getAs(Boolean.class, ParentEntityAttribute.FORM_IS_PRIMARY.getName())) {
            throw ExceptionUtils.createValidationException(
                ParentEntityAttribute.FORM_IS_PRIMARY.getName(), 
                "Primary flag is required");
        }

        // Build complex nested payload from form fields
        input.put(ParentEntityReference.CHILD_ENTITIES.getName(), List.of(Payload.map(
                ChildEntityReference.REFERENCE_DATA.getName(), input.get(ParentEntityReference.FORM_REFERENCE_DATA.getName()),
                ChildEntityAttribute.REGION.getName(), input.get(ParentEntityAttribute.FORM_REGION.getName()),
                ChildEntityAttribute.POSTAL_CODE.getName(), input.get(ParentEntityAttribute.FORM_POSTAL_CODE.getName()),
                ChildEntityAttribute.CITY.getName(), input.get(ParentEntityAttribute.FORM_CITY.getName()),
                ChildEntityAttribute.STREET_NAME.getName(), input.get(ParentEntityAttribute.FORM_STREET_NAME.getName()),
                ChildEntityAttribute.CATEGORY.getName(), input.get(ParentEntityAttribute.FORM_CATEGORY.getName()),
                ChildEntityAttribute.NUMBER.getName(), input.get(ParentEntityAttribute.FORM_NUMBER.getName()),
                ChildEntityAttribute.BUILDING.getName(), input.get(ParentEntityAttribute.FORM_BUILDING.getName()),
                ChildEntityAttribute.FLOOR.getName(), input.get(ParentEntityAttribute.FORM_FLOOR.getName()),
                ChildEntityAttribute.UNIT.getName(), input.get(ParentEntityAttribute.FORM_UNIT.getName()),
                ChildEntityAttribute.REFERENCE_CODE.getName(), input.get(ParentEntityAttribute.FORM_REFERENCE_CODE.getName()),
                ChildEntityAttribute.MANUAL_DATA.getName(), input.get(ParentEntityAttribute.FORM_MANUAL_DATA.getName()),
                ChildEntityAttribute.COMPUTED_DATA.getName(), input.get(ParentEntityAttribute.FORM_COMPUTED_DATA.getName()),
                ChildEntityAttribute.IS_PRIMARY.getName(), true,
                ChildEntityAttribute.IS_DEFAULT.getName(), input.get(ParentEntityAttribute.FORM_IS_DEFAULT.getName()),
                ChildEntityAttribute.IS_ACTIVE.getName(), input.get(ParentEntityAttribute.FORM_IS_ACTIVE.getName()),
                ChildEntityAttribute.IS_VERIFIED.getName(), input.get(ParentEntityAttribute.FORM_IS_VERIFIED.getName())
        )));

        return OperationCallInterceptor.super.preCall(operation, parameterPayload);
    }

    @Override
    public Object postCall(EOperation operation, Object parameterPayload, Object returnPayload) {
        Payload input = ((CreateInstanceCallPayload) parameterPayload).getInput();

        ParentEntity parentEntity = parentEntityDao.getById(getIdOf(returnPayload), ParentEntityMask.parentEntityMask()).orElseThrow();
        ChildEntity childEntity = parentEntityDao.queryChildEntities(parentEntity)
                                    .maskedBy(ChildEntityMask.childEntityMask())
                                    .selectList().stream().findAny().orElseThrow();

        // Set relationship references
        parentEntityDao.setPrimaryChild(parentEntity, childEntity);

        if (input.getAs(Boolean.class, "form_isDefault")) {
            parentEntityDao.setDefaultChild(parentEntity, childEntity);
        }
        if (input.getAs(Boolean.class, "form_isVerified")) {
            parentEntityDao.setVerifiedChild(parentEntity, childEntity);
        }

        // Post-process created related entities
        List<ChildEntity> childEntities = parentEntityDao.queryChildEntities(parentEntity).selectList();
        for (ChildEntity child : childEntities) {
            if (!child.getManualData()) {
                locationService.autoUpdateComputedData(child.identifier());
            }
            locationService.updateFullData(child.identifier());
        }

        return returnPayload;
    }
}
```

**Key patterns demonstrated:**
- **Payload manipulation**: Modify input before operation execution
- **Payload.map()**: Build nested payloads with key-value pairs
- **Form field mapping**: Transform flat form fields to nested entity structures
- **Pre-call validation**: Validate and throw exceptions before operation
- **Setting relationship references**: `parentEntityDao.setPrimaryChild()`, `setDefaultChild()`
- **Post-processing related entities**: Call external services on created entities

## Example 5: Intercepting Reference Operations

**Pattern**: Intercept add/remove/set/delete reference operations

```java
@Component(property = { "judo.model.name=northwind" })
public class AccessRoleSetAndRemoveAndDeleteInterceptor implements OperationCallInterceptor {

    @Reference EntityDao entityDao;
    @Reference RecalculateRelatedData recalculateRelatedData;
    @Reference AccessValidationDao accessValidationDao;

    private AsmUtils asmUtils;
    private List<EOperation> interceptedOperations;

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public Collection<EOperation> getOperations(AsmModel asmModel) {
        if (interceptedOperations == null) {
            if (asmUtils == null) {
                asmUtils = new AsmUtils(asmModel.getResourceSet());
            }

            // Intercept multiple reference operations
            interceptedOperations = Stream.of(
                    "northwind.services.entity_service.AccessRole#_addReferenceAccessPermissions",
                    "northwind.services.entity_service.AccessRole#_removeReferenceAccessPermissions",
                    "northwind.services.entity_service.AccessRole#_setReferenceAccessPermissions",
                    "northwind.services.entity_service.AccessRole#_deleteInstancenorthwind_services_entity_service_AccessRole"
            ).map(asmUtils::resolveOperation).map(Optional::orElseThrow).toList();
        }
        return interceptedOperations;
    }

    @Override
    public Object postCall(EOperation operation, Object parameterPayload, Object returnPayload) {
        // Validate business rule after any permission change
        Boolean activeEntitiesWithAtLeastManagementPermission = 
            accessValidationDao.queryActiveEntitiesWithAtLeastManagementPermission().orElse(false);
        Boolean activeEntitiesWithAtLeastAdminPermission = 
            accessValidationDao.queryActiveEntitiesWithAtLeastAdminPermission().orElse(false);

        if (!(activeEntitiesWithAtLeastManagementPermission && activeEntitiesWithAtLeastAdminPermission)) {
            throw new IllegalStateException(
                "Maintain minimum required entities with specific permissions");
        }

        // Recalculate related data for all entities
        List<Entity> entities = entityDao.query().maskedBy(EntityMask.entityMask()).selectList();
        for (Entity entity : entities) {
            try {
                recalculateRelatedData.accept(entity);
            } catch (GenericOperationErrorException e) {
                throw new RuntimeException(e);
            }
        }

        return OperationCallInterceptor.super.postCall(operation, parameterPayload, returnPayload);
    }
}
```

**Key patterns demonstrated:**
- **Multiple operation interception**: Single interceptor for related operations
- **Reference operations**: `_addReference`, `_removeReference`, `_setReference`
- **Business rule enforcement**: Validate after changes, rollback via exception
- **Derived query methods**: Use model-generated validation queries

## Example 6: Handling Both Create and Update

**Pattern**: Single interceptor for create and update with pattern matching

```java
@Component(property = { "judo.model.name=northwind" })
public class ChildEntityCreateAndUpdateInterceptor implements OperationCallInterceptor {

    @Reference ParentEntityDao parentEntityDao;
    @Reference ChildEntityDao childEntityDao;
    @Reference ValidateEntity validateEntity;
    @Reference LocationService locationService;
    @Reference DataInterceptorService dataInterceptorService;

    private AsmUtils asmUtils;
    private List<EOperation> interceptedOperations;

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public Collection<EOperation> getOperations(AsmModel asmModel) {
        if (interceptedOperations == null) {
            if (asmUtils == null) {
                asmUtils = new AsmUtils(asmModel.getResourceSet());
            }

            // Intercept both create and update
            interceptedOperations = Stream.of(
                    "northwind.services.parent_service.ParentEntity#_createInstanceChildEntities",
                    "northwind.services.parent_service.ChildEntity#_updateInstancenorthwind_services_parent_service_ChildEntity"
            ).map(asmUtils::resolveOperation).map(Optional::orElseThrow).toList();
        }
        return interceptedOperations;
    }

    @Override
    public Object preCall(EOperation operation, Object parameterPayload) {
        // Pattern matching with instanceof - handles both create and update
        if (parameterPayload instanceof CreateInstanceCallPayload createInstanceCallPayload) {
            Payload inputPayload = createInstanceCallPayload.getInput();
            dataInterceptorService.createNestedGroupsOnEntity(inputPayload);
        } else if (parameterPayload instanceof UpdateInstanceCall.UpdateInstanceCallPayload updateInstanceCallPayload) {
            Payload inputPayload = updateInstanceCallPayload.getInput();
            dataInterceptorService.createNestedGroupsOnEntity(inputPayload);
        } else {
            throw new IllegalArgumentException("Unsupported parameter payload: " + parameterPayload.getClass().getName());
        }

        return OperationCallInterceptor.super.preCall(operation, parameterPayload);
    }

    @Override
    public Object postCall(EOperation operation, Object parameterPayload, Object returnPayload) {
        if (parameterPayload instanceof CreateInstanceCallPayload) {
            ChildEntity childEntity = childEntityDao.getById(getIdOf(returnPayload)).orElseThrow();
            ParentEntity parentEntity = childEntityDao.queryContainer(childEntity, ParentEntityMask.parentEntityMask()).orElseThrow();

            // Set relationships based on flags
            if (childEntity.getIsPrimary()) {
                parentEntityDao.setPrimaryChild(parentEntity, childEntity);
            }
            if (childEntity.getIsDefault()) {
                parentEntityDao.setDefaultChild(parentEntity, childEntity);
            }
            if (childEntity.getIsVerified()) {
                parentEntityDao.setVerifiedChild(parentEntity, childEntity);
            }

            // Call external services
            if (!childEntity.getManualData()) {
                locationService.autoUpdateComputedData(childEntity.identifier());
            }
            locationService.updateFullData(childEntity.identifier());

            validateEntity.accept(parentEntity);
        } else if (parameterPayload instanceof UpdateInstanceCall.UpdateInstanceCallPayload updateInstanceCallPayload) {
            ChildEntity childEntity = childEntityDao.getById(getIdOf(updateInstanceCallPayload.getInstance())).orElseThrow();
            ParentEntity parentEntity = childEntityDao.queryContainer(childEntity, ParentEntityMask.parentEntityMask()).orElseThrow();
            
            if (!childEntity.getManualData()) {
                locationService.autoUpdateComputedData(childEntity.identifier());
            }
            locationService.updateFullData(childEntity.identifier());
            validateEntity.accept(parentEntity);
        } else {
            throw new IllegalArgumentException("Unsupported parameter payload: " + parameterPayload.getClass().getName());
        }

        return returnPayload;
    }
}
```

**Key patterns demonstrated:**
- **Pattern matching**: Modern Java `instanceof` with pattern variables
- **Mixed operation types**: Handle create and update in same interceptor
- **Container navigation**: `queryContainer()` to get parent entity
- **Conditional relationship setting**: Set references based on entity flags
- **External service calls**: Injecting and calling custom services
- **Invoking other operations**: Call `validateEntity.accept()` operation

## Operation FQN Format Reference

Operation Fully Qualified Names follow specific patterns:

| Operation Type | FQN Pattern | Example |
|----------------|-------------|---------|
| Create (Transfer) | `[model_name].[actor_package].[ActorName]#_createInstance[EntityPlural]` | `myapp.entity_admin.Admin#_createInstanceEntities` |
| Create (Contained) | `[model_name].[entity_package].[Parent]#_createInstance[ChildEntityPlural]` | `myapp.data_management.DataGroup#_createInstanceDataItems` |
| Update | `[model_name].[entity_package].[Entity]#_updateInstance[FullEntityFQN]` | `myapp.access_management.AccessRole#_updateInstanceMyapp_access_management_AccessRole` |
| Delete | `[model_name].[entity_package].[Entity]#_deleteInstance[FullEntityFQN]` | `myapp.access_management.AccessRole#_deleteInstanceMyapp_access_management_AccessRole` |
| Add Reference | `[model_name].[entity_package].[Entity]#_addReference[RelationshipName]` | `myapp.access_management.AccessRole#_addReferenceAccessPermissions` |
| Remove Reference | `[model_name].[entity_package].[Entity]#_removeReference[RelationshipName]` | `myapp.access_management.AccessRole#_removeReferenceAccessPermissions` |
| Set Reference | `[model_name].[entity_package].[Entity]#_setReference[RelationshipName]` | `myapp.access_management.AccessRole#_setReferenceAccessPermissions` |
| Custom Operation | `[model_name].[entity_package].[Entity]#[operationName]` | `myapp.entity_management.Entity#toggleStatus` |

**Finding Operation FQNs:**

```bash
# Search in ASM model for operation definitions
grep -r "operation name=" application/model/target/generated-resources/model/

# Use AsmUtils in code to resolve and log operation names
String opFqn = AsmUtils.getOperationFQName(operation);
log.info("Operation FQN: {}", opFqn);
```

## Using .default Template Files

The generator creates `.default` template files as **blueprints** for custom interceptors. These are starting point templates with commented example code.

**Important**: `.java.default` files are **NOT compiled** by Maven. They are blueprints that must be:
1. **Renamed** to `.java` extension to be compiled
2. **Customized** by implementing the method bodies and uncommenting relevant code

**Note**: The renamed `.java` files do NOT need to be added to `.generator-ignore` because the generator only creates `.default` files, never `.java` files. Your `.java` implementations are safe from regeneration.

### Workflow: Using .default Templates

```bash
# 1. Find generated .default blueprint templates
find application/interceptors/src/main/java -name "*.java.default"

# 2. Copy/rename to remove .default extension
cp application/interceptors/src/main/java/[PACKAGE]/[InterceptorName].java.default \
   application/interceptors/src/main/java/[PACKAGE]/[InterceptorName].java

# 3. Edit the file - uncomment and implement the logic
vim application/interceptors/src/main/java/[PACKAGE]/[InterceptorName].java

# 4. Build and deploy
cd application/interceptors
mvn install
```

**Important Notes**:
- Do NOT edit `.java.default` files directly - they are regenerated on each build
- Do NOT add `.java` files to `.generator-ignore` - the generator only creates `.default` files, your `.java` implementations are never overwritten
- Always work with the `.java` file after renaming

### Common .default Template Patterns

| Pattern | Purpose | Must Rename |
|---------|---------|-------------|
| `Log*Interceptor.java.default` | Blueprint for logging interceptors | ✅ Yes → `.java` |
| `*ValidationInterceptor.java.default` | Blueprint for validation logic | ✅ Yes → `.java` |
| `Custom*ServiceImpl.java.default` | Blueprint for custom service operations | ✅ Yes → `.java` |

**Note**: Specific blueprint files generated depend on your model definition. All `.default` files are templates only and will NOT be compiled until renamed to `.java`.

## See Also

- [Authentication Guide](authentication-guide.md) - For intercepting user authentication events.
- [Custom Operations](custom-operations.md) - For implementing the business logic that these interceptors wrap.
- [Patterns and Best Practices](patterns-and-best-practices.md) - For other common backend patterns.
