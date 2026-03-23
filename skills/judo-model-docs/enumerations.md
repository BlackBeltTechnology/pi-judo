# Enumerations

Enumerations define a fixed set of named values used for categorization and state representation in the model.

## Defining an Enumeration

```
enum OrderStatus {
    DRAFT;
    SUBMITTED;
    APPROVED;
    REJECTED;
    COMPLETED;
    CANCELLED;
}
```

## Using Enumerations in Entity Types

Reference the enum as a field type:

```
entity type Order {
    field OrderStatus status required default(DRAFT);
}
```

## Using Enumerations in Transfer Objects

```
transfer object OrderTO maps Order {
    field OrderStatus status <= Order.status;
}
```

## Enum Members

Each member is a simple named constant. Members are ordered as declared, which can matter for display purposes in the generated frontend.

## Member Naming

- Use `UPPER_SNAKE_CASE` for member names
- Keep member names descriptive and concise
- Members must be unique within their enumeration

## Common Patterns

### Status Enums

Track lifecycle states:

```
enum DocumentStatus {
    DRAFT;
    PENDING_REVIEW;
    APPROVED;
    PUBLISHED;
    ARCHIVED;
}
```

### Category Enums

Classify entities:

```
enum Priority {
    LOW;
    MEDIUM;
    HIGH;
    CRITICAL;
}
```

### Type Discriminators

Distinguish between subtypes without inheritance:

```
enum ContactType {
    EMAIL;
    PHONE;
    ADDRESS;
    SOCIAL_MEDIA;
}
```

## Frontend Rendering

The generated frontend renders enumerations as dropdown selects by default. The display label for each member can be configured through the i18n system.

## Best Practices

- Use enumerations for fixed sets of values that rarely change
- Prefer enumerations over free-text fields for categorization
- Define a sensible default value when applicable
- Keep the number of members manageable (under 20 for typical UI dropdowns)
- Use descriptive member names since they appear in the API
