// ---------------------------------------------------------------------------
// Model Protection Guards
//
// Extension-level tool_call event interception that blocks all direct
// .model file reads/writes across the session. The guard is wired in
// index.ts via `pi.on("tool_call", guard)`.
// ---------------------------------------------------------------------------

// ---- Block messages -------------------------------------------------------

const READ_BLOCKED_MESSAGE =
  "Direct .model file access is forbidden. Use the model_cli tool to query the model via GraphQL.";

const WRITE_BLOCKED_MESSAGE =
  "Direct .model file modification is forbidden. Use the model_cli tool to mutate the model via GraphQL mutations, then use the save command.";

const BASH_BLOCKED_MESSAGE =
  "Direct .model file access via shell is forbidden. Use the model_cli tool.";

// ---- Path matching helpers ------------------------------------------------

/** Returns true when a file path targets a `.model` file. */
function pathTargetsModelFile(filePath: string): boolean {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.endsWith(".model") || /\/[^/]*\.model\//.test(normalized);
}

/** Returns true when a glob pattern references `.model` files. */
function globReferencesModel(pattern: string): boolean {
  if (!pattern) return false;
  return (
    pattern.endsWith(".model") ||
    pattern.includes("*.model") ||
    pattern.includes(".model/") ||
    pattern.includes(".model*")
  );
}

// ---- Tool routing ---------------------------------------------------------

/** Maps file-based tool names to the parameter that carries the path. */
const READ_TOOLS: Record<string, string> = {
  Read: "file_path",
  read: "file_path",
  Grep: "path",
  grep: "path",
};

const GLOB_TOOLS: Record<string, string> = {
  Glob: "pattern",
  glob: "pattern",
};

const WRITE_TOOLS: Record<string, string> = {
  Write: "file_path",
  write: "file_path",
  Edit: "file_path",
  edit: "file_path",
};

/**
 * Checks whether a file-based tool targets a .model file and returns the
 * appropriate block message, or `null` if the call is safe.
 */
function checkFileTool(
  toolName: string,
  params: Record<string, any>,
): string | null {
  // Read / Grep
  const readParam = READ_TOOLS[toolName];
  if (readParam) {
    const value = params[readParam];
    if (typeof value === "string" && pathTargetsModelFile(value)) {
      return READ_BLOCKED_MESSAGE;
    }
    return null;
  }

  // Glob
  const globParam = GLOB_TOOLS[toolName];
  if (globParam) {
    const value = params[globParam];
    if (typeof value === "string" && globReferencesModel(value)) {
      return READ_BLOCKED_MESSAGE;
    }
    return null;
  }

  // Write / Edit
  const writeParam = WRITE_TOOLS[toolName];
  if (writeParam) {
    const value = params[writeParam];
    if (typeof value === "string" && pathTargetsModelFile(value)) {
      return WRITE_BLOCKED_MESSAGE;
    }
    return null;
  }

  return null;
}

// ---- Bash command matching ------------------------------------------------

/**
 * Regex that matches shell commands known to read or modify file contents
 * followed by a path that contains `.model`.
 *
 * Captures commands like:
 *   cat foo/bar.model
 *   head -n 10 some.model
 *   sed -i 's/x/y/' path/to/thing.model
 *   python script.py bar.model   (only when .model is an argument)
 *
 * Does NOT match benign commands such as:
 *   ls model/
 *   java -jar target/judo-cli.jar
 *   find . -name "*.model"        (find is informational, like ls)
 */
const DANGEROUS_BASH_COMMANDS =
  /\b(cat|head|tail|sed|awk|grep|python|vi|nano)\b[^|;&#]*\S+\.model\b/;

function isBashModelAccess(command: string): boolean {
  if (!command) return false;
  return DANGEROUS_BASH_COMMANDS.test(command);
}

// ---- Public API -----------------------------------------------------------

/**
 * Creates a tool_call event handler that blocks direct .model file access.
 *
 * Usage in index.ts:
 * ```ts
 * import { createModelProtectionGuard } from "./guards";
 * pi.on("tool_call", createModelProtectionGuard());
 * ```
 */
export function createModelProtectionGuard() {
  return (event: any) => {
    const toolName: string = event.toolName || event.name;
    const params: Record<string, any> = event.params || event.input || {};

    // Check file-based tools (Read, Grep, Glob, Write, Edit)
    const fileBlockMessage = checkFileTool(toolName, params);
    if (fileBlockMessage) {
      return { block: true, reason: fileBlockMessage };
    }

    // Check Bash commands
    if (toolName === "Bash" || toolName === "bash") {
      const command = params.command || "";
      if (isBashModelAccess(command)) {
        return { block: true, reason: BASH_BLOCKED_MESSAGE };
      }
    }

    return undefined; // allow the tool call to proceed
  };
}
