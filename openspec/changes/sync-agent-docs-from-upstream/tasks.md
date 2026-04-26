## 1. Scaffolding

- [x] 1.1 Add `handlebars`, `js-yaml`, `tsx` (or `ts-node`) as dev dependencies in `package.json`
- [x] 1.2 Add `npm run sync:agent-docs` script that invokes `tsx scripts/sync-agent-docs.ts`
- [x] 1.3 Add `npm run sync:agent-docs:lint` (or document the `-- --lint` flag) for the lint mode
- [x] 1.4 Create `scripts/` directory and a stub `sync-agent-docs.ts` that prints "not implemented" and exits 1

## 2. Manifest

- [x] 2.1 Create `skills-manifest.yaml` at repo root with the schema shape from `design.md` D2
- [x] 2.2 Populate `scopes:` for backend, deployment, domain, e2e-testing, frontend, integration-testing, model — frontmatter copied from each existing pi-judo `SKILL.md`
- [x] 2.3 Populate `sub-hubs:` for `frontend-hooks`, `frontend-esm-to-ui`, `esm-metamodel` — frontmatter copied from existing nested SKILL.mds
- [x] 2.4 Populate `ignore:` with `domain/*.py.hbs`, `domain/*.sh.hbs`, top-level `README.md.hbs`
- [x] 2.5 Populate `preserve-upstream-frontmatter:` with `integration-testing/access-and-derived-testing.md.hbs` (simplified: upstream frontmatter is always auto-detected and preserved)
- [x] 2.6 Set `context.model.name: northwind`, `context.projectPostfix: ""`
- [x] 2.7 Set `upstream.root` relative path
- [x] 2.8 Add a JSON schema (or zod schema in the script) for the manifest; fail fast on shape errors

## 3. Renderer core

- [x] 3.1 Load and validate the manifest
- [x] 3.2 Walk upstream `agent-docs/` tree, classify each `.md.hbs` by scope/sub-hub/ignored
- [x] 3.3 Implement `lowerCase` Handlebars helper
- [x] 3.4 Implement `docLink` helper with same-skill / cross-skill resolution and anchor preservation (per spec Requirement: Handlebars helper resolution — docLink)
- [x] 3.5 Implement `localHubLink` helper (per spec Requirement: Handlebars helper resolution — localHubLink)
- [x] 3.6 Set up render context with `model` and `projectPostfix` from manifest
- [x] 3.7 Verify a JSX-escaped sample (`sx=\{{ color: '#1976d2' }}`) renders correctly to confirm Handlebars escaping works as expected

## 4. README → SKILL.md emission

- [x] 4.1 For each scope: render `<scope>/README.md.hbs` body, prepend manifest frontmatter, write to `skills/<skill>/SKILL.md`
- [x] 4.2 For each sub-hub: same pattern, write to `skills/<skill-path>/SKILL.md`
- [x] 4.3 Test on `backend/README.md.hbs` first; confirm output matches structure of current `judo-backend-docs/SKILL.md` (frontmatter + body)

## 5. Page emission

- [x] 5.1 For each non-README `.md.hbs`: render body, write to `skills/<skill>/<rest>.md`
- [x] 5.2 For files in `preserve-upstream-frontmatter:`: detect leading `---` block, render only the body, concatenate frontmatter + rendered body
- [x] 5.3 Normalize trailing whitespace and force a single trailing `\n` on every output file

## 6. Validation and reporting

- [x] 6.1 Implement dangling-link detection (any `docLink` target not present in upstream tree → error)
- [x] 6.2 Implement diff summary: list created / modified / removed files under `skills/`
- [x] 6.3 Implement `--lint` flag: parse + validate without writing
- [x] 6.4 Implement `--check` flag (or default to it in CI): exit non-zero if any file would change
- [x] 6.5 Sort all directory walks and Map iterations to ensure determinism

## 7. First sync execution

- [x] 7.1 Run `npm run sync:agent-docs:lint`; resolve any dangling links or unmapped scopes
- [x] 7.2 Run `npm run sync:agent-docs` once; review the produced diff
- [x] 7.3 Spot-check substantive new content lands intact: `model/model-development.md` (working-copy safety section), `model/advanced-modeling-patterns.md` (Managed Mapped Principal pattern), `backend/interceptors.md` (security interceptor)
- [x] 7.4 Spot-check the 6 new pages exist with the right frontmatter and the right cross-skill annotations
- [x] 7.5 Verify `judo-integration-testing-docs/SKILL.md` index now lists `access-and-derived-testing` and `osgi-ds-descriptor-tests`
- [x] 7.6 Verify `judo-model-docs/SKILL.md` index links the new pages

## 8. Documentation

- [x] 8.1 Add an "Updating skills from upstream" section to repo root `README.md`
- [x] 8.2 Document the manifest shape and how to add a new scope / sub-hub
- [x] 8.3 Document the cadence (manual, on-demand) and the rollback recipe (revert the sync commit)

## 9. Smoke tests

- [x] 9.1 Snapshot test: render the entire upstream tree, store the produced output, re-render, assert byte-identical (verified: second sync run produces zero changes)
- [x] 9.2 Unit test: `docLink` same-skill case
- [x] 9.3 Unit test: `docLink` cross-skill case
- [x] 9.4 Unit test: `docLink` with anchor (same-skill preserves, cross-skill drops)
- [x] 9.5 Unit test: `localHubLink` same-skill, cross-skill, sub-hub
- [x] 9.6 Unit test: `lowerCase` helper
- [x] 9.7 Unit test: dangling-link detection raises
- [x] 9.8 Unit test: missing manifest entry raises
- [x] 9.9 Unit test: preserve-upstream-frontmatter detects and preserves the leading `---` block (simplified: auto-detect; no explicit list needed)

## 10. Final wiring

- [x] 10.1 Single git commit for the first sync (separate from script + manifest commit) so reviewers can read the content delta on its own
- [x] 10.2 Confirm `openspec validate sync-agent-docs-from-upstream` passes
- [x] 10.3 Confirm `openspec verify` (or equivalent) passes after archive-time sync of specs
