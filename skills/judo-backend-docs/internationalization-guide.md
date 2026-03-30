# Backend Internationalization (i18n) Guide

## Overview

This guide explains how to use JUDO's backend internationalization (i18n) features to provide localized messages for validation, business logic, and error handling.

The i18n service allows you to inject a type-safe interface into your custom operations, which resolves translated message strings at runtime based on the user's language preferences.

**See also:**
- [Error Handling Guide](error-handling-guide.md) - For details on how to throw exceptions.
- [Custom Operations](custom-operations.md) - For examples of using i18n in business logic.

---

## Internationalization (i18n)

### I18n Service Interface

The i18n service provides translated message strings that can be injected into your custom operations.

**Key concepts:**
- **Generated i18n interface** - Auto-generated from your model's translation keys
- **OSGi service** - Injected via `@Reference`
- **Type-safe methods** - Each translation key becomes a method
- **Runtime language resolution** - Automatically uses user's preferred language

### Creating I18n Interface

The i18n interface is typically defined in your common utilities and implements translation key methods.

**Example interface structure:**
```java
package [your.package].utils.services.i18n;

public interface ApplicationI18n {
    // Validation messages
    String field_is_required();
    String invalid_format();
    String value_must_be_unique();

    // Business error messages
    String operation_failed();
    String entity_not_found();
    String insufficient_permissions();

    // Field-specific messages
    String primary_entity_is_required();
    String primary_entity_cannot_be_inactive();
    String status_change_failed();

    // Validation with parameters
    String value_must_be_between(int min, int max);
    String field_exceeds_maximum_length(int maxLength);
}
```

### Using I18n in Custom Operations

**Pattern 1: Injecting I18n Service**

```java
@Component(immediate = true, service = ToggleStatus.class)
public class ToggleStatusCustomImplementation implements ToggleStatus {

    @Reference EntityDao entityDao;
    @Reference RelatedEntityDao relatedEntityDao;
    @Reference ApplicationI18n i18n;  // Inject i18n service

    @Override
    public void accept(Entity _this) throws GenericOperationErrorException {
        Entity entity = entityDao.getById(_this.identifier()).orElseThrow();

        if (!entity.isActive()) {
            // Use i18n for error message
            throw ExceptionUtils.createBusinessException(
                i18n.status_change_failed(),
                i18n.entity_must_be_active()
            );
        }

        entity.setStatus(!entity.getStatus());
        entityDao.update(entity);
    }
}
```

**Pattern 2: Validation with I18n Messages**

```java
@Component(immediate = true, service = ValidateEntity.class)
public class ValidateEntityCustomImplementation implements ValidateEntity {

    @Reference EntityDao entityDao;
    @Reference ApplicationI18n i18n;

    @Override
    public void accept(Entity _this) {
        List<ValidationResult> validationResults = new ArrayList<>();

        // Validate required fields
        if (_this.getTitle() == null || _this.getTitle().isEmpty()) {
            validationResults.add(
                ExceptionUtils.createValidationResult(
                    EntityAttribute.TITLE.getName(),
                    i18n.field_is_required()
                )
            );
        }

        // Validate field length
        if (_this.getDetails() != null && _this.getDetails().length() > 500) {
            validationResults.add(
                ExceptionUtils.createValidationResult(
                    EntityAttribute.DETAILS.getName(),
                    i18n.field_exceeds_maximum_length(500)
                )
            );
        }

        // Validate unique constraint
        boolean isDuplicate = entityDao.query()
            .filterByTitle(StringFilter.equalTo(_this.getTitle()))
            .selectOne()
            .isPresent();

        if (isDuplicate) {
            validationResults.add(
                ExceptionUtils.createValidationResult(
                    EntityAttribute.TITLE.getName(),
                    i18n.value_must_be_unique()
                )
            );
        }

        // Throw validation exception if any errors
        if (!validationResults.isEmpty()) {
            throw ExceptionUtils.createValidationException(validationResults);
        }
    }
}
```

**Pattern 3: Complex Validation with Multiple Messages**

```java
@Component(immediate = true, service = CreateExternalData.class)
public class CreateExternalDataCustomImplementation implements CreateExternalData {

    @Reference ExternalDataDao externalDataDao;
    @Reference ConfigurationDao configurationDao;
    @Reference ApplicationI18n i18n;

    @Override
    public void accept(Entity _this, CreateInput input) {
        String dateAttributeName = ExternalDataAttribute.DATE_FIELD.getName();
        List<ValidationResult> validationResults = new ArrayList<>();

        // Validate date not in future
        LocalDate dateField = input.getDateField();
        LocalDate today = LocalDate.now();
        if (today.isBefore(dateField)) {
            validationResults.add(
                ExceptionUtils.createValidationResult(
                    dateAttributeName,
                    i18n.future_date_not_allowed()
                )
            );
        } else {
            // Validate no existing record for date
            Optional<ExternalData> existingRecord = externalDataDao.query()
                .filterByDateField(DateFilter.equalTo(dateField))
                .filterByRecordingMethod(EnumerationFilter.equalTo(RecordingMethod.AUTO))
                .selectOne();

            if (existingRecord.isPresent()) {
                validationResults.add(
                    ExceptionUtils.createValidationResult(
                        dateAttributeName,
                        i18n.record_already_exists_for_date()
                    )
                );
            }
        }

        // Validate source and target are different
        String sourceRefName = ExternalDataReference.SOURCE.getName();
        String targetRefName = ExternalDataReference.TARGET.getName();
        if (input.getSource().identifier().equals(input.getTarget().identifier())) {
            validationResults.addAll(List.of(
                ExceptionUtils.createValidationResult(sourceRefName, i18n.source_and_target_must_differ()),
                ExceptionUtils.createValidationResult(targetRefName, i18n.source_and_target_must_differ())
            ));
        }

        // Validate numeric field
        String numericFieldName = ExternalDataAttribute.AMOUNT.getName();
        if (!NumberUtils.isPositiveNumber(input.getAmount()) || input.getAmount().compareTo(BigDecimal.ONE) < 0) {
            validationResults.add(
                ExceptionUtils.createValidationResult(
                    numericFieldName,
                    i18n.value_must_be_positive_number()
                )
            );
        }

        // Throw all validation errors at once
        if (!validationResults.isEmpty()) {
            throw ExceptionUtils.createValidationException(validationResults);
        }

        // Create entity if validation passed
        externalDataDao.create(
            ExternalDataForCreate.builder()
                .withDateField(input.getDateField())
                .withSource(input.getSource())
                .withTarget(input.getTarget())
                .withAmount(input.getAmount())
                .withRecordingMethod(RecordingMethod.MANUAL)
                .build()
        );
    }
}
```

### I18n Message Organization

**Recommended message categories:**

```java
public interface ApplicationI18n {
    // Generic validation messages
    String field_is_required();
    String invalid_email_format();
    String invalid_phone_format();
    String invalid_url_format();
    String value_must_be_unique();
    String value_out_of_range();

    // Entity-specific validation
    String primary_entity_is_required();
    String primary_entity_cannot_be_inactive();
    String default_entity_is_required();
    String minimum_required_entities_not_met();

    // Date/time validation
    String future_date_not_allowed();
    String past_date_not_allowed();
    String date_range_invalid();
    String start_date_must_be_before_end_date();

    // Business rule violations
    String operation_not_permitted();
    String insufficient_permissions();
    String entity_in_invalid_state();
    String dependency_constraint_violated();

    // System errors
    String operation_failed();
    String external_service_unavailable();
    String database_error();
    String unexpected_error();

    // Success messages
    String operation_completed_successfully();
    String entity_created_successfully();
    String entity_updated_successfully();
    String entity_deleted_successfully();
}
```

---



## I18n Best Practices

✅ **DO:**
- Use descriptive, user-friendly message keys (e.g., `field_is_required` instead of `ERR_001`).
- Keep messages generic and reusable across the application.
- Use parameters for dynamic values (e.g., `field_exceeds_maximum_length(int maxLength)`).
- Organize messages by category in your `ApplicationI18n` interface.

❌ **DON'T:**
- Hardcode English strings directly in your Java code.
- Include technical details (like stack traces) in user-facing messages.
- Duplicate message definitions; reuse generic messages where possible.

---

## Translation File Setup

Translation files are typically java property files in your resources:

**Example: messages_en.properties**
```properties
field_is_required:This field is required
invalid_email_format:Please enter a valid email address
primary_entity_is_required:A primary item must be selected
primary_entity_cannot_be_inactive:The primary item cannot be inactive
status_change_failed:Status Change Failed
entity_not_ready_error:The item is not ready for this operation
function_under_development:This feature is currently under development
```

**Example: messages_hu.properties**
```properties
field_is_required:Ez a mező kötelező
invalid_email_format:Kérem adjon meg érvényes email címet
primary_entity_is_required:Elsődleges elem kiválasztása kötelező
primary_entity_cannot_be_inactive:Az elsődleges elem nem lehet inaktív
status_change_failed:Státusz Változtatás Sikertelen
entity_not_ready_error:Az elem nem áll készen erre a műveletre
function_under_development:Ez a funkció jelenleg fejlesztés alatt áll
```

---

## See Also

- [Error Handling Guide](error-handling-guide.md) - For details on how to throw exceptions using these i18n messages.
- Frontend i18n (see `judo-frontend-docs` skill) - For how these backend messages are consumed by the frontend.
- [Custom Operations](custom-operations.md) - For examples of using i18n in business logic.
