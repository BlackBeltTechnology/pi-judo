---
name: judo-e2e-testing-docs
description: E2E testing guide for JUDO React frontends using Playwright. Covers test patterns, helpers, and browser automation.
disable-model-invocation: false
user-invocable: false
agent: general-purpose
---

# E2E Testing Guide

## Overview

This guide covers end-to-end (E2E) testing for JUDO-generated React frontends using Playwright. E2E tests verify the complete user workflow by automating browser interactions against the running application.

**Note**: Throughout this document:
- `{{ lowerCase model.name \}}` refers to the application name from `judo.properties` (app_name property)
- `[actor_fqn]` represents the modeled actor's fully qualified name (e.g., `service__actor`)

## Key Concepts

- **Generated Project Skeleton**: Like the frontend, the E2E module is generated from the model. It provides utilities, helpers, and configuration but **no extension points** (unlike frontend hooks).
- **Manual Test Implementation**: Tests must be written manually. The generated project provides the structure and helper utilities.
- **Backend-Served Frontend**: Tests run against the frontend served by the JUDO backend (not a dev server).
- **Playwright Framework**: Uses Microsoft Playwright for browser automation with TypeScript.

## Prerequisites

### Required Tools

- **Node.js**: Version 18.15.0 LTS or as specified in `.nvmrc`
- **PNPM**: Package manager for dependencies
- **Running Backend**: JUDO backend serving the frontend application

```bash
# Install NVM (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use project Node version
nvm use

# Install PNPM globally
npm i -g pnpm
```

### Enable E2E Generation

To enable the E2E generator in JUDO, edit the `generator-parameter.properties` file in your project root and change:

```properties
generateE2eModule=false
```

to:

```properties
generateE2eModule=true
```

Then rebuild the project with:

```bash
./judo.sh build
```

This will generate an E2E test module in your application structure. The E2E tests are typically generated using Playwright for React frontends.

## Project Structure

```
application/e2e/{{ lowerCase model.name \}}__[actor_fqn]/
├── playwright/
│   ├── tests/                      # ✏️ TEST FILES HERE
│   │   └── *.spec.ts               # Playwright test files
│   ├── helpers/                    # 📦 GENERATED UTILITIES
│   │   ├── ApiHelper.ts            # API request handling
│   │   ├── TableHelper.ts          # Table interaction helpers
│   │   ├── utils.ts                # Common test utilities
│   │   └── visualElementIds/
│   │       └── VisualElementIds.ts # Generated element IDs
│   ├── .env                        # Environment configuration
│   ├── playwright.config.ts        # Playwright configuration
│   ├── package.json                # Dependencies
│   └── README.md                   # Quick start guide
└── pom.xml                         # Maven build config
```

## Environment Configuration

Configure the test environment in `.env`:

```bash
# Base URL of the running application
APP_URL='http://localhost:8181'
```

The test base URL is constructed as:
```
${APP_URL}/${ModelName}/${ActorName}
```

Example: `http://localhost:8181/{{ model.name \}}/Actor`

## Authentication (Actors with Principal)

When an Actor has a **principal** (authenticated user), the application requires login through Keycloak. Configure Playwright to handle authentication:

1. Create `tests/auth.setup.ts` to perform Keycloak login
2. Configure `playwright.config.ts` with setup project and `storageState`
3. Tests automatically reuse the saved session

See **[Language-Independent Testing](language-independent-testing.md)** for complete authentication setup examples.

**Note**: Anonymous actors (no principal) don't require authentication setup.

## Running Tests

### Install Dependencies

```bash
cd application/e2e/{{ lowerCase model.name \}}__[actor_fqn]/playwright
pnpm install
```

### Run Tests

```bash
# Run all tests (headless)
pnpm test
# or
npx playwright test

# Run tests with UI (interactive mode)
pnpm test:dev
# or
npx playwright test --ui

# Run specific test file
npx playwright test tests/MyTest.spec.ts

# Run with browser visible
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### View Test Reports

```bash
npx playwright show-report
```

### Video Recording and Screenshots

Playwright can record videos and capture screenshots for debugging failed tests.

**Configuration in `playwright.config.ts`:**

```typescript
use: {
  /* Video recording options: 'off', 'on', 'retain-on-failure', 'on-first-retry' */
  video: "retain-on-failure",

  /* Screenshot options: 'off', 'on', 'only-on-failure' */
  screenshot: "only-on-failure",
},
```

**Video Recording Options:**

| Option | Behavior |
|--------|----------|
| `"off"` | No video recording |
| `"on"` | Record all tests (uses more disk space) |
| `"retain-on-failure"` | Record all, keep only failed tests (recommended) |
| `"on-first-retry"` | Record only on retry attempts |

**Screenshot Options:**

| Option | Behavior |
|--------|----------|
| `"off"` | No screenshots |
| `"on"` | Screenshot after each test |
| `"only-on-failure"` | Screenshot only when test fails (recommended) |

**Viewing Results:**

Videos and screenshots are saved in `test-results/` folder and included in the HTML report:

```bash
# View HTML report with embedded videos
npx playwright show-report
```

**How to Enable Video Recording:**

1. **Edit `playwright.config.ts`** - set `video` option in the `use` section:

```typescript
use: {
  video: "on",  // Record all tests
},
```

2. **Run tests with HTML reporter:**

```bash
npx playwright test --reporter=html
```

3. **View the report:**

```bash
npx playwright show-report
```

4. **Click on any test name** in the report to see the video under "Attachments" section.

**Video files location:** `test-results/<test-name>/video.webm`

**To switch back to retain-on-failure (recommended for CI):**

```typescript
use: {
  video: "retain-on-failure",  // Only keep videos for failed tests
},
```

## Related Documentation

- **[Writing E2E Tests](writing-tests.md)** - Complete guide to writing tests
- **[Language-Independent Testing](language-independent-testing.md)** - Avoiding i18n labels, authentication setup, testid patterns
- **[Helper Utilities Reference](helpers-reference.md)** - API for generated helpers
- **[Testing Patterns](testing-patterns.md)** - Common patterns and examples
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

## Quick Start Example

```typescript
import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/ApiHelper';
import { TableHelper } from '../helpers/TableHelper';
import {
  navigateToAccess,
  createOnAccesList,
  fillPrimitiveField,
  submitOnAccesListCreate,
  TEST_DATA_PREFIX
} from '../helpers/utils';
import { faker } from '@faker-js/faker';

test.describe('Entity CRUD Operations', () => {
  const apiHelper = new ApiHelper();
  const tableHelper = new TableHelper();

  test('Create and verify entity', async ({ page }) => {
    const entityName = TEST_DATA_PREFIX + faker.string.alpha(10);

    // Navigate to dashboard
    await apiHelper.gotoWithWait(page);

    // Navigate to access table
    await navigateToAccess(page, '󰵲 Entities');

    // Open create form
    await createOnAccesList(page);

    // Fill form fields
    await fillPrimitiveField(page, "Name *", entityName);

    // Submit
    await submitOnAccesListCreate(page);

    // Verify in table
    await expect(tableHelper.getCell(
      tableHelper.getRow(page, 1),
      "name"
    )).toContainText(entityName);
  });
});
```

## Best Practices

1. **Use TEST_DATA_PREFIX**: Prefix test data for easy cleanup and identification
2. **Wait for API responses**: Use `ApiHelper.triggerAndWaitWithRegex()` for reliable tests
3. **Use generated VisualElementIds**: Reference UI elements by their model IDs when available
4. **Clean up test data**: Delete created entities after tests when possible
5. **Use faker for unique data**: Generate random data to avoid conflicts
6. **Structure tests by feature**: Group related tests in describe blocks
7. **Avoid i18n labels**: Use `data-testid`, `href` patterns, or VisualElementIds instead of translated text (see [Language-Independent Testing](language-independent-testing.md))
8. **Handle duplicate testids**: Use `.first()` when selecting elements in nested UI structures
9. **Use href for menu navigation**: `page.locator('a[href*="/Service/Actor/PageName/"]')` is language-independent
