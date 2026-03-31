# Database Schema Evolution Guide

## Overview

The `application/schema` module provides database schema migration capabilities for northwind. It uses Liquibase under the hood to perform incremental schema updates when the model evolves.

**Note**: Throughout this document, `northwind` refers to the application name from `judo.properties` (app_name property).

## Table of Contents

- [Quick Start Workflow](#quick-start-workflow)
- [Key Concepts](#key-concepts)
- [Migration Commands](#migration-commands)
- [Production Migration Strategy](#production-migration-strategy)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Quick Start Workflow

This section provides a condensed workflow for the most common migration task: generating and applying a schema update in a local development environment.

1.  **Ensure your model changes are built:**
    ```bash
    # From the project root
    cd application/model
    mvn clean install
    ```

2.  **Generate the migration scripts:**
    You need the `baseModelVersion` (current) and `updateModelVersion` (new). Find these in `application/model/pom.xml` or from your build logs.
    ```bash
    # From application/schema/
    mvn judo-rdbms-schema:generate \
      -DbaseModelVersion=<base_version> \
      -DupdateModelVersion=<update_version>
    ```

3.  **Apply the migration to your local database:**
    ```bash
    # From application/schema/
    mvn judo-rdbms-schema:execute \
      -DbaseModelVersion=<base_version> \
      -DupdateModelVersion=<update_version> \
      -DjdbcUrl=jdbc:postgresql://localhost:5432/northwind \
      -DdbUser=northwind \
      -DdbPassword=[password]
    ```

4.  **Start the application** to verify the changes:
    ```bash
    # From the project root
    ./judo.sh start
    ```

## Key Concepts

### What is Schema Evolution?

When you modify the ESM model (using Judo Designer), the database schema often needs to change:
- Adding/removing entities → Adding/removing tables
- Adding/removing attributes → Adding/removing columns
- Changing types → Altering column types
- Modifying relationships → Changing foreign keys

Schema evolution manages these database changes safely and incrementally.

**⚠️ IMPORTANT: When Schema Migration is Required**

Schema migration is **ONLY necessary when entity types change** in the model. The JUDO platform generates SQL schema from entity type definitions.

**Schema migration IS required when:**
- ✅ Adding/removing/modifying entity types (mapped entities)
- ✅ Adding/removing attributes on entity types
- ✅ Changing attribute types (String → Integer, etc.)
- ✅ Adding/removing relationships between entities
- ✅ Modifying entity inheritance hierarchy

**Schema migration is NOT required when:**
- ❌ Changing transfer object types (view models, DTOs)
- ❌ Modifying actors or access points
- ❌ Changing UI layouts or forms
- ❌ Adding/removing operations (unless they affect entity structure)
- ❌ Modifying validations or derived attributes (computed fields)

**Why?** The database schema is generated exclusively from **entity types**. Transfer objects, actors, and UI definitions exist only at runtime and do not affect the database structure.

### Schema Migration Module

**Location**: `application/schema/`

**Purpose**: CLI tool and Docker image for database migrations

**Key Features**:
- **Automatic migration script generation** from model versions
- **Incremental migrations** - migrate from any version to any version
- **Manual migration support** - custom SQL when needed
- **Docker image** - containerized migration tool
- **Multiple database support** - PostgreSQL, HSQLDB, etc.

## Module Structure

```
application/schema/
├── pom.xml                          # Schema module build configuration
├── migration/                       # Manual migration scripts directory
│   └── [manual-scripts].sql        # Custom SQL migrations
├── README.adoc                      # Original migration instructions
└── target/
    └── northwind-application-schema-[version].jar   # Executable JAR
```

## Schema Migration Workflow

### Step 1: Identify Model Versions

When migrating, you need two model versions:
- **Base version** (FROM): Current database schema version
- **Update version** (TO): Target database schema version

**Model versions** are embedded in the generated model artifacts and follow the pattern:
```
[version].[timestamp]_[git-commit]_[branch]
Example: 1.1.0.20210929_004050_9602796_develop
```

**Important**: This is the MODEL version (from `application/model/pom.xml`), NOT the application version.

### Step 2: Generate Migration Scripts

**Automatic generation** creates SQL scripts by comparing two model versions:

```bash
cd application/schema

# Generate migration SQL scripts
mvn judo-rdbms-schema:generate \
  -DbaseModelVersion=1.1.0.20210929_004050 \
  -DupdateModelVersion=1.2.0.20211021_085156 \
  -DdbType=postgresql

# Scripts are generated in: migration/ directory
```

**What gets generated:**
- DDL scripts for schema changes (ALTER TABLE, CREATE TABLE, DROP TABLE, etc.)
- Data migration scripts (if detectable)
- Stored as: `migration/[baseVersion]__[updateVersion].sql`

### Step 3: Manual Migration Scripts (Optional)

Sometimes automatic generation cannot handle complex migrations:
- Data transformations
- Complex logic changes
- Splitting/merging columns
- Custom data fixes

**Create manual SQL scripts** in `application/schema/migration/`:

```sql
-- migration/1.1.0__1.2.0_manual.sql

-- Custom data migration
UPDATE t_entity_user 
SET full_name = CONCAT(first_name, ' ', last_name)
WHERE full_name IS NULL;

-- Complex transformation
-- ... your custom SQL
```

### Step 4: Test Migration

**Always test migrations before production!**

```bash
# 1. Start with old version database
# Checkout old version, build, and run
git checkout v1.1.0
mvn clean install
./judo.sh start

# 2. Stop application (keep database running)
./judo.sh stop

# 3. Backup database
pg_dump -h localhost -U northwind northwind > backup_v1.1.0.sql

# 4. Execute migration
cd application/schema
mvn judo-rdbms-schema:execute \
  -DbaseModelVersion=1.1.0 \
  -DupdateModelVersion=1.2.0 \
  -DjdbcUrl=jdbc:postgresql://localhost:5432/northwind \
  -DdbType=postgresql \
  -DdbUser=northwind \
  -DdbPassword=[password]

# 5. Upgrade application
git checkout v1.2.0
mvn clean install -DskipDocker
./judo.sh start

# 6. Verify application works with migrated schema
```

### Step 5: Rollback (If Migration Fails)

If something goes wrong:

```bash
# 1. Stop database
docker stop northwind-postgres
# or: sudo systemctl stop postgresql

# 2. Remove database content
docker rm northwind-postgres
# or: dropdb northwind

# 3. Start fresh database
docker run -d --name northwind-postgres -e POSTGRES_DB=northwind -e POSTGRES_USER=northwind -e POSTGRES_PASSWORD=[password] -p 5432:5432 postgres:15

# 4. Restore from backup
psql -h localhost -U northwind -d northwind < backup_v1.1.0.sql

# 5. Start application with old version
git checkout v1.1.0
./judo.sh start
```

## Migration Commands

### Maven-Based Migrations

#### Apply Fresh Schema

Create schema from scratch (development):

```bash
cd application/schema

mvn judo-rdbms-schema:apply \
  -DjdbcUrl=jdbc:postgresql://localhost:5432/northwind \
  -DdbType=postgresql \
  -DdbUser=northwind \
  -DdbPassword=[password]
```

**Use case**: Fresh development database, testing

#### Generate Migration Scripts

Compare two model versions and generate SQL:

```bash
mvn judo-rdbms-schema:generate \
  -DbaseModelVersion=1.1.0.20210929_004050_9602796_develop \
  -DupdateModelVersion=1.2.0.20211021_085156_21efaed_develop \
  -DdbType=postgresql

# Output: migration/[base]__[update].sql
```

#### Execute Migration

Run migration from one version to another:

```bash
mvn judo-rdbms-schema:execute \
  -DbaseModelVersion=1.1.0.20210929_004050 \
  -DupdateModelVersion=1.2.0.20211021_085156 \
  -DjdbcUrl=jdbc:postgresql://localhost:5432/northwind \
  -DdbType=postgresql \
  -DdbUser=northwind \
  -DdbPassword=[password]
```

### Docker-Based Migrations

The schema module can be built as a **Docker image** for containerized migrations.

#### Build Docker Image

```bash
cd application/schema

# Build with Docker profile
mvn clean install -Pdocker

# Image created: northwind-application-schema:[version]
```

#### Run Migration with Docker

```bash
docker run --rm \
  northwind-application-schema:latest \
  execute \
  --baseModelVersion=1.1.0.20210929_004050_9602796_develop \
  --updateModelVersion=1.2.0.20211021_085156_21efaed_develop \
  --modelName=northwind \
  --incrementalDirectory=/ \
  --jdbcUrl=jdbc:postgresql://host.docker.internal:5432/northwind \
  --dbType=postgresql \
  --dbUser=northwind \
  --dbPassword=[password]
```

**Note**: Use `host.docker.internal` to access host database from container (Docker Desktop), or use actual hostname/IP.

#### Docker Compose Example

```yaml
version: '3.8'

services:
  db-migration:
    image: northwind-application-schema:${VERSION}
    command:
      - execute
      - --baseModelVersion=${BASE_VERSION}
      - --updateModelVersion=${UPDATE_VERSION}
      - --modelName=northwind
      - --jdbcUrl=jdbc:postgresql://postgres:5432/northwind
      - --dbType=postgresql
      - --dbUser=northwind
      - --dbPassword=${DB_PASSWORD}
    depends_on:
      - postgres
    networks:
      - app-network

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: northwind
      POSTGRES_USER: northwind
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:

volumes:
  postgres-data:
```

## Production Migration Strategy

### Recommended Approach

1. **Prepare Migration**
   ```bash
   # Generate and review migration scripts
   mvn judo-rdbms-schema:generate \
     -DbaseModelVersion=${CURRENT_PROD_VERSION} \
     -DupdateModelVersion=${NEW_VERSION}
   
   # Review generated SQL
   cat migration/${CURRENT_PROD_VERSION}__${NEW_VERSION}.sql
   ```

2. **Test in Staging**
   ```bash
   # Clone production database to staging
   # Execute migration on staging
   # Test application thoroughly
   ```

3. **Backup Production**
   ```bash
   # Full database backup
   pg_dump -h prod-db -U northwind northwind > prod_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Maintenance Window**
   ```bash
   # Stop application
   # Execute migration
   # Deploy new application version
   # Verify
   # Start application
   ```

5. **Verify and Monitor**
   - Check application logs
   - Verify data integrity
   - Monitor performance
   - Keep backup for quick rollback

### Blue-Green Deployment Consideration

For zero-downtime deployments:
- Ensure migrations are **backward compatible** when possible
- Use **additive changes** (add columns as nullable, add tables, etc.)
- Deploy application first, then remove deprecated schema elements later
- Consider **feature flags** for database-dependent features

## Configuration

### Model Version Configuration

Model version is typically set in `application/model/pom.xml`:

```xml
<properties>
    <model-version>1.2.0.${maven.build.timestamp}_${git.commit.id.abbrev}_${git.branch}</model-version>
</properties>
```

### Schema Module Properties

In `application/schema/pom.xml`:

```xml
<properties>
    <modelName>northwind</modelName>
    <incrementalDirectory>${basedir}/migration</incrementalDirectory>
    <updateModelArtifactVersion>${project.version}</updateModelArtifactVersion>
</properties>
```

## Troubleshooting

### Migration Fails with "Unknown version"

**Problem**: Cannot find model version in Maven repository

**Solution**:
```bash
# Ensure model is built and installed
cd application/model
mvn clean install

# Check version matches exactly
mvn dependency:tree | grep northwind-model
```

### Migration Scripts Not Generated

**Problem**: `migration/` directory is empty after generate

**Solution**:
- Check both model versions are valid and different
- Verify model artifacts exist in local Maven repo (`~/.m2/repository`)
- Check for errors in Maven output

### Migration Fails Halfway

**Problem**: Migration executed partially, database is in inconsistent state

**Solution**:
```bash
# Check Liquibase changelog lock
SELECT * FROM databasechangeloglock;

# Release lock if stuck
UPDATE databasechangeloglock SET locked = false;

# Restore from backup and retry
```

### Column Type Mismatch

**Problem**: Migration tries to change column type incompatibly

**Solution**:
- Create manual migration script
- Convert data explicitly:
  ```sql
  -- Add new column with new type
  ALTER TABLE t_entity_user ADD COLUMN age_new INTEGER;
  
  -- Convert data
  UPDATE t_entity_user SET age_new = CAST(age_old AS INTEGER);
  
  -- Drop old column
  ALTER TABLE t_entity_user DROP COLUMN age_old;
  
  -- Rename new column
  ALTER TABLE t_entity_user RENAME COLUMN age_new TO age;
  ```

### Docker Migration Cannot Connect to Database

**Problem**: `connection refused` or `unknown host`

**Solution**:
- Use `host.docker.internal` instead of `localhost` (Docker Desktop)
- Use `--network host` for Docker run
- Ensure database is accessible from container network
- Check firewall rules

## Best Practices

1. **Always backup before migration** - No exceptions in production
2. **Test migrations in staging** - Identical environment to production
3. **Review generated SQL** - Automatic isn't always correct
4. **Version control migrations** - Commit `migration/` directory
5. **Document manual steps** - Complex migrations need runbooks
6. **Use transactions** - Wrap migrations in transactions when possible
7. **Monitor migration time** - Large migrations may need downtime planning
8. **Keep old backups** - Retain backups across several versions
9. **Automate testing** - CI/CD should test migrations automatically
10. **Plan rollback strategy** - Know how to rollback before executing

## Integration with CI/CD

### GitLab CI Example

```yaml
migration-test:
  stage: test
  services:
    - postgres:15
  variables:
    POSTGRES_DB: northwind_test
    POSTGRES_USER: northwind
    POSTGRES_PASSWORD: test
  script:
    # Apply base schema
    - cd application/schema
    - mvn judo-rdbms-schema:apply -DjdbcUrl=jdbc:postgresql://postgres/northwind_test -DdbUser=northwind -DdbPassword=test
    # Generate migration
    - mvn judo-rdbms-schema:generate -DbaseModelVersion=${BASE_VERSION} -DupdateModelVersion=${CI_COMMIT_TAG}
    # Execute migration
    - mvn judo-rdbms-schema:execute -DbaseModelVersion=${BASE_VERSION} -DupdateModelVersion=${CI_COMMIT_TAG} -DjdbcUrl=jdbc:postgresql://postgres/northwind_test -DdbUser=northwind -DdbPassword=test
```

## See Also

- **Liquibase Documentation**: https://docs.liquibase.com/
- **Model Development**: Model Guide (see `judo-model-docs` skill) - For information on editing the ESM model.
- **Deployment Guides**: [Deployment Overview](./SKILL.md) - For the full build and deployment process.
- **Application Configuration**: [Application Config](./application-config.md) - For database connection settings.

## File Locations

- Schema module: `application/schema/`
- Migration scripts: `application/schema/migration/`
- Generated models: `application/model/target/generated-resources/model/`
- Liquibase changelogs: `application/model/target/generated-resources/model/northwind-liquibase_[db].changelog.xml`
- Schema JAR: `application/schema/target/northwind-application-schema-[version].jar`
