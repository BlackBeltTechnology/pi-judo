import { StringEnum } from "@mariozechner/pi-ai";
import { Type, type Static } from "@sinclair/typebox";
import { spawn } from "node:child_process";
import { existsSync, globSync } from "node:fs";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Mutation tracking state
// ---------------------------------------------------------------------------

interface MutationLogEntry {
	operation: string;
	fqn: string;
	type: string;
	timestamp: number;
}

let mutationCount = 0;
let mutationLog: MutationLogEntry[] = [];

export function getMutationCount(): number {
	return mutationCount;
}

export function getMutationLog(): MutationLogEntry[] {
	return [...mutationLog];
}

export function resetMutations(): void {
	mutationCount = 0;
	mutationLog = [];
}

// ---------------------------------------------------------------------------
// Model path cache
// ---------------------------------------------------------------------------

let cachedModelPath: string | null = null;
let cachedModelCwd: string | null = null;

function detectModelPath(cwd: string): string | null {
	if (cachedModelCwd === cwd && cachedModelPath !== null) {
		return cachedModelPath;
	}

	const pattern = join(cwd, "model", "*.model");
	const matches = globSync(pattern);

	if (matches.length > 0) {
		cachedModelPath = matches[0];
		cachedModelCwd = cwd;
		return cachedModelPath;
	}

	cachedModelPath = null;
	cachedModelCwd = cwd;
	return null;
}

// ---------------------------------------------------------------------------
// Spawn helper
// ---------------------------------------------------------------------------

function spawnCli(
	args: string[],
	cwd: string,
	signal?: AbortSignal,
): Promise<{ stdout: string; stderr: string; code: number }> {
	return new Promise((resolvePromise, reject) => {
		const child = spawn("java", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });

		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (chunk: Buffer) => {
			stdout += chunk.toString();
		});

		child.stderr.on("data", (chunk: Buffer) => {
			stderr += chunk.toString();
		});

		child.on("error", (err) => {
			reject(err);
		});

		child.on("close", (code) => {
			resolvePromise({ stdout, stderr, code: code ?? 1 });
		});

		if (signal) {
			signal.addEventListener(
				"abort",
				() => {
					child.kill("SIGTERM");
				},
				{ once: true },
			);
		}
	});
}

// ---------------------------------------------------------------------------
// Parse mutation info from a GraphQL query string
// ---------------------------------------------------------------------------

function parseMutationInfo(query: string): { operation: string; fqn: string; type: string } {
	// Try to extract the operation name and type from the mutation query.
	// Example: mutation { createEntity(input: {...}) { ... } }
	const operationMatch = query.match(/mutation\s*(?:\w+\s*)?\{[\s]*(\w+)/);
	const operation = operationMatch ? operationMatch[1] : "unknown";

	// Attempt to extract a fully-qualified name from common patterns like
	// createFoo, updateFoo, deleteFoo, or a fqn argument.
	const fqnArgMatch = query.match(/fqn\s*:\s*"([^"]+)"/);
	const fqn = fqnArgMatch ? fqnArgMatch[1] : operation;

	// Derive a type from the operation prefix (create/update/delete/...)
	let type = "mutation";
	if (operation.startsWith("create")) type = "create";
	else if (operation.startsWith("update")) type = "update";
	else if (operation.startsWith("delete")) type = "delete";
	else if (operation.startsWith("add")) type = "add";
	else if (operation.startsWith("remove")) type = "remove";

	return { operation, fqn, type };
}

// ---------------------------------------------------------------------------
// Tool schema
// ---------------------------------------------------------------------------

const ModelCliParams = Type.Object({
	command: StringEnum(["graphql", "validate", "transform", "save", "discard", "status"] as const),
	query: Type.Optional(Type.String({ description: "GraphQL query string (for graphql command)" })),
	dryRun: Type.Optional(Type.Boolean({ description: "Dry-run mode for graphql command" })),
	flags: Type.Optional(Type.Array(Type.String(), { description: "Additional CLI flags" })),
});

export type ModelCliInput = Static<typeof ModelCliParams>;

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

export function createModelCliTool(cwd: string) {
	const resolvedCwd = resolve(cwd);

	return {
		name: "model_cli",
		label: "Model CLI",
		description:
			"Execute JUDO model CLI commands. Supports GraphQL queries/mutations against the model, " +
			"validation, transformation, save, discard, and status checks. " +
			"The CLI operates on the .model file found in the model/ directory.",
		parameters: ModelCliParams,

		async execute(
			_toolCallId: string,
			params: ModelCliInput,
			signal: AbortSignal | undefined,
			_onUpdate: any,
			_ctx: any,
		) {
			// Validate JAR exists
			const jarPath = join(resolvedCwd, "target", "judo-cli.jar");
			if (!existsSync(jarPath)) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error: judo-cli.jar not found at ${jarPath}. Build the project first (e.g., mvn package).`,
						},
					],
					details: { error: "jar_not_found", jarPath },
				};
			}

			// Auto-detect model path
			const modelPath = detectModelPath(resolvedCwd);
			if (!modelPath) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error: No .model file found in ${join(resolvedCwd, "model")}. Ensure a *.model file exists in the model/ directory.`,
						},
					],
					details: { error: "model_not_found", searchDir: join(resolvedCwd, "model") },
				};
			}

			// Build command args
			const baseArgs = ["-jar", jarPath, "-m", modelPath];
			let commandArgs: string[];

			switch (params.command) {
				case "graphql": {
					if (!params.query) {
						return {
							content: [
								{
									type: "text" as const,
									text: "Error: 'query' parameter is required for the graphql command.",
								},
							],
							details: { error: "missing_query" },
						};
					}
					commandArgs = [...baseArgs, "-q", "graphql", params.query];
					if (params.dryRun) {
						commandArgs.push("--dry-run");
					}
					break;
				}
				case "validate":
					commandArgs = [...baseArgs, "validate"];
					break;
				case "transform":
					commandArgs = [...baseArgs, "transform", "--load"];
					break;
				case "save":
					commandArgs = [...baseArgs, "save"];
					break;
				case "discard":
					commandArgs = [...baseArgs, "discard"];
					break;
				case "status":
					commandArgs = [...baseArgs, "status"];
					break;
				default:
					return {
						content: [
							{
								type: "text" as const,
								text: `Error: Unknown command '${params.command}'.`,
							},
						],
						details: { error: "unknown_command", command: params.command },
					};
			}

			// Append additional flags
			if (params.flags && params.flags.length > 0) {
				commandArgs.push(...params.flags);
			}

			// Execute
			try {
				const result = await spawnCli(commandArgs, resolvedCwd, signal);

				if (result.code !== 0) {
					const errorOutput = result.stderr.trim() || result.stdout.trim() || `Process exited with code ${result.code}`;
					return {
						content: [
							{
								type: "text" as const,
								text: `Error (exit code ${result.code}):\n${errorOutput}`,
							},
						],
						details: {
							command: params.command,
							exitCode: result.code,
							stderr: result.stderr,
							stdout: result.stdout,
						},
					};
				}

				const output = result.stdout.trim();

				// Track mutations on success
				if (params.command === "graphql" && params.query && params.query.trimStart().startsWith("mutation")) {
					mutationCount++;
					const info = parseMutationInfo(params.query);
					mutationLog.push({
						operation: info.operation,
						fqn: info.fqn,
						type: info.type,
						timestamp: Date.now(),
					});
				}

				// Reset mutation tracking on discard
				if (params.command === "discard") {
					resetMutations();
				}

				return {
					content: [
						{
							type: "text" as const,
							text: output || `Command '${params.command}' completed successfully.`,
						},
					],
					details: {
						command: params.command,
						exitCode: 0,
						mutationCount,
					},
				};
			} catch (err: any) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error executing CLI: ${err.message ?? String(err)}`,
						},
					],
					details: { error: "spawn_error", message: err.message ?? String(err) },
				};
			}
		},
	};
}
