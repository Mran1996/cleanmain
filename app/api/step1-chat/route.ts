import { NextRequest, NextResponse } from "next/server";
import { STEP4_SYSTEM_PROMPT } from "@/lib/step4Prompt";

export const runtime = "nodejs"; // or "edge" if your stack already supports it

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
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    throw new Error("Kimi API key is not configured");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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

    if (!r.ok) {
      const errorText = await r.text();
      throw new Error(`Kimi API error: ${r.status} - ${errorText}`);
    }

    return await r.json();
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
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
      docSection,
    ].join("\n\n");
    
    console.log('🔍 [API DEBUG] Document data received:', {
      hasDocumentData: !!documentData,
      documentLength: documentData?.length || 0,
      documentPreview: documentData?.substring(0, 100) || 'No document data'
    });

  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ];

  // Prefer Kimi (Moonshot) if configured, otherwise fall back to OpenAI
  const completion = process.env.MOONSHOT_API_KEY
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



