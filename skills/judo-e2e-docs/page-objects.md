# Page Objects

Page objects encapsulate interactions with JUDO generated UI components, providing a stable API for tests even when the generated UI changes.

## JUDO Selectors

JUDO generates `data-testid` attributes on key elements:

| Element Type     | Selector Pattern                              |
|------------------|-----------------------------------------------|
| Page container   | `[data-testid="page-<PageName>"]`             |
| Data grid        | `[data-testid="table-<TransferObject>"]`      |
| Form field       | `[data-testid="field-<fieldName>"]`           |
| Action button    | `[data-testid="action-<actionName>"]`         |
| Navigation item  | `[data-testid="nav-<itemName>"]`              |
| Dialog           | `[data-testid="dialog-<dialogName>"]`         |
| Tab              | `[data-testid="tab-<tabName>"]`               |

## Base Page Object

```typescript
export class JudoPage {
  constructor(protected page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getFieldValue(fieldName: string): Promise<string> {
    return this.page.inputValue(`[data-testid="field-${fieldName}"] input`);
  }

  async setFieldValue(fieldName: string, value: string) {
    const field = this.page.locator(`[data-testid="field-${fieldName}"] input`);
    await field.clear();
    await field.fill(value);
  }

  async clickAction(actionName: string) {
    await this.page.click(`[data-testid="action-${actionName}"]`);
  }
}
```

## Table Page Object

```typescript
export class JudoTablePage extends JudoPage {
  constructor(page: Page, private tableName: string) {
    super(page);
  }

  get table() {
    return this.page.locator(`[data-testid="table-${this.tableName}"]`);
  }

  async getRowCount(): Promise<number> {
    return this.table.locator('.MuiDataGrid-row').count();
  }

  async clickRow(index: number) {
    await this.table.locator('.MuiDataGrid-row').nth(index).click();
  }

  async filterByColumn(column: string, value: string) {
    await this.page.click(`[data-testid="filter-${column}"]`);
    await this.page.fill(`[data-testid="filter-${column}-input"]`, value);
    await this.page.keyboard.press('Enter');
  }
}
```

## Form Page Object

```typescript
export class JudoFormPage extends JudoPage {
  async fillForm(data: Record<string, string>) {
    for (const [field, value] of Object.entries(data)) {
      await this.setFieldValue(field, value);
    }
  }

  async submit() {
    await this.clickAction('save');
    await this.waitForPageLoad();
  }

  async getValidationError(fieldName: string): Promise<string | null> {
    const error = this.page.locator(`[data-testid="field-${fieldName}"] .Mui-error`);
    return error.isVisible() ? error.textContent() : null;
  }
}
```

## Best Practices

- Always use `data-testid` selectors over CSS class or DOM structure selectors
- Create one page object per JUDO page/view
- Keep page objects focused on interaction, not assertion logic
- Update page objects when the model changes to keep selectors in sync
