# Testing Guide

This directory contains automated tests for the Ask AI Legal application.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
__tests__/
├── lib/
│   ├── document-chunking.test.ts  # Tests for document chunking (RAG system)
│   └── validation.test.ts          # Tests for validation functions
└── README.md                        # This file
```

## What's Tested

### ✅ Document Chunking (`document-chunking.test.ts`)
- Empty text handling
- Text splitting logic
- Sentence boundary preservation
- Legal document format handling
- Edge cases (very long sentences, special characters)

### ✅ Validation Functions (`validation.test.ts`)
- String sanitization
- Email validation
- UUID validation
- File type validation
- Message validation
- HTML sanitization (XSS prevention)

## Writing New Tests

### Example: Testing a Utility Function

```typescript
// __tests__/lib/my-function.test.ts
import { myFunction } from '@/lib/my-function'

describe('myFunction', () => {
  it('should handle normal input', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('')
    expect(myFunction(null)).toThrow()
  })
})
```

### Example: Testing a React Component

```typescript
// __tests__/components/my-component.test.tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Test Best Practices

1. **Test Critical Functions First**
   - Payment processing
   - Document generation
   - User authentication
   - Data validation

2. **Test Edge Cases**
   - Empty inputs
   - Null/undefined values
   - Very long inputs
   - Special characters

3. **Keep Tests Simple**
   - One assertion per test (when possible)
   - Clear test names that describe what's being tested
   - Test one thing at a time

4. **Mock External Dependencies**
   - API calls
   - Database operations
   - External services (Stripe, Supabase, OpenAI)

## Running Specific Tests

```bash
# Run tests matching a pattern
npm test -- document-chunking

# Run tests in a specific file
npm test -- __tests__/lib/validation.test.ts

# Run tests in watch mode
npm run test:watch
```

## Coverage

To see what code is covered by tests:

```bash
npm run test:coverage
```

This generates a coverage report showing:
- Which files are tested
- Which lines are covered
- Which functions are tested

Aim for:
- **80%+ coverage** on critical functions
- **100% coverage** on security-sensitive code (validation, sanitization)

## Continuous Integration

Tests should run automatically:
- Before every commit (pre-commit hook)
- Before every deployment
- In CI/CD pipeline

## Troubleshooting

### Tests fail with "Module not found"
- Check that the import path matches your `tsconfig.json` paths
- Ensure the file exists at the expected location

### Tests fail with environment variable errors
- Check `jest.setup.js` for required env vars
- Add missing vars to `.env.test` (if needed)

### Tests are slow
- Mock external API calls
- Use `jest.fn()` instead of real implementations
- Consider running tests in parallel (Jest does this by default)

## Next Steps

1. Add tests for API routes (`app/api/**`)
2. Add tests for React components
3. Add integration tests for critical user flows
4. Set up test coverage reporting in CI/CD

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

