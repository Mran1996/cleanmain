import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify Perplexity API connection
 * GET /api/test-perplexity
 */
export async function GET() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  // Check if API key exists
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'PERPLEXITY_API_KEY is not configured',
      message: 'Please add PERPLEXITY_API_KEY to your .env.local file',
      help: 'Get your API key from: https://www.perplexity.ai/settings/api'
    }, { status: 500 });
  }
  
  // Check API key format
  const keyFormatValid = apiKey.startsWith('pplx-');
  const keyLength = apiKey.length;
  
  // Test API connection
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const testQuery = "What are the current eviction laws in Washington State?";
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "user", content: testQuery }],
        temperature: 0.0
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      let helpMessage = '';
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed - Invalid API key';
        helpMessage = 'Check your API key at: https://www.perplexity.ai/settings/api';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded';
        helpMessage = 'Wait a few minutes and try again';
      } else if (response.status === 402) {
        errorMessage = 'Payment required';
        helpMessage = 'Check your Perplexity account billing: https://www.perplexity.ai/settings/billing';
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        help: helpMessage,
        apiKeyConfigured: true,
        apiKeyFormat: keyFormatValid ? 'valid' : 'invalid (should start with pplx-)',
        apiKeyLength: keyLength
      }, { status: response.status });
    }
    
    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content ?? "No response";
    const citations = data?.citations || [];
    
    return NextResponse.json({
      success: true,
      message: 'Perplexity API is working correctly!',
      testQuery,
      response: {
        length: summary.length,
        preview: summary.substring(0, 200) + '...',
        citationsCount: citations.length,
        citations: citations.slice(0, 5)
      },
      apiKeyInfo: {
        configured: true,
        format: keyFormatValid ? 'valid' : 'warning: should start with pplx-',
        length: keyLength
      },
      configuration: {
        endpoint: 'https://api.perplexity.ai/chat/completions',
        model: 'sonar-pro',
        timeout: '30 seconds'
      }
    });
    
  } catch (error: any) {
    let errorMessage = 'Unknown error';
    let errorType = 'unknown';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out after 30 seconds';
      errorType = 'timeout';
    } else if (error.message) {
      errorMessage = error.message;
      errorType = 'network';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType,
      apiKeyConfigured: true,
      apiKeyFormat: keyFormatValid ? 'valid' : 'invalid (should start with pplx-)',
      apiKeyLength: keyLength,
      help: 'Check your internet connection and try again'
    }, { status: 500 });
  }
}


