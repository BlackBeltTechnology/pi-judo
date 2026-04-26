# Configuration Guide

## Overview

The northwind application is configured through **environment variables** defined in the `judo-karaf.env` file. This approach ensures configuration is externalized and can be easily changed without modifying code or configuration files.

**Note**: Throughout this document, `northwind` refers to the application name from `judo.properties` (app_name property). Use this value in database names, Keycloak realms, and other application-specific settings.

**Important**: Do NOT edit `.cfg` files in `application/karaf-offline/etc/` directly. Always use environment variables via `judo-karaf.env`.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Configuration Methods](#configuration-methods)
- [Parameter Naming Convention](#parameter-naming-convention)
- [Configuration Categories](#configuration-categories)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Reference

| Parameter | Example Value | Purpose |
| :--- | :--- | :--- |
| `JUDO_PLATFORM_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/northwind` | Database connection URL |
| `JUDO_PLAT-FORM_DATASOURCE_USERNAME`| `northwind` | Database username |
| `JUDO_PLAT-FORM_DATASOURCE_PASSWORD`| `secret` | Database password |
| `JUDO_PLATFORM_KEYCLOAK_AUTH_SERVER_URL`| `http://localhost:8080/auth` | Keycloak server URL |
| `JUDO_PLATFORM_KEYCLOAK_REALM` | `northwind` | Keycloak realm name |
| `JUDO_PLATFORM_KEYCLOAK_RESOURCE` | `northwind-client` | Keycloak client ID |
| `JUDO_PLATFORM_LOG_LEVEL` | `DEBUG` | Global log level |

---

## Configuration Methods

### Primary Method: judo-karaf.env (Recommended)

**Location:** `/judo-karaf.env`

**Usage:**
1. Edit `judo-karaf.env` in project root
2. Add or modify environment variables
3. Restart application: `./judo.sh stop && ./judo.sh start`

**Format:**
```bash
JUDO_PLATFORM_PARAMETER_NAME=value
```

**Example:**
```bash
# Database configuration
JUDO_PLATFORM_RDBMS_DIALECT=postgresql
JUDO_PLATFORM_DATASOURCE_URL=jdbc:postgresql://localhost:5432/northwind
JUDO_PLATFORM_DATASOURCE_USERNAME=northwind
JUDO_PLATFORM_DATASOURCE_PASSWORD=secret

# Keycloak configuration
JUDO_PLATFORM_KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080/auth
JUDO_PLATFORM_KEYCLOAK_REALM=northwind
JUDO_PLATFORM_KEYCLOAK_RESOURCE=northwind-client
```

### Alternative Methods (Not Recommended)

**Java System Properties:**
```bash
export JAVA_EXTRA_OPTS="-Djudo.platform.parameterName=value"
```

**Direct .cfg file editing** (avoid this):
- Files in `application/karaf-offline/etc/*.cfg`
- Changes are overwritten on rebuild
- Not portable across environments

## Parameter Naming Convention

### Environment Variables
- Prefix: `JUDO_PLATFORM_`
- Format: `SNAKE_CASE` (uppercase with underscores)
- Example: `JUDO_PLATFORM_RDBMS_DIALECT`

### Java System Properties / OSGi Config
- No prefix needed
- Format: `camelCase`
- Example: `rdbmsDialect`

### Conversion Rule
```
Environment Variable          → OSGi Parameter
JUDO_PLATFORM_RDBMS_DIALECT  → rdbmsDialect
JUDO_PLATFORM_KEYCLOAK_REALM → keycloakRealm
```

## Configuration Categories

### 1. Database (RDBMS)

**For database schema migration and evolution**, see: `docs/schema-evolution.md`

#### Connection Settings

**JUDO_PLATFORM_DATASOURCE_URL**
- **Description**: JDBC connection URL
- **Format**: `jdbc:<dialect>://<host>:<port>/<database>`
- **Example**:
  - PostgreSQL: `jdbc:postgresql://localhost:5432/northwind`
  - HSQLDB: `jdbc:hsqldb:mem:northwind`

**JUDO_PLATFORM_DATASOURCE_USERNAME**
- **Description**: Database username
- **Default**: None (required)
- **Example**: `northwind`

**JUDO_PLATFORM_DATASOURCE_PASSWORD**
- **Description**: Database password
- **Security**: Masked in logs
- **Example**: `secret`

**JUDO_PLATFORM_DATASOURCE_DRIVER_CLASS_NAME**
- **Description**: JDBC driver class
- **PostgreSQL**: `org.postgresql.Driver`
- **HSQLDB**: `org.hsqldb.jdbcDriver`

#### Dialect Configuration

**JUDO_PLATFORM_RDBMS_DIALECT**
- **Description**: Database dialect for SQL generation
- **Options**:
  - `postgresql` - PostgreSQL 9.5+
  - `hsqldb` - HSQLDB (for development/testing)
- **Default**: Detected from JDBC URL
- **Example**: `postgresql`

#### Connection Pool

**JUDO_PLATFORM_DATASOURCE_MAX_POOL_SIZE**
- **Description**: Maximum database connections in pool
- **Default**: `10`
- **Recommended**:
  - Development: `5-10`
  - Production: `20-50`

**JUDO_PLATFORM_DATASOURCE_MIN_POOL_SIZE**
- **Description**: Minimum idle connections
- **Default**: `2`

**JUDO_PLATFORM_DATASOURCE_CONNECTION_TIMEOUT**
- **Description**: Connection timeout in milliseconds
- **Default**: `30000` (30 seconds)

### 2. Keycloak (Security)

#### Server Configuration

**JUDO_PLATFORM_KEYCLOAK_AUTH_SERVER_URL**
- **Description**: Keycloak server URL
- **Format**: `http(s)://<host>:<port>/auth`
- **Example**: `http://localhost:8080/auth`
- **Required**: Yes

**JUDO_PLATFORM_KEYCLOAK_REALM**
- **Description**: Keycloak realm name
- **Example**: `northwind`
- **Required**: Yes

**JUDO_PLATFORM_KEYCLOAK_RESOURCE**
- **Description**: Client ID in Keycloak
- **Example**: `northwind-client`
- **Required**: Yes

**JUDO_PLATFORM_KEYCLOAK_CREDENTIALS_SECRET**
- **Description**: Client secret (for confidential clients)
- **Security**: Masked in logs
- **Example**: `a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6`

#### Security Settings

**JUDO_PLATFORM_KEYCLOAK_DEFAULT_PASSWORD_POLICY**
- **Description**: Password policy enforcement
- **Options**:
  - `SAME_EMAIL` - Password must differ from email
  - `STRONG` - Strong password requirements
  - `NONE` - No policy
- **Default**: `NONE`
- **Current**: `SAME_EMAIL` (see judo-karaf.env)

**JUDO_PLATFORM_SECURITY_PROVIDER**
- **Description**: Security implementation
- **Options**:
  - `keycloak` - Keycloak-based authentication
  - `none` - No authentication (development only)
- **Default**: `keycloak`

**JUDO_PLATFORM_KEYCLOAK_SSL_REQUIRED**
- **Description**: Require SSL for Keycloak communication
- **Options**: `external`, `none`, `all`
- **Default**: `external`
- **Production**: Should be `all`

### 3. REST API

**JUDO_PLATFORM_REST_API_ROOT**
- **Description**: Base path for REST API
- **Default**: `/api`
- **Example**: `http://localhost:8080/api`

**JUDO_PLATFORM_REST_CORS_ENABLED**
- **Description**: Enable CORS (Cross-Origin Resource Sharing)
- **Options**: `true`, `false`
- **Default**: `true`
- **Production**: Configure allowed origins

**JUDO_PLATFORM_REST_CORS_ALLOWED_ORIGINS**
- **Description**: Allowed CORS origins
- **Format**: Comma-separated list
- **Example**: `http://localhost:3000,https://app.example.com`
- **Default**: `*` (all origins - development only)

**JUDO_PLATFORM_SWAGGER_UI**
- **Description**: Enable Swagger UI for API documentation
- **Options**: `true`, `false`
- **Default**: `true`
- **Production**: Consider `false` for security

**JUDO_PLATFORM_SWAGGER_UI_PATH**
- **Description**: Path to Swagger UI
- **Default**: `/swagger-ui`
- **Example**: `http://localhost:8080/swagger-ui`

### 4. File Storage

**JUDO_PLATFORM_FILESTORE**
- **Description**: File storage backend
- **Options**:
  - `rdbms` - Store in database (current setting)
  - `filesystem` - Store in filesystem
  - `s3` - Store in AWS S3
- **Default**: `rdbms`
- **Current**: `rdbms` (see judo-karaf.env)

**JUDO_PLATFORM_FILESTORE_PATH**
- **Description**: Filesystem path for files (if `filestore=filesystem`)
- **Example**: `/var/lib/northwind/files`

**JUDO_PLATFORM_FILESTORE_S3_BUCKET**
- **Description**: S3 bucket name (if `filestore=s3`)
- **Example**: `northwind-files`

### 5. Identifier Generation

**JUDO_PLATFORM_IDENTIFIER_PROVIDER**
- **Description**: Strategy for generating identifiers
- **Options**:
  - `uuid` - UUID-based identifiers
  - `sequence` - Database sequences
- **Default**: `uuid`

**JUDO_PLATFORM_IDENTIFIER_SIGNER_SECRET**
- **Description**: Secret key for signing identifiers
- **Security**: Masked in logs
- **Format**: Base64-encoded key
- **Current**: Set in judo-karaf.env
- **Important**: Change default in production!

### 6. Email (SMTP)

**JUDO_PLATFORM_MAIL_SMTP_HOST**
- **Description**: SMTP server hostname
- **Example**: `smtp.gmail.com`

**JUDO_PLATFORM_MAIL_SMTP_PORT**
- **Description**: SMTP server port
- **Default**: `25` (plain), `587` (TLS), `465` (SSL)
- **Example**: `587`

**JUDO_PLATFORM_MAIL_SMTP_USERNAME**
- **Description**: SMTP authentication username
- **Example**: `notifications@example.com`

**JUDO_PLATFORM_MAIL_SMTP_PASSWORD**
- **Description**: SMTP authentication password
- **Security**: Masked in logs

**JUDO_PLATFORM_MAIL_SMTP_AUTH**
- **Description**: Enable SMTP authentication
- **Options**: `true`, `false`
- **Default**: `false`

**JUDO_PLATFORM_MAIL_SMTP_STARTTLS_ENABLE**
- **Description**: Enable STARTTLS encryption
- **Options**: `true`, `false`
- **Default**: `false`
- **Recommended**: `true` for production

**JUDO_PLATFORM_LOG_SMTP_SERVER**
- **Description**: Log SMTP server interactions
- **Options**: `true`, `false`
- **Default**: `false`
- **Current**: `true` (see judo-karaf.env)

**JUDO_PLATFORM_MAIL_FROM**
- **Description**: Default "from" email address
- **Example**: `noreply@northwind.example.com`

### 7. Model and DAO

**JUDO_PLATFORM_DAO**
- **Description**: Data Access Object implementation
- **Options**:
  - `rdbms` - RDBMS-based DAO
- **Default**: `rdbms`

**JUDO_PLATFORM_MODEL_NAME**
- **Description**: Model identifier
- **Default**: Detected from deployed model
- **Example**: `northwind`

### 8. Logging

**JUDO_PLATFORM_LOG_LEVEL**
- **Description**: Global log level
- **Options**: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`
- **Default**: `INFO`
- **Development**: `DEBUG`
- **Production**: `INFO` or `WARN`

**JUDO_PLATFORM_LOG_SQL**
- **Description**: Log SQL statements
- **Options**: `true`, `false`
- **Default**: `false`
- **Development**: Can enable for debugging

### 9. Performance and Caching

**JUDO_PLATFORM_CACHE_ENABLED**
- **Description**: Enable entity caching
- **Options**: `true`, `false`
- **Default**: `false`
- **Production**: Consider `true` for performance

**JUDO_PLATFORM_CACHE_SIZE**
- **Description**: Maximum cache entries
- **Default**: `1000`

**JUDO_PLATFORM_QUERY_TIMEOUT**
- **Description**: Query timeout in seconds
- **Default**: `30`

## Configuration Precedence

When a parameter is set in multiple places, the following precedence applies (highest to lowest):

1. **OSGi Configuration** (.cfg files) - Not recommended
2. **Java System Properties** (`-D` flags)
3. **Environment Variables** (`JUDO_PLATFORM_*`) - **Recommended**

**Best Practice**: Use environment variables via `judo-karaf.env` exclusively.

## Current Configuration

The project's current configuration is defined in `/judo-karaf.env`:

```bash
# Identifier signing (security)
JUDO_PLATFORM_IDENTIFIER_SIGNER_SECRET=<base64-encoded-secret>

# Keycloak password policy
JUDO_PLATFORM_KEYCLOAK_DEFAULT_PASSWORD_POLICY=SAME_EMAIL

# SMTP logging (development)
JUDO_PLATFORM_LOG_SMTP_SERVER=true

# File storage backend
JUDO_PLATFORM_FILESTORE=rdbms
```

## Environment-Specific Configuration

### Development (Local)

**judo-karaf.env:**
```bash
# Database - HSQLDB (in-memory)
JUDO_PLATFORM_RDBMS_DIALECT=hsqldb
JUDO_PLATFORM_DATASOURCE_URL=jdbc:hsqldb:mem:northwind
JUDO_PLATFORM_DATASOURCE_USERNAME=sa
JUDO_PLATFORM_DATASOURCE_PASSWORD=

# Keycloak - Local
JUDO_PLATFORM_KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080/auth
JUDO_PLATFORM_KEYCLOAK_REALM=northwind
JUDO_PLATFORM_KEYCLOAK_RESOURCE=northwind-client

# Development settings
JUDO_PLATFORM_SWAGGER_UI=true
JUDO_PLATFORM_LOG_LEVEL=DEBUG
JUDO_PLATFORM_LOG_SQL=true
```

### Production

**judo-karaf.env:**
```bash
# Database - PostgreSQL
JUDO_PLATFORM_RDBMS_DIALECT=postgresql
JUDO_PLATFORM_DATASOURCE_URL=jdbc:postgresql://db.example.com:5432/northwind
JUDO_PLATFORM_DATASOURCE_USERNAME=northwind_prod
JUDO_PLATFORM_DATASOURCE_PASSWORD=${DB_PASSWORD}  # From secrets management
JUDO_PLATFORM_DATASOURCE_MAX_POOL_SIZE=30

# Keycloak - Production
JUDO_PLATFORM_KEYCLOAK_AUTH_SERVER_URL=https://auth.example.com/auth
JUDO_PLATFORM_KEYCLOAK_REALM=northwind-prod
JUDO_PLATFORM_KEYCLOAK_RESOURCE=northwind-prod-client
JUDO_PLATFORM_KEYCLOAK_CREDENTIALS_SECRET=${KEYCLOAK_SECRET}
JUDO_PLATFORM_KEYCLOAK_SSL_REQUIRED=all

# Production security
JUDO_PLATFORM_IDENTIFIER_SIGNER_SECRET=${SIGNER_SECRET}
JUDO_PLATFORM_KEYCLOAK_DEFAULT_PASSWORD_POLICY=STRONG

# Production settings
JUDO_PLATFORM_SWAGGER_UI=false
JUDO_PLATFORM_LOG_LEVEL=INFO
JUDO_PLATFORM_REST_CORS_ALLOWED_ORIGINS=https://app.example.com
JUDO_PLATFORM_CACHE_ENABLED=true

# Email
JUDO_PLATFORM_MAIL_SMTP_HOST=smtp.example.com
JUDO_PLATFORM_MAIL_SMTP_PORT=587
JUDO_PLATFORM_MAIL_SMTP_USERNAME=notifications@example.com
JUDO_PLATFORM_MAIL_SMTP_PASSWORD=${SMTP_PASSWORD}
JUDO_PLATFORM_MAIL_SMTP_AUTH=true
JUDO_PLATFORM_MAIL_SMTP_STARTTLS_ENABLE=true
JUDO_PLATFORM_MAIL_FROM=noreply@northwind.example.com
```

## Applying Configuration Changes

### Method 1: Restart Application (Recommended)

```bash
# Edit judo-karaf.env
vim judo-karaf.env

# Restart
./judo.sh stop
./judo.sh start
```

### Method 2: Karaf Console (Runtime Changes)

Some parameters can be changed at runtime via Karaf console:

```bash
# Connect to Karaf
./application/.karaf/bin/client

# Update config (temporary until restart)
config:edit hu.blackbelt.judo.runtime
config:property-set parameterName newValue
config:update

# View current config
config:list
```

**Note**: Runtime changes via console are lost on restart. Always update `judo-karaf.env` for persistence.

## Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:
```
judo-karaf.env
*.env
```

### 2. Use Environment-Specific Files

```bash
# Development
judo-karaf.env.development

# Production (never commit)
judo-karaf.env.production
```

### 3. Use Secrets Management

For production, inject secrets from:
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- Kubernetes Secrets

**Example with placeholders:**
```bash
# judo-karaf.env.production.template
JUDO_PLATFORM_DATASOURCE_PASSWORD=${DB_PASSWORD}
JUDO_PLATFORM_IDENTIFIER_SIGNER_SECRET=${SIGNER_SECRET}
```

### 4. Rotate Secrets Regularly

- Change `JUDO_PLATFORM_IDENTIFIER_SIGNER_SECRET` periodically
- Update `JUDO_PLATFORM_KEYCLOAK_CREDENTIALS_SECRET`
- Rotate database passwords

### 5. Principle of Least Privilege

- Database user should have minimal required permissions
- Keycloak client should have minimal scopes

## Troubleshooting

### Configuration Not Applied

**Symptom**: Changes to `judo-karaf.env` not reflected

**Solutions:**
1. Ensure application was restarted: `./judo.sh stop && ./judo.sh start`
2. Check environment variable name matches convention
3. Verify no typos in parameter names
4. Check Karaf logs: `tail -f application/.karaf/data/log/karaf.log`

### Viewing Effective Configuration

**Check loaded parameters:**
```bash
# In Karaf console
./application/.karaf/bin/client

# List all JUDO platform configs
config:list | grep judo

# View specific config
config:list "(service.pid=hu.blackbelt.judo.runtime)"
```

### Parameter Masked in Logs

**Symptom**: Can't see parameter value in logs

**Reason**: Parameters containing "Password" or "Secret" are automatically masked for security

**Solution**: Check configuration source (judo-karaf.env) directly

### Database Connection Failed

**Check these parameters:**
```bash
JUDO_PLATFORM_DATASOURCE_URL=jdbc:postgresql://localhost:5432/northwind
JUDO_PLATFORM_DATASOURCE_USERNAME=northwind
JUDO_PLATFORM_DATASOURCE_PASSWORD=secret
JUDO_PLATFORM_RDBMS_DIALECT=postgresql
```

**Test connection:**
```bash
psql -h localhost -U northwind -d northwind
```

### Keycloak Authentication Failed

**Check these parameters:**
```bash
JUDO_PLATFORM_KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080/auth
JUDO_PLATFORM_KEYCLOAK_REALM=northwind
JUDO_PLATFORM_KEYCLOAK_RESOURCE=northwind-client
```

**Verify Keycloak running:**
```bash
curl http://localhost:8080/auth/realms/northwind
```

## Reference Documentation

For comprehensive parameter documentation, see:
- **JUDO Platform Parameters**: https://internal-documentation.judo.technology/administrator-guide/03_platform_parameters.html

## File Locations

- Configuration file: `/judo-karaf.env`
- Karaf config directory: `/application/karaf-offline/etc/`
- Runtime logs: `/application/.karaf/data/log/karaf.log`
- Application POM: `/application/pom.xml`

## Related Documentation

- **Deployment Guides**: `../deployment/` - For the build and deployment process.
- **Backend Guides**: `../backend/` - For guides on custom operations and other backend topics.
- **AGENTS.md**: For a complete project overview.
