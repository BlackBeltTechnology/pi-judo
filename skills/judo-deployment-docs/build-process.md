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

### Extending Generated Files via Fragment Overrides

Some generated files (mostly `pom.xml` and `feature.xml`) cannot be fully controlled by template parameters because they need to carry project-specific content (extra dependencies, plugins, bundles, …). For these, the templates expose **named fragment extension points** that you can fill in without touching the generated output.

**How to spot one:** generated files contain paired marker comments like

```xml
<!-- To define create 'app/pom.xml.extra-dependencies.fragment.hbs' file -->
<!-- End of 'app/pom.xml.extra-dependencies.fragment.hbs' -->
```

By default the fragment resolves to an empty stub from the template jar. You override it by dropping a file with the **same relative path and name** into the override directory.

**Override directory:** `application/generator-overrides/` (wired into the generator invocation in the root `pom.xml` via `<uri>${maven.multiModuleProjectDirectory}/application/generator-overrides</uri>`; a second override root `generator-overrides/` exists for the project-root generator step).

**Worked example — add a runtime dependency to `application/app/pom.xml`:**

1. Locate the marker in `application/app/pom.xml`:
   ```xml
   <!-- To define create 'app/pom.xml.extra-dependencies.fragment.hbs' file -->
   <!-- End of 'app/pom.xml.extra-dependencies.fragment.hbs' -->
   ```
2. Create `application/generator-overrides/app/pom.xml.extra-dependencies.fragment.hbs` containing just the snippet to be inlined (no wrapping `<dependencies>` element — it is injected inside the existing `<dependencies>` block):
   ```xml
   <dependency>
       <groupId>hu.blackbelt.judo.runtime</groupId>
       <artifactId>judo-runtime-core-dispatcher</artifactId>
       <version>${judo-runtime-core-version}</version>
   </dependency>
   ```
3. Run `./judo.sh generate` (or `./judo.sh build`). The dependency now appears in the regenerated `application/app/pom.xml`, and its checksum in `.generated-files` stays stable because the content is produced by the template, not by a manual edit.

Fragments are Handlebars templates, so you can use `{{ }}` expressions and generator parameters (for example `{{ lowerCase model.name }}`) inside them.

**Available fragment extension points (from `judo-esm-fullstack-project-template`):**

| Scope | Fragment | Typical use |
|-------|----------|-------------|
| Root `pom.xml` | `pom.xml.project-definition.fragment.hbs` | Override parent/artifact coordinates |
| Root `pom.xml` | `pom.xml.properties-definition.fragment.hbs` | Extra `<properties>` entries |
| Root `pom.xml` | `pom.xml.model-properties-definition.fragment.hbs` | Override model-related properties |
| Root `pom.xml` | `pom.xml.judo-properties-definition.fragment.hbs` | Override JUDO version properties |
| Root `pom.xml` | `pom.xml.extra-dependency-management.fragment.hbs` | Extra `<dependencyManagement>` entries |
| Root `pom.xml` | `pom.xml.extra-plugin-management.fragment.hbs` | Extra `<pluginManagement>` entries |
| Root `pom.xml` | `pom.xml.extra-plugins.fragment.hbs` | Extra `<plugins>` in `<build>` |
| Root `pom.xml` | `pom.xml.extra-modules.fragment.hbs` | Extra `<modules>` |
| Root `pom.xml` | `pom.xml.extra-profiles.fragment.hbs` / `pom.xml.release-profiles.fragment.hbs` | Extra / release `<profiles>` |
| Root `pom.xml` | `pom.xml.distribution-management.fragment.hbs` / `pom.xml.repository-definition.fragment.hbs` | Custom deploy & repository config |
| `app/pom.xml` | `app/pom.xml.project-definition.fragment.hbs` | Override coordinates of the `app` module |
| `app/pom.xml` | `app/pom.xml.properties-definition.fragment.hbs` | Extra properties for `app` |
| `app/pom.xml` | `app/pom.xml.extra-plugin-management.fragment.hbs` | Extra `<pluginManagement>` for `app` |
| `app/pom.xml` | `app/pom.xml.extra-plugins.fragment.hbs` | Extra `<plugins>` for `app` |
| `app/pom.xml` | `app/pom.xml.extra-dependencies.fragment.hbs` | Extra `<dependencies>` for `app` (e.g. custom interceptor SPIs) |
| `karaf-features/pom.xml` | `karaf-features/pom.xml.{project-definition,properties-definition,extra-plugin-management,extra-plugins,extra-dependencies}.fragment.hbs` | Same pattern for the Karaf features module |
| `karaf-features/.../feature.xml` | `karaf-features/src/main/feature/feature.xml.{extra-repositories,extra-bundles,model-bundles}.fragment.hbs` | Extra Karaf bundles / repositories in the generated feature descriptor |
| `e2e/pom.xml`, `e2e/actor/pom.xml`, `e2e/model/pom.xml` | `e2e/**/pom.xml.{project-definition,properties-definition,extra-plugin-management,extra-plugins,extra-dependencies}.fragment.hbs` | Same pattern for the E2E test modules |
| `frontend-react/pom.xml`, `frontend-react/actor/pom.xml`, `frontend-react/model/pom.xml` | `frontend-react/**/pom.xml.{project-definition,properties-definition}.fragment.hbs` | Override coordinates / properties for React frontend modules |

> **Prefer fragment overrides over `.generator-ignore`.** A fragment keeps the file under the generator's control so future template improvements still flow in; adding the file to `.generator-ignore` freezes the generated output and will drift from the template over time.

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

# Prune untracked files (DESTRUCTIVE - see warning below)
./judo.sh prune          # prunes the whole repo working tree
./judo.sh prune -f       # prunes frontend-react/ only
./judo.sh prune -y       # skip confirmation prompt (DANGEROUS)

# View help
./judo.sh --help
```

### ⚠️ Prune (Destructive) — Read Before Running

`./judo.sh prune` runs `git clean` against the working tree and **permanently deletes every file that is not tracked by git**. There is no undo.

| Variant | What it deletes |
|---------|-----------------|
| `./judo.sh prune` | All untracked files in the whole repository |
| `./judo.sh prune -f` | All untracked files inside `application/frontend-react/` |
| `./judo.sh prune -y` | Same as above but skips the `[Y/n]` confirmation |

**What gets wiped that you likely care about:**

- Custom frontend code that has not yet been committed (Pandino hooks, theme overrides, custom components, i18n overrides under `frontend-react/<app>/src/custom/**`, `.../theme/**`, `.../i18n/**`).
- Any scratch files, notes, screenshots, or locally generated artifacts in the working tree (for the bare `prune` variant).
- `node_modules/`, generator caches, and other untracked build output — this is the *intended* use case.

**Mandatory safety checklist before running `prune` / `prune -f`:**

1. `git status` — confirm every custom file you want to keep is either tracked or intentionally disposable.
2. `git stash -u` (or `git add` + commit) any untracked customizations you want to preserve.
3. Prefer `./judo.sh prune` (interactive) over `./judo.sh prune -y`. Never chain `-y` in an automated agent workflow unless the working tree is verified clean first.
4. For agents: treat `prune -y` as equivalent to `rm -rf` on customer code. Require explicit human confirmation.

**When `prune -f` is actually the right tool:**

- The JUDO designer freezes on opening the model project (stale generated frontend state).
- After major model refactors where generator output layout changed (e.g. actor renamed) and stale per-actor dirs need to disappear.
- As the first step of a fully clean rebuild: `./judo.sh prune -f && ./judo.sh build -i`.

If you only need to clear generator caches without touching untracked files, use `./judo.sh clean` instead — `clean` is non-destructive to untracked source files.

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
