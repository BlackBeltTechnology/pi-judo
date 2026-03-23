# Build System

The `judo.sh` script is the central build tool for JUDO applications. It wraps Maven and the JUDO toolchain into a unified command-line interface.

## Common Commands

```bash
# Full build: model transformation + code generation + compile + package
./judo.sh build

# Clean build: remove all generated artifacts and rebuild
./judo.sh clean build

# Build only the backend
./judo.sh build --backend

# Build only the frontend
./judo.sh build --frontend

# Start the application locally
./judo.sh start

# Run integration tests
./judo.sh test
```

## Build Phases

The `./judo.sh build` command executes these phases in order:

1. **Model load** -- Reads the ESM model files
2. **Transform** -- ESM to PSM to ASM transformation
3. **Generate** -- Produces Java backend and React frontend code
4. **Merge** -- Combines generated code with custom implementations
5. **Compile** -- Maven compiles Java code, npm bundles frontend
6. **Package** -- Creates deployable artifacts

## Maven Integration

The build system uses Maven for Java compilation and dependency management. Key Maven modules:

```
application/
├── pom.xml                    # Parent POM
├── model/
│   └── pom.xml                # Model module (ESM files)
├── app/
│   └── pom.xml                # Backend application module
├── frontend/
│   └── pom.xml                # Frontend module
└── sdk/
    └── pom.xml                # Generated SDK module
```

## Dependency Management

JUDO framework dependencies are managed through a BOM (Bill of Materials):

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>hu.blackbelt.judo</groupId>
            <artifactId>judo-bom</artifactId>
            <version>${judo.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## Build Output

After a successful build:

- `application/app/target/` -- Backend JAR/WAR and ASM artifacts
- `application/frontend/target/` -- Bundled frontend assets
- `application/sdk/target/` -- Generated SDK JAR

## Generator Ignore

The `.generator-ignore` file controls which files are not overwritten during regeneration:

```
# Preserve custom operation implementations
application/app/src/main/java/**/*.java

# Preserve custom frontend components
application/frontend/src/custom/**
```

## Best Practices

- Always run a full build after model changes
- Use `clean build` when switching branches or resolving build issues
- Check `.generator-ignore` when custom files are unexpectedly overwritten
- Keep the JUDO BOM version consistent across all modules
