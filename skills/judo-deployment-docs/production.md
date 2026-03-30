# Production Deployment

This guide covers production deployment, Docker deployment, environment configuration, and production best practices for the northwind project.

## Table of Contents

- [Production Build](#production-build)
- [Docker Deployment](#docker-deployment)
- [Environment Configuration](#environment-configuration)
- [Monitoring and Debugging](#monitoring-and-debugging)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Key Concepts

- **Production Build**: A build that is optimized for performance and security, with debugging information removed.
- **Docker Deployment**: The process of packaging the application and its dependencies into a Docker container for easy deployment and scaling.
- **Karaf Console**: A command-line interface for the running Karaf server. It allows you to manage bundles, view logs, and change configurations at runtime.

## Production Build

### Full Production Build

Build everything including Docker image:

```bash
./judo.sh build
```

Or with Maven directly:

```bash
mvn clean install
```

### Build Without Docker

If you're deploying to a non-Docker environment:

```bash
mvn clean install -DskipDocker
```

### Build Verification

Before deploying to production, verify:

1. **All tests pass:**
   ```bash
   mvn clean test
   ```

2. **Full clean build succeeds:**
   ```bash
   mvn clean install
   ```

3. **No snapshot dependencies:**
   ```bash
   mvn dependency:tree | grep SNAPSHOT
   # Should return nothing
   ```

## Docker Deployment

### Building Docker Image

The build process creates a Docker image when the `build-docker` profile is active (default):

```bash
./judo.sh build
```

**Output:**
- Docker context: `/application/docker/target/docker/`
- Docker image: Tagged with project version

### Docker Image Contents

The Docker image includes:
- Karaf standalone distribution
- All OSGi bundles
- Configuration files
- Runtime dependencies

### Running Docker Container

**Basic deployment:**
```bash
docker run -d \
  --name northwind-app \
  -p 8080:8080 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=northwind \
  -e DB_USER=postgres \
  -e DB_PASSWORD=yourpassword \
  [project-name]:latest
```

### Docker Compose

For complete stack deployment including database and Keycloak:

```bash
./judo.sh start
```

This uses Docker Compose to orchestrate:
- Application container
- PostgreSQL container
- Keycloak container

## Environment Configuration

### Maven Configuration

**Distribution Repository** (`~/.m2/settings.xml`):

```xml
<settings>
  <servers>
    <server>
      <id>[private-maven-repo]</id>
      <username>YOUR_USERNAME</username>
      <password>YOUR_PASSWORD</password>
    </server>
  </servers>
</settings>
```

### Environment Variables

#### Application Configuration

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=northwind
DB_USER=postgres
DB_PASSWORD=yourpassword

# Keycloak
KEYCLOAK_URL=http://localhost:8080/auth
KEYCLOAK_REALM=northwind
KEYCLOAK_CLIENT_ID=northwind-client

# Application
APP_PORT=8080
LOG_LEVEL=INFO
```

#### Frontend Configuration

**Frontend** (`.env` or export):

```bash
VITE_API_DEFAULT_BASE_URL=https://api.yourdomain.com
VITE_KEYCLOAK_URL=https://auth.yourdomain.com/auth
VITE_KEYCLOAK_REALM=northwind
```

### Karaf Configuration

Production Karaf configurations are located in:
- `application/karaf-offline/target/assembly/etc/`

**Important files:**
- `org.ops4j.datasource-northwind.cfg` - Database configuration
- `org.ops4j.pax.web.cfg` - Web server configuration
- `judo-runtime.cfg` - Application runtime configuration

## Monitoring and Debugging

### Logs

**Locations:**
- Karaf: `application/.karaf/data/log/karaf.log`
- Docker: `docker logs northwind-app`

**Tail logs:**
```bash
# Local Karaf
tail -f application/.karaf/data/log/karaf.log

# Docker container
docker logs -f northwind-app

# Filter errors
docker logs northwind-app | grep ERROR
```

### Karaf Console

**Connect to Karaf console:**

```bash
# Local
ssh -p 8101 karaf@localhost

# Docker
docker exec -it northwind-app /opt/karaf/bin/client
```

**Production monitoring commands:**

```bash
# Check bundle status
bundle:list | grep northwind

# Check for failed bundles
bundle:list | grep -i fail

# View service status
service:list

# Check memory usage
shell:jvm

# View active threads
thread:list

# Export diagnostics
bundle:diag > diagnostics.txt
```

### Health Checks

**Verify application health:**

```bash
# Check application endpoint
curl http://localhost:8080/health

# Check bundle status via SSH
ssh -p 8101 karaf@localhost "bundle:list" | grep Active

# Check database connectivity
ssh -p 8101 karaf@localhost "jdbc:datasources"
```

## Troubleshooting

### Deployment Issues

#### "Could not resolve dependencies"

**Solution:**
- Check Maven settings: `~/.m2/settings.xml`
- Verify repository credentials
- Check network connectivity to artifact repository

#### "Database connection failed"

**Solution:**
- Verify database is running and accessible
- Check database credentials in configuration
- Test connection: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME`

#### "Port already in use"

**Solution:**
- Check running processes: `lsof -i :8080`
- Stop conflicting service or change port
- For Docker: Check for orphaned containers: `docker ps -a`

### Runtime Issues

#### "Bundle not starting"

**Solution:**
- Check dependencies: `bundle:diag [bundle-id]`
- View detailed errors: `log:tail` or check log files
- Verify all required bundles are installed: `bundle:list`

#### "Out of memory"

**Solution:**
- Increase JVM memory in Karaf startup script
- Check for memory leaks: `shell:jvm`
- Review and optimize application code

## Best Practices

### Pre-Deployment Checklist

1. **Code Quality**
   - All tests passing
   - No snapshot dependencies
   - Code reviewed and approved

2. **Build Verification**
   - Clean build successful: `mvn clean install`
   - Docker image built successfully
   - All profiles activated

3. **Configuration**
   - Environment variables set correctly
   - Database credentials configured
   - Keycloak realm configured
   - SSL/TLS certificates in place

4. **Testing**
   - Integration tests passed
   - Performance tests completed
   - Security scan performed

### Deployment Process

1. **Backup current version**
   ```bash
   docker tag northwind-manager:latest northwind-manager:backup-$(date +%Y%m%d)
   ```

2. **Build new version**
   ```bash
   mvn clean install
   ```

3. **Test in staging environment**
   - Deploy to staging
   - Run smoke tests
   - Verify functionality

4. **Deploy to production**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

5. **Verify deployment**
   - Check logs for errors
   - Verify all bundles active
   - Test critical endpoints
   - Monitor performance

### Security Considerations

1. **Credentials**
   - Never commit credentials to version control
   - Use environment variables or secrets management
   - Rotate credentials regularly

2. **Network**
   - Use HTTPS in production
   - Configure firewall rules
   - Limit exposed ports

3. **Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Apply security patches promptly

### Performance Optimization

1. **Database**
   - Configure connection pooling
   - Optimize queries
   - Regular maintenance and vacuum

2. **JVM**
   - Tune heap size appropriately
   - Configure garbage collection
   - Monitor memory usage

3. **Karaf**
   - Remove unused bundles
   - Optimize start levels
   - Configure appropriate thread pools

### Backup and Recovery

1. **Database Backups**
   ```bash
   pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup-$(date +%Y%m%d).sql
   ```

2. **Configuration Backups**
   - Backup Karaf configuration directory
   - Backup environment variable definitions
   - Version control deployment scripts

3. **Recovery Plan**
   - Document rollback procedure
   - Test recovery process regularly
   - Maintain previous version images

## Related Documentation

- [Build Process](./build-process.md) - Detailed build system documentation
- [Local Development](./local-development.md) - Development environment setup
- [Deployment Overview](./SKILL.md) - Main deployment documentation
