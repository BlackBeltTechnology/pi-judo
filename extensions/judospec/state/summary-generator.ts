import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * Generate a summary of a completed change from its artifacts.
 *
 * Reads proposal.md, design.md, and verification.md from the change
 * directory, extracts the essential information, and writes a concise
 * summary to judospec/summaries/<changeId>.md.
 *
 * Returns the generated summary content.
 */
export function generateSummary(changeId: string, cwd: string): string {
  const changeDir = join(cwd, "judospec", "changes", changeId);
  const planDir = join(changeDir, "plan");

  const proposal = readArtifact(join(planDir, "proposal.md"));
  const design = readArtifact(join(planDir, "design.md"));
  const verification = readArtifact(join(changeDir, "verification.md"));

  const whatChanged = extractSection(proposal, "## What") || extractFirstParagraph(proposal);
  const whyChanged = extractSection(proposal, "## Why") || extractSection(proposal, "## Motivation");
  const keyDecisions = extractSection(design, "## Decisions") || extractSection(design, "## Key Decisions");
  const filesAffected = extractFileList(verification) || extractFileList(design);
  const verificationResult = extractSection(verification, "## Result") || extractSection(verification, "## Status");

  const lines: string[] = [
    `# Summary: ${changeId}`,
    "",
    `> Auto-generated summary for change \`${changeId}\`.`,
    "",
  ];

  if (whatChanged) {
    lines.push("## What Changed", "", whatChanged.trim(), "");
  }

  if (whyChanged) {
    lines.push("## Why", "", whyChanged.trim(), "");
  }

  if (keyDecisions) {
    lines.push("## Key Decisions", "", keyDecisions.trim(), "");
  }

  if (filesAffected) {
    lines.push("## Files Affected", "", filesAffected.trim(), "");
  }

  if (verificationResult) {
    lines.push("## Verification", "", verificationResult.trim(), "");
  }

  // If we had nothing to extract, include the raw proposal content as-is
  if (!whatChanged && !whyChanged && proposal) {
    lines.push("## Proposal (raw)", "", proposal.trim(), "");
  }

  const summary = lines.join("\n") + "\n";

  // Write to summaries directory
  const summariesDir = join(cwd, "judospec", "summaries");
  if (!existsSync(summariesDir)) {
    mkdirSync(summariesDir, { recursive: true });
  }
  const summaryPath = join(summariesDir, `${changeId}.md`);
  writeFileSync(summaryPath, summary, "utf-8");

  return summary;
}

/** Safely read a file, returning empty string when missing. */
function readArtifact(filePath: string): string {
  if (!existsSync(filePath)) return "";
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Extract the content under a markdown heading (## level).
 * Returns everything from the line after the heading up to the next
 * heading of equal or higher level, or end of file.
 */
function extractSection(
  content: string,
  headingPrefix: string
): string | null {
  if (!content) return null;

  const lines = content.split("\n");
  const headingLower = headingPrefix.toLowerCase();
  let capturing = false;
  const captured: string[] = [];

  for (const line of lines) {
    if (capturing) {
      // Stop at next heading of same or higher level
      if (/^#{1,2}\s/.test(line)) {
        break;
      }
      captured.push(line);
    } else if (line.toLowerCase().startsWith(headingLower)) {
      capturing = true;
    }
  }

  if (captured.length === 0) return null;
  const text = captured.join("\n").trim();
  return text || null;
}

/** Extract the first non-empty paragraph from markdown content. */
function extractFirstParagraph(content: string): string | null {
  if (!content) return null;

  const lines = content.split("\n");
  const para: string[] = [];
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip headings and blank lines at the start
    if (!started) {
      if (!trimmed || trimmed.startsWith("#")) continue;
      started = true;
    }

    if (started) {
      if (!trimmed) break; // end of paragraph
      para.push(line);
    }
  }

  return para.length > 0 ? para.join("\n").trim() : null;
}

/**
 * Extract a file list from markdown content.
 * Looks for lines that look like file paths (contain "/" or common extensions).
 */
function extractFileList(content: string): string | null {
  if (!content) return null;

  const filePattern = /(?:^[-*]\s+)?(`?)([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,10})\1/;
  const lines = content.split("\n");
  const files: string[] = [];

  for (const line of lines) {
    const match = filePattern.exec(line.trim());
    if (match && match[2].includes("/")) {
      files.push(`- ${match[2]}`);
    }
  }

  if (files.length === 0) return null;
  // Deduplicate
  return [...new Set(files)].join("\n");
}
