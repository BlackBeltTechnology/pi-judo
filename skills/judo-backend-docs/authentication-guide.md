# Authentication Guide

## Overview

This guide provides a comprehensive overview of `AuthenticationInterceptor` in the JUDO framework. Authentication interceptors are a powerful mechanism for handling cross-cutting concerns related to user authentication, such as just-in-time user provisioning from an external identity provider like Keycloak.

## Table of Contents

- [AuthenticationInterceptor Interface](#authenticationinterceptor-interface)
- [The `#_principal` Operation](#the-_principal-operation)
- [Token Attribute Extraction](#token-attribute-extraction)
- [Example: Just-in-Time User Provisioning](#example-just-in-time-user-provisioning)
- [Testing and Best Practices](#testing-and-best-practices)

---

## AuthenticationInterceptor Interface

The core of this pattern is the `AuthenticationInterceptor` interface. Your custom interceptor will implement this interface to hook into the authentication lifecycle.

```java
public interface AuthenticationInterceptor {
    String getName();
    boolean isSuitableForOperation(EOperation operation, String claim, String realm, String client, Map<String, Object> attributes);
    void authenticate(String operationFQName, Map<String, Object> exchange, String claim, String realm, String client, Map<String, Object> attributes);
}
```

## The `#_principal` Operation

The `#_principal` operation is a special, framework-level operation that is automatically invoked after a user successfully authenticates with an external identity provider. This is the primary point of interception for just-in-time provisioning.

**Key Characteristics:**
- **Triggered Automatically**: Called by the JUDO framework after a successful external login.
- **Provides Token Claims**: The `attributes` map in the `authenticate` method contains all the claims from the user's JWT token.
- **Ideal for User Creation**: It's the perfect place to check if a user exists in your local database and create them if they don't.

## Token Attribute Extraction

When a user authenticates, their JWT token contains claims that are passed to the interceptor as the `attributes` map. You can extract standard and custom claims to populate your local user entity.

**Standard Keycloak Token Attributes:**
- `email` - User's email address
- `preferred_username` - Username from the identity provider
- `given_name` - First name
- `family_name` - Last name
- `sub` - The subject identifier (a unique user ID from the IdP)

---

## Example: Just-in-Time User Provisioning

This is the most common use case for an `AuthenticationInterceptor`. The following example demonstrates how to create a user in the local application database on their first login.

```java
@Component(property = {"judo.model.name=MyApp"})
public class AutoUserCreationAuthenticationInterceptor implements AuthenticationInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AutoUserCreationAuthenticationInterceptor.class);
    private final Object createLock = new Object();

    @Reference
    private UserDao userDao;

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public boolean isSuitableForOperation(EOperation operation, String claim, String realm, String client, Map<String, Object> attributes) {
        // This interceptor is applicable to all authentication operations.
        return true;
    }

    @Override
    public void authenticate(String operationFQName, Map<String, Object> exchange, String claim, String realm, String client, Map<String, Object> attributes) {
        // We only care about the #_principal operation.
        if (!operationFQName.endsWith("#_principal")) {
            return;
        }

        // Extract user information from the token claims.
        String email = (String) attributes.get("email");
        if (email == null || email.isBlank()) {
            log.warn("Cannot auto-provision user: email not found in token.");
            return;
        }

        // Use a synchronized block to prevent race conditions during user creation.
        synchronized (createLock) {
            Optional<User> existingUser = userDao.query()
                    .filterByEmail(StringFilter.equalTo(email))
                    .selectOne();

            if (existingUser.isPresent()) {
                return; // User already exists, do nothing.
            }

            log.info("Auto-provisioning new user: email={}", email);
            try {
                String username = (String) attributes.getOrDefault("preferred_username", email.split("@")[0]);
                
                UserForCreate newUser = UserForCreate.builder()
                        .withUserName(ensureUniqueUsername(username))
                        .withEmail(email)
                        .withIsActive(true)
                        .build();

                userDao.create(newUser);
                log.info("User auto-provisioned successfully: {}", email);

            } catch (Exception e) {
                log.error("Failed to auto-provision user: {}", email, e);
                // IMPORTANT: Do not rethrow the exception. This would block the user from logging in.
            }
        }
    }

    private String ensureUniqueUsername(String baseUsername) {
        String username = baseUsername;
        int counter = 1;
        while (userDao.query().filterByUserName(StringFilter.equalTo(username)).count() > 0) {
            username = baseUsername + counter++;
        }
        return username;
    }
}
```

### Key Patterns in the Example

- **`@Component(property = {"judo.model.name=..."})`**: This property is **required** to bind the interceptor to your specific JUDO model.
- **Filtering for `#_principal`**: The interceptor immediately returns if the operation is not the principal creation hook.
- **Thread Safety**: A `synchronized` block on a dedicated lock object (`createLock`) is crucial to prevent race conditions where two concurrent login attempts could try to create the same user, resulting in a unique constraint violation.
- **Idempotency**: The check for `existingUser.isPresent()` ensures that the logic is idempotent—it can run multiple times for the same user without creating duplicate accounts.
- **Error Handling**: Exceptions during user creation are caught and logged but **not re-thrown**. This is a critical design choice to ensure that a failure in the provisioning logic does not prevent a valid user from logging in.

---

## Testing and Best Practices

### Testing Authentication Interceptors

Direct unit testing is challenging because it requires mocking the entire authentication flow. The recommended approach is **integration testing**:

1.  Deploy the application to a local Karaf instance.
2.  Configure a real identity provider like Keycloak.
3.  Log in with a new user that does not exist in the application database.
4.  Verify in the application logs and database that the user was created correctly.
5.  Log out and log back in with the same user to test for idempotency (i.e., ensure no duplicate user is created).

### Best Practices

✅ **DO:**
- Use `AuthenticationInterceptor` for just-in-time user provisioning.
- Synchronize user attributes (like name or roles) from token claims.
- Log authentication events for auditing purposes.
- Make your user creation logic thread-safe and idempotent.

❌ **DON'T:**
- Use `AuthenticationInterceptor` for complex business logic (use `OperationCallInterceptor` or custom operations instead).
- Use it for authorization decisions (this should be handled by the JUDO access control model).
- Block the authentication flow by throwing exceptions from the `authenticate` method, unless that is the intended behavior.

---

## See Also

- [Operation Call Interceptors](interceptors.md) - For intercepting standard business operations.
- [Patterns and Best Practices](patterns-and-best-practices.md) - For other common backend patterns.