## Why

The `pi-judo/skills/judo-*-docs/` skills were originally derived from
`agent-docs/` in `judo-ng/template/judo-esm-fullstack-project-template`,
but they have drifted: upstream has added 6 net-new pages (including
**ui-authoring-guide**, **transformation-pipeline**, **judo-cli**,
**access-and-derived-testing**, **osgi-ds-descriptor-tests**,
**generator-reserved-names**) and pushed substantive new content into
roughly half a dozen existing pages — most importantly working-copy
safety rules in `model-development.md` and the *Managed Mapped
Principal* / *Role Flags* patterns in `advanced-modeling-patterns.md`.

Pi-judo's skills carry no original authorial content over upstream; the
differences are entirely (a) already-rendered template helpers and
(b) older snapshots. Without a sync mechanism, every upstream
improvement is silently lost to the agents using these skills.

## What Changes

- **Add** a sync tool (Node.js script in `scripts/sync-agent-docs.ts`,
  invoked as an npm script) that renders upstream `*.md.hbs` templates
  into pi-judo skill `.md` pages, applying the established adaptation
  rules (`{{{docLink}}}` → cross-skill or relative link;
  `{{{localHubLink}}}` → SKILL.md link; `{{ lowerCase model.name }}`
  → `northwind`; `README.md.hbs` → `SKILL.md` with frontmatter from a
  manifest).
- **Add** a `skills-manifest.yaml` mapping each `agent-docs/` top-level
  directory to its target skill name and the SKILL.md frontmatter to
  emit (so a sub-skill's metadata is owned by pi-judo, not by the
  upstream `.hbs`).
- **Run** the sync once (full sync as the script's first execution),
  producing:
  - 6 new pages (`access-and-derived-testing`, `osgi-ds-descriptor-tests`,
    `transformation-pipeline`, `judo-cli`, `ui-authoring-guide`,
    `generator-reserved-names`).
  - Updated content across ~54 existing pages (most are template-noise
    only; ~7 carry substantive new material).
  - Updated SKILL.md indexes that link the new pages.
- **Document** the sync workflow in a top-level `CONTRIBUTING.md`
  section (or equivalent) so future re-syncs are repeatable.

Out of scope (deliberately deferred):
- Updating `agents/*.md` to reference the new pages — handled in a
  separate change once the doc surface settles.
- Vendoring `agent-docs/domain/*.py|*.sh` scripts — they are
  project-runtime resources, not skill knowledge.
- Generalizing the sync tool to non-pi-judo projects.

Open questions captured in `design.md`:
- Where exactly does `model/judo-cli.md` belong (page in
  `judo-model-docs/`, vs. preamble of `judo-model-cli/SKILL.md`,
  vs. a new `judo-platform-docs` skill).
- Does `access-and-derived-testing.md` get promoted to a sub-skill
  (its upstream frontmatter suggests yes) or stay a page.
- Cadence: re-sync on every upstream release, on demand, or scheduled.

## Capabilities

### New Capabilities
- `agent-docs-sync`: Tooling and workflow for keeping pi-judo skill
  documentation in sync with upstream
  `judo-esm-fullstack-project-template` `agent-docs/`. Defines the
  contract for the renderer (helper resolution, frontmatter manifest,
  path mapping) and the operational workflow for executing syncs.

### Modified Capabilities
*(none — pi-judo has no spec-level capabilities defined yet; the
skills themselves are not modeled as specs. The new sync tool is
introduced cleanly.)*

## Impact

- **New code**: `scripts/sync-agent-docs.ts`, supporting types, and a
  `skills-manifest.yaml` at repo root.
- **New dev dependency**: `handlebars` (npm) and `js-yaml` for manifest
  parsing. Optionally `tsx` to run the script without a build step.
- **Modified files**: ~60 files under `skills/judo-*-docs/` will be
  rewritten by the first sync run. These are not hand-edited going
  forward — the script is the source of truth for skill page content.
- **New files**: 6 skill pages + updates to several `SKILL.md`
  indexes; `skills-manifest.yaml`; sync script; README/contrib note.
- **Workflow**: `npm run sync:agent-docs` becomes the canonical way to
  pull upstream documentation changes. Hand-edits to skill `.md` files
  become a documented exception (recorded in the manifest as
  per-file overrides if ever needed).
- **No runtime impact**: skills are static documentation; only the
  agents using them benefit (or, before sync, lack) the upstream
  knowledge.
