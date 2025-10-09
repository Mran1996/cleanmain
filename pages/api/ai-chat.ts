import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { checkRateLimit } from '@/lib/rate-limiter'
import { ATTORNEY_INTERVIEW_SYSTEM, ATTORNEY_INTERVIEW_PROMPTS } from '@/app/ai-assistant/step-1/prompts/attorney-interview'

// Web search functionality
async function runWebSearch(question: string) {
  const pkey = process.env.PERPLEXITY_API_KEY;
  if (!pkey) return { findings: [], summary: "No research provider configured." };
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${pkey}` },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "user", content: question }],
        temperature: 0.0
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!r.ok) {
      throw new Error(`Perplexity API error: ${r.status}`);
    }
    
    const data = await r.json().catch(() => null);
    const summary = data?.choices?.[0]?.message?.content ?? "No summary available.";
    return { findings: [{ point: "Research summary", source: "Perplexity", quote: summary.slice(0, 2000) }], summary };
  } catch (error) {
    console.error('Web search error:', error);
    if (error.name === 'AbortError') {
      return { findings: [], summary: "Web search timed out. Please try again with a more specific query." };
    }
    return { findings: [], summary: "Unable to perform web search at this time." };
  }
}

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('OPENAI_API_KEY is missing. Please set it in your environment.')
}
const openai = new OpenAI({ apiKey })

// Use the Step 4 attorney interview system prompt
const systemPrompt = ATTORNEY_INTERVIEW_SYSTEM

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting - 50 requests per minute per IP (increased for better UX)
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(`ai-chat-${clientIP}`, 50, 60000);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Please try again later.',
      resetTime: rateLimit.resetTime
    });
  }
  
  const { messages, documentContext, documentFields, category } = req.body
  
  if (!messages) {
    return res.status(400).json({ error: 'Missing messages' })
  }

  try {
    // Build enhanced system prompt with document context
    let enhancedSystemPrompt = systemPrompt;

    // Add document context if provided
    if (documentContext) {
      // Try to parse as JSON array of documents first
      let formattedDocumentContext = documentContext;
      try {
        const documents = JSON.parse(documentContext);
        if (Array.isArray(documents) && documents.length > 0) {
          const { formatDocumentsForAI } = await import('@/lib/documentFormatter');
          formattedDocumentContext = formatDocumentsForAI(documents);
        }
      } catch {
        // Use documentContext as-is if not JSON
      }

      enhancedSystemPrompt += `

📄 DOCUMENT CONTEXT:
You have access to the following uploaded legal documents:

${formattedDocumentContext}

Use this document content to answer questions and provide guidance. Reference specific details from these documents when responding. You can reference specific documents by their number (Document 1, Document 2, etc.) or by filename.`;
    }

    // Add document fields if provided
    if (documentFields) {
      enhancedSystemPrompt += `

📋 DOCUMENT INFORMATION:
- Document Type: ${documentFields.documentType || 'Not specified'}
- Case Number: ${documentFields.caseNumber || 'Not specified'}
- Court: ${documentFields.courtName || 'Not specified'}
- Opposing Party: ${documentFields.opposingParty || 'Not specified'}
- State: ${documentFields.state || 'Not specified'}
- Filing Date: ${documentFields.filingDate || 'Not specified'}

Use this information to provide more accurate and contextual responses.`;
    }

    // Add category context if provided
    if (category) {
      enhancedSystemPrompt += `

🏛️ LEGAL CATEGORY: ${category}
Focus your responses on ${category} law and procedures.`;
    }

    // Add web search instructions
    enhancedSystemPrompt += `

🔍 WEB SEARCH CAPABILITY:
You have access to web search functionality. Use it when users ask for:
- Current case law or legal precedents
- Recent legal developments or changes in law
- Specific case information or court rulings
- Legal procedures or requirements
- Statutory information or regulations
- Similar cases or legal examples

When a user asks for legal research, case information, or current legal developments, use the web_search function to provide accurate, up-to-date information.`;

    console.log('🤖 Sending request to OpenAI with enhanced context');
    console.log('📄 Document context length:', documentContext ? documentContext.length : 0);
    console.log('📋 Document fields:', documentFields ? Object.keys(documentFields) : 'None');

    // Convert message format from Step 4 format to OpenAI format
    const openaiMessages = messages.map((msg: any) => ({
      role: msg.sender === 'assistant' ? 'assistant' : 'user',
      content: msg.text || msg.content
    }));

    
    console.log('📝 Converted messages:', openaiMessages.length, 'messages');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        ...openaiMessages,
      ],
      max_tokens: 512,
      temperature: 0.7,
      stream: false,
      tools: [
        {
          type: "function",
          function: {
            name: "web_search",
            description: "Search the internet for current legal information, case law, statutes, or legal procedures",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query for legal research"
                }
              },
              required: ["query"]
            }
          }
        }
      ],
      tool_choice: "auto"
    })
    
    let reply = completion.choices[0]?.message?.content || '';
    console.log('✅ OpenAI response received, length:', reply.length);
    
    // Handle tool calls for web search
    const toolCall = completion?.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.name === 'web_search') {
      console.log('🔍 Performing web search...');
      const args = JSON.parse(toolCall.function?.arguments || "{}");
      const searchResults = await runWebSearch(args.query);
      
      // Get final response with search results
      const followupCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          ...openaiMessages,
          completion.choices[0].message,
          { 
            role: 'tool', 
            name: 'web_search', 
            content: JSON.stringify(searchResults), 
            tool_call_id: toolCall.id 
          }
        ],
        max_tokens: 512,
        temperature: 0.7,
        stream: false,
      });
      
      reply = followupCompletion.choices[0]?.message?.content || '';
      console.log('✅ Web search response received, length:', reply.length);
    }
    
    // Post-process to remove forbidden phrases and formatting
    if (reply) {
      // Remove forbidden phrases
      const forbiddenPhrases = [
        "**Rehearing or En Banc Review**:",
        "**Case Law Research**:",
        "**Legal Analysis**:",
        "**Procedural Requirements**:",
        "It's advisable to work with an attorney experienced in post-conviction relief",
        "Consult with an attorney",
        "Seek legal counsel",
        "It's recommended to consult with an attorney",
        "You should consult with an attorney",
        "Consider consulting with an attorney"
      ];

      forbiddenPhrases.forEach(phrase => {
        // Escape special regex characters and use a safer replacement
        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        reply = reply.replace(new RegExp(escapedPhrase, 'gi'), '');
      });

      // Remove bold formatting
      reply = reply.replace(/\*\*(.*?)\*\*/g, '$1');
      
      // Remove bullet points and numbered lists
      reply = reply.replace(/^\s*[-*•]\s+/gm, '');
      reply = reply.replace(/^\s*\d+\.\s+/gm, '');
      
      // Clean up extra whitespace
      reply = reply.replace(/\n\s*\n\s*\n/g, '\n\n');
      reply = reply.trim();
    }
    
    res.status(200).json({ 
      reply,
      message: reply,  // For backward compatibility with Step 4
      content: reply   // For backward compatibility with Step 4
    })
  } catch (error) {
    console.error('❌ OpenAI API error:', error)
    
    // Check if it's a timeout or web search related error
    if (error.message && error.message.includes('timeout')) {
      res.status(200).json({ 
        reply: "I'm searching for the latest information. This may take a moment. Please try again if you don't see a response soon." 
      })
    } else {
      res.status(200).json({ 
        reply: "I'm having technical difficulties right now. Please try again in a moment." 
      })
    }
  }
} 