/**
 * Tests for document chunking functionality
 * This is critical for RAG (Retrieval-Augmented Generation) system
 */

// Mock OpenAI before importing the module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn(),
    },
  }))
})

// Mock supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  },
}))

import { splitIntoChunks } from '@/lib/document-chunking'

describe('splitIntoChunks', () => {
  it('should return empty array for empty text', () => {
    const result = splitIntoChunks('', 1000)
    expect(result).toEqual([])
  })

  it('should return empty array for whitespace-only text', () => {
    const result = splitIntoChunks('   \n\t  ', 1000)
    expect(result).toEqual([])
  })

  it('should not split text smaller than target token count', () => {
    const shortText = 'This is a short document. It has only a few sentences.'
    const result = splitIntoChunks(shortText, 1000)
    
    expect(result.length).toBe(1)
    expect(result[0]).toContain('short document')
  })

  it('should split long text into multiple chunks', () => {
    // Create a long text with many sentences
    const sentences = Array(50).fill('This is a sentence in a legal document.')
    const longText = sentences.join(' ')
    
    const result = splitIntoChunks(longText, 100) // Small target to force splitting
    
    expect(result.length).toBeGreaterThan(1)
    expect(result.every(chunk => chunk.length > 0)).toBe(true)
  })

  it('should preserve sentence boundaries when splitting', () => {
    const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.'
    const result = splitIntoChunks(text, 50) // Small target to force splitting
    
    // Each chunk should end with a period (sentence boundary)
    result.forEach(chunk => {
      expect(chunk.trim().endsWith('.')).toBe(true)
    })
  })

  it('should handle text with multiple punctuation marks', () => {
    const text = 'Question? Answer! Statement. Exclamation! Another question?'
    const result = splitIntoChunks(text, 1000)
    
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toContain('Question')
  })

  it('should handle very long single sentence', () => {
    // Create a very long sentence without periods
    const longSentence = 'This is a very long sentence ' + 'that continues '.repeat(100) + 'without any periods.'
    const result = splitIntoChunks(longSentence, 100)
    
    // Should still create at least one chunk
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].length).toBeGreaterThan(0)
  })

  it('should handle custom target token count', () => {
    const text = 'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five.'
    const result = splitIntoChunks(text, 200) // Larger target
    
    // With larger target, should create fewer chunks
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('should handle legal document format', () => {
    const legalDoc = `
      IN THE SUPERIOR COURT OF THE STATE OF CALIFORNIA
      
      CASE NUMBER: 12345
      
      MOTION TO VACATE
      
      This motion is filed pursuant to Penal Code section 1473.7.
      The defendant seeks to vacate the conviction based on ineffective assistance of counsel.
      The attorney failed to investigate key evidence.
      The attorney failed to call critical witnesses.
      The defendant was prejudiced by these failures.
    `.trim()
    
    const result = splitIntoChunks(legalDoc, 1000)
    
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(chunk => chunk.includes('MOTION TO VACATE'))).toBe(true)
    expect(result.some(chunk => chunk.includes('Penal Code'))).toBe(true)
  })

  it('should not create empty chunks', () => {
    const text = 'First. Second. Third.'
    const result = splitIntoChunks(text, 1000)
    
    result.forEach(chunk => {
      expect(chunk.trim().length).toBeGreaterThan(0)
    })
  })

  it('should handle text with newlines and special characters', () => {
    const text = `Line one.
      Line two.
      Line three with "quotes" and (parentheses).
      Line four with numbers: 123, 456, 789.`
    
    const result = splitIntoChunks(text, 1000)
    
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(chunk => chunk.includes('quotes'))).toBe(true)
  })
})

