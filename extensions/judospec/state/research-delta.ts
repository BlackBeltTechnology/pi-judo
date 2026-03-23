import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface DomainDelta {
  domain: string; // "model" | "backend" | "frontend" | "shared"
  changedFiles: string[];
  addedFiles: string[];
  deletedFiles: string[];
  summary: string;
}

/**
 * Well-known directory prefixes mapped to domain names.
 * Order matters -- first match wins.
 */
const DOMAIN_PATTERNS: Array<{ prefix: string; domain: string }> = [
  { prefix: "src/model", domain: "model" },
  { prefix: "src/backend", domain: "backend" },
  { prefix: "src/frontend", domain: "frontend" },
  { prefix: "lib/model", domain: "model" },
  { prefix: "lib/backend", domain: "backend" },
  { prefix: "lib/frontend", domain: "frontend" },
  { prefix: "server/", domain: "backend" },
  { prefix: "api/", domain: "backend" },
  { prefix: "app/", domain: "frontend" },
  { prefix: "pages/", domain: "frontend" },
  { prefix: "components/", domain: "frontend" },
  { prefix: "models/", domain: "model" },
  { prefix: "db/", domain: "model" },
  { prefix: "prisma/", domain: "model" },
  { prefix: "migrations/", domain: "model" },
];

/**
 * Compute file changes per domain since the last research snapshot.
 *
 * The reference commit is read from
 *   judospec/changes/<changeId>/.research-ref
 * If that file is missing, HEAD~20 is used as a reasonable fallback.
 *
 * Uses `git diff --name-status` to categorise added / modified / deleted
 * files, then buckets them into domains.
 */
export function computeResearchDelta(
  changeId: string,
  cwd: string
): DomainDelta[] {
  const refFile = join(
    cwd,
    "judospec",
    "changes",
    changeId,
    ".research-ref"
  );
  const refCommit = existsSync(refFile)
    ? readFileSync(refFile, "utf-8").trim()
    : "HEAD~20";

  let diffOutput: string;
  try {
    diffOutput = execSync(`git diff --name-status ${refCommit} HEAD`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    // Not a git repo or ref doesn't exist -- return empty deltas.
    return [];
  }

  const buckets = new Map<
    string,
    { changed: string[]; added: string[]; deleted: string[] }
  >();

  for (const line of diffOutput.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format: STATUS\tFILE  (or STATUS\tOLD\tNEW for renames)
    const parts = trimmed.split("\t");
    if (parts.length < 2) continue;

    const status = parts[0].charAt(0); // A, M, D, R, C ...
    const filePath = parts.length >= 3 ? parts[2] : parts[1]; // use new name for renames

    const domain = classifyFile(filePath);
    if (!buckets.has(domain)) {
      buckets.set(domain, { changed: [], added: [], deleted: [] });
    }
    const bucket = buckets.get(domain)!;

    switch (status) {
      case "A":
      case "C":
        bucket.added.push(filePath);
        break;
      case "D":
        bucket.deleted.push(filePath);
        break;
      default:
        // M, R, T, U, X -- treat as changed
        bucket.changed.push(filePath);
        break;
    }
  }

  const deltas: DomainDelta[] = [];
  for (const [domain, bucket] of buckets) {
    const total =
      bucket.changed.length + bucket.added.length + bucket.deleted.length;
    const parts: string[] = [];
    if (bucket.added.length) parts.push(`${bucket.added.length} added`);
    if (bucket.changed.length) parts.push(`${bucket.changed.length} modified`);
    if (bucket.deleted.length) parts.push(`${bucket.deleted.length} deleted`);

    deltas.push({
      domain,
      changedFiles: bucket.changed,
      addedFiles: bucket.added,
      deletedFiles: bucket.deleted,
      summary: `${domain}: ${total} file(s) — ${parts.join(", ")}`,
    });
  }

  // Sort by domain name for deterministic output
  deltas.sort((a, b) => a.domain.localeCompare(b.domain));
  return deltas;
}

function classifyFile(filePath: string): string {
  for (const { prefix, domain } of DOMAIN_PATTERNS) {
    if (filePath.startsWith(prefix)) {
      return domain;
    }
  }
  return "shared";
}
