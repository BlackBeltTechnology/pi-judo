# Deployment Guide

This guide covers deployment configurations and environment setup for JUDO applications.

## Deployment Models

### Standalone JAR

The simplest deployment -- a single executable JAR containing the backend and frontend:

```bash
java -jar application/app/target/my-application.jar
```

### Docker Container

Package the application as a Docker image:

```dockerfile
FROM eclipse-temurin:17-jre
COPY application/app/target/my-application.jar /app/app.jar
COPY application/frontend/target/dist /app/frontend
EXPOSE 8080
CMD ["java", "-jar", "/app/app.jar"]
```

Build and run:

```bash
docker build -t my-judo-app .
docker run -p 8080:8080 my-judo-app
```

### WAR Deployment

Deploy to an external application server (Tomcat, WildFly):

```bash
cp application/app/target/my-application.war $TOMCAT_HOME/webapps/
```

## Environment Configuration

JUDO applications are configured through environment variables or property files:

| Variable                          | Default               | Description                     |
|-----------------------------------|-----------------------|---------------------------------|
| `JUDO_DATASOURCE_URL`            | `jdbc:h2:mem:app`     | Database JDBC URL               |
| `JUDO_DATASOURCE_USERNAME`       | `sa`                  | Database username               |
| `JUDO_DATASOURCE_PASSWORD`       | (empty)               | Database password               |
| `JUDO_SERVER_PORT`               | `8080`                | HTTP server port                |
| `JUDO_AUTH_SECRET`               | (generated)           | JWT signing secret              |
| `JUDO_AUTH_TOKEN_EXPIRY`         | `3600`                | Token expiry in seconds         |
| `JUDO_LOG_LEVEL`                 | `INFO`                | Application log level           |

## Database Setup

JUDO supports multiple databases:

- **H2** -- Embedded, for development and testing
- **PostgreSQL** -- Recommended for production
- **Oracle** -- Enterprise deployments

PostgreSQL example:

```bash
export JUDO_DATASOURCE_URL="jdbc:postgresql://localhost:5432/myapp"
export JUDO_DATASOURCE_USERNAME="appuser"
export JUDO_DATASOURCE_PASSWORD="secret"
```

## Schema Management

The JUDO runtime manages database schema automatically:
- On first startup, it creates tables from the ASM
- On subsequent startups, it applies schema migrations for model changes
- Set `JUDO_SCHEMA_UPDATE=validate` to prevent automatic schema changes in production

## Reverse Proxy

For production, deploy behind a reverse proxy (nginx, Apache):

```nginx
server {
    listen 443 ssl;
    server_name app.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Best Practices

- Use environment variables for all environment-specific configuration
- Never commit secrets to version control
- Use PostgreSQL for production deployments
- Set `JUDO_SCHEMA_UPDATE=validate` in production to prevent unintended schema changes
- Monitor application health through the `/health` endpoint
