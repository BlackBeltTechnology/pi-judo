# Frontend Testing Guide

This guide covers testing approaches for JUDO frontend customizations, including hook testing, component testing, and integration with the generated code.

## Testing Stack

- **Vitest** or **Jest** -- Test runner and assertion library
- **React Testing Library** -- Component rendering and interaction
- **MSW (Mock Service Worker)** -- API mocking for integration tests

## Testing Custom Hooks

Test hooks in isolation using `renderHook`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { customizeMyPageActions } from './myPage.customizer';

describe('MyPage Actions', () => {
  it('should call notification after create', async () => {
    const { result } = renderHook(() => customizeMyPageActions());

    await act(async () => {
      await result.current.postCreateAction(mockData, mockResult);
    });

    expect(notificationSpy).toHaveBeenCalledWith('Created successfully');
  });
});
```

## Testing Component Overrides

Render override components with the expected props:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomOrderSummary } from './CustomOrderSummary';

describe('CustomOrderSummary', () => {
  it('renders order details', () => {
    render(<CustomOrderSummary data={mockOrder} actions={mockActions} />);

    expect(screen.getByText('Order #1234')).toBeInTheDocument();
    expect(screen.getByText('Approve')).toBeInTheDocument();
  });

  it('calls approve action on button click', () => {
    render(<CustomOrderSummary data={mockOrder} actions={mockActions} />);

    fireEvent.click(screen.getByText('Approve'));
    expect(mockActions.onApprove).toHaveBeenCalledWith(mockOrder);
  });
});
```

## API Mocking

Use MSW to mock JUDO backend responses:

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/orders', (req, res, ctx) => {
    return res(ctx.json({ items: [mockOrder], totalCount: 1 }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test Organization

```
src/custom/
├── pages/
│   ├── myPage.customizer.ts
│   └── __tests__/
│       └── myPage.customizer.test.ts
├── overrides/
│   ├── CustomOrderSummary.tsx
│   └── __tests__/
│       └── CustomOrderSummary.test.tsx
```

## Best Practices

- Test custom hooks separately from components
- Mock the API layer, not internal functions
- Test user interactions, not implementation details
- Ensure override components handle loading and error states
- Run frontend tests as part of CI to catch regressions
