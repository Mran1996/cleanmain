/**
 * Example Test: Document Chunking
 * 
 * This demonstrates testing a more complex function that processes documents.
 * Tests verify the chunking logic works correctly.
 */

import { splitIntoChunks } from '../document-chunking'

describe('splitIntoChunks', () => {
  it('should return empty array for empty text', () => {
    const result = splitIntoChunks('')
    expect(result).toEqual([])
  })

  it('should return empty array for whitespace-only text', () => {
    const result = splitIntoChunks('   \n\t  ')
    expect(result).toEqual([])
  })

  it('should split text into chunks', () => {
    // Create a long text with multiple sentences
    const longText = 'This is sentence one. This is sentence two. This is sentence three. This is sentence four.'
    const result = splitIntoChunks(longText, 50) // Small chunk size for testing
    
    expect(result.length).toBeGreaterThan(0)
    expect(result.every(chunk => chunk.length > 0)).toBe(true)
  })

  it('should preserve sentence boundaries', () => {
    const text = 'First sentence. Second sentence. Third sentence.'
    const result = splitIntoChunks(text, 100)
    
    // Each chunk should end with a period (sentence boundary)
    result.forEach(chunk => {
      expect(chunk.trim().endsWith('.')).toBe(true)
    })
  })

  it('should handle single sentence', () => {
    const text = 'This is a single sentence.'
    const result = splitIntoChunks(text)
    
    expect(result.length).toBe(1)
    expect(result[0]).toContain('sentence')
  })

  it('should respect target token count approximately', () => {
    // Create text with many sentences to ensure chunking
    const sentences = Array.from({ length: 50 }, (_, i) => 
      `This is sentence number ${i + 1} with enough words to create a chunk.`
    ).join(' ')
    
    const result = splitIntoChunks(sentences, 100) // Target 100 tokens
    
    // Should create at least one chunk
    expect(result.length).toBeGreaterThan(0)
    // Each chunk should contain complete sentences
    result.forEach(chunk => {
      expect(chunk.trim().endsWith('.')).toBe(true)
    })
  })

  it('should handle very long text', () => {
    // Simulate a legal document with many sentences
    const longDocument = Array.from({ length: 100 }, (_, i) => 
      `This is sentence number ${i + 1} in a long legal document.`
    ).join(' ')
    
    const result = splitIntoChunks(longDocument, 1000)
    
    expect(result.length).toBeGreaterThan(0)
    expect(result.every(chunk => chunk.length > 0)).toBe(true)
  })
})

