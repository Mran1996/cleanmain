/**
 * Test script to verify Perplexity API connection
 * Run with: npx tsx scripts/test-perplexity.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testPerplexityConnection() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  console.log('🔍 Testing Perplexity API Connection...\n');
  
  // Check if API key exists
  if (!apiKey) {
    console.error('❌ ERROR: PERPLEXITY_API_KEY is not set in environment variables');
    console.log('\n📝 To fix this:');
    console.log('1. Make sure you have a .env.local file in the root directory');
    console.log('2. Add: PERPLEXITY_API_KEY=your_api_key_here');
    console.log('3. Get your API key from: https://www.perplexity.ai/settings/api');
    process.exit(1);
  }
  
  // Check API key format
  if (!apiKey.startsWith('pplx-')) {
    console.warn('⚠️  WARNING: API key should start with "pplx-"');
    console.log('   Current key starts with:', apiKey.substring(0, 5) + '...');
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
  console.log('   Key length:', apiKey.length, 'characters\n');
  
  // Test API connection
  console.log('🌐 Testing API connection...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const testQuery = "What is the current status of eviction laws in Washington State?";
    console.log('📤 Sending test query:', testQuery);
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: "sonar-pro", // Best model for real-time internet search
        messages: [{ role: "user", content: testQuery }],
        temperature: 0.0
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Request Failed!');
      console.error('   Status:', response.status, response.statusText);
      console.error('   Error:', errorText);
      
      if (response.status === 401) {
        console.error('\n🔑 Authentication Error:');
        console.error('   - Your API key may be invalid or expired');
        console.error('   - Check your API key at: https://www.perplexity.ai/settings/api');
        console.error('   - Make sure you copied the full key including "pplx-" prefix');
      } else if (response.status === 429) {
        console.error('\n⏱️  Rate Limit Error:');
        console.error('   - You have exceeded your API rate limit');
        console.error('   - Wait a few minutes and try again');
      } else if (response.status === 402) {
        console.error('\n💳 Payment Required:');
        console.error('   - Your Perplexity account may need payment');
        console.error('   - Check your account at: https://www.perplexity.ai/settings/billing');
      }
      
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (!data) {
      throw new Error('Failed to parse response');
    }
    
    const summary = data?.choices?.[0]?.message?.content ?? "No response";
    const citations = data?.citations || [];
    
    console.log('\n✅ API Connection Successful!\n');
    console.log('📊 Response Details:');
    console.log('   - Model used: sonar-pro');
    console.log('   - Response length:', summary.length, 'characters');
    console.log('   - Citations found:', citations.length);
    
    if (citations.length > 0) {
      console.log('\n📚 Citations:');
      citations.slice(0, 5).forEach((citation: any, index: number) => {
        console.log(`   ${index + 1}. ${citation}`);
      });
    }
    
    console.log('\n📝 Response Preview (first 300 chars):');
    console.log('   ' + summary.substring(0, 300) + '...\n');
    
    console.log('✅ All tests passed! Perplexity API is properly configured.\n');
    console.log('💡 The internet search functionality should work correctly in your app.');
    
  } catch (error: any) {
    console.error('\n❌ Connection Error:', error.message);
    
    if (error.name === 'AbortError') {
      console.error('   - Request timed out after 30 seconds');
      console.error('   - This may indicate network issues or API slowness');
    } else if (error.message.includes('fetch')) {
      console.error('   - Network error - check your internet connection');
    }
    
    process.exit(1);
  }
}

// Run the test
testPerplexityConnection().catch(console.error);


