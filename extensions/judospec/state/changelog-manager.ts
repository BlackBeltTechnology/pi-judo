import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export interface ChangelogEntry {
  changeId: string;
  description: string;
  date: string;
  categories: Record<string, string[]>; // category -> items
}

const CHANGELOG_HEADER = `# Changelog

All notable changes managed by judospec are documented in this file.
Entries are listed newest-first.

`;

/**
 * Ensure CHANGELOG.md exists under judospec/.
 * Creates the file with a standard header if it is missing.
 */
export function ensureChangelog(cwd: string): void {
  const changelogPath = getChangelogPath(cwd);
  const dir = dirname(changelogPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (!existsSync(changelogPath)) {
    writeFileSync(changelogPath, CHANGELOG_HEADER, "utf-8");
  }
}

/**
 * Append a new entry to the changelog.
 *
 * The entry is inserted immediately after the header block so that the
 * most recent change always appears first. Items are auto-grouped by
 * the provided categories (e.g. "Model Changes", "Backend", "Frontend",
 * "Tests").
 */
export function appendChangelogEntry(
  entry: ChangelogEntry,
  cwd: string
): void {
  ensureChangelog(cwd);

  const changelogPath = getChangelogPath(cwd);
  const existing = readFileSync(changelogPath, "utf-8");

  const entryBlock = formatEntry(entry);

  // Insert the new entry right after the header.
  // The header ends at the first blank line after the opening "# Changelog"
  // section. We look for the double-newline boundary.
  const insertionPoint = findHeaderEnd(existing);
  const before = existing.slice(0, insertionPoint);
  const after = existing.slice(insertionPoint);

  writeFileSync(changelogPath, before + entryBlock + after, "utf-8");
}

function getChangelogPath(cwd: string): string {
  return join(cwd, "judospec", "CHANGELOG.md");
}

/**
 * Find the byte offset where the header block ends.
 * We treat everything up to and including the first blank line after
 * the title as header.
 */
function findHeaderEnd(content: string): number {
  const lines = content.split("\n");
  let pastTitle = false;
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    offset += line.length + 1; // +1 for the newline

    if (line.startsWith("# ")) {
      pastTitle = true;
      continue;
    }

    // After the title, skip non-empty description lines until we hit a
    // blank line, which marks the end of the header.
    if (pastTitle && line.trim() === "") {
      // Keep consuming consecutive blank lines that are part of the header.
      while (i + 1 < lines.length && lines[i + 1].trim() === "") {
        i++;
        offset += lines[i].length + 1;
      }
      return offset;
    }
  }

  // Fallback: append at end
  return content.length;
}

function formatEntry(entry: ChangelogEntry): string {
  const lines: string[] = [];

  lines.push(`## [${entry.changeId}] - ${entry.date}`);
  lines.push("");

  if (entry.description) {
    lines.push(entry.description);
    lines.push("");
  }

  const categoryNames = Object.keys(entry.categories);
  if (categoryNames.length > 0) {
    for (const category of categoryNames) {
      const items = entry.categories[category];
      if (!items || items.length === 0) continue;

      lines.push(`### ${category}`);
      lines.push("");
      for (const item of items) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }
  }

  // Ensure a trailing blank line to separate from subsequent entries
  if (lines[lines.length - 1] !== "") {
    lines.push("");
  }

  return lines.join("\n");
}
