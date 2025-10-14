import { NextRequest, NextResponse } from "next/server";
import { STEP4_SYSTEM_PROMPT } from "@/lib/step4Prompt";

export const runtime = "nodejs"; // or "edge" if your stack already supports it

// Configure for large documents (200+ pages)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb', // Allow up to 200MB for large legal documents
    },
  },
  maxDuration: 300, // 5 minutes for very large documents
};

type Step2Payload = {
  docType: "letter" | "motion" | "brief";
  jurisdiction: { state: string; county: string; court: string };
  parties: { plaintiff: string; defendant: string; opposingCounsel?: string };
  case: { caption: string; number: string };
  facts: string[];
  issues: string[];
  reliefRequested: string[];
  evidence: { label: string; description: string }[];
  legalAuthorityRequested: boolean;
  citations: { name: string; pin?: string; summaryPlainEnglish: string }[];
  uploadedDocReferences: { filename: string; relevance: string }[];
  notesForDraft?: string;
};

async function callOpenAI(messages: any[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (increased)

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${apiKey}` 
      },
    body: JSON.stringify({
        model: "gpt-4o-mini",
      temperature: 0.3,
      tools: [
        { type: "function", function: { name: "research", parameters: { type: "object", properties: { question: { type: "string" } }, required: ["question"] } } },
        { type: "function", function: { name: "handoff_step2", parameters: { type: "object", properties: {
          docType: { type: "string", enum: ["letter","motion","brief"] },
          jurisdiction: { type: "object", properties: { state: {type:"string"}, county:{type:"string"}, court:{type:"string"} }, required:["state","county","court"] },
          parties: { type: "object", properties: { plaintiff:{type:"string"}, defendant:{type:"string"}, opposingCounsel:{type:"string"} }, required:["plaintiff","defendant"] },
          case: { type: "object", properties: { caption:{type:"string"}, number:{type:"string"} }, required:["caption","number"] },
          facts: { type: "array", items:{type:"string"} },
          issues: { type: "array", items:{type:"string"} },
          reliefRequested: { type: "array", items:{type:"string"} },
          evidence: { type: "array", items:{ type:"object", properties:{ label:{type:"string"}, description:{type:"string"} }, required:["label","description"] } },
          legalAuthorityRequested: { type: "boolean" },
          citations: { type: "array", items:{ type:"object", properties:{ name:{type:"string"}, pin:{type:"string"}, summaryPlainEnglish:{type:"string"} }, required:["name","summaryPlainEnglish"] } },
          uploadedDocReferences: { type: "array", items:{ type:"object", properties:{ filename:{type:"string"}, relevance:{type:"string"} }, required:["filename","relevance"] } },
          notesForDraft: { type:"string" }
        }, required:["docType","jurisdiction","parties","case","facts","issues","reliefRequested"] } } }
      ],
      messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!r.ok) {
      const errorText = await r.text();
      throw new Error(`OpenAI API error: ${r.status} - ${errorText}`);
    }

    return await r.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  }
}

async function callKimi(messages: any[]) {
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("Kimi API key is not configured");
  }

  // Simple retry with exponential backoff for overload/429/5xx
  const maxAttempts = 3;
  const baseDelayMs = 1500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    // Increase timeout to 120s to accommodate large doc processing
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const r = await fetch("https://api.moonshot.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "kimi-k2-0905-preview",
          temperature: 0.6,
          messages
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (r.ok) {
        return await r.json();
      }

      // Retry on common transient errors
      if ([429, 500, 502, 503, 504].includes(r.status) && attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      const errorText = await r.text();
      throw new Error(`Kimi API error: ${r.status} - ${errorText}`);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        if (attempt < maxAttempts) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        throw new Error("Request timed out. Please try again.");
      }
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw error;
    }
  }
}

async function runPerplexity(question: string) {
  const pkey = process.env.PERPLEXITY_API_KEY;
  if (!pkey) return { findings: [], summary: "No research provider configured." };
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${pkey}` },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [{ role: "user", content: question }],
      temperature: 0.0
    })
  });
  const data = await r.json().catch(() => null);
  // Normalize to short structured output
  const summary = data?.choices?.[0]?.message?.content ?? "No summary.";
  return { findings: [{ point: "Research summary", source: "Perplexity", quote: summary.slice(0, 2000) }], summary };
}

async function saveStep2Payload(payload: Step2Payload) {
  // Minimal placeholder: store in memory or emit to document generation channel.
  // Integrate with your existing state passing (Supabase/localStorage/event bus).
  // DO NOT change any design.
  // Example: write to a lightweight server-side store or return to client to stash.
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    // Add better error handling for JSON parsing
    let body;
    try {
      const text = await req.text();
      console.log('📥 Raw request body:', text);
      if (!text || text.trim() === '') {
        return NextResponse.json({ error: "Empty request body" }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    console.log('📦 Parsed body:', body);
    const { messages, documentData } = body as { 
      messages: { role: "user"|"assistant"|"system"|"tool"; content?: string; name?: string; tool_call_id?: string; }[],
      documentData?: string
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Enhanced system prompt with document data if available
    let docSection = "No uploaded document available.";
    
    if (documentData?.trim()) {
      // Try to parse as JSON array of documents first
      try {
        const documents = JSON.parse(documentData);
        if (Array.isArray(documents) && documents.length > 0) {
          const { formatDocumentsForAI } = await import('@/lib/documentFormatter');
          docSection = formatDocumentsForAI(documents);
        } else {
          // Fallback to single document format
          docSection = `UPLOADED DOCUMENT (use as primary source when relevant):\n-----\n${documentData}\n-----`;
        }
      } catch {
        // Fallback to single document format
        docSection = `UPLOADED DOCUMENT (use as primary source when relevant):\n-----\n${documentData}\n-----`;
      }
    }

    const systemPrompt = [
      "You are Khristian, an expert legal assistant for Washington State and US matters.",
      "When documents are uploaded, you should:",
      "1. Acknowledge the document upload(s) briefly",
      "2. Continue with the next intake question in your interview process",
      "3. Do NOT automatically explain, summarize, or analyze the document content",
      "4. If the user explicitly asks you to explain, summarize, or analyze a document, provide a detailed explanation",
      "5. Focus on gathering the information needed for your comprehensive legal intake",
      "Never invent facts. If a needed fact is missing, ask for it.",
      "The uploaded documents are available for reference when needed. When users ask for document explanation, provide it thoroughly.",
      "IMPORTANT: You can reference specific documents by their number (Document 1, Document 2, etc.) or by filename.",
      "PAGE-LEVEL ANALYSIS: You can analyze specific pages within documents. When users ask about specific pages (e.g., 'page 82'), provide detailed analysis of that page's content.",
      "DOCUMENT TYPES: You can handle all types of legal evidence including PDFs, scanned documents, images, text messages, videos, audio recordings, spreadsheets, and more.",
      "IMAGE ANALYSIS: When users upload images (screenshots, photos, scanned documents), guide them to describe the content including any text, people, dates, locations, or other important details visible in the image.",
      "LEGAL EVIDENCE: Focus on extracting legally relevant information from all document types, including timestamps, names, locations, communications, and other evidence that could be important for legal proceedings.",
      "",
      "CRITICAL: DOCUMENT SIZE AWARENESS:",
      "When analyzing documents, ALWAYS consider the document size and scope:",
      "- For large documents (10+ pages): Provide comprehensive analysis that reflects the full scope and complexity",
      "- For medium documents (5-10 pages): Provide detailed analysis covering all major sections",
      "- For small documents (1-4 pages): Provide thorough analysis of all content",
      "- NEVER give brief, superficial responses for large documents - they require comprehensive analysis",
      "- Large documents contain extensive legal information that must be fully addressed",
      "- Your responses should match the document's complexity and depth",
      docSection,
    ].join("\n\n");
    
    console.log('🔍 [API DEBUG] Document data received:', {
      hasDocumentData: !!documentData,
      documentLength: documentData?.length || 0,
      documentPreview: documentData?.substring(0, 100) || 'No document data'
    });

    // Enhanced logging for large documents
    if (documentData && documentData.length > 100000) {
      console.log(`📄 [LARGE DOCUMENT] Processing large document: ${documentData.length} characters`);
      
      // Check if document is truncated
      if (documentData.includes('...') && documentData.length < 50000) {
        console.warn(`⚠️ [TRUNCATION WARNING] Document may be truncated: ${documentData.length} characters`);
      }
    }

  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ];

  // Prefer Kimi (Moonshot) if configured, otherwise fall back to OpenAI
  const completion = (process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY)
    ? await callKimi(fullMessages)
    : await callOpenAI(fullMessages);

  // Handle tool calls (function calls)
  const toolCall = completion?.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    const name = toolCall.function?.name;
    const args = JSON.parse(toolCall.function?.arguments || "{}");

    if (name === "research") {
      const out = await runPerplexity(args.question);
      // Return a tool result message to the model for final user-facing text
      const followup = await callOpenAI([
        { role: "system", content: STEP4_SYSTEM_PROMPT },
        ...messages,
        completion.choices[0].message,
        { role: "tool", name: "research", content: JSON.stringify(out), tool_call_id: toolCall.id }
      ]);
      return NextResponse.json(followup);
    }

    if (name === "handoff_step2") {
      const result = await saveStep2Payload(args as Step2Payload);
      return NextResponse.json({ tool: "handoff_step2", result });
    }
  }

  return NextResponse.json(completion);
  } catch (error) {
    console.error("Step1-chat API error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        choices: [{ 
          message: { 
            content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment." 
          } 
        }] 
      }, 
      { status: 500 }
    );
  }
}



