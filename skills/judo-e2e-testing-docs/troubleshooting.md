# E2E Test Troubleshooting

## Common Issues and Solutions

### Test Execution Issues

#### Tests fail with "Target page, context or browser has been closed"

**Cause**: Page navigation or action completed before test could interact.

**Solution**: Add explicit waits for elements:
```typescript
// Wait for element before interacting
await page.getByRole('button', { name: 'Submit' }).waitFor({ state: 'visible' });
await page.getByRole('button', { name: 'Submit' }).click();

// Or use ApiHelper to wait for API
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByRole('button', { name: 'Submit' }),
  /.*~validate$/
);
```

#### Tests timeout waiting for API responses

**Cause**: Wrong regex pattern or API not called.

**Solutions**:
1. Check the network tab to see actual API endpoints
2. Update regex pattern to match:
```typescript
// Debug: Log all network requests
page.on('response', response => {
  console.log(response.url());
});

// Common patterns
/.*~list$/      // List endpoints
/.*~get$/       // Get single entity
/.*template$/   // Form templates
/.*~validate$/  // Validation
/.*range$/      // Autocomplete/selector
```

3. Increase timeout in playwright.config.ts:
```typescript
projects: [
  {
    name: 'chromium',
    timeout: 4 * 60 * 1000, // 4 minutes
    use: {
      actionTimeout: 10000,
    },
    expect: {
      timeout: 5000
    }
  }
]
```

#### Element not found with getByRole/getByLabel

**Cause**: Element not rendered, wrong selector, or element inside shadow DOM.

**Solutions**:
1. Use Playwright Inspector to find correct selector:
```bash
npx playwright test --debug
```

2. Try alternative selectors:
```typescript
// By role
page.getByRole('button', { name: 'Submit' })

// By label
page.getByLabel('Name')

// By text
page.getByText('Submit')

// By test ID (if available)
page.getByTestId('submit-button')

// By CSS (last resort)
page.locator('.MuiButton-root')

// By data attribute
page.locator('[data-field="name"]')
```

3. Check if element is in dialog:
```typescript
// Wrong - looks in entire page
page.getByLabel('Name');

// Correct - scoped to dialog
page.getByRole('dialog').getByLabel('Name');
```

### Data Grid Issues

#### Table rows not found

**Cause**: TableHelper uses specific selectors for MUI DataGrid.

**Solution**: Ensure using correct row indexing:
```typescript
const tableHelper = new TableHelper();

// Row 0 is header, data starts at row 1
const firstDataRow = tableHelper.getRow(page, 1);
const secondDataRow = tableHelper.getRow(page, 2);

// For scoped tables (in dialogs)
const dialogTable = tableHelper.getRow(page.getByRole('dialog'), 1);
```

#### Cell content assertion fails

**Cause**: Cell name doesn't match data-field attribute.

**Solution**: Check actual data-field in browser DevTools:
```typescript
// Find correct cell name
// Open DevTools > Elements > Find the cell
// Look for: <div data-field="fieldName">

// Use exact data-field value
tableHelper.getCell(row, "name");        // correct
tableHelper.getCell(row, "Name");        // wrong - case sensitive
tableHelper.getCell(row, "entityName");  // wrong - use model attribute name
```

#### Boolean cell assertions fail

**Cause**: Wrong CSS class expected.

**Solution**: Use correct BooleanValue assertion:
```typescript
// Correct classes
await expect(cell.locator('> div span')).toHaveClass('mdi mdi-check-circle JUDO-mdi-icon true');
await expect(cell.locator('> div span')).toHaveClass('mdi mdi-close-circle JUDO-mdi-icon false');
await expect(cell.locator('> div span')).toHaveClass('mdi mdi-minus JUDO-mdi-icon undefined');

// Or use helper
await assertCellContent(tableHelper, page, 1, {
  cellName: 'active',
  textOperation: 'BooleanValue',
  value: 'true'  // or 'false' or 'undefined'
});
```

### Filter Issues

#### Filters not applied

**Cause**: Missing wait for API after applying filters.

**Solution**: Use openAddAndApplyFilters which includes wait:
```typescript
// Correct - waits for API
await openAddAndApplyFilters(page, apiHelper, [
  { attributeName: 'Name', startOption: 'Like', option: 'Like', value: 'Test', type: 'text' }
]);

// Manual approach with wait
await openFilter(page, true);
await addFilter(page, 'Name', 'Like', 'Like', 'Test', 'text');
await applyFilters(page, apiHelper, 1, true);  // true = doWait
```

#### Multiple filters on same field fail

**Cause**: Need to specify operationNth and valueNth for additional filters.

**Solution**:
```typescript
await openAddAndApplyFilters(page, apiHelper, [
  { attributeName: 'Name', startOption: 'Like', option: 'Like', value: 'A', type: 'text' },
  { 
    attributeName: 'Name', 
    startOption: 'Like', 
    option: 'Not equal', 
    value: 'AB', 
    type: 'text',
    operationNth: 1,  // Second dropdown
    valueNth: 1       // Second input
  }
]);
```

### Form Issues

#### Form field not accepting input

**Cause**: Field disabled, readonly, or covered by overlay.

**Solutions**:
1. Check field state:
```typescript
await expect(page.getByLabel('Name')).toBeEnabled();
await expect(page.getByLabel('Name')).toBeEditable();
```

2. Wait for loading to complete:
```typescript
await page.waitForLoadState('networkidle');
await fillPrimitiveField(page, "Name", "Value");
```

3. Check for overlays:
```typescript
// Wait for loading overlay to disappear
await page.locator('.MuiBackdrop-root').waitFor({ state: 'hidden' });
```

#### Enum combobox doesn't open

**Cause**: Click target wrong or options not loaded.

**Solution**:
```typescript
// Ensure clicking the right element
await page.getByLabel('Status').click();
await page.waitForTimeout(200);  // Wait for dropdown animation

// Or force click
await page.getByLabel('Status').click({ force: true });
```

### Relation Issues

#### Autocomplete doesn't show options

**Cause**: Range API not triggered or no matching results.

**Solution**:
```typescript
// Use fillSingleRelationElement which handles API wait
await fillSingleRelationElement(page, page, "Owner", "John");

// Manual approach with proper wait
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByRole('combobox', { name: 'Owner' }),
  /.*range$/
);
await page.getByRole('combobox', { name: 'Owner' }).fill('John');
await page.waitForTimeout(200);
await page.getByRole('option', { name: 'John Doe' }).click();
```

#### Selector dialog is empty

**Cause**: Range API not fetching data.

**Solution**: Apply filter to narrow results:
```typescript
await openSingleRelationSelector(page, page, "Owner");
await openAddAndApplyFilters(page, apiHelper, [
  { attributeName: 'Name', startOption: 'Like', option: 'Like', value: 'John', type: 'text' }
]);
await page.getByRole('gridcell', { name: 'John Doe' }).click();
```

### Operation Issues

#### Operation button disabled

**Cause**: Precondition not met (data validation, state check).

**Solution**: Ensure required data exists:
```typescript
// Check button state
await expect(page.getByRole('button', { name: '󰖕 Process' })).toBeDisabled();

// Create required data
await createCollectionRelationElement(page, page, [
  { type: 'string', name: 'Name', value: 'Required Item' }
]);

// Save
await updateAccessViewPage(page);

// Button should be enabled now
await expect(page.getByRole('button', { name: '󰖕 Process' })).toBeEnabled();
```

#### Operation input form doesn't open

**Cause**: Wrong regex pattern for template endpoint.

**Solution**:
```typescript
// Check pattern matches API
await apiHelper.triggerAndWaitWithRegex(
  page,
  page.getByRole('button', { name: '󰅂 Operation' }),
  /.*template$/  // or /.*~template$/
);
```

### Environment Issues

#### Tests work locally but fail in CI

**Causes**:
1. Different timing (CI is slower)
2. Missing dependencies
3. Different browser versions

**Solutions**:
1. Add retries in config:
```typescript
// playwright.config.ts
retries: process.env.CI ? 4 : 0,
```

2. Increase timeouts for CI:
```typescript
timeout: process.env.CI ? 5 * 60 * 1000 : 2 * 60 * 1000,
```

3. Use consistent browser:
```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] }
  }
]
```

#### APP_URL not working

**Cause**: Environment variable not loaded.

**Solution**: Ensure .env file exists and dotenv is configured:
```bash
# .env file in playwright directory
APP_URL='http://localhost:8181'
```

```typescript
// playwright.config.ts
import 'dotenv/config';

export default defineConfig({
  use: {
    baseURL: (process.env.APP_URL || 'http://localhost:8181') + '/AppName/Actor'
  }
});
```

## Debugging Techniques

### Visual Debugging

```bash
# Run with UI mode (interactive)
npx playwright test --ui

# Run with browser visible
npx playwright test --headed

# Debug specific test
npx playwright test tests/MyTest.spec.ts --debug

# Slow down execution
npx playwright test --slow-mo=500
```

### Screenshots and Videos

```typescript
// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry'
}
```

### Console Logging

```typescript
test('Debug test', async ({ page }) => {
  // Log page console
  page.on('console', msg => console.log('PAGE:', msg.text()));
  
  // Log network
  page.on('response', response => {
    console.log('API:', response.status(), response.url());
  });
  
  // Pause execution
  await page.pause();
  
  // Take screenshot
  await page.screenshot({ path: 'debug.png' });
});
```

### View Test Report

```bash
# Generate and open HTML report
npx playwright show-report
```

## Performance Tips

### Speed Up Tests

1. **Reuse authentication**:
```typescript
// Save auth state
await page.context().storageState({ path: 'auth.json' });

// Reuse in tests
test.use({ storageState: 'auth.json' });
```

2. **Parallel execution**:
```typescript
// playwright.config.ts
fullyParallel: true,
workers: process.env.CI ? 2 : undefined
```

3. **Skip unnecessary waits**:
```typescript
// Use waitForTimeout sparingly
await page.waitForTimeout(200);  // Only when necessary

// Prefer element-based waits
await page.getByRole('button').waitFor({ state: 'visible' });
```

4. **Batch test data creation**:
```typescript
// Create all test data in single setup
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await createTestData(page);
  await page.close();
});
```

## Getting Help

1. **Playwright Documentation**: https://playwright.dev/docs/intro
2. **Check trace viewer**: Detailed execution timeline
3. **Review test videos**: Visual confirmation of failures
4. **Use Playwright Inspector**: Step through test interactively
