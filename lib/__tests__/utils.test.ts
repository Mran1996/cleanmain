/**
 * Example Test: Utility Functions
 * 
 * This demonstrates how to test utility functions.
 * Tests verify that functions work correctly with different inputs.
 */

import { cn } from '../utils'

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz')
    expect(result).toBe('foo baz')
  })

  it('should merge Tailwind classes correctly', () => {
    // Tailwind merge: 'p-2 p-4' should become just 'p-4'
    const result = cn('p-2', 'p-4')
    expect(result).toBe('p-4')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })
})

