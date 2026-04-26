# Generator Reserved Names

**[◄ Back to Index](../SKILL.md)**

Structural flags on a `TransferObjectType` (`createable`, …) cause the generators to emit methods with fixed names. A relation or attribute whose `name` collides with one of these methods surfaces only at `tsgo` / `vite build` time as `error TS2393: Duplicate function implementation`, several transformation steps away from the root cause.

## Reserved Member Names

| Flag on TO | Emitted method | Reserved member name |
|---|---|---|
| `createable="true"` | `getTemplate()` — returns a blank prototype for Create forms (endpoint `/services/<TO>/~template`). | **`template`** |

**Resolution:** rename the member and keep `binding` unchanged so the underlying entity relation is not disturbed (e.g. `name="template"` → `name="letterTemplate"`).

**Detection (before build):**

```bash
grep -nE 'createable="true"' model/*.model   # TOs at risk
grep -nE 'name="template"'   model/*.model   # candidate collisions
```

Any TO that appears in both results needs a rename.

## Related

- [Structure package](./structure.md) — `createable`/`updateable`/`deleteable` flags on `TransferObjectType`.
