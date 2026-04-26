# Backend Error Handling Guide

## Overview

This guide provides a comprehensive overview of error handling strategies in the JUDO backend. It covers how to use modeled custom faults (Business Errors), standard platform exceptions, and best practices for creating robust and user-friendly error responses.

For information on localizing error messages, please refer to the [Internationalization Guide](internationalization-guide.md).

## Table of Contents

- [Error Handling with Custom Faults](#error-handling-with-custom-faults)
  - [Modeled Business Errors](#modeled-business-errors)
  - [Creating Business Exceptions](#creating-business-exceptions)
  - [Exception Types](#exception-types)
- [Best Practices](#best-practices)
  - [Error Handling](#error-handling-best-practices)
  - [Validation Strategy](#validation-strategy)
- [Testing Error Handling](#testing-error-handling)
- [API Error Code Reference](#api-error-code-reference)

---

## Error Handling with Custom Faults

### Modeled Business Errors

JUDO allows you to model custom fault types (`BusinessError`) in your ESM model. These are strongly-typed exceptions that can carry structured error information back to the client.

**Benefits:**
- **Type-safe error handling**: Allows clients to catch specific, predictable error types.
- **Structured error data**: Can include error codes, details, and contextual information.
- **Localized messages**: Combine with the i18n service for localized error messages.

### Creating Business Exceptions

The recommended way to throw errors from custom operations is by using the `ExceptionUtils` helper class, which simplifies the creation of standard platform exceptions.

**Pattern 1: Simple Business Exception**
Used for straightforward business rule violations.

```java
@Component(service = PerformOperation.class)
public class PerformOperationCustomImplementation implements PerformOperation {
    @Reference private ApplicationI18n i18n;

    @Override
    public void accept(Entity _this) throws BusinessErrorException {
        if (!_this.isReady()) {
            // Throw a modeled business error with a localized message
            throw ExceptionUtils.createBusinessErrorException(
                "ENTITY_NOT_READY",           // A machine-readable error code
                i18n.entity_not_ready_error()  // A user-friendly, localized message
            );
        }
        // ... operation logic
    }
}
```

**Pattern 2: Validation Exception for Multiple Field Errors**
Used when an input DTO fails validation on multiple fields. This collects all errors and returns them in a single response.

```java
@Component(service = ValidateEntity.class)
public class ValidateEntityCustomImplementation implements ValidateEntity {
    @Reference private ApplicationI18n i18n;

    @Override
    public void accept(Entity _this) {
        List<ValidationResult> validationResults = new ArrayList<>();

        if (_this.getTitle() == null || _this.getTitle().isEmpty()) {
            validationResults.add(ExceptionUtils.createValidationResult(
                EntityAttribute.TITLE.getName(), i18n.field_is_required()
            ));
        }

        if (_this.getDetails() != null && _this.getDetails().length() > 500) {
            validationResults.add(ExceptionUtils.createValidationResult(
                EntityAttribute.DETAILS.getName(), i18n.field_exceeds_maximum_length(500)
            ));
        }

        // Throw a single exception containing all validation errors
        if (!validationResults.isEmpty()) {
            throw ExceptionUtils.createValidationException(validationResults);
        }
    }
}
```

**Pattern 3: Generic Business Exception with Title and Detail**
Used for general operational failures where a title and a more detailed message are helpful.

```java
@Component(service = TogglePrimary.class)
public class TogglePrimaryCustomImplementation implements TogglePrimary {
    @Reference private ApplicationI18n i18n;
    // ... other DAOs

    @Override
    public void accept(ChildEntity _this) throws GenericOperationErrorException {
        // ... logic to check state
        if (isPrimary) {
            throw ExceptionUtils.createBusinessException(
                i18n.primary_change_failed(),      // Error title
                i18n.primary_entity_is_required()  // Error details
            );
        }
        // ... operation logic
    }
}
```

### Exception Types

| Exception Type | When to Use | HTTP Status | Client-Side Effect |
| :--- | :--- | :--- | :--- |
| `ValidationException` | For input validation failures on specific fields, **and** for business-semantic failures carried via machine-code prefixes (see note below). | 400 | Field-level error messages are displayed. |
| `BusinessErrorException` | For modeled, type-safe business rule violations. | 422 | Can be caught by type for specific error handling. |
| `GenericOperationErrorException` | For general business rule violations not tied to a specific field. | 500 | A general error notification is shown to the user. |
| `NotFoundException` | When a required entity cannot be found in the database. | 404 | Standard "Not Found" handling. |
| `AccessDeniedException` | For permission or authorization failures. | 403 | Standard "Forbidden" handling. |

> [!IMPORTANT]
> **There is no `BusinessException` class in `runtime-core`.**
>
> Older docs and code comments sometimes refer to a `BusinessException` type — it does not exist as a Java class in the current JUDO runtime. The concrete type for generic business failures is **`GenericOperationErrorException`**, and `ExceptionUtils.createBusinessException(...)` is the factory that produces it.
>
> **Convention for business-semantic failures**: the idiomatic pattern is to throw a `ValidationException` whose `ValidationResult` entries carry a **machine-code prefix** in the code/message (e.g. `ERR_USER_INACTIVE`, `ERR_QUOTA_EXCEEDED`). Clients branch on the prefix; the 400 status and field-level rendering are a feature, not a bug, because the business cause is tied to an input or an addressable path.

> [!WARNING]
> **`NotFoundException` and `AccessDeniedException` require a `ValidationResult` constructor.**
>
> The current runtime-core does **not** provide a no-arg constructor on these exceptions. You must instantiate them with a `ValidationResult` (or collection thereof):
>
> ```java
> throw new NotFoundException(ExceptionUtils.createValidationResult(
>     "id", i18n.entity_not_found()));
>
> throw new AccessDeniedException(ExceptionUtils.createValidationResult(
>     "principal", i18n.access_denied()));
> ```
>
> `new NotFoundException()` / `new AccessDeniedException()` will not compile. Prefer `ExceptionUtils.createValidationResult(field, message)` so the message is localizable and the field path renders correctly client-side.

---

## Best Practices

### Error Handling Best Practices

✅ **DO:**
- Validate all inputs at the beginning of an operation.
- Collect all possible validation errors and throw them in a single `ValidationException`.
- Provide clear, actionable, and localized error messages.
- Use the most specific exception type appropriate for the error.
- Log errors with sufficient context for debugging.

❌ **DON'T:**
- Use exceptions for normal control flow.
- Expose internal implementation details or stack traces in user-facing messages.
- Return `null` to indicate an error; throw an exception instead.
- Catch and ignore exceptions silently.
- Throw generic exceptions like `RuntimeException` without a specific cause.

### Validation Strategy

**Collect All Errors Approach (Recommended):**
This approach provides the best user experience by showing the user all validation issues at once.

```java
// Collect all validation errors
List<ValidationResult> errors = new ArrayList<>();

if (entity.getTitle() == null) {
    errors.add(ExceptionUtils.createValidationResult("title", i18n.field_is_required()));
}
if (entity.getAmount() < 0) {
    errors.add(ExceptionUtils.createValidationResult("amount", i18n.value_must_be_positive()));
}

// Throw all errors at once if any were found
if (!errors.isEmpty()) {
    throw ExceptionUtils.createValidationException(errors);
}
```

---

## Testing Error Handling

You can use standard JUnit assertions like `assertThrows` to verify that your custom operations throw the correct exceptions under specific conditions.

```java
@ExtendWith(MockitoExtension.class)
class TogglePrimaryCustomImplementationTest {
    @Mock private EntityContactDao entityContactDao;
    @Mock private ParentEntityDao parentEntityDao;
    @Mock private ApplicationI18n i18n;
    @InjectMocks private TogglePrimaryCustomImplementation implementation;

    @Test
    void testTogglePrimary_throwsExceptionWhenAlreadyPrimary() {
        // Arrange
        EntityContact contact = new EntityContact();
        contact.setIdentifier(UUID.randomUUID());

        when(entityContactDao.getById(any())).thenReturn(Optional.of(contact));
        when(parentEntityDao.queryPrimaryContact(any())).thenReturn(Optional.of(contact));
        when(i18n.primary_contact_change_failed()).thenReturn("Primary Change Failed");
        when(i18n.primary_contact_is_required()).thenReturn("Primary contact is required");

        // Act & Assert
        GenericOperationErrorException exception = assertThrows(
            GenericOperationErrorException.class,
            () -> implementation.accept(contact)
        );

        assertThat(exception.getMessage()).contains("Primary contact is required");
    }
}
```

---

## API Error Code Reference

This section provides a reference for the standard error codes returned by the JUDO platform's REST API.

### Error Response Structure

A failed request will typically return a JSON response body containing:
-   `code`: The specific error code from the tables below.
-   `location`: For validation errors, a path expression pointing to the exact attribute or relation that failed.
-   `details`: A map of additional parameters providing context about the error.

### HTTP 400 - Bad Request
Indicates a client-side error, usually due to invalid input that violates model constraints.

| Error Code | Description |
| :--- | :--- |
| `MISSING_REQUIRED_ATTRIBUTE` | A mandatory attribute was not provided. |
| `MAX_LENGTH_VALIDATION_FAILED`| A string value exceeds the `maxLength` defined in the model. |
| `PATTERN_VALIDATION_FAILED` | A string value does not match the `pattern` (RegExp) defined in the model. |
| `ENTITY_NOT_FOUND` | An entity referenced by an ID in the request could not be found. |

### HTTP 401 - Unauthorized
Indicates that the request requires authentication, but credentials were not provided or were invalid.

| Error Code | Description |
| :--- | :--- |
| `AUTHENTICATION_REQUIRED` | The request is missing the OAuth 2.0 `Bearer` token. |
| `ACCESS_TOKEN_EXPIRED` | The provided JWT access token has expired. |

### HTTP 403 - Forbidden
Indicates that the user is authenticated, but they do not have permission to perform the requested action.

| Error Code | Description |
| :--- | :--- |
| `ACCESS_DENIED` | The requested operation is not exposed to the current `Actor`. |
| `PERMISSION_DENIED` | The user is missing the required CRUD privileges on the `Access` link. |

### HTTP 404 - Not Found
Indicates that the specific resource instance could not be found.

| Error Code | Description |
| :--- | :--- |
| `BOUND_OPERATION_INSTANCE_NOT_FOUND`| The instance referenced by the signed ID for an `INSTANCE` operation could not be found. |

### HTTP 422 - Unprocessable Entity
Reserved for custom, modeled **Business Faults**. The `X-Fault` header will contain the qualified name of the fault, and the body will contain the structured fault data as defined in the model.

### HTTP 500 - Internal Server Error
An unexpected server-side error occurred, indicating a bug or misconfiguration.

---

## See Also
- [Internationalization Guide](internationalization-guide.md) - For localizing error messages.
- [Custom Operations](custom-operations.md) - For implementing operations that may throw these errors.
- [Patterns and Best Practices](patterns-and-best-practices.md) - For other common backend patterns.
