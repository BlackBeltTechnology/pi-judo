# Build Process

This guide covers the build system, Maven configuration, and build workflows for the northwind project.

## Table of Contents

- [judo.sh Script](#judosh-script)
- [Maven Commands](#maven-commands)
- [Build Profiles](#build-profiles)
- [Build Workflows](#build-workflows)
- [Maven Configuration](#maven-configuration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Key Concepts

- **Model Transformation**: The process of converting the high-level ESM model into more detailed PSM and ASM models, which are then used to generate code.
- **SDK Generation**: The process of creating the Java interfaces and DTOs that make up the application's API.
- **Reckless Mode**: A fast build mode for development that skips non-essential checks and enables caching.
- **Hot Deployment**: A development feature that allows you to apply backend code changes without restarting the server.

## Project Template and Generation

### How the Project is Generated

This project was initially generated using the **JUDO ESM Fullstack Project Template**:
- **Template Repository**: [judo-esm-fullstack-project-template](https://github.com/BlackBeltTechnology/judo-esm-fullstack-project-template)
- **Generator**: Uses Handlebars templates to create project skeleton
- **Configuration**: `generator-parameter.properties` file in project root

### generator-parameter.properties

This file controls how the project structure is generated from templates.

**Location:** `/generator-parameter.properties`

**Key Parameters:**

```properties
# Model Generation
sqlDialects=postgresql,hsqldb
validateModels=true
useCache=false
rdbmsCreateSimpleName=true              # Use simple table names in RDBMS

# Frontend
frontendType=react
defaultLanguage=en-US
tablePageLimit=10

# Modules to Generate
generateInterceptorModule=true
generateApplicationModule=true
generateSdkModule=true
generateRestModule=true
generateFrontendModule=true
generateDockerModule=true
generateKarafModule=true
```

### When to Check Templates Instead of Patching

**⚠️ IMPORTANT**: Before manually editing generated files (like `pom.xml`), check if the template supports a parameter.

**Why?**
- Manual edits may be overwritten on regeneration
- Template parameters are the proper way to configure generation
- Ensures consistency across regenerations

**Process:**

1. **Identify the generated file** you want to modify (e.g., `application/model/pom.xml`)

2. **Find the template** in [judo-esm-fullstack-project-template](https://github.com/BlackBeltTechnology/judo-esm-fullstack-project-template)
   - Example: `judo-esm-fullstack-project-template-application/src/main/resources/model/pom.xml.hbs`

3. **Check for conditional blocks** in the template:
   ```handlebars
   ```

4. **Add parameter** to `generator-parameter.properties` instead of manually editing
   ```properties
   rdbmsCreateSimpleName=true
   ```

5. **Regenerate** if needed, or apply manually for existing projects

**Example: Adding rdbmsCreateSimpleName**

Instead of manually editing `application/model/pom.xml`:
```xml
<!-- ❌ DON'T: Manual edit -->
<rdbmsCreateSimpleName>true</rdbmsCreateSimpleName>
```

Add to `generator-parameter.properties`:
```properties
# ✅ DO: Configure via parameter
rdbmsCreateSimpleName=true
```

### Common Generator Parameters

| Parameter | Purpose | Values | Default |
|-----------|---------|--------|---------|
| `rdbmsCreateSimpleName` | Simple RDBMS table names | `true`/`false` | `false` |
| `validateModels` | Enable model validation | `true`/`false` | `true` |
| `useCache` | Cache model transformations | `true`/`false` | `false` |
| `sqlDialects` | Target database dialects | `postgresql,hsqldb` | - |
| `frontendType` | Frontend framework | `react` | `react` |
| `generateDockerModule` | Generate Docker configs | `true`/`false` | `true` |

See `generator-parameter.properties` for complete list.

---

## judo.sh Script

Main orchestration script that simplifies common operations.

**Location:** `/judo.sh`

**Capabilities:**
- Environment setup (SDKMAN, tools)
- Model transformation
- Build orchestration
- Service lifecycle management (start/stop/status)
- Docker compose management

### Quick Reference Commands

```bash
# Build from scratch
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

## Maven Commands

### Essential Maven Commands

```bash
# Full build
mvn clean install

# Build specific profiles
mvn clean install -DskipFrontendReact  # Skip frontend
mvn clean install -DskipDocker         # Skip Docker
mvn clean install -DskipSchema         # Skip schema

# Build single module
cd application/app
mvn clean install

# Parallel build
mvn clean install -T 4                 # 4 threads
```

## Build Profiles

Control what gets built using Maven profiles:

### Available Profiles

| Profile | Description | Skip Flag | Default |
|---------|-------------|-----------|---------|
| `build-model` | Backend model transformation (ESM→PSM→ASM) | `-DskipBackendModels` | Enabled |
| `build-schema` | Database schema evolution scripts | `-DskipSchema` | Enabled |
| `build-sdk` | Java SDK API generation | `-DskipSDK` | Enabled |
| `build-frontend-react` | React frontend generation and build | `-DskipFrontendReact` | Enabled |
| `build-karaf` | Karaf runtime assembly | `-DskipKaraf` | Enabled |
| `build-docker` | Docker image creation | `-DskipDocker` | Enabled |

### Usage Examples

```bash
# Backend only (no frontend)
mvn clean install -DskipFrontendReact -DskipDocker

# Model changes only
mvn clean install -DskipFrontendReact -DskipKaraf -DskipDocker

# Everything except Docker
mvn clean install -DskipDocker
```

## Build Workflows

### Full Build Process

```bash
./judo.sh build
```

**Steps Executed:**
1. **Environment Check** - Verify Docker, Java, Maven
2. **Model Transformation**
   - Load `/model/northwind.model`
   - Generate ESM, PSM, ASM models
   - Create database schemas (see `docs/schema-evolution.md` for schema migration)
   - Generate expression models
3. **SDK Generation**
   - Create Java interfaces from ASM
   - Generate DAO and Service APIs
4. **Backend Compilation**
   - Compile SDK module
   - Compile custom operations (`app/`)
   - Compile interceptors
   - Compile REST endpoints
5. **Frontend Generation and Build**
   - Generate UI model from ESM
   - Generate React components
   - Run `pnpm install`
   - Run `pnpm build`
   - Package as JAR
6. **Karaf Assembly**
   - Collect all OSGi bundles
   - Create feature definitions
   - Assemble standalone distribution
7. **Docker Image** (optional)
   - Build container image
   - Include Karaf distribution

**Duration:**
- First build: 10-15 minutes
- Incremental: 3-5 minutes
- With cache: 1-2 minutes

### Incremental Build

Build only changed modules:

```bash
# Model changed
mvn clean install -pl application/model,application/sdk,application/rest

# Backend code changed
cd application/app
mvn install

# Frontend changed
cd application/frontend-react/northwind__[actor_fqn]
mvn install
```

### Reckless Mode

Fastest build for rapid iteration:

```bash
./judo.sh reckless
```

**What it does:**
- Enables Maven caching
- Disables validation
- Skips non-essential checks
- Uses incremental compilation

**Use for:**
- Rapid prototyping
- Frequent small changes
- Development iterations

**Don't use for:**
- Production builds
- Breaking changes
- Final testing

## Maven Configuration

### Distribution Repository

**Location:** `~/.m2/settings.xml`

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

### Memory Configuration

**Increase Maven memory for large builds:**

```bash
export MAVEN_OPTS="-Xmx4g"
```

## Troubleshooting

### Build Failures

#### "Model validation failed"

**Solution:**
- Check model file: `/model/northwind.model`
- Run: `mvn clean install -X` for detailed errors

#### "Could not resolve dependencies"

**Solution:**
- Check Maven settings: `~/.m2/settings.xml`
- Verify repository credentials
- Clear cache: `rm -rf ~/.m2/repository/hu/blackbelt`

#### "Frontend build failed"

**Solution:**
- Check Node.js version: `node --version` (should be 18+)
- Clear node_modules: `rm -rf node_modules && pnpm install`

#### "Out of memory"

**Solution:**
- Increase Maven memory: `export MAVEN_OPTS="-Xmx4g"`

## Best Practices

### Performance Optimization

1. **Parallel builds** - Use `-T` flag for Maven
   ```bash
   mvn clean install -T 4  # Use 4 threads
   ```

2. **Skip unnecessary profiles** - Don't build Docker in development
   ```bash
   mvn clean install -DskipDocker
   ```

3. **Cache dependencies** - Use local Maven mirror

### Development Workflow

1. **Use incremental builds** - Build only what changed
2. **Use reckless mode** - For rapid iteration
3. **Test before committing** - Full clean build

## Related Documentation

- [Local Development](./local-development.md) - Development environment and hot deployment
- [Production Deployment](./production.md) - Production build and deployment
- [Deployment Overview](./SKILL.md) - Main deployment documentation
