#!/usr/bin/env node
/**
 * sync-agent-docs.ts
 *
 * Renders upstream agent-docs/*.md.hbs templates into pi-judo skills/.
 *
 * Upstream templates use Handlebars with three custom helpers:
 *   {{{docLink "rel/path.md[#anchor]" "Display Text" "scope"}}}
 *   {{{localHubLink "Display Text" "hub-scope-id"}}}
 *   {{ lowerCase model.name }}
 *
 * Usage (via npm scripts):
 *   npm run sync:agent-docs             — full sync, writes all output files
 *   npm run sync:agent-docs:lint        — validate only, no writes
 *   npm run sync:agent-docs:check       — exit non-zero if any file would change
 *
 * Direct invocation:
 *   node --experimental-strip-types scripts/sync-agent-docs.ts [--lint|--check]
 */

import Handlebars from 'handlebars';
import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScopeEntry {
  skill: string;
  /** Optional manifest-supplied YAML frontmatter, emitted when the upstream
   *  README.md.hbs has no built-in frontmatter block. */
  frontmatter?: Record<string, unknown>;
}

interface SubHubEntry {
  'upstream-path': string; // e.g. "frontend/hooks"
  'skill-path': string;    // e.g. "judo-frontend-docs/hooks"
  /** Optional manifest-supplied YAML frontmatter, emitted when the upstream
   *  README.md.hbs has no built-in frontmatter block. */
  frontmatter?: Record<string, unknown>;
}

export interface Manifest {
  upstream: { root: string };
  scopes: Record<string, ScopeEntry>;
  'sub-hubs': Record<string, SubHubEntry>;
  ignore: string[];
  context: { model: { name: string }; projectPostfix: string };
}

export interface FileClassification {
  /** Upstream path relative to agent-docs root, WITHOUT .hbs.
   *  e.g. "backend/custom-operations.md" */
  upstreamRel: string;
  /** The pi-judo skill name, e.g. "judo-backend-docs" */
  skill: string;
  /** Destination path relative to skills/, e.g. "judo-backend-docs/custom-operations.md" */
  destRel: string;
  /** True if this upstream file is a README.md (renders to SKILL.md) */
  isHub: boolean;
}

// ─── Module-level render state (set per-file for helpers) ─────────────────────

/** Set before rendering each file so helpers can access it. */
let currentFile: FileClassification | null = null;

/** File index: upstreamRel (without .hbs) → classification.
 *  Populated during file discovery, consumed by docLink helper. */
export const fileIndex = new Map<string, FileClassification>();

/** Hub lookup: localHubLink scope id → { skill, destRel }.
 *  Populated from manifest, consumed by localHubLink helper. */
export const hubLookup = new Map<string, { skill: string; destRel: string }>();

// ─── Glob matching ─────────────────────────────────────────────────────────────

/** Minimal glob matcher: supports *, ?, and ** path segments.
 *  Operates on forward-slash-separated paths. */
export function matchesGlob(relPath: string, pattern: string): boolean {
  // Escape regex special chars except * and ?
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\x00') // temp placeholder for **
    .replace(/\*/g, '[^/]*')  // * matches within a single segment
    .replace(/\?/g, '[^/]')   // ? matches a single char
    .replace(/\x00/g, '.*');  // ** matches across segments
  return new RegExp(`^${regexStr}$`).test(relPath);
}

// ─── Manifest loading & validation ───────────────────────────────────────────

export function loadManifest(manifestPath: string): Manifest {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `skills-manifest.yaml not found at ${manifestPath}\n` +
      `See design.md for the manifest format.`,
    );
  }
  const raw = yaml.load(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
  validateManifest(raw);
  return raw;
}

export function validateManifest(m: Manifest): void {
  const errors: string[] = [];
  if (!m?.upstream?.root) errors.push('upstream.root is required');
  if (!m?.scopes || typeof m.scopes !== 'object') errors.push('scopes is required');
  if (!m?.context?.model?.name) errors.push('context.model.name is required');
  for (const [scope, entry] of Object.entries(m?.scopes ?? {})) {
    if (!entry?.skill) errors.push(`scopes.${scope}.skill is required`);
  }
  if (errors.length) {
    throw new Error('Manifest validation errors:\n' + errors.map(e => `  • ${e}`).join('\n'));
  }
}

// ─── File classification ──────────────────────────────────────────────────────

/** Classify a single upstream file.
 *  @param upstreamRelHbs - path relative to agent-docs root, WITH .hbs suffix
 *  @returns FileClassification, or null if the file should be ignored */
export function classifyFile(
  upstreamRelHbs: string,
  manifest: Manifest,
): FileClassification | null {
  // 1. Check ignore list
  for (const pattern of manifest.ignore ?? []) {
    if (matchesGlob(upstreamRelHbs, pattern)) return null;
  }

  // Strip .hbs
  const upstreamRel = upstreamRelHbs.endsWith('.hbs')
    ? upstreamRelHbs.slice(0, -4)
    : upstreamRelHbs;

  const isHub = path.basename(upstreamRel) === 'README.md';

  // 2. Check sub-hubs (longer upstream-path first for most-specific match)
  const subHubs = Object.entries(manifest['sub-hubs'] ?? {}).sort(
    (a, b) => b[1]['upstream-path'].length - a[1]['upstream-path'].length,
  );
  for (const [, subHub] of subHubs) {
    const prefix = subHub['upstream-path'] + '/';
    if (upstreamRel.startsWith(prefix)) {
      const relWithinHub = upstreamRel.slice(prefix.length);
      const skillPath = subHub['skill-path'];
      const skill = skillPath.split('/')[0];
      const destRel = isHub
        ? `${skillPath}/SKILL.md`
        : `${skillPath}/${relWithinHub}`;
      return { upstreamRel, skill, destRel, isHub };
    }
  }

  // 3. Check top-level scopes
  const topDir = upstreamRel.split('/')[0];
  const scopeEntry = manifest.scopes[topDir];
  if (!scopeEntry) {
    throw new Error(`Unknown top-level directory in agent-docs: "${topDir}" (from "${upstreamRelHbs}")\n` +
      `Add it to scopes: or ignore: in skills-manifest.yaml`);
  }

  const relWithinScope = upstreamRel.slice(topDir.length + 1);
  const skill = scopeEntry.skill;
  const destRel = isHub
    ? `${skill}/SKILL.md`
    : `${skill}/${relWithinScope}`;
  return { upstreamRel, skill, destRel, isHub };
}

// ─── Handlebars helpers ────────────────────────────────────────────────────────

/** Resolve a docLink target to its rendered destination path, or null if dangling. */
export function resolveDocLinkTarget(
  target: string,          // e.g. "../model/advanced-modeling-patterns.md#anchor"
  agentDocsRoot: string,
): { classification: FileClassification | null; anchor: string } {
  const hashIdx = target.indexOf('#');
  const anchor = hashIdx >= 0 ? target.slice(hashIdx + 1) : '';
  const targetPath = hashIdx >= 0 ? target.slice(0, hashIdx) : target;

  if (!currentFile) throw new Error('resolveDocLinkTarget called outside render loop');

  // Resolve target relative to the current file's directory in agent-docs
  const currentFileAbsDir = path.join(agentDocsRoot, path.dirname(currentFile.upstreamRel));
  const resolvedAbs = path.resolve(currentFileAbsDir, targetPath);
  const targetRel = path.relative(agentDocsRoot, resolvedAbs); // e.g. "backend/README.md"

  const classification = fileIndex.get(targetRel) ?? null;
  return { classification, anchor };
}

export function buildDocLink(
  target: string,
  display: string,
  agentDocsRoot: string,
  debugLog: (msg: string) => void,
): string {
  if (!currentFile) throw new Error('docLink called outside render loop');

  const { classification: tgt, anchor } = resolveDocLinkTarget(target, agentDocsRoot);

  if (!tgt) {
    // Dangling — report and fall back to plain text
    debugLog(`DANGLING docLink: "${target}" from "${currentFile.upstreamRel}"`);
    return `${display} _(broken link: ${target})_`;
  }

  if (currentFile.skill === tgt.skill) {
    // Same skill → relative Markdown link
    const srcDir = path.dirname(currentFile.destRel);
    let rel = path.relative(srcDir, tgt.destRel);
    if (!rel.startsWith('..')) rel = './' + rel;
    const anchorSuffix = anchor ? `#${anchor}` : '';
    return `[${display}](${rel}${anchorSuffix})`;
  } else {
    // Cross-skill → annotation form; anchors are dropped
    if (anchor) {
      debugLog(`Dropping anchor #${anchor} in cross-skill link "${target}" from "${currentFile.upstreamRel}"`);
    }
    return `${display} (see \`${tgt.skill}\` skill)`;
  }
}

export function buildLocalHubLink(display: string, hubScopeId: string): string {
  if (!currentFile) throw new Error('localHubLink called outside render loop');

  const hub = hubLookup.get(hubScopeId);
  if (!hub) {
    // Unknown hub — fall back to plain text
    return `${display} _(unknown hub: ${hubScopeId})_`;
  }

  if (currentFile.skill === hub.skill) {
    const srcDir = path.dirname(currentFile.destRel);
    let rel = path.relative(srcDir, hub.destRel);
    if (!rel.startsWith('..')) rel = './' + rel;
    return `[${display}](${rel})`;
  } else {
    return `${display} (see \`${hub.skill}\` skill)`;
  }
}

// ─── Output normalisation ──────────────────────────────────────────────────────

/** Trim trailing whitespace from each line; ensure exactly one trailing newline. */
export function normalizeOutput(content: string): string {
  const lines = content.split('\n');
  const trimmed = lines.map(l => l.trimEnd());
  // Remove trailing blank lines, then add exactly one
  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === '') {
    trimmed.pop();
  }
  trimmed.push('');
  return trimmed.join('\n');
}

// ─── Core render loop ─────────────────────────────────────────────────────────

export interface SyncResult {
  created: string[];
  modified: string[];
  removed: string[];
  /** Dropped anchors (cross-skill links) — informational, not errors */
  droppedAnchors: string[];
  /** Dangling docLink targets — target file not found in upstream tree */
  dangles: string[];
}

export function buildHubLookup(manifest: Manifest): void {
  hubLookup.clear();
  // Scopes: scope name → skill SKILL.md
  for (const [scope, entry] of Object.entries(manifest.scopes ?? {})) {
    hubLookup.set(scope, {
      skill: entry.skill,
      destRel: `${entry.skill}/SKILL.md`,
    });
  }
  // Sub-hubs: the map key is the localHubLink id
  for (const [id, subHub] of Object.entries(manifest['sub-hubs'] ?? {})) {
    const skill = subHub['skill-path'].split('/')[0];
    hubLookup.set(id, {
      skill,
      destRel: `${subHub['skill-path']}/SKILL.md`,
    });
  }
}

/** Return the manifest-supplied frontmatter for a hub file, or null. */
export function resolveManifestFrontmatter(
  classification: FileClassification,
  manifest: Manifest,
): Record<string, unknown> | null {
  // Check sub-hubs by matching destRel to the expected SKILL.md path
  for (const subHub of Object.values(manifest['sub-hubs'] ?? {})) {
    if (classification.destRel === `${subHub['skill-path']}/SKILL.md`) {
      return subHub.frontmatter ?? null;
    }
  }
  // Check scopes
  for (const scopeEntry of Object.values(manifest.scopes ?? {})) {
    if (classification.destRel === `${scopeEntry.skill}/SKILL.md`) {
      return scopeEntry.frontmatter ?? null;
    }
  }
  return null;
}

/** Walk upstream tree, classify all .md.hbs files, populate fileIndex. */
export function discoverFiles(agentDocsRoot: string, manifest: Manifest): string[] {
  const dangles: string[] = [];
  fileIndex.clear();

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md.hbs')) {
        const upstreamRelHbs = path.relative(agentDocsRoot, full);
        let classification: FileClassification | null;
        try {
          classification = classifyFile(upstreamRelHbs, manifest);
        } catch (err) {
          dangles.push((err as Error).message);
          continue;
        }
        if (classification === null) continue; // ignored
        // Key by upstreamRel (without .hbs)
        fileIndex.set(classification.upstreamRel, classification);
      }
    }
  }

  walk(agentDocsRoot);
  return dangles;
}

export function runSync(opts: {
  agentDocsRoot: string;
  skillsRoot: string;
  manifest: Manifest;
  lint: boolean;
  check: boolean;
  verbose: boolean;
}): SyncResult {
  const { agentDocsRoot, skillsRoot, manifest, lint, check } = opts;

  // Build hub lookup for localHubLink
  buildHubLookup(manifest);

  // Discover all upstream files
  const discoveryErrors = discoverFiles(agentDocsRoot, manifest);
  if (discoveryErrors.length) {
    throw new Error('Unknown scopes encountered:\n' + discoveryErrors.join('\n'));
  }

  // Render context from manifest
  const renderContext = {
    model: manifest.context.model,
    projectPostfix: manifest.context.projectPostfix ?? '',
  };

  // Handlebars helpers (closures over agentDocsRoot)
  const dangles: string[] = [];
  const droppedAnchors: string[] = [];
  const debugLog = (msg: string) => {
    if (msg.startsWith('DANGLING')) dangles.push(msg);
    else droppedAnchors.push(msg);
  };

  Handlebars.registerHelper('lowerCase', (s: unknown) => String(s).toLowerCase());

  Handlebars.registerHelper('docLink', function (
    this: unknown,
    target: string,
    display: string,
    _scope: string,
  ) {
    return new Handlebars.SafeString(
      buildDocLink(target, display, agentDocsRoot, debugLog),
    );
  });

  Handlebars.registerHelper('localHubLink', function (
    this: unknown,
    display: string,
    hubScopeId: string,
  ) {
    return new Handlebars.SafeString(buildLocalHubLink(display, hubScopeId));
  });

  // Build the set of skill roots managed by this sync (scopes + sub-hubs).
  // Files outside these directories (e.g. judo-model-cli) are pi-judo-only
  // additions that are never touched by the sync.
  const managedSkillDirs = new Set<string>();
  for (const entry of Object.values(manifest.scopes ?? {})) {
    managedSkillDirs.add(entry.skill);
  }
  for (const subHub of Object.values(manifest['sub-hubs'] ?? {})) {
    managedSkillDirs.add(subHub['skill-path'].split('/')[0]);
  }

  // Collect existing files under managed skill dirs for "removed" detection
  const existingSkillFiles = new Set<string>();
  function collectExisting(dir: string): void {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectExisting(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        existingSkillFiles.add(path.relative(skillsRoot, full));
      }
    }
  }
  for (const skillDir of Array.from(managedSkillDirs).sort()) {
    collectExisting(path.join(skillsRoot, skillDir));
  }

  const result: SyncResult = { created: [], modified: [], removed: [], dangles: [], droppedAnchors: [] };
  const renderedFiles = new Set<string>();

  // Render each classified file (sorted by destRel for determinism)
  const sorted = Array.from(fileIndex.values()).sort((a, b) =>
    a.destRel.localeCompare(b.destRel),
  );

  for (const classification of sorted) {
    currentFile = classification;
    const srcPath = path.join(agentDocsRoot, classification.upstreamRel + '.hbs');
    const rawContent = fs.readFileSync(srcPath, 'utf8');

    let rendered: string;
    try {
      const template = Handlebars.compile(rawContent, { noEscape: true });
      rendered = template(renderContext);
    } catch (err) {
      throw new Error(`Handlebars render error in ${classification.upstreamRel}: ${(err as Error).message}`);
    }

    // For hub files (README → SKILL.md): if the upstream file has no built-in
    // YAML frontmatter block, prepend manifest-supplied frontmatter instead.
    // This covers sub-hubs like esm_metamodel and esm-to-ui-mappings whose
    // upstream READMEs contain no ---...--- header.
    let output: string;
    if (classification.isHub && !rawContent.trimStart().startsWith('---\n')) {
      const manifestFm = resolveManifestFrontmatter(classification, manifest);
      if (manifestFm) {
        const fmBlock = '---\n' + yaml.dump(manifestFm, { lineWidth: -1 }).trimEnd() + '\n---\n';
        output = normalizeOutput(fmBlock + '\n' + rendered);
      } else {
        output = normalizeOutput(rendered);
      }
    } else {
      output = normalizeOutput(rendered);
    }
    const destRel = classification.destRel;
    const destPath = path.join(skillsRoot, destRel);
    renderedFiles.add(destRel);

    // Compare with existing
    const existing = fs.existsSync(destPath) ? fs.readFileSync(destPath, 'utf8') : null;
    if (existing === null) {
      result.created.push(destRel);
    } else if (existing !== output) {
      result.modified.push(destRel);
    }

    if (!lint && !check) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, output, 'utf8');
    }
  }

  currentFile = null;

  // Detect removed files (exist in skills/ but were not rendered)
  for (const existing of existingSkillFiles) {
    if (!renderedFiles.has(existing)) {
      result.removed.push(existing);
    }
  }

  result.dangles = dangles;
  result.droppedAnchors = droppedAnchors;
  return result;
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const lint = args.includes('--lint');
  const check = args.includes('--check');
  const verbose = args.includes('--verbose');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, '..');
  const manifestPath = path.join(repoRoot, 'skills-manifest.yaml');

  let manifest: Manifest;
  try {
    manifest = loadManifest(manifestPath);
  } catch (err) {
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }

  const agentDocsRoot = path.resolve(repoRoot, manifest.upstream.root);
  const skillsRoot = path.join(repoRoot, 'skills');

  if (!fs.existsSync(agentDocsRoot)) {
    console.error(`Error: upstream agent-docs root not found: ${agentDocsRoot}`);
    console.error(`Check 'upstream.root' in skills-manifest.yaml`);
    process.exit(1);
  }

  const mode = lint ? 'LINT' : check ? 'CHECK' : 'SYNC';
  console.log(`\n⚙  sync-agent-docs [${mode}]`);
  console.log(`   upstream: ${agentDocsRoot}`);
  console.log(`   skills:   ${skillsRoot}\n`);

  let result: SyncResult;
  try {
    result = runSync({ agentDocsRoot, skillsRoot, manifest, lint, check, verbose });
  } catch (err) {
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }

  // Report
  if (result.droppedAnchors.length && verbose) {
    console.log(`ℹ  ${result.droppedAnchors.length} cross-skill anchor(s) dropped (informational):`);
    for (const d of result.droppedAnchors) console.log(`   ${d}`);
    console.log();
  } else if (result.droppedAnchors.length) {
    console.log(`ℹ  ${result.droppedAnchors.length} cross-skill anchor(s) dropped (use --verbose to list)`);
  }

  if (result.dangles.length) {
    console.log(`✗  ${result.dangles.length} dangling link(s) — targets not found in upstream tree:`);
    for (const d of result.dangles) console.log(`   ${d}`);
    console.log();
  }

  const hasChanges = result.created.length + result.modified.length + result.removed.length > 0;

  if (result.created.length) {
    console.log(`✚  Created (${result.created.length}):`);
    for (const f of result.created) console.log(`   ${f}`);
  }
  if (result.modified.length) {
    console.log(`✎  Modified (${result.modified.length}):`);
    for (const f of result.modified) console.log(`   ${f}`);
  }
  if (result.removed.length) {
    console.log(`✖  Removed from skills (${result.removed.length}) — not deleted, manual action needed:`);
    for (const f of result.removed) console.log(`   ${f}`);
  }

  if (!hasChanges) {
    console.log('✓  All skills are up to date.');
  }

  // Dangling links are fatal in all modes — they indicate upstream renames
  // that have left broken references in the rendered skill pages.
  if (result.dangles.length) {
    if (lint) {
      console.log('\n✗  Lint failed: dangling links detected.');
    } else {
      console.log('\n✗  Sync failed: dangling links detected. Fix the upstream templates or update the manifest before syncing.');
    }
    process.exit(1);
  }

  if (lint) {
    console.log('\n✓  Lint clean.');
  }

  if (check && hasChanges) {
    console.log('\n✗  Check failed: files would change. Run `npm run sync:agent-docs` to update.');
    process.exit(1);
  }
}

// Only run when invoked directly, not when imported by tests.
const __selfUrl = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] ?? '') === __selfUrl) {
  main();
}
