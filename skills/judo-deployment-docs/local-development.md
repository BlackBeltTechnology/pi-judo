# Local Development

This guide covers local development setup, hot deployment, and development workflows for the northwind project.

## Table of Contents

- [Development Server Setup](#development-server-setup)
- [Hot Deployment](#hot-deployment)
- [Development Workflow](#development-workflow)
- [Monitoring and Debugging](#monitoring-and-debugging)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Key Concepts

- **Hot Deployment**: A development feature that allows you to apply backend code changes to a running server without a full restart. This enables a fast and efficient development loop.
- **Karaf Console**: A command-line interface for the running Karaf server. It allows you to manage bundles, view logs, and change configurations at runtime.
- **Incremental Builds**: The process of building only the modules that have changed, rather than the entire application. This significantly speeds up the development workflow.

## Development Server Setup

### Starting Services

**Start all services:**
```bash
./judo.sh start
```

**What starts:**
- PostgreSQL (Docker container, port 5432)
- Keycloak (Docker container, port 8080)
- Karaf (standalone, port 8080 for app)

**Access points:**
- Application: http://localhost:8080
- Keycloak Admin: http://localhost:8080/auth/admin
- Karaf SSH: `ssh -p 8101 karaf@localhost` (password: karaf)

### Stopping Services

**Stop all services:**
```bash
./judo.sh stop
```

### Checking Status

**Check service status:**
```bash
./judo.sh status
```

## Hot Deployment

Hot deployment allows you to make changes and see them immediately without restarting the entire application.

### How It Works

1. Build module: `mvn install`
2. JAR installed to local Maven repo (`~/.m2/repository/`)
3. Karaf watches for changes
4. Bundle automatically updated
5. Services re-registered

### What Supports Hot Deployment

**Supports hot deployment:**
- Custom operations (`application/app/`)
- Interceptors (`application/interceptors/`)
- Frontend JAR (`application/frontend-react/`)
- REST endpoints (via bundle update)

**Requires restart:**
- Model changes (schema evolution)
- Configuration changes
- Feature definition changes

### Example Workflow

```bash
# 1. Start Karaf
./judo.sh start

# 2. Make changes in application/app/
vim application/app/src/main/java/.../CustomService.java

# 3. Build
cd application/app
mvn install

# 4. Watch Karaf logs
tail -f application/.karaf/data/log/karaf.log

# Output:
# Bundle updated: northwind-app
# Service registered: CustomAddressService

# 5. Test immediately - no restart needed
curl http://localhost:8080/api/entity/Address
```

## Development Workflow

### Rapid Iteration

For fast development cycles:

```bash
# 1. Start services once
./judo.sh start

# 2. Use reckless mode for fast builds
./judo.sh reckless

# 3. Make changes and rebuild specific modules
cd application/app
mvn install

# 4. Changes auto-deploy to running Karaf
```

### Incremental Builds

Build only changed modules:

```bash
# Backend code changed
cd application/app
mvn install

# Frontend changed
cd application/frontend-react/northwind__[actor_fqn]
mvn install

# Multiple modules
mvn install -pl application/app,application/interceptors
```

## Monitoring and Debugging

### Karaf Console

**Connect to Karaf console:**
```bash
./application/.karaf/bin/client
# or
ssh -p 8101 karaf@localhost
```

**Useful commands:**
```bash
# List bundles
bundle:list | grep northwind

# View bundle details
bundle:info northwind-app

# View services
service:list

# View logs
log:tail

# Restart bundle
bundle:restart northwind-app

# View configuration
config:list
```

### Logs

**Locations:**
- Karaf: `application/.karaf/data/log/karaf.log`
- Docker: `docker logs northwind-app`

**Tail logs:**
```bash
tail -f application/.karaf/data/log/karaf.log

# Filter errors
tail -f karaf.log | grep ERROR

# Watch bundle updates
tail -f karaf.log | grep "Bundle"
```

## Troubleshooting

### Runtime Issues

#### "Port 8080 already in use"

**Solution:**
- Check running processes: `lsof -i :8080`
- Stop conflicting service or change port

#### "Database connection failed"

**Solution:**
- Check PostgreSQL running: `docker ps | grep postgres`
- Restart PostgreSQL: `docker restart [container-name]`

#### "Keycloak authentication failed"

**Solution:**
- Check Keycloak running: `docker ps | grep keycloak`
- Verify Keycloak configuration in environment variables

#### "Bundle not starting"

**Solution:**
- Check dependencies: `bundle:diag [bundle-id]`
- View bundle details: `bundle:info [bundle-id]`
- Check logs: `log:tail`

### Hot Deployment Issues

#### "Changes not applied"

**Solution:**
- Verify bundle updated: `bundle:list -t 0`
- Check JAR timestamp: `ls -l ~/.m2/repository/.../northwind-app/`
- Force refresh: `bundle:update [bundle-id]`

#### "Service not registered"

**Solution:**
- Check bundle status: `bundle:list | grep northwind`
- Restart bundle: `bundle:restart [bundle-id]`
- Check for errors: `log:tail`

## Best Practices

### Development Workflow

1. **Keep Karaf running** - Leverage hot deployment instead of restarting
2. **Monitor logs** - Keep `tail -f karaf.log` in separate terminal
3. **Use incremental builds** - Build only what changed
4. **Use reckless mode** - For rapid iteration during development
5. **Test before committing** - Run full clean build before commits

### Performance Tips

1. **Use parallel builds** when building multiple modules:
   ```bash
   mvn install -T 4 -pl application/app,application/interceptors
   ```

2. **Skip unnecessary profiles** during development:
   ```bash
   mvn install -DskipDocker -DskipFrontendReact
   ```

3. **Keep dependencies cached** - Don't clean Maven repository frequently

### Environment Variables

**Frontend** (`.env` or export):
```bash
VITE_API_DEFAULT_BASE_URL=http://localhost:8080
VITE_KEYCLOAK_URL=http://localhost:8080/auth
VITE_KEYCLOAK_REALM=northwind
```

## Related Documentation

- [Build Process](./build-process.md) - Detailed build system documentation
- [Production Deployment](./production.md) - Production deployment guide
- [Deployment Overview](./SKILL.md) - Main deployment documentation
