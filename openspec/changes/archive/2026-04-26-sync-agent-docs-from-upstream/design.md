## Context

`pi-judo/skills/judo-*-docs/` hold a stale snapshot of upstream
`judo-esm-fullstack-project-template/.../agent-docs/`. The upstream is
authored as Handlebars templates (`*.md.hbs`) and uses a small set of
project-specific helpers:

| Helper / variable | Purpose | Args |
|---|---|---|
| `{{{docLink target display scope}}}` | Cross-doc link with anchors | `target`: relative path from `agent-docs/<scope>/` (anchors allowed); `display`: link text; `scope`: top-level dir of the *current* file |
| `{{{localHubLink display scope}}}` | Link back to a hub README | `display`: link text; `scope`: hub identifier (top-level dir or sub-hub like `frontend-hooks`) |
| `{{ lowerCase model.name }}` | Lowercase application name | (helper + variable) |
| `{{ model.name }}` | Application name as-is | (variable) |
| `{{ projectPostfix }}` | Maven artifact postfix (e.g. `-app`, often empty) | (variable) |

All upstream files are valid Handlebars: JSX object literals inside
code fences are escaped as `\{{ ... }}` so the parser leaves them alone
(verified in `frontend/theming.md.hbs`).

The pi-judo project hosts a *single* "northwind" exemplar render of
these docs. There is no other project to sync to right now.

Two upstream files already carry skill-style YAML frontmatter
(`integration-testing/access-and-derived-testing.md.hbs`), suggesting
upstream is moving toward intent-tagged sub-skills. Most files do not.

## Goals / Non-Goals

**Goals:**
- One command (`npm run sync:agent-docs`) refreshes all
  `skills/judo-*-docs/` content from upstream `agent-docs/`.
- Helper resolution faithful enough that no manual fix-up is required
  after a sync, on the current upstream snapshot.
- Manifest-driven mapping: adding a new skill or sub-skill is a
  config edit, not a code edit.
- The script is a *renderer*, not a *merger*: it overwrites target
  files. Source of truth = upstream + pi-judo manifest.
- Re-running the script is idempotent (byte-stable output for an
  unchanged upstream).

**Non-Goals:**
- Generalizing to non-pi-judo projects (out of scope; design leaves
  the door open via manifest, but does not implement multi-project).
- Syncing `agent-docs/domain/*.py|*.sh` scripts — they are project
  runtime resources, not skill knowledge. Carved out.
- Updating `agents/*.md` to reference new skill pages — separate
  change.
- Auto-detecting upstream changes / scheduled cron sync — invoked
  manually, by an operator or CI hook.
- Round-tripping pi-judo → upstream. One-way sync only.

## Decisions

### D1. Renderer = real Handlebars (npm `handlebars` package)

**Choice.** Use `handlebars@^4` directly; register `docLink`,
`localHubLink`, and `lowerCase` as helpers; render with a context
object `{ model: { name: "northwind" }, projectPostfix: "" }`.

**Why not regex / sed.**
- JSX literals inside code fences (`\{{ color: '#1976d2' }}`) are
  intentionally escaped. Real HB unescapes them; regex won't.
- `docLink` arguments include anchors and need exact string parsing,
  not template-shaped patterns.
- Future helpers added upstream cost a one-line `registerHelper`,
  not a regex rewrite.

**Why not a custom mini-parser.**
- Handlebars is ~100KB and zero-config for our needs. Building a
  parser is a maintenance liability for a one-project tool.

### D2. Path / scope mapping lives in `skills-manifest.yaml`

**Shape:**

```yaml
# skills-manifest.yaml — authoritative mapping between agent-docs
# directories and pi-judo skill folders.

upstream:
  root: ../judo-ng/template/judo-esm-fullstack-project-template/judo-esm-fullstack-project-template-root/src/main/resources/agent-docs

# Per-scope mapping. The `scope` is the top-level dir under agent-docs.
# `skill` is the destination folder under skills/.
# `frontmatter` is what to emit at the top of <skill>/SKILL.md when the
# upstream README.md.hbs is rendered.
scopes:
  backend:
    skill: judo-backend-docs
    frontmatter:
      name: judo-backend-docs
      description: Backend development guide for JUDO. Covers custom operations, interceptors, data access, authentication, testing.
      disable-model-invocation: false
      user-invocable: false
      model: inherit
      context: fork
      agent: general-purpose

  integration-testing:
    skill: judo-integration-testing-docs
    frontmatter: { ... }

  # ... etc

# Sub-hubs: nested READMEs that produce nested SKILL.md files.
# When localHubLink "scope" = "frontend-hooks", that resolves here.
sub-hubs:
  frontend-hooks:
    upstream-path: frontend/hooks
    skill-path: judo-frontend-docs/hooks
    hub-file: hooks/SKILL.md
    frontmatter: { ... }
  frontend-esm-to-ui:
    upstream-path: frontend/esm-to-ui-mappings
    skill-path: judo-frontend-docs/esm-to-ui-mappings
    hub-file: esm-to-ui-mappings/SKILL.md
    frontmatter: { ... }
  esm-metamodel:
    upstream-path: model/esm_metamodel
    skill-path: judo-model-docs/esm_metamodel
    hub-file: esm_metamodel/SKILL.md
    frontmatter: { ... }

# Files in upstream that should NOT be synced (e.g. domain/*.py).
ignore:
  - domain/*.py.hbs
  - domain/*.sh.hbs
  - README.md.hbs   # top-level — pi-judo has no equivalent location

# Files that already ship skill frontmatter upstream — render them
# as-is (script must NOT prepend a manifest-derived frontmatter).
preserve-upstream-frontmatter:
  - integration-testing/access-and-derived-testing.md.hbs

# Render context substituted into HB templates.
context:
  model:
    name: northwind
  projectPostfix: ""
```

**Why a manifest, not hard-coded.**
- Six new sub-hub files need their frontmatter from somewhere. Hard
  coding inside the script means every "new sub-skill" upstream
  becomes a code change.
- Future generalization (different demo project name, different
  skill naming convention) is a manifest edit.
- The manifest doubles as the spec of pi-judo's skill surface — easy
  to read, easy to review.

### D3. Helper resolution rules

**`docLink target display scope`:**

```
Resolved path = normalize(agent-docs/<scope>/<target>)
              = upstream-relative path with anchor

Find which scope/sub-hub the resolved path lives in:
  • Same skill as the source file → relative MD link
        [<display>](./<rel-within-skill>.md[#anchor])

  • Different skill                → annotation form
        <display> (see `<skill-name>` skill)

  • README.md / SKILL.md target    → link to SKILL.md, not README.md
        (e.g. ../backend/README.md → judo-backend-docs/SKILL.md)
```

Edge cases:
- Anchor on `README.md` cross-skill links: drop the anchor in the
  annotation form (no good way to express it textually). Add a code
  comment in the script noting the loss.
- `localHubLink display scope` = `docLink "./README.md" display scope`
  for purposes of resolution — emits a same-skill or cross-skill link
  to the hub's `SKILL.md`.

**`lowerCase` helper:** `(s) => String(s).toLowerCase()`.

**Variable substitution:** `model.name` and `projectPostfix` come from
manifest `context`.

### D4. README.md.hbs → SKILL.md (frontmatter source)

The renderer renders **every file** (README and non-README) in full
through Handlebars, then determines how to emit the frontmatter:

**Case A — upstream file begins with `---\n` (has built-in frontmatter):**
The frontmatter passes through Handlebars unchanged (it contains no
`{{ }}` expressions) and leads the output. This covers most scope
READMEs (`backend`, `frontend`, `integration-testing`, …) and the
specially-tagged `access-and-derived-testing.md.hbs`.

**Case B — upstream README does NOT begin with `---\n` (no built-in
frontmatter):**
The renderer checks the manifest for a `frontmatter:` block on the
matching `sub-hubs.<id>` (or `scopes.<name>`) entry. If found, it
serialises that block as YAML and prepends it. This covers
`model/esm_metamodel/README.md.hbs` and
`frontend/esm-to-ui-mappings/README.md.hbs`, which have no upstream
frontmatter and need manifest-supplied metadata so the resulting
SKILL.md files are properly configured as pi-judo skills.

**No `preserve-upstream-frontmatter:` list in manifest.** The
auto-detection by leading `---\n` is simpler and handles all current
cases without an explicit inclusion list.

### D5. Idempotency and validation

After a render run, the script:

- Compares output against existing files in pi-judo (string equality).
- Reports new / changed / removed files.
- Optionally fails on **dangling** `docLink` paths (target file not
  found in upstream tree). This catches upstream renames early.

Output stability:
- All `Map`/`Set` iteration is sorted.
- Trailing newline normalized to single `\n`.
- No timestamps embedded.

### D6. Where new pages land (resolves proposal-listed open questions)

| Upstream new file | Lands in | Rationale |
|---|---|---|
| `integration-testing/access-and-derived-testing.md.hbs` | `judo-integration-testing-docs/access-and-derived-testing.md` (page) | Keeps current pattern (pages, not sub-skills). Upstream frontmatter preserved verbatim, but pi-judo's loader treats it as a regular page until/unless we promote. |
| `integration-testing/osgi-ds-descriptor-tests.md.hbs` | `judo-integration-testing-docs/osgi-ds-descriptor-tests.md` | Same. |
| `model/transformation-pipeline.md.hbs` | `judo-model-docs/transformation-pipeline.md` | Concept-level model doc; sits with the rest. |
| `model/judo-cli.md.hbs` | `judo-model-docs/judo-cli.md` | Philosophy/identity of the CLI tool, complementary to `judo-model-cli` skill (how-to). Add cross-link from each side. |
| `model/ui-authoring-guide.md.hbs` | `judo-model-docs/ui-authoring-guide.md` | 618-line authoring guide; high-value addition. |
| `model/esm_metamodel/generator-reserved-names.md.hbs` | `judo-model-docs/esm_metamodel/generator-reserved-names.md` | Slot-fits the existing sub-hub. |

**Sub-skill promotion deferred.** If pi-judo agents start needing
finer-grained skill targeting, promoting a page to a sub-skill is a
manifest edit + a script re-run; we don't lock in either way now.

### D7. Sync cadence

Manual, on-demand. Operator runs `npm run sync:agent-docs` whenever
they pull upstream changes. CI hook deferred — adding it is one
GitHub Action step once we trust the script.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Upstream upgrades helper signatures** (e.g. `docLink` gains a 4th arg) | Script logs all unknown helper invocations and fails non-zero; first sync after each upstream pull is reviewed. |
| **HB renders our example correctly but breaks on a future code-fence pattern** | Snapshot test: render every current upstream file once, store output, compare on every script run. |
| **Loss of pi-judo-authored content during first sync** | Spot-check shows none exists, but the script runs against a clean working tree and produces a single git commit for review before merge. |
| **Anchor loss in cross-skill annotation form** | Documented limitation; a small percentage of links. Acceptable given the alternative (a richer cross-skill linking format that would have to be hand-rolled). |
| **`access-and-derived-testing.md` frontmatter naming the file as a sub-skill but pi-judo treating it as a page** | The frontmatter sits dormant; pi-judo's skill loader ignores nested frontmatter. If we ever promote, the upstream metadata is already correct. |
| **Manifest drift if upstream adds a new scope or sub-hub** | Script fails fast on unknown top-level dir under `agent-docs/`. Operator updates manifest, re-runs. |
| **Two parallel renderings (e.g. another project) drift in helper expectations** | Out of scope today; manifest design admits a future `projects:` block without breaking compatibility. |

## Migration Plan

1. **Land the script + manifest** without touching skill files
   (`tasks: scaffolding`).
2. **First sync run**: review the produced diff in a single commit.
   Expect ~60 changed files. Verify substantive content updates
   (`model-development.md`, `advanced-modeling-patterns.md`, etc.)
   read correctly.
3. **Smoke-test with one agent** (e.g. `judo-model-researcher`) to
   confirm the new pages are reachable and the cross-skill annotations
   parse cleanly in agent context.
4. **Document the workflow** in `README.md` (a new "Updating skills"
   section).

**Rollback**: revert the sync commit. The script + manifest are inert
without invocation.

## Open Questions

These are explicitly *not* blocking. Captured here for follow-up.

1. **Should the renderer also normalize line endings / trailing
   whitespace** to reduce diff churn against upstream? (Tentative: yes,
   LF + trim trailing spaces.)
2. **Should `judo-cli.md` cross-link to `judo-model-cli` skill via the
   same `(see X skill)` annotation, even though it's a sibling-skill
   reference not present in upstream?** Probably yes; the script can
   inject a "See also" footer block from the manifest for selected
   pages.
3. **`agents/*.md` updates** — separate change, but should the
   reference-detection live in this script (e.g. find every
   `\`judo-*-docs\` skill` mention and validate the skill exists)?
   Lean: yes, as a lint mode (`npm run sync:agent-docs -- --lint`).
4. **Cadence automation** — once stable, add a GitHub Action that
   runs the lint on PR and posts the diff if upstream has moved.
5. **Sub-skill promotion criteria** — when does a page graduate to
   sub-skill? Likely when an agent's `agents/*.md` benefits from
   targeting it directly. Not needed in this change.
