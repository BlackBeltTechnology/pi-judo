# Internationalization Guide

JUDO supports internationalization (i18n) through message bundles, locale-aware formatting, and translatable model elements.

## Message Bundles

Error messages and user-facing strings are externalized in message bundle files:

```
src/main/resources/messages/
├── messages.properties          # Default (fallback) messages
├── messages_en.properties       # English
├── messages_de.properties       # German
└── messages_hu.properties       # Hungarian
```

Bundle format:

```properties
# messages.properties
error.order.limit.exceeded=Order limit exceeded: maximum {0} orders per day
error.insufficient.stock=Insufficient stock for product {0}: requested {1}, available {2}
validation.email.invalid=Invalid email format
```

## Using Messages in Custom Operations

```java
@Inject
private MessageResolver messageResolver;

public void validate(OrderTO order) {
    if (exceedsLimit(order)) {
        String msg = messageResolver.resolve(
            "error.order.limit.exceeded",
            context.getLocale(),
            MAX_DAILY_ORDERS
        );
        throw new BusinessException("ORDER_LIMIT_EXCEEDED", msg);
    }
}
```

## Locale Resolution

The current locale is determined from:

1. The `Accept-Language` HTTP header
2. The authenticated principal's preferred locale
3. The application default locale

Access the current locale in custom operations:

```java
Locale locale = context.getLocale();
```

## Number and Date Formatting

Use locale-aware formatters for user-facing output:

```java
BigDecimal amount = order.getTotalAmount();
String formatted = NumberFormat.getCurrencyInstance(locale).format(amount);

LocalDate date = order.getCreatedDate();
String formattedDate = date.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale));
```

## Translatable Model Elements

Model-level labels and descriptions can be translated. The framework provides these translations through the metadata API, which the frontend uses for rendering labels.

## Best Practices

- Always externalize user-facing strings in message bundles
- Use parameterized messages instead of string concatenation
- Provide a complete default bundle as fallback
- Keep message keys consistent and hierarchical
- Test with multiple locales to catch formatting issues
