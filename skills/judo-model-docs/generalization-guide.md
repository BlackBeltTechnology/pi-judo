# Documentation Generalization Guide

This document explains the generic placeholders and patterns used throughout the documentation to make it reusable across any JUDO-based application.

## Overview

All documentation has been generalized to avoid domain-specific examples. This allows the documentation to be used as a reference for any JUDO application, regardless of the business domain.

## Generic Placeholder Convention

### Entity Names

| Placeholder | Purpose |
|---|---|
| `Entity` | Generic single entity |
| `ParentEntity` | Entity with child relationships |
| `ChildEntity` | Related/contained entity |
| `RelatedEntity` | Associated entity |
| `Item` | List item or record |
| `Record` | Data record |
| `ConfigurationEntity` | Configuration/settings entity |
| `ExternalDataEntity` | Data from external sources |
| `AccessRole` | Role/permission entity |
| `AccessPermission` | Permission entity |
| `UserEntity` | User/actor entity |
| `Location` | Location/address entity |

### Attribute Names

| Placeholder | Purpose |
|---|---|
| `identifier` | Unique identifier |
| `displayName` | Human-readable name |
| `title` | Primary title/name |
| `details` | Detailed description |
| `status` | Status/state field |
| `isActive` | Boolean status flag |
| `isPrimary` | Primary/default flag |
| `isDefault` | Default selection flag |
| `isVerified` | Verification flag |
| `dateField` | Generic date field |
| `fromDate` | Start date in range |
| `toDate` | End date in range |
| `statusField` | Status attribute |
| `priorityLevel` | Priority value |
| `qualityScore` | Quality metric |
| `coordinate1` | First coordinate |
| `coordinate2` | Second coordinate |
| `amount` | Numeric amount |
| `quantity` | Count/quantity |
| `manualData` | Manually entered data |
| `computedData` | Calculated data |

### Relationship Names

| Placeholder | Purpose |
|---|---|
| `children` | Child collection |
| `items` | Related items |
| `relatedRecords` | Associated records |
| `primaryChild` | Main child reference |
| `container` | Parent reference |
| `roles` | Role assignments |
| `permissions` | Permission assignments |
| `validationErrors` | Validation error collection |

### Operation Names

| Placeholder | Purpose |
|---|---|
| `ToggleStatus` | Toggle boolean field |
| `ToggleFlag` | Toggle any flag |
| `ValidateEntity` | Validate entity |
| `RecalculateRelatedData` | Recalculate dependent data |
| `SyncExternalData` | Sync with external source |
| `ProcessEntity` | Generic processing |

### Component Names (Frontend)

| Placeholder | Purpose |
|---|---|
| `ServiceEntityCard` | Entity card component |
| `ServiceItemsTable` | Items table component |
| `ServiceEntityDashboard` | Dashboard component |
| `ServiceEntityView` | View/detail page |
| `ServiceEntityForm` | Form component |
| `ServiceEntityList` | List component |

### Route Patterns (Frontend)

| Placeholder | Purpose |
|---|---|
| `/entities` | Entity list route |
| `/items` | Item list route |
| `/records` | Record list route |
| `/entity/:id` | Entity detail route |

### Translation Keys (Frontend)

| Placeholder | Purpose |
|---|---|
| `entities.*` | Entity translations |
| `items.*` | Item translations |
| `records.*` | Record translations |

## Generic Code Examples

### Backend - Custom Operation

**Generic Pattern:**
```java
@Component(immediate = true, service = OperationInterface.class)
public class OperationNameCustomImplementation implements OperationInterface {
    @Reference EntityDao entityDao;
    @Reference RelatedEntityDao relatedEntityDao;

    @Override
    public void accept(Entity _this) {
        Entity entity = entityDao.getById(_this.identifier()).orElseThrow();
        // Business logic here
        entity.setStatus(newStatus);
        entityDao.update(entity);
.
    }
}
```

### Backend - Interceptor

**Generic Pattern:**
```java
@Component(property = { "judo.model.name=northwind" })
public class EntityCreateInterceptor implements OperationCallInterceptor {
    @Reference EntityDao entityDao;

    @Override
    public Collection<EOperation> getOperations(AsmModel asmModel) {
        return Stream.of(
            "[model_name].[actor_package].[ActorName]#_createInstanceEntities"
        ).map(asmUtils::resolveOperation).map(Optional::orElseThrow).toList();
    }

    @Override
    public Object postCall(EOperation operation, Object parameterPayload, Object returnPayload) {
        Entity entity = entityDao.getById(getIdOf(returnPayload)).orElseThrow();
        // Post-creation logic
        return returnPayload;
    }
}
```

### Frontend - Data Hook

**Generic Pattern:**
```typescript
export const ServiceEntityViewPageDataHook: ViewPageDataHook<ServiceEntityStored> = () => {
  const { data: entity, isLoading } = useViewData();

  if (isLoading || !entity) return {};

  return {
    customData: {
      displayTitle: entity.title,
      statusLabel: getStatusLabel(entity.status),
    },
  };
};
```

### Frontend - Table Hook

**Generic Pattern:**
```typescript
export const ServiceItemsTableRowHighlightingHook: TableRowHighlightingHook<ServiceItemStored> = () => {
  return (row: ServiceItemStored) => {
    if (row.priorityLevel === 'HIGH') {
      return {
        style: {
          backgroundColor: '#ffebee',
          fontWeight: 'bold',
        },
      };
    }
    return {};
  };
};
```

## Business Logic Generalizations

### Validation Rules

**Generic:**
```java
if (!entity.meetsConstraint()) {
    throw new ValidationException("Entity does not meet required constraints");
}
```

### Permission Checks

**Generic:**
```java
if (!validationDao.queryMinimumRequiredEntities().orElse(false)) {
    throw new IllegalStateException("Maintain minimum required entities with specific permissions");
}
```

### Self-Modification Prevention

**Generic:**
```java
if (!_this.getIdentifier().equals(variableResolver.resolve(String.class, "ACTOR", "id"))) {
    // Prevent self-modification
}
```

## Application Branding

All application-specific branding has been replaced with placeholders:

| Context | Placeholder |
|---|---|
| Application Name | `[Your Application Name]` |
| Application Purpose | `[Application Purpose]` |
| Copyright | `© [Year] [Your Application]` |
| Tagline | `[Application Tagline]` |

## Using This Documentation

### For Your JUDO Application

1. **Understand the Pattern**: Read the generic example to understand the pattern
2. **Map to Your Domain**: Replace placeholders with your domain entities
3. **Adapt Business Logic**: Modify validation/business rules for your use case
4. **Keep Structure**: Maintain the same code structure and architectural patterns

## Benefits of Generalization

✅ **Reusable**: Documentation applicable to any business domain
✅ **Clear Patterns**: Focus on architectural patterns, not specific business logic
✅ **Easy Adaptation**: Simple find-replace to adapt to your domain
✅ **Maintainable**: Changes to patterns don't require domain knowledge
✅ **Universal Examples**: Examples demonstrate JUDO concepts, not specific business rules

## Generic Roles and Permissions

These role names are generic enough to be kept as-is:

- `ADMIN` - Administrative role
- `MANAGER` - Management role
- `USER` - Standard user role
- `GUEST` - Guest/public access
- `OPERATOR` - Operational role
- `VIEWER` - Read-only role

## Summary

All documentation now uses:
- ✅ Generic entity names (Entity, Item, Record)
- ✅ Generic attribute names (identifier, title, status)
- ✅ Generic operation names (ToggleStatus, ValidateEntity)
- ✅ Generic component names (ServiceEntityCard, ServiceItemsTable)
- ✅ Generic routes (/entities, /items)
- ✅ Generic translation keys (entities.*, items.*)
- ✅ Generic business logic descriptions
- ✅ Placeholder branding ([Your Application Name])

The documentation is now a universal reference for JUDO applications across all business domains.

---

Last updated: 2025-10-28
