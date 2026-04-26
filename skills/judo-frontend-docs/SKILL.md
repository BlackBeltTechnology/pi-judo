---
name: judo-frontend-docs
description: Frontend development guide for JUDO React applications. Covers hooks, theming, i18n, and Pandino DI customization patterns.
disable-model-invocation: false
user-invocable: false
agent: general-purpose
---

# Frontend Development Guide

## Overview

The React frontend in northwind is generated from the ESM and UI models using JUDO generators. Customization is achieved through a hook system rather than direct code modification.

**Note**: Throughout this documentation:
- `northwind` refers to the application name from `judo.properties` (app_name property)
- `[actor_fqn]` represents the modeled actor's fully qualified name (without the model name prefix)
  - Generated from ESM model: `[model_name]::[namespace]::[ActorName]` → `[namespace]__[actor_name]` (lowercased, `::` replaced with `_`)
  - Example: Model name `MyApp` (lowercased: `myapp`), Actor FQN `myapp::service::Admin` → actor path becomes `service__admin`
- Frontend module naming pattern: `northwind__[actor_fqn]`
  - Double underscore (`__`) separates app name from actor path
  - Single underscores (`_`) replace namespace separators (`::`) within the actor path
  - Full example: `application/frontend-react/northwind__[actor_fqn]/` (e.g., `myapp__service__admin/`)

## Key Concepts

- **Model-Driven Generation**: The entire frontend is generated from the ESM and UI models. This ensures consistency and reduces boilerplate code.
- **Hook System**: Customizations are achieved through a hook system based on Pandino. Instead of editing generated code, you register custom hooks to override or extend functionality.
- **Checksum Protection**: To prevent accidental edits to generated files, a checksum system is in place. Modifying a generated file will cause the build to fail unless it's explicitly ignored in `.generator-ignore`.
- **`.default` Files**: The generator creates `.default` template files for hooks and other customizable components. You copy and rename these files to implement your customizations.

## Architecture

### Generated vs Custom Code

**Generated (Do Not Edit Directly):**
- `src/generated/` - All React components, pages, services
- `src/App.tsx` - Main application component
- `src/routes.tsx` - Route definitions
- API client services
- Model type definitions

**Custom Code (Edit Here):**
- `src/custom/` - Hooks and customizations
- `src/theme/` - Theme and styling customizations
- `src/custom/application-customizer.tsx` - Hook registration

### Code Generation and Checksum Protection

**How Generation Works:**
1. All generated files are tracked by **checksum** in `.generated-files__[actor_fqn]` (located in the frontend module root)
2. Files NOT in `.generator-ignore` will be regenerated on `./judo.sh build` or `mvn clean install`
3. **Checksum validation**: Before overwriting, the generator checks if a file was manually edited
   - If file was edited (checksum mismatch) → ❌ **Build FAILS** with error
   - If file unchanged → ✅ File is regenerated normally

**When You Must Edit Generated Files:**

Sometimes there's no hook available for customization, and you must edit generated code directly. This is **NOT the preferred way**, but when necessary:

1. **Edit the generated file** with your changes (e.g., in `src/generated/`)
2. **Add to `.generator-ignore`** to protect it from regeneration
   ```bash
   echo "src/generated/pages/MyCustomPage.tsx" >> .generator-ignore
   ```
3. Place the entry in `.generator-ignore` near related overrides (it's used like `.gitignore`)

**Handling Checksum Errors:**

If you get checksum errors due to code formatting changes (e.g., after `git checkout`, Prettier/Biomé auto-format, or dev mode changes):

```bash
# Ignore checksum errors and force regeneration (frontend module)
cd application/frontend-react/northwind__[actor_fqn]
mvn clean install -Dignore-checksums

# Or from root with judo.sh
./judo.sh build -i
```

**Checksum File Locations:**
- `.generated-files__[actor_fqn]` - In frontend module root directory
- Format: Tracks file paths and their checksums for the specific actor module

**Best Practice:** Always prefer using hooks over editing generated files. Only edit generated code when absolutely no hook exists for your use case.

## Project Structure

```
application/frontend-react/northwind__[actor_fqn]/
├── model/                              # UI model generation
│   ├── pom.xml                         # UI model generator config
│   └── target/generated-resources/
│       └── model/northwind-ui.model
├── src/
│   ├── generated/                      # ⚠️ GENERATED - DO NOT EDIT
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── models/
│   ├── custom/                         # ✏️ CUSTOMIZATIONS HERE
│   │   ├── application-customizer.tsx  # Hook registration
│   │   ├── hooks/
│   │   ├── components/
│   │   └── *.default files            # Templates for hooks
│   ├── theme/                          # ✏️ THEME CUSTOMIZATION
│   │   └── palette.ts
│   └── App.tsx                         # Generated entry point
├── public/
│   ├── i18n/                           # Internationalization
│   │   ├── default/
│   │   ├── en-US/
│   │   └── hu-HU/
│   └── manifest.json
├── .generator-ignore                   # Exclude files from generation
├── package.json
├── vite.config.ts
└── pom.xml                             # Frontend build config
```

## Generation Process

### Build Flow

```
ESM Model (northwind.model) ⚠️ Edit with Judo Designer only
    ↓
[UI Model Generation] (application/frontend-react/model/pom.xml)
    ↓
UI Model (northwind-ui.model)
    ↓
[React Code Generation] (application/frontend-react/northwind__[actor_fqn]/pom.xml)
    ↓
Generated React Code (src/generated/)
    ↓
[PNPM Build] (vite)
    ↓
Frontend JAR
    ↓
[Auto-Deploy to Karaf] (when server running)
```

**Important**: The ESM model file cannot be edited directly. Use the **Judo Designer** modeling tool for all model changes. See `../model/README.md` for details.

### Generator Configuration

**UI Model Generation** (`application/frontend-react/model/pom.xml`):
```xml
<plugin>
    <groupId>hu.blackbelt.judo.tatami</groupId>
    <artifactId>judo-tatami-psm2ui-maven-plugin</artifactId>
    <!-- Transforms PSM → UI Model -->
</plugin>
```

**React Code Generation** (`application/frontend-react/northwind__[actor_fqn]/pom.xml`):
```xml
<plugin>
    <groupId>hu.blackbelt.judo</groupId>
    <artifactId>judo-ui-react-maven-plugin</artifactId>
    <!-- Generates React code from UI Model -->
</plugin>

<plugin>
    <groupId>com.github.eirslett</groupId>
    <artifactId>frontend-maven-plugin</artifactId>
    <!-- Runs pnpm install and build -->
</plugin>
```

## Understanding .generator-ignore

The `.generator-ignore` file works exactly like `.gitignore` but for the code generator.

**Location:** `application/frontend-react/northwind__[actor_fqn]/.generator-ignore`

**Syntax:**
```
# Comments start with #

# Exact file
src/custom/application-customizer.tsx

# Wildcards
src/custom/**/*.tsx

# Directories
src/custom/

# Patterns
*.custom.tsx
**/custom-*.tsx
```

**Common Patterns:**
```
# Ignore all customizations
src/custom/

# Ignore specific customizer
src/custom/application-customizer.tsx

# Ignore theme
src/theme/

# Ignore specific hooks
src/custom/hooks/usePrincipal.tsx
src/custom/hooks/useCustomAuth.tsx
```

**Workflow:**
1. Generate code initially
2. Identify file you need to customize
3. Add to `.generator-ignore`
4. Make your changes
5. On rebuild, your changes are preserved

**Verification:**
```bash
# Check if file is ignored
grep "src/custom/application-customizer.tsx" .generator-ignore

# List all ignored files
cat .generator-ignore
```

## Generated File Headers

Every generated file contains a header that provides important metadata about how it was generated:

```
//////////////////////////////////////////////////////////////////////////////
// G E N E R A T E D    S O U R C E
// --------------------------------
// Factory expression: <actor>
// Path expression: 'src/App.tsx'
// Template name: actor/src/App.tsx
// Template file: actor/src/App.tsx.hbs
```

### Header Fields Explained

- **`Template file`**: The Handlebars template (`.hbs`) used for generation
  - Location: Inside `judo-ui-react-template` or `judo-ui-typescript-rest-template` Maven artifacts
  - Example: `actor/src/App.tsx.hbs`

- **`Template name`**: The logical name of the template
  - Used for the override mechanism
  - To override: Create file with same name in `generator-overrides/` directory

- **`Path expression`**: A SpringEL expression that determines the output file path
  - Evaluates to the actual file location
  - Example: `'src/App.tsx'` means file will be at `src/App.tsx`

- **`Factory expression`**: A SpringEL expression defining the data context
  - Determines what model elements are used to generate this file
  - Example: `<actor>` means this file is generated for each Actor in the model

### Why This Matters

1. **Override Decisions**: The template name tells you which template to override
2. **Understanding Regeneration**: Knowing the factory expression helps understand when a file is regenerated
3. **Debugging**: Path expression helps track where generated files end up
4. **Template Customization**: Template file location helps you find the original template to base overrides on

## Code Generation Templates

The JUDO platform uses two main template projects for code generation:

### 1. judo-ui-typescript-rest-template

**Purpose**: Generates TypeScript REST API client

**Generated Content:**
- Model type definitions (interfaces for entities)
- Service implementations (API calls)
- DTO transformations
- Error handling
- HTTP client configuration

**Template Technology**: Handlebars (`.hbs` files)

**Typical Generated Files:**
- `src/generated/models/*.ts` - Type definitions
- `src/generated/services/*.ts` - API service implementations
- `src/generated/data-axios/*.ts` - Axios-based HTTP clients

### 2. judo-ui-react-template

**Purpose**: Generates React frontend UI components

**Generated Content:**
- React components (pages, dialogs, forms, tables)
- Route definitions
- Navigation structure
- Internationalization scaffolding
- Theme structure
- Hook placeholders

**Template Technology**: Handlebars (`.hbs` files)

**Typical Generated Files:**
- `src/generated/pages/*.tsx` - Page components
- `src/generated/components/*.tsx` - Reusable components
- `src/generated/dialogs/*.tsx` - Dialog components
- `src/App.tsx` - Main application entry
- `src/routes.tsx` - Route configuration

### Template Override Process

**When to Override:**
- Hook system cannot achieve desired behavior
- Need to change generated code structure
- Want to use different libraries/patterns

**How to Override:**

1. **Identify template name** from generated file header
   ```
   Template name: actor/src/App.tsx
   ```

2. **Create override directory structure**
   ```bash
   mkdir -p generator-overrides/actor/src
   ```

3. **Create custom template** with same name
   ```bash
   # generator-overrides/actor/src/App.tsx.hbs
   # Your custom Handlebars template here
   ```

4. **Regenerate**
   ```bash
   mvn clean install
   ```

5. **Result**: Your custom template is used instead of default

**Important Notes:**
- Overrides are checked before default templates
- You must maintain the template on upgrades
- Prefer hooks over overrides for maintainability
- Document why override was necessary

### Template Variables

Templates have access to model elements:

**Common Variables:**
- `{{actor}}` - Current actor definition
- `{{package}}` - Package name
- `{{entities}}` - List of entities
- `{{relations}}` - Relationships
- `{{operations}}` - Available operations

**Handlebars Helpers:**
- `{{#each entities}}` - Iterate collections
- `{{#if required}}` - Conditional rendering
- `{{camelCase name}}` - Name transformations
- `{{pascalCase name}}` - Capitalization

**Example Template Snippet:**
```handlebars
export interface {{pascalCase entity.name}} {
  {{#each entity.attributes}}
  {{camelCase name}}{{#unless required}}?{{/unless}}: {{toTypeScript type}};
  {{/each}}
}
```

## Related Documentation

**Authoring vs customizing.** This skill covers **customizing the generated React frontend** (hooks, theming, i18n, overrides). The UI layout itself — Form / Table / View scaffolds on each `TransferObjectType`, the menu on each `ActorType` — is **authored in the ESM model**. For that, see the model skill's UI Authoring Guide (see `judo-model-docs` skill).

### Core Topics
- [Development Workflow](./development-workflow.md) - Dev server, build, testing
- [Theming](./theming.md) - MUI theme customization
- [Internationalization](./i18n.md) - i18n setup and translations
- [Advanced Patterns](./advanced-patterns.md) - Production patterns for complex requirements

### Hook System
- [Hook System Overview](./hooks/SKILL.md) - Understanding the hook system
- [Data Hooks](./hooks/data-hooks.md) - usePrincipal, useViewData
- [UI Hooks](./hooks/ui-hooks.md) - AppBar, Hero, Logo, Footer
- [Table Hooks](./hooks/table-hooks.md) - Row highlighting, custom columns, sidekicks
- [Action Hooks](./hooks/action-hooks.md) - Container actions, page actions, operation flows
- [Navigation and Access](./hooks/navigation-and-access.md) - Redirects, access filtering, hotkeys
- [Validation Hooks](./hooks/validation-hooks.md) - Date/DateTime validation

## External Documentation

- [JUDO UI React Template](https://github.com/BlackBeltTechnology/judo-ui-react-template/blob/develop/docs/pages/01_ui_react.adoc)
- [Generator Commons](https://github.com/BlackBeltTechnology/judo-generator-commons/blob/develop/README.adoc)
- [Material-UI Documentation](https://mui.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React 19 Documentation](https://react.dev/)

## Best Practices

1. **Always use hooks over direct edits** - Maintainable and upgrade-safe
2. **Add files to .generator-ignore** - Prevent overwriting custom code
3. **Keep customizations minimal** - Easier to maintain and upgrade
4. **Test after regeneration** - Ensure hooks still work
5. **Use TypeScript strictly** - Catch errors early
6. **Follow Material-UI patterns** - Consistent with generated code
7. **Leverage generated services** - Don't reimplement API calls
8. **Document custom hooks** - Help future developers

## Troubleshooting

### "File overwritten after build"
→ Add file to `.generator-ignore`

### "Build fails with checksum mismatch error"
```bash
# Option 1: Add the file to .generator-ignore (keep your changes)
echo "src/generated/pages/MyPage.tsx" >> .generator-ignore
mvn clean install

# Option 2: Discard your changes (let it regenerate)
git checkout src/generated/pages/MyPage.tsx
mvn clean install

# Option 3: Formatting-only changes - ignore checksums
mvn clean install -Dignore-checksums
# or
./judo.sh build -i
```

### "Hook not being called"
→ Check registration in `application-customizer.tsx`
→ Verify export name matches expected interface

### "Type errors after regeneration"
→ Run `pnpm install` to update type definitions
→ Check for breaking changes in generated types

## File Locations Reference

- UI Model: `application/frontend-react/model/target/generated-resources/model/northwind-ui.model`
- Generated React: `application/frontend-react/northwind__[actor_fqn]/src/generated/`
- Custom hooks: `application/frontend-react/northwind__[actor_fqn]/src/custom/`
- Build output: `application/frontend-react/northwind__[actor_fqn]/target/*.jar`
- Vite config: `application/frontend-react/northwind__[actor_fqn]/vite.config.ts`
