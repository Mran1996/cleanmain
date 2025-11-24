/**
 * Tests for validation functions
 * Critical for security and data integrity
 */

import {
  sanitizeString,
  validateEmail,
  validateUUID,
  validateFileType,
  validateMessages,
  sanitizeHTML,
} from '@/lib/validation'

describe('sanitizeString', () => {
  it('should return empty string for non-string input', () => {
    expect(sanitizeString(null as any)).toBe('')
    expect(sanitizeString(123 as any)).toBe('')
    expect(sanitizeString({} as any)).toBe('')
  })

  it('should remove null bytes and control characters', () => {
    const input = 'Hello\x00World\x01Test'
    const result = sanitizeString(input)
    
    expect(result).not.toContain('\x00')
    expect(result).not.toContain('\x01')
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('should preserve newlines and tabs', () => {
    const input = 'Line one\nLine two\tTabbed'
    const result = sanitizeString(input)
    
    expect(result).toContain('\n')
    expect(result).toContain('\t')
  })

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
    expect(sanitizeString('\n\thello\n\t')).toBe('hello')
  })

  it('should respect maxLength parameter', () => {
    const longString = 'a'.repeat(200)
    const result = sanitizeString(longString, 100)
    
    expect(result.length).toBe(100)
  })

  it('should handle empty string', () => {
    expect(sanitizeString('')).toBe('')
  })
})

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    expect(validateEmail('user+tag@example.com')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(validateEmail('notanemail')).toBe(false)
    expect(validateEmail('missing@domain')).toBe(false)
    expect(validateEmail('@nodomain.com')).toBe(false)
    expect(validateEmail('nodomain@')).toBe(false)
  })

  it('should reject non-string input', () => {
    expect(validateEmail(null as any)).toBe(false)
    expect(validateEmail(123 as any)).toBe(false)
    expect(validateEmail({} as any)).toBe(false)
  })

  it('should reject emails longer than 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@example.com'
    expect(validateEmail(longEmail)).toBe(false)
  })
})

describe('validateUUID', () => {
  it('should validate correct UUIDs', () => {
    expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('should reject invalid UUIDs', () => {
    expect(validateUUID('not-a-uuid')).toBe(false)
    expect(validateUUID('123e4567-e89b-12d3-a456')).toBe(false)
    expect(validateUUID('123e4567e89b12d3a456426614174000')).toBe(false)
  })

  it('should reject non-string input', () => {
    expect(validateUUID(null as any)).toBe(false)
    expect(validateUUID(123 as any)).toBe(false)
  })
})

describe('validateFileType', () => {
  it('should validate allowed file extensions', () => {
    const allowed = ['pdf', 'docx', 'txt']
    
    expect(validateFileType('document.pdf', allowed)).toBe(true)
    expect(validateFileType('file.DOCX', allowed)).toBe(true)
    expect(validateFileType('text.txt', allowed)).toBe(true)
  })

  it('should reject disallowed file extensions', () => {
    const allowed = ['pdf', 'docx']
    
    expect(validateFileType('file.exe', allowed)).toBe(false)
    expect(validateFileType('script.js', allowed)).toBe(false)
  })

  it('should handle case-insensitive extensions', () => {
    const allowed = ['pdf']
    
    expect(validateFileType('file.PDF', allowed)).toBe(true)
    expect(validateFileType('file.Pdf', allowed)).toBe(true)
  })

  it('should reject files without extensions', () => {
    const allowed = ['pdf']
    
    expect(validateFileType('filename', allowed)).toBe(false)
    expect(validateFileType('filename.', allowed)).toBe(false)
  })

  it('should reject non-string input', () => {
    expect(validateFileType(null as any, ['pdf'])).toBe(false)
    expect(validateFileType(123 as any, ['pdf'])).toBe(false)
  })
})

describe('validateMessages', () => {
  it('should validate correct message format', () => {
    const messages = [
      { sender: 'user', text: 'Hello' },
      { sender: 'assistant', text: 'Hi there!' },
    ]
    
    expect(validateMessages(messages)).toBe(true)
  })

  it('should validate messages with role/content format', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ]
    
    expect(validateMessages(messages)).toBe(true)
  })

  it('should reject non-array input', () => {
    expect(validateMessages(null as any)).toBe(false)
    expect(validateMessages({} as any)).toBe(false)
    expect(validateMessages('not an array' as any)).toBe(false)
  })

  it('should reject messages without sender/role', () => {
    const messages = [
      { text: 'No sender' },
    ]
    
    expect(validateMessages(messages)).toBe(false)
  })

  it('should reject messages without text/content', () => {
    const messages = [
      { sender: 'user' },
    ]
    
    expect(validateMessages(messages)).toBe(false)
  })

  it('should reject empty messages', () => {
    const messages = [
      { sender: 'user', text: '' },
    ]
    
    expect(validateMessages(messages)).toBe(false)
  })

  it('should handle mixed valid and invalid messages', () => {
    const messages = [
      { sender: 'user', text: 'Valid' },
      { sender: 'assistant' }, // Invalid - missing text
    ]
    
    expect(validateMessages(messages)).toBe(false)
  })
})

describe('sanitizeHTML', () => {
  it('should escape dangerous HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello'
    const result = sanitizeHTML(input)
    
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('Hello')
  })

  it('should allow safe formatting tags', () => {
    const input = '**bold** *italic* `code`'
    const result = sanitizeHTML(input)
    
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<em>italic</em>')
    expect(result).toContain('<code>code</code>')
  })

  it('should convert newlines to br tags', () => {
    const input = 'Line one\nLine two'
    const result = sanitizeHTML(input)
    
    expect(result).toContain('<br>')
  })

  it('should escape HTML entities', () => {
    const input = '<div>Hello & "world"</div>'
    const result = sanitizeHTML(input)
    
    expect(result).toContain('&lt;div&gt;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&quot;')
  })

  it('should handle non-string input', () => {
    expect(sanitizeHTML(null as any)).toBe('')
    expect(sanitizeHTML(123 as any)).toBe('')
    expect(sanitizeHTML({} as any)).toBe('')
  })

  it('should prevent XSS attacks', () => {
    const xssAttempts = [
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '<body onload=alert(1)>',
    ]
    
    xssAttempts.forEach(attempt => {
      const result = sanitizeHTML(attempt)
      // All HTML should be escaped, so dangerous attributes should be escaped too
      expect(result).toContain('&lt;') // All tags should be escaped
      expect(result).toContain('&gt;')
      // The escaped version will contain the text "onerror" but it's safe because it's escaped
      // We verify that the HTML is properly escaped, not that the text is removed
      expect(result).not.toContain('<img') // Should not contain unescaped tags
      expect(result).not.toContain('<svg')
      expect(result).not.toContain('<iframe')
      expect(result).not.toContain('<body')
    })
  })
})

