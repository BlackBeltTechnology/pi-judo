# Tracing and Debugging (Read-Only)

The `model_cli` tool provides tracing capabilities for debugging query execution and understanding model resolution. This guide covers read-only debugging techniques.

## Verbose Mode

Enable verbose output to see detailed operation information:

```bash
model_cli --load --verbose query '{ entityTypes { name } }'
```

Verbose mode shows:
- Model loading progress and timing
- Query parsing and execution steps
- Resolved types and field mappings

## Trace Levels

Different trace levels provide varying detail:

```bash
# Basic operation logging
model_cli --load --trace=info query '{ ... }'

# Detailed execution tracing
model_cli --load --trace=debug query '{ ... }'

# Full diagnostic output (very verbose)
model_cli --load --trace=trace query '{ ... }'
```

## Debugging Queries

When a query returns unexpected results:

1. **Check the schema**: Use `__type` introspection to verify field names and types
2. **Simplify the query**: Start with a minimal query and add fields incrementally
3. **Enable tracing**: Use `--trace=debug` to see how the query is resolved
4. **Check filters**: Verify filter syntax matches the expected format

```bash
# Introspect to verify the type exists and has expected fields
model_cli --load query '{ __type(name: "Order") { fields { name type { name } } } }'
```

## Common Issues

- **Empty results**: The type name may be different from expected -- use `__schema` to list all types
- **Missing fields**: The field may not exist on the queried type -- introspect the type first
- **Filter not matching**: String filters are case-sensitive
- **Load failures**: The model directory may not contain valid ESM files

## Log Output

Trace output goes to stderr, allowing query results on stdout to be piped:

```bash
# Pipe query results while seeing traces on stderr
model_cli --load --trace=debug query '{ entityTypes { name } }' > result.json 2> trace.log
```

## Best Practices

- Use `--verbose` as the default when exploring a model
- Use `--trace=debug` when investigating specific query issues
- Start with `__schema` queries to get an overview of the model
- Use `__type` queries to drill into specific types before writing complex queries
