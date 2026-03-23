# Troubleshooting

This guide covers common build and deployment issues in JUDO applications and their solutions.

## Build Issues

### Model Transformation Fails

**Symptom**: `./judo.sh build` fails during the transformation phase.

**Common Causes**:
- Syntax errors in model files
- Circular dependencies between entity types
- Invalid relation targets (referencing non-existent types)
- Constraint conflicts (e.g., min > max)

**Solution**:
```bash
# Validate the model separately to get detailed errors
model_cli --load transform --validate --verbose
```

### Custom Operation Compilation Error

**Symptom**: Java compilation fails for custom operation files.

**Common Causes**:
- Generated SDK changed after a model update (method signatures changed)
- Missing import for a renamed or new transfer object type
- Incompatible JUDO framework version

**Solution**:
```bash
# Rebuild from clean to regenerate all SDK classes
./judo.sh clean build

# Check the generated SDK for changed interfaces
ls application/sdk/target/generated-sources/
```

### Frontend Build Fails

**Symptom**: npm/webpack bundling fails during frontend build.

**Common Causes**:
- Node.js version mismatch
- Corrupted node_modules
- TypeScript errors in custom components referencing changed generated types

**Solution**:
```bash
# Clean and rebuild frontend dependencies
cd application/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Runtime Issues

### Application Fails to Start

**Symptom**: Application crashes on startup with model or database errors.

**Common Causes**:
- ASM artifacts not generated (build incomplete)
- Database connection failure
- Schema mismatch between ASM and existing database

**Solution**: Check logs for the root cause:
```bash
# Start with debug logging
JUDO_LOG_LEVEL=DEBUG java -jar application/app/target/my-application.jar
```

### Schema Migration Fails

**Symptom**: Application fails to start with database schema errors.

**Common Causes**:
- Incompatible schema changes (column type change, non-nullable column added without default)
- Database permissions insufficient for DDL operations
- Concurrent schema migrations from multiple application instances

**Solution**:
- Review the model change that caused the schema change
- Consider adding a default value for new required fields
- Run migration against a clean database to verify the schema
- Ensure only one application instance runs during migration

### Custom Operation Returns 500

**Symptom**: A custom operation returns an internal server error.

**Common Causes**:
- Unhandled exception in custom operation code
- NullPointerException from missing DAO injection
- Transaction timeout for long-running operations

**Solution**:
- Check application logs for the stack trace
- Ensure all dependencies are properly injected
- Add appropriate error handling to the custom operation
- Consider async processing for long-running operations

## Performance Issues

### Slow Queries

**Symptom**: Data grid loading is slow or timeouts occur.

**Solution**:
- Enable SQL logging (`JUDO_LOG_LEVEL=DEBUG` or `judo.runtime.logSql=true`)
- Check for N+1 query patterns in custom operations
- Use masks to limit fetched relations
- Add database indexes for frequently filtered columns

## Best Practices

- Always check logs first when diagnosing issues
- Use `./judo.sh clean build` when build state is uncertain
- Keep a known-working version for quick rollback
- Test schema migrations on a copy of production data before deploying
