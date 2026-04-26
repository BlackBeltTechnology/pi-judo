---
name: judo-integration-testing-access-and-derived
description: Integration-test patterns for Access.getterExpression and DERIVED attribute getters in JUDO models. Covers DAO-level derived projection, dispatcher-driven per-actor access scoping, and ACTOR-context-dependent derived getters.
disable-model-invocation: false
user-invocable: false
model: inherit
context: fork
agent: general-purpose
---

# Testing Access Rules and DERIVED Attributes

**[◄ Back to Integration Testing index](./SKILL.md)**

The other guides in this directory cover entity-level DAO tests and custom-operation tests. They are silent on two model-layer concerns that ship as **JQL strings** and have no compile-time check:

1.  **`Access.getterExpression`** — the per-actor row-scoping filter on every `Access` declared on an `ActorType` (e.g. `Order!filter(o | o.owner.userName == String!getVariable("ACTOR", "userName"))`).
2.  **`DERIVED` attribute `getterExpression`** on a `TransferObjectType` — values computed at projection time (e.g. an `isNotAdmin` boolean, a flattened `ownerName` string, a `permissionToFoo` flag).

Both are evaluated by the runtime, both are easy to get wrong in subtle ways, and both can ship to production undetected unless integration tests cover them. This page documents the three patterns that close the gap, using only the public APIs of `judo-dispatcher-api` and `judo-runtime-core-guice-testkit`.

## Coverage matrix

| What you want to verify | Pattern | Requires actor context? | Layer exercised |
| :--- | :--- | :--- | :--- |
| `DERIVED` getter referencing only `self.*` and other entity members (e.g. `not self.isAdmin`, `self.firstName + ' ' + self.lastName`) | **Pattern A** | No | DAO projection |
| `Access.getterExpression` (per-actor data scoping, CRUD-flag enforcement) | **Pattern B** | Yes (`JudoPrincipal` in dispatcher exchange) | Dispatcher / access point |
| `DERIVED` getter that reads `!getVariable("ACTOR", "...")` (e.g. `ownedByMe = self.owner.userName == String!getVariable("ACTOR", "userName")`) | **Pattern C** | Yes (`JudoPrincipal` in dispatcher exchange) | Dispatcher → access point → projection |

## Limitations to be aware of

*   **Plain DAO reads do not populate the variable resolver context.** A `<TO>Dao.query()` call has no `__principal` in scope, so any `DERIVED` getter that calls `!getVariable("ACTOR", …)` evaluates against an empty resolver and returns empty / wrong values. Do **not** test these via Pattern A; use Pattern C.
*   **`managed=true` first-login auto-insert is not implemented in the current runtime** (see Authentication Guide (see `judo-backend-docs` skill)). For Pattern B and Pattern C the test must `dao.create(...)` the principal row itself before calling the dispatcher with a matching `JudoPrincipal`.
*   **Only the Managed Mapped Principal actor shape exposes `ACTOR.*`** to JQL. For the *Token-only* (`claimPrincipal: true`) and *Transient principal* shapes, access getters can only reference `USER.*` / `PRINCIPAL.*`; the dispatcher exchange must carry the corresponding attributes, and there is no persisted row to seed.

---

## Pattern A — Testing pure `DERIVED` attributes via DAO

`DERIVED` attributes that depend only on `self.*` and other entity / relation members are **already projected** onto the TO returned by any generated `<TO>Dao` query. Each derived field appears on the TO API as an `Optional<T>` getter (e.g. `Optional<Boolean> getIsNotAdmin()`), with the value computed by the runtime during projection materialization. No dispatcher call is required.

### When to use

*   Boolean role-mirror flags that negate a stored attribute (`not self.isAdmin`).
*   Computed labels (`self.firstName + ' ' + self.lastName`).
*   Aggregates (`self.orders!count()`, `self.invoices!sum(i | i.amount)`).
*   Any expression whose only inputs are members of `self` or its reachable graph.

### Example

```java
package [your.package].[yourmodel].integration;

import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoRuntimeFixture;
import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoTest;
import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoTest.TransactionHandling;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class IsNotAdminDerivedTest {

    @Test
    @JudoTest(
        modelName = "northwind",
        dialect = "hsqldb",
        transaction = TransactionHandling.AUTO_ROLLBACK
    )
    void isNotAdmin_mirrors_negation_of_stored_flag(JudoRuntimeFixture fixture) {
        UserDao userDao = fixture.getInjector().getInstance(UserDao.class);

        User admin = userDao.create(UserForCreate.builder()
            .withUserName("admin1")
            .withIsAdmin(true)
            .build());
        User regular = userDao.create(UserForCreate.builder()
            .withUserName("user1")
            .withIsAdmin(false)
            .build());

        // The DERIVED `isNotAdmin` (getter: `not self.isAdmin`) is projected on the TO.
        // It is exposed as Optional<Boolean> by the generated SDK.
        assertEquals(false, admin.getIsNotAdmin().orElseThrow());
        assertEquals(true,  regular.getIsNotAdmin().orElseThrow());
    }
}
```

### What this proves

That the JQL `getterExpression` of the `DERIVED` attribute parses, transforms, and evaluates against the entity row \u2014 catching the common authoring mistakes (wrong member name, missing `not`, wrong type, missing `!any()` at the tail of a singleton-typed expression).

### What this does NOT prove

That the value is correct under an authenticated actor context. If the getter expression contains `!getVariable("ACTOR", …)` switch to **Pattern C** \u2014 the variable resolver returns empty in the bare-DAO context, masking real bugs.

---

## Pattern B \u2014 Testing `Access.getterExpression` per actor via the Dispatcher

`Access.getterExpression` is evaluated by the dispatcher when a request enters through the access point, **not** by the DAO. To exercise it from a test you go through `Dispatcher.callOperation` with a `JudoPrincipal` in the exchange.

### Setup steps

1.  Seed the principal entity row via the entity DAO (since `managed=true` auto-insert is not implemented \u2014 see Limitations above).
2.  Seed the test data the access should scope (some rows the actor should see, some it should not).
3.  Build a `JudoPrincipal` whose `attributes` map contains the keys consumed by your access getter (`userName`, `email`, etc.).
4.  Resolve the `Dispatcher` from the fixture's injector.
5.  Call the auto-generated access-point query operation, passing the principal in the exchange under `Dispatcher.PRINCIPAL_KEY`.
6.  Assert the returned collection matches the expected scoped subset.

### Finding the operation FQN

The generator produces a query operation per `Access`. The naming convention is
`<modelPackage>::<ActorName>::<AccessName>`. Confirm the exact FQN by inspecting
the generated SDK (`application/sdk/target/generated-sources/.../api/.../services/`)
or the application's OpenAPI document; do not invent it.

### Example

```java
package [your.package].[yourmodel].integration;

import hu.blackbelt.judo.dispatcher.api.Dispatcher;
import hu.blackbelt.judo.dispatcher.api.JudoPrincipal;
import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoRuntimeFixture;
import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoTest;
import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoTest.TransactionHandling;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.*;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.order.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class OrderAccessScopingTest {

    @Test
    @JudoTest(
        modelName = "northwind",
        dialect = "hsqldb",
        transaction = TransactionHandling.AUTO_ROLLBACK
    )
    void access_scopes_orders_to_owner_for_non_admin(JudoRuntimeFixture fixture) {
        UserDao userDao = fixture.getInjector().getInstance(UserDao.class);
        OrderDao orderDao = fixture.getInjector().getInstance(OrderDao.class);
        Dispatcher dispatcher = fixture.getInjector().getInstance(Dispatcher.class);

        // 1. Seed the principal row (managed=true auto-insert is NYI).
        User alice = userDao.create(UserForCreate.builder()
            .withUserName("alice").withIsAdmin(false).build());
        User bob = userDao.create(UserForCreate.builder()
            .withUserName("bob").withIsAdmin(false).build());

        // 2. Seed scoped data: 2 orders for alice, 1 for bob.
        orderDao.create(OrderForCreate.builder().withOwner(alice).withRef("A1").build());
        orderDao.create(OrderForCreate.builder().withOwner(alice).withRef("A2").build());
        orderDao.create(OrderForCreate.builder().withOwner(bob).withRef("B1").build());

        // 3. Build a JudoPrincipal matching alice. The `attributes` map MUST contain
        //    every key consumed by getVariable("ACTOR", ...) in the access getter
        //    AND in any DERIVED getters the projection will evaluate.
        JudoPrincipal alicePrincipal = JudoPrincipal.builder()
            .name("alice")
            .attributes(Map.of("userName", "alice"))
            .build();

        // 4. Build the exchange. PRINCIPAL_KEY drives both the access getter
        //    evaluation and the actor-row lookup that populates ACTOR.*.
        Map<String, Object> exchange = new HashMap<>();
        exchange.put(Dispatcher.PRINCIPAL_KEY, alicePrincipal);

        // 5. Call the auto-generated access-point query. Replace the FQN with
        //    the one your generator emits for the GenericUser actor's `orders` access.
        String operationFqn =
            "northwind::accesspoint::GenericUser::orders::__get";
        Map<String, Object> response = dispatcher.callOperation(operationFqn, exchange);

        // 6. Assert: alice sees only her own rows.
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows =
            (List<Map<String, Object>>) response.get("__output");
        assertEquals(2, rows.size(), "alice should see exactly her two orders");
        rows.forEach(r -> assertEquals("alice",
            ((Map<String, Object>) r.get("owner")).get("userName")));
    }
}
```

### What this proves

That the access getter compiles, runs, and **scopes correctly per actor**. Run the same test with an admin principal and assert the unfiltered set to cover the role-branch.

### Common failure modes this catches

*   Wrong attribute name in `getVariable("ACTOR", "...")` \u2014 returns empty results for everyone.
*   Wrong type in the typed prefix (`String!getVariable` vs `Boolean!getVariable`) \u2014 expression rejects at evaluation.
*   Forgetting `!any()` where the expression must terminate at a single instance.
*   Off-by-one membership bugs from a `!filter` predicate that doesn't match the intent.
*   `Access.upper`, `createable`, `updateable`, `deleteable` flag mismatches \u2014 the dispatcher rejects the operation with the access-point's permission semantics.

### What this does NOT prove

That the menu actually surfaces this access in the UI \u2014 that requires the paired `MenuItemAccess` and is an E2E concern. See E2E Testing Guide (see `judo-e2e-testing-docs` skill).

---

## Pattern C \u2014 Testing DERIVED getters that depend on `ACTOR.*`

When a `DERIVED` attribute's getter references `!getVariable("ACTOR", "...")`, its value is per-request \u2014 it can only be evaluated when a principal is in scope. The plain DAO path used in Pattern A returns empty because the variable resolver has nothing to resolve.

The mechanics are the same as Pattern B: build a `JudoPrincipal`, put it in the exchange under `Dispatcher.PRINCIPAL_KEY`, and call the access-point query through the dispatcher. The difference is the assertion target \u2014 you read a `DERIVED` field off the *projected TO returned by the dispatcher response*, not a row count.

### Example

```java
package [your.package].[yourmodel].integration;

import hu.blackbelt.judo.dispatcher.api.Dispatcher;
import hu.blackbelt.judo.dispatcher.api.JudoPrincipal;
import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoRuntimeFixture;
import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoTest;
import hu.blackbelt.judo.runtime.core.guice.testkit.fixture.JudoTest.TransactionHandling;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.order.*;
import [your.package].[yourmodel].api.[yourmodel]._default_transferobjecttypes.entity.user.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class OwnedByMeDerivedTest {

    @Test
    @JudoTest(
        modelName = "northwind",
        dialect = "hsqldb",
        transaction = TransactionHandling.AUTO_ROLLBACK
    )
    void ownedByMe_is_true_only_for_principal_owned_rows(JudoRuntimeFixture fixture) {
        UserDao userDao = fixture.getInjector().getInstance(UserDao.class);
        OrderDao orderDao = fixture.getInjector().getInstance(OrderDao.class);
        Dispatcher dispatcher = fixture.getInjector().getInstance(Dispatcher.class);

        // Both users are admins so the access getter returns ALL rows;
        // we want to test the per-row DERIVED `ownedByMe` flag, not access scoping.
        User alice = userDao.create(UserForCreate.builder()
            .withUserName("alice").withIsAdmin(true).build());
        User bob = userDao.create(UserForCreate.builder()
            .withUserName("bob").withIsAdmin(true).build());

        orderDao.create(OrderForCreate.builder().withOwner(alice).withRef("A1").build());
        orderDao.create(OrderForCreate.builder().withOwner(bob).withRef("B1").build());

        JudoPrincipal alicePrincipal = JudoPrincipal.builder()
            .name("alice")
            .attributes(Map.of("userName", "alice"))
            .build();
        Map<String, Object> exchange = new HashMap<>();
        exchange.put(Dispatcher.PRINCIPAL_KEY, alicePrincipal);

        Map<String, Object> response = dispatcher.callOperation(
            "northwind::accesspoint::GenericUser::orders::__get",
            exchange);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows =
            (List<Map<String, Object>>) response.get("__output");

        // The DERIVED `ownedByMe` getter:
        //   self.owner.userName == String!getVariable("ACTOR", "userName")
        // resolves true only for alice's row, even though both rows are visible.
        Map<String, Boolean> byRef = new HashMap<>();
        rows.forEach(r -> byRef.put(
            (String) r.get("ref"),
            (Boolean) r.get("ownedByMe")));

        assertEquals(Boolean.TRUE,  byRef.get("A1"));
        assertEquals(Boolean.FALSE, byRef.get("B1"));
    }
}
```

### Counter-example: why a DAO test would silently pass

If you tried to assert `ownedByMe` via `orderDao.query().selectList()`, every row would come back with `ownedByMe = empty Optional` (or `false`, depending on coercion) regardless of the data, because there is no `__principal` in scope to populate `getVariable("ACTOR", "userName")`. The DAO test would either always fail or always trivially "pass" \u2014 neither catches the real bug. **Always route ACTOR-dependent derived getters through the dispatcher.**

---

## Cross-references

*   [Mocking VariableResolver for custom operations](./advanced-patterns.md#pattern-mocking-variableresolver-for-authentication) \u2014 the analogous pattern for *custom Java code* that calls `VariableResolver.resolve("ACTOR", …)` directly. Use that helper when the SUT is a custom operation implementation; use Patterns B and C here when the SUT is the JQL evaluation pipeline itself.
*   Role Flags on the Principal Entity (see `judo-model-docs` skill) \u2014 every model authored from that pattern should ship with the corresponding Pattern A (for the `isNotAdmin` mirror) and Pattern B (for the role-scoped access getter) tests.
*   Three actor shapes (see `judo-model-docs` skill) \u2014 determines which of `USER` / `PRINCIPAL` / `ACTOR` is populated, and therefore which test patterns apply.
