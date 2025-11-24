# Testing Guide

This project uses **Jest** and **React Testing Library** for testing.

## Quick Start

### Install Dependencies

```bash
npm install
# or
pnpm install
```

### Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## What Are Tests?

Tests are automated checks that verify your code works correctly:

1. **Catch bugs before users do** - Find issues before deployment
2. **Document expected behavior** - Tests show how code should work
3. **Enable safe refactoring** - Change code confidently knowing tests will catch problems
4. **Save time** - Run tests in seconds instead of manually testing everything

## Example Tests

### 1. Utility Function Test

```typescript
// lib/__tests__/utils.test.ts
import { cn } from '../utils'

test('should merge class names', () => {
  expect(cn('foo', 'bar')).toBe('foo bar')
})
```

**What it does:** Verifies the `cn` function correctly merges CSS class names.

### 2. Document Processing Test

```typescript
// lib/__tests__/document-chunking.test.ts
import { splitIntoChunks } from '../document-chunking'

test('should split text into chunks', () => {
  const text = 'Sentence one. Sentence two. Sentence three.'
  const chunks = splitIntoChunks(text)
  
  expect(chunks.length).toBeGreaterThan(0)
})
```

**What it does:** Verifies document chunking works correctly for legal documents.

### 3. Component Test

```typescript
// components/__tests__/example-component.test.tsx
import { render, screen } from '@testing-library/react'

test('should render button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

**What it does:** Verifies React components render and behave correctly.

## Writing Your Own Tests

### Test Structure

```typescript
describe('Function or Component Name', () => {
  it('should do something specific', () => {
    // Arrange: Set up test data
    const input = 'test data'
    
    // Act: Call the function or render component
    const result = myFunction(input)
    
    // Assert: Verify the result
    expect(result).toBe('expected output')
  })
})
```

### Common Test Patterns

**Testing a function:**
```typescript
test('should handle edge cases', () => {
  expect(myFunction('')).toBe('default')
  expect(myFunction(null)).toBe('default')
})
```

**Testing user interactions:**
```typescript
test('should handle button click', () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick} />)
  
  screen.getByRole('button').click()
  expect(handleClick).toHaveBeenCalled()
})
```

**Testing API responses:**
```typescript
test('should handle API errors', async () => {
  fetch.mockReject(new Error('API Error'))
  
  await expect(myApiCall()).rejects.toThrow('API Error')
})
```

## Test Coverage

Run `npm run test:coverage` to see which parts of your code are tested:

```
File          | % Stmts | % Branch | % Funcs | % Lines
--------------|---------|----------|---------|--------
lib/utils.ts  |   100   |   100    |   100   |   100
lib/chunking  |    85   |    80    |    90   |    85
```

**Goal:** Aim for 80%+ coverage on critical business logic.

## Best Practices

1. **Test behavior, not implementation** - Test what the code does, not how it does it
2. **Write descriptive test names** - "should handle empty input" is better than "test1"
3. **Keep tests simple** - One assertion per test when possible
4. **Test edge cases** - Empty strings, null values, very large inputs
5. **Mock external dependencies** - Don't make real API calls in tests

## Next Steps

1. Run the example tests: `npm test`
2. Look at the test files in `lib/__tests__/` and `components/__tests__/`
3. Write tests for your critical functions
4. Add tests when you find bugs (prevents regressions)

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

