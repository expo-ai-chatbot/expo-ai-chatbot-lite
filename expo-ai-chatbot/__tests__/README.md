# Test Structure

This directory contains all the test files for the AI Chatbot app.

## Folder Structure

- **`components/`** - Tests for React components
  - `auth/` - Authentication related component tests
  - `ui/` - UI component tests
- **`hooks/`** - Tests for custom React hooks
- **`context/`** - Tests for React context providers
- **`lib/`** - Tests for utility functions and libraries
- **`utils/`** - Tests for helper utilities
- **`integration/`** - Integration tests
- **`e2e/`** - End-to-end tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test LoginScreen.test.tsx

# Run tests matching pattern
npm test auth
```

## Test File Naming

- Component tests: `ComponentName.test.tsx`
- Hook tests: `useHookName.test.ts`
- Utility tests: `utilityName.test.ts`
- Integration tests: `feature.integration.test.ts`

## Writing Tests

Each test file should follow this general structure:

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeTruthy();
  });

  it('should handle user interaction', () => {
    render(<ComponentName />);
    const button = screen.getByRole('button');
    fireEvent.press(button);
    expect(/* assertion */).toBeTruthy();
  });
});
```