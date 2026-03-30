---
name: judo-deployment-docs
description: Deployment and build documentation for JUDO applications. Covers judo.sh commands, Docker setup, Karaf configuration, and production deployment.
disable-model-invocation: false
user-invocable: false
agent: general-purpose
---

# Deployment Documentation

## Overview

The {{ lowerCase model.name \}} project uses a sophisticated build system orchestrated by `judo.sh` script and Maven. This documentation provides comprehensive guidance for building, deploying, and troubleshooting the application.

**Note**: Throughout this documentation, `{{ lowerCase model.name \}}` refers to the application name from `judo.properties` (app_name property). This value is used in artifact names, bundle names, and deployment configurations.

## Quick Reference

### Essential Commands

```bash
# Build from scratch (WARNING: Takes several minutes for complete project)
./judo.sh build

# Build and start
./judo.sh build start

# Stop services
./judo.sh stop

# Check status
./judo.sh status

# Fast iteration mode
./judo.sh reckless

# Clean everything
./judo.sh clean

# View help
./judo.sh --help
```

> **Important**: A full `./judo.sh build` for the complete project can take **several minutes** (5-15+ minutes depending on hardware). When running in automated environments or background processes, ensure appropriate timeouts are configured. Never run multiple concurrent builds as they will conflict.

> **Critical for AI Agents**: The `judo.sh` script uses **mvnd (Maven Daemon)** which requires a stable PTY (pseudo-terminal) environment. When running `judo.sh` commands from automated/background processes:
>
> 1. **Always use `screen` or `tmux`** to provide a stable terminal session
> 2. **Check for availability first** - if neither `screen` nor `tmux` is installed, **terminate the task and notify the user**
> 3. Running without a session manager will cause `StaleAddressException` errors due to daemon communication failures
>
> Example usage with screen:
> ```bash
> # Check if screen or tmux is available
> command -v screen || command -v tmux || { echo "ERROR: screen or tmux required for judo.sh"; exit 1; }
>
> # Start build in detached screen session
> screen -dmS judo-build bash -c './judo.sh build 2>&1 | tee /tmp/judo-build.log'
>
> # Monitor progress
> tail -f /tmp/judo-build.log
>
> # Or check screen output directly
> screen -r judo-build
> ```

### Common Workflows

- **First-time setup**: `./judo.sh build start`
- **Development iteration**: `./judo.sh reckless` (fast builds)
- **Production build**: `./judo.sh build -DskipDocker=false`
- **Stop all services**: `./judo.sh stop`

## Deployment Guides

This documentation is organized into context-specific guides:

### [Build Process](./build-process.md)
Comprehensive guide to the build system:
- judo.sh command reference
- Maven profiles and configuration
- Build workflows (full, incremental, reckless)
- Build system architecture
- Performance optimization

### [Local Development](./local-development.md)
Development environment setup and workflow:
- Hot deployment explained
- Development server setup
- Local deployment workflow
- Troubleshooting local development
- Development best practices

### [Production Deployment](./production.md)
Production deployment guide:
- Production deployment process
- Docker deployment
- Environment configuration
- Production best practices
- Monitoring and debugging

### [Application Configuration](./application-config.md)
Configuration for different environments:
- Environment variables
- `judo-karaf.env` file
- Security and database settings

### [Schema Evolution](./schema-evolution.md)
Database schema management:
- Liquibase changelog generation
- Migration strategies
- Schema versioning

### [Tooling Guide](./tooling-guide.md)
Development tooling and utilities:
- Build tool configuration
- IDE setup
- Debugging tools

## Build System Architecture

### Components

```
judo.sh (orchestration)
    ↓
Maven (build tool)
    ├→ Model Transformation (application/model/)
    ├→ Schema Generation (application/schema/)
    ├→ SDK Generation (application/sdk/)
    ├→ Backend Compilation (application/app/, interceptors/)
    ├→ Frontend Generation (application/frontend-react/)
    ├→ Karaf Assembly (application/karaf-offline/)
    └→ Docker Image (application/docker/)
```

## File Locations Reference

- Build script: `/judo.sh`
- Root POM: `/pom.xml`
- Application POM: `/application/pom.xml`
- Karaf distribution: `/application/karaf-offline/target/assembly/`
- Docker context: `/application/docker/target/docker/`
- Runtime logs: `/application/.karaf/data/log/karaf.log`

## Access Points

When services are running locally:

- **Application**: http://localhost:8181/apps/
- **API Spec**: http://localhost:8181/api-spec/{{ lowerCase model.name \}}
- **Health Check**: http://localhost:8181/system/health?tags={{ lowerCase model.name \}}
- **Keycloak Admin**: http://localhost:8080
- **Karaf SSH**: `ssh -p 8101 karaf@localhost` (password: karaf)

## Health Check Endpoint

Check backend health at: `http://localhost:8181/system/health?tags={{ lowerCase model.name \}}`

### Response Format

**HTML format** (default):
```
http://localhost:8181/system/health?tags={{ lowerCase model.name \}}
```

**JSON format** (recommended for automation):
```
http://localhost:8181/system/health?tags={{ lowerCase model.name \}}&format=json
```

### JSON Response Structure

```json
{
    "overallResult": "OK",
    "results": [
        {
            "name": "ModelsCheck",
            "status": "OK",
            "timeInMs": 0,
            "finishedAt": "2025-12-02T20:45:21.339",
            "tags": ["{{ lowerCase model.name \}}"],
            "messages": [
                {
                    "status": "OK",
                    "message": "All models are active"
                }
            ]
        },
        {
            "name": "OperationsCheck",
            "status": "OK",
            "timeInMs": 0,
            "finishedAt": "2025-12-02T20:45:21.339",
            "tags": ["{{ lowerCase model.name \}}"],
            "messages": [
                {
                    "status": "OK",
                    "message": "All operations are active"
                }
            ]
        },
        {
            "name": "PlatformComponentsCheck",
            "status": "OK",
            "timeInMs": 10,
            "finishedAt": "2025-12-02T20:45:21.349",
            "tags": ["{{ lowerCase model.name \}}"],
            "messages": [
                {
                    "status": "OK",
                    "message": "All platform components are active"
                }
            ]
        }
    ]
}
```

### Health Check Status Values

| Status | Description | CSS Class |
|--------|-------------|-----------|
| `OK` | All checks passed | `statusOK` (green) |
| `WARN` | Warning condition | `statusWARN` (yellow) |
| `TEMPORARILY_UNAVAILABLE` | Temporary issue | `statusTEMPORARILY_UNAVAILABLE` (purple) |
| `CRITICAL` | Critical failure | `statusCRITICAL` (orange) |
| `HEALTH_CHECK_ERROR` | Check itself failed | `statusHEALTH_CHECK_ERROR` (red) |

### Health Checks Performed

1. **ModelsCheck** - Verifies all JUDO models are active
2. **OperationsCheck** - Verifies all operations are registered and active
3. **PlatformComponentsCheck** - Verifies all platform OSGi components are active

### URL Parameters

| Parameter | Description |
|-----------|-------------|
| `tags` | Comma-separated list of health check tags (e.g., `{{ lowerCase model.name \}}`) |
| `names` | Comma-separated list of specific health check names |
| `format` | Output format: `html`, `json`, `jsonp`, `txt`, `verbose.txt` |
| `httpStatus` | Custom HTTP status mapping (e.g., `CRITICAL:503`) |
| `timeout` | Timeout in milliseconds for health checks |
| `forceInstantExecution` | If `true`, bypasses cache and executes checks immediately |

### Example: Check Health with curl

```bash
# HTML format (human-readable)
curl "http://localhost:8181/system/health?tags={{ lowerCase model.name \}}"

# JSON format (for scripts/automation)
curl -s "http://localhost:8181/system/health?tags={{ lowerCase model.name \}}&format=json" | jq .

# Check overall status only
curl -s "http://localhost:8181/system/health?tags={{ lowerCase model.name \}}&format=json" | jq -r '.overallResult'
```

## Next Steps

1. **New to the project?** Start with [Local Development](./local-development.md)
2. **Building for production?** See [Production Deployment](./production.md)
3. **Understanding the build?** Read [Build Process](./build-process.md)
