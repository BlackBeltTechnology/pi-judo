## ADDED Requirements

### Requirement: Manifest-driven scope mapping

The sync tool SHALL read a `skills-manifest.yaml` at repo root that
defines the mapping from each upstream `agent-docs/` top-level
directory (a "scope") to a destination skill folder under
`skills/`, the SKILL.md frontmatter to emit, and any nested sub-hubs.

#### Scenario: Manifest defines all upstream scopes
- **WHEN** the script runs against the upstream tree
- **AND** every top-level directory under `agent-docs/` has a matching
  entry under `scopes:` or `sub-hubs:` (or is listed under `ignore:`)
- **THEN** the script proceeds without warnings

#### Scenario: Unmapped upstream directory
- **WHEN** the script encounters a top-level directory under
  `agent-docs/` that is not in `scopes:`, `sub-hubs:`, or `ignore:`
- **THEN** the script exits non-zero with an error naming the
  unmapped directory and the change does not write any output

#### Scenario: Missing manifest
- **WHEN** the script runs and `skills-manifest.yaml` is absent
- **THEN** the script exits non-zero with an error pointing the
  operator at the example manifest

### Requirement: Handlebars helper resolution — docLink

The renderer SHALL resolve `{{{docLink target display scope}}}`
invocations to plain Markdown according to whether the resolved
target file lives in the same skill as the source file.

#### Scenario: Same-skill link
- **WHEN** the resolved target file maps to the same skill as the
  file currently being rendered
- **THEN** the helper emits a relative Markdown link of the form
  `[<display>](./<rel-path>.md[#<anchor>])`
- **AND** any anchor present on the target is preserved verbatim

#### Scenario: Cross-skill link
- **WHEN** the resolved target file maps to a different skill from
  the file currently being rendered
- **THEN** the helper emits the annotation form
  `<display> (see \`<other-skill-name>\` skill)`
- **AND** any anchor on the target is dropped (with a debug log line)

#### Scenario: Link to another scope's hub README
- **WHEN** the target ends in `README.md`
- **AND** the target resolves to a different scope's hub
- **THEN** the helper points at that scope's `SKILL.md` (in either
  same-skill or cross-skill form depending on resolution)

#### Scenario: Dangling target
- **WHEN** the resolved target file does not exist anywhere under
  `agent-docs/`
- **THEN** the script exits non-zero with an error naming the
  source file, the helper invocation, and the unresolved path

### Requirement: Handlebars helper resolution — localHubLink

The renderer SHALL resolve `{{{localHubLink display scope}}}` to a
link pointing at the `SKILL.md` of the named scope (or sub-hub),
using the same same-skill / cross-skill rules as `docLink`.

#### Scenario: Same-skill hub
- **WHEN** the requested hub scope resolves to the same skill as
  the source file
- **THEN** the helper emits `[<display>](./SKILL.md)` (or the
  appropriate relative path within the skill)

#### Scenario: Cross-skill hub
- **WHEN** the requested hub scope resolves to a different skill
- **THEN** the helper emits `<display> (see \`<other-skill\`> skill)`

#### Scenario: Sub-hub reference
- **WHEN** the requested hub scope is a sub-hub identifier (e.g.
  `frontend-hooks`)
- **THEN** the helper resolves through `sub-hubs:` in the manifest
  to the correct nested SKILL.md path

### Requirement: Variable substitution

The renderer SHALL substitute `{{ model.name }}`, `{{ lowerCase
model.name }}`, and `{{ projectPostfix }}` from the manifest's
`context:` block.

#### Scenario: Default pi-judo context
- **WHEN** the manifest specifies `context.model.name: northwind`
  and `context.projectPostfix: ""`
- **AND** the source contains `{{ lowerCase model.name }}-app{{
  projectPostfix }}.jar`
- **THEN** the rendered output contains `northwind-app.jar`

#### Scenario: Helper unaffected by case of source
- **WHEN** `model.name` is `Northwind`
- **AND** the source contains `{{ lowerCase model.name }}`
- **THEN** the rendered output is `northwind`

### Requirement: Escaped JSX literals are preserved

The renderer SHALL leave Handlebars-escaped expressions of the form
`\{{ ... }}` rendered as the literal `{{ ... }}` in the output.

#### Scenario: JSX object literal in code fence
- **WHEN** the source contains ``sx=\{{ color: '#1976d2' }}`` inside
  a code fence
- **THEN** the rendered output contains ``sx={{ color: '#1976d2' }}``
  inside the same code fence

### Requirement: README.md.hbs rendering as SKILL.md with manifest frontmatter

For each scope and sub-hub, the renderer SHALL emit a `SKILL.md`
file consisting of (a) the YAML frontmatter from the manifest, and
(b) the rendered body of the upstream `README.md.hbs`.

#### Scenario: Scope README is rendered
- **WHEN** `agent-docs/<scope>/README.md.hbs` exists
- **AND** the manifest has a `frontmatter:` block for `<scope>`
- **THEN** the output `skills/<skill-name>/SKILL.md` starts with
  `---\n<yaml>\n---\n\n`
- **AND** the rendered body of the README follows the frontmatter

#### Scenario: Frontmatter missing for a mapped scope
- **WHEN** the manifest maps a scope but provides no `frontmatter:`
  block
- **THEN** the script exits non-zero with an error naming the scope

### Requirement: Preserve upstream-authored frontmatter

The renderer SHALL preserve any upstream-authored YAML frontmatter for files listed in the manifest's `preserve-upstream-frontmatter:` section, by detecting the leading `---\n…\n---` block in the upstream `.hbs` and emitting it unchanged at the top of the rendered output.

#### Scenario: Preserve upstream frontmatter
- **WHEN** the file is listed in `preserve-upstream-frontmatter:`
- **AND** the upstream file begins with `---\n...---\n`
- **THEN** the rendered output begins with that exact frontmatter
  block, unmodified
- **AND** the body below is rendered through Handlebars normally

#### Scenario: Preserve listing references a file without frontmatter
- **WHEN** the file is listed in `preserve-upstream-frontmatter:`
  but does not begin with `---\n`
- **THEN** the script exits non-zero with a clear error

### Requirement: Idempotent renders

The renderer SHALL produce byte-stable output for an unchanged
upstream tree across runs on the same machine and across compatible
machines.

#### Scenario: Re-running with no upstream change
- **WHEN** the script runs twice in a row with no changes to
  `agent-docs/` or `skills-manifest.yaml`
- **THEN** the second run reports zero file changes

#### Scenario: Determinism across machines
- **WHEN** two different machines (matching Node version range) run
  the same script against the same upstream and manifest
- **THEN** the produced files are byte-identical

### Requirement: Sync run reports a diff summary

After every render, the script SHALL print a summary of files
created, modified, and removed under `skills/`.

#### Scenario: Summary on a sync run
- **WHEN** the script completes a render
- **THEN** standard output includes a section listing each created,
  modified, and removed file under `skills/`
- **AND** the exit code is zero on success

### Requirement: Ignore list excludes non-doc upstream files

The renderer SHALL skip files matched by `ignore:` glob patterns in
the manifest.

#### Scenario: Ignored python helper script
- **WHEN** `domain/diagram_generator.py.hbs` exists upstream
- **AND** `ignore:` includes `domain/*.py.hbs`
- **THEN** the file is not rendered and produces no output under
  `skills/`

### Requirement: Sync command exposed via npm script

The repo SHALL expose the sync as `npm run sync:agent-docs` so
operators do not need to remember the underlying invocation.

#### Scenario: Operator runs sync
- **WHEN** an operator runs `npm run sync:agent-docs` from the repo
  root
- **THEN** the script executes, reads the manifest, renders all
  templates, prints a summary, and exits zero on success

### Requirement: Lint mode (advisory)

The script SHALL accept a `--lint` flag that performs all template
parsing and dangling-link checks but does not write any files.

#### Scenario: Lint passes on clean tree
- **WHEN** the operator runs `npm run sync:agent-docs -- --lint`
- **AND** all templates parse and all `docLink` targets resolve
- **THEN** the script exits zero with a "lint clean" message
- **AND** no files under `skills/` are modified

#### Scenario: Lint fails on dangling link
- **WHEN** the operator runs the lint
- **AND** any `docLink` target does not exist in the upstream tree
- **THEN** the script exits non-zero, lists the dangling references,
  and writes nothing to disk
