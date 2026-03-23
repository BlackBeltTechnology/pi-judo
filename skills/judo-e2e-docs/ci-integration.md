# CI Integration

This guide covers running JUDO e2e tests in continuous integration pipelines.

## Headless Mode

Playwright runs in headless mode by default in CI (when the `CI` environment variable is set):

```bash
CI=true npx playwright test
```

The `playwright.config.ts` already respects the `CI` variable for:
- Retries (2 retries in CI, 0 locally)
- Workers (1 in CI for stability, auto locally)
- Web server reuse (disabled in CI)

## GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build application
        run: ./judo.sh build

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Playwright
        run: |
          cd e2e
          npm ci
          npx playwright install --with-deps

      - name: Run E2E tests
        run: |
          cd e2e
          npx playwright test
        env:
          CI: true
          APP_URL: http://localhost:8080

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 7
```

## Test Artifacts

Configure Playwright to capture artifacts on failure:

```typescript
use: {
  trace: 'on-first-retry',        // Trace file for debugging
  screenshot: 'only-on-failure',   // Screenshot on test failure
  video: 'retain-on-failure',      // Video recording on failure
},
```

Artifacts are saved to the `playwright-report/` directory and can be uploaded as CI artifacts.

## Parallel Execution

In CI, run tests sequentially for stability:

```typescript
workers: process.env.CI ? 1 : undefined,
```

For faster CI runs on stable test suites, increase workers:

```typescript
workers: process.env.CI ? 2 : undefined,
```

## Application Startup

The web server configuration handles starting the JUDO application:

```typescript
webServer: {
  command: './judo.sh start',
  url: 'http://localhost:8080',
  reuseExistingServer: false,  // Always start fresh in CI
  timeout: 120000,             // Allow time for JUDO runtime startup
},
```

## Test Data Management

For CI, ensure test data is consistent:

- Use setup fixtures that create test data before tests
- Clean up data after test suites
- Avoid depending on data from previous test runs
- Consider using a database seed script as part of the CI setup

## Best Practices

- Run e2e tests after integration tests pass (fail-fast approach)
- Upload artifacts on failure for debugging
- Keep the test suite focused on critical paths to maintain fast CI times
- Use retries in CI to handle transient failures
- Monitor test execution time and optimize slow tests
