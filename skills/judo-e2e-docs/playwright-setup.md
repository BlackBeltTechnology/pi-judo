# Playwright Setup

This guide covers Playwright configuration for JUDO application e2e testing.

## Installation

```bash
npm init playwright@latest
npx playwright install
```

## Configuration

Create `playwright.config.ts` configured for the JUDO application:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: process.env.APP_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: './judo.sh start',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## Project Structure

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts       # Authentication setup
│   └── data.fixture.ts       # Test data creation
├── pages/
│   ├── LoginPage.ts           # Login page object
│   ├── OrderListPage.ts       # Order list page object
│   └── OrderDetailPage.ts     # Order detail page object
├── tests/
│   ├── auth.spec.ts           # Authentication tests
│   ├── order-crud.spec.ts     # Order CRUD tests
│   └── navigation.spec.ts     # Navigation tests
└── playwright.config.ts
```

## Authentication Fixture

Set up authenticated sessions for tests:

```typescript
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
    await use(page);
  },
});
```

## Environment Variables

| Variable    | Default                 | Description                |
|-------------|-------------------------|----------------------------|
| `APP_URL`   | `http://localhost:8080` | Application base URL       |
| `CI`        | unset                   | Enables CI-specific config |

## Best Practices

- Use `webServer` config to auto-start the application
- Store authentication state to avoid logging in for every test
- Use trace and screenshot artifacts for debugging failures
- Keep timeouts reasonable but sufficient for the JUDO runtime startup
