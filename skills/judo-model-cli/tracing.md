# Tracing and Debugging

The `model_cli` tool provides tracing capabilities for debugging model operations, understanding query execution, and diagnosing transformation issues.

## Verbose Mode

Enable verbose output to see detailed operation information:

```bash
model_cli --load --verbose query '{ entityTypes { name } }'
```

Verbose mode shows:
- Model loading progress and timing
- Query parsing and execution steps
- Resolved types and field mappings
- Transformation phases and timings

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

## Debugging Mutations

When a mutation fails:

1. **Check the error message**: The CLI reports validation errors with field details
2. **Query before mutating**: Verify the current state of the element being modified
3. **Validate references**: Ensure referenced types (relation targets, enum types) exist
4. **Use tracing**: `--trace=debug` shows mutation validation steps

```bash
# Check if the target type exists before creating a relation
model_cli --load query '{ entityTypes(filter: { name: { eq: "Customer" } }) { name } }'
```

## Debugging Transformation

Transformation errors indicate model inconsistencies:

```bash
# Run transformation with full tracing
model_cli --load --trace=debug transform --validate
```

Common transformation issues:
- **Unresolved references**: A relation targets a non-existent type
- **Circular compositions**: Two types compose each other
- **Missing mappings**: A TO field maps to a non-existent entity field
- **Constraint conflicts**: Incompatible constraints on inherited fields

## Log Output

Trace output goes to stderr, allowing query results on stdout to be piped:

```bash
# Pipe query results while seeing traces on stderr
model_cli --load --trace=debug query '{ entityTypes { name } }' > result.json 2> trace.log
```

## Best Practices

- Use `--verbose` as the default when developing
- Use `--trace=debug` when investigating specific issues
- Redirect trace output to a file for complex debugging sessions
- Always validate the model after a series of mutations
