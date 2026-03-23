# Model Transformation

JUDO models go through a transformation pipeline from the platform-independent ESM to the runtime-ready ASM. The `model_cli` tool drives this transformation.

## Transformation Pipeline

```
ESM (Entity State Model)
  |
  v  [ESM → PSM transformation]
PSM (Platform-Specific Model)
  |
  v  [PSM → ASM transformation]
ASM (Application-Specific Model)
```

### ESM (Entity State Model)

The developer-authored model. Contains entity types, transfer objects, relations, enumerations, access points, and operations in a platform-independent format.

### PSM (Platform-Specific Model)

Generated from the ESM. Adds platform-specific details such as:
- Database table and column mappings
- REST endpoint paths
- Java package and class names
- Platform-specific type resolutions

### ASM (Application-Specific Model)

The final model artifact consumed by the JUDO runtime. Contains fully resolved types, generated code metadata, and deployment descriptors.

## Running Transformation

```bash
# Load ESM and transform to ASM
model_cli --load transform

# Transform with verbose output
model_cli --load transform --verbose

# Transform and validate the result
model_cli --load transform --validate
```

## The --load Flag

The `--load` flag is required for most `model_cli` operations. It loads the ESM from the model directory before executing the command:

```bash
# Load is required before querying
model_cli --load query '{ entityTypes { name } }'

# Load is required before mutations
model_cli --load mutate '{ ... }'

# Load is required before transformation
model_cli --load transform
```

Without `--load`, the CLI has no model to operate on and will fail.

## Incremental vs Full Transformation

- **Full transformation**: Regenerates all PSM and ASM artifacts from scratch
- **Incremental**: Only regenerates artifacts affected by model changes (when supported)

## Post-Transformation

After transformation, the application needs to be rebuilt to pick up the regenerated code:

```bash
# Typical workflow
model_cli --load mutate '{ ... }'   # Modify the model
model_cli --load transform           # Regenerate PSM/ASM
./judo.sh build                       # Rebuild the application
```

## Validation

The transformation validates the model and reports errors:
- Missing required fields
- Invalid relation targets
- Circular dependencies
- Constraint conflicts
- Duplicate names

## Best Practices

- Always transform after model mutations
- Review transformation output for warnings
- Run validation before committing model changes
- Keep the transformation pipeline fast by using incremental mode when available
