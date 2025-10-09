import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
}) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, documentContext, documentFields } = body;

    // Enhanced system prompt with document context
    let systemPrompt = `
You are Khristian, a legal assistant who helps users create professional, court-ready documents.
Ask one smart question at a time. Be calm, clear, and professional.
`;

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

      systemPrompt += `

📄 DOCUMENT CONTEXT:
You have access to the following uploaded legal documents:

${formattedDocumentContext}

Use this document content to answer questions and provide guidance. Reference specific details from these documents when responding. You can reference specific documents by their number (Document 1, Document 2, etc.) or by filename.`;
    }

    // Add document fields if provided
    if (documentFields) {
      systemPrompt += `

📋 DOCUMENT INFORMATION:
- Document Type: ${documentFields.documentType || 'Not specified'}
- Case Number: ${documentFields.caseNumber || 'Not specified'}
- Court: ${documentFields.courtName || 'Not specified'}
- Opposing Party: ${documentFields.opposingParty || 'Not specified'}
- State: ${documentFields.state || 'Not specified'}
- Filing Date: ${documentFields.filingDate || 'Not specified'}

Use this information to provide more accurate and contextual responses.`;
    }

    let final: string | undefined;

    if (process.env.MOONSHOT_API_KEY) {
      // Use Kimi (Moonshot)
      const r = await fetch("https://api.moonshot.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MOONSHOT_API_KEY}`,
        },
        body: JSON.stringify({
          model: "kimi-k2-0905-preview",
          messages: [
            { role: "system", content: systemPrompt.trim() },
            ...messages,
          ],
          temperature: 0.7,
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Kimi API error: ${r.status} - ${text}`);
      }
      const data = await r.json();
      final = data?.choices?.[0]?.message?.content;
    } else {
      if (!openai) throw new Error("OpenAI not configured");
      const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        stream: false,
        messages: [
          {
            role: "system",
            content: systemPrompt.trim(),
          },
          ...messages,
        ],
      });
      final = response.choices[0]?.message?.content;
    }


    // Post-process to remove forbidden phrases and formatting
    if (final) {
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
        final = final.replace(new RegExp(escapedPhrase, 'gi'), '');
      });

      // Remove bold formatting
      final = final.replace(/\*\*(.*?)\*\*/g, '$1');
      
      // Remove bullet points and numbered lists
      final = final.replace(/^\s*[-*•]\s+/gm, '');
      final = final.replace(/^\s*\d+\.\s+/gm, '');
      
      // Clean up extra whitespace
      final = final.replace(/\n\s*\n\s*\n/g, '\n\n');
      final = final.trim();
    }

    return NextResponse.json({
      choices: [{ message: { content: final } }]
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({
      choices: [{ message: { content: "I apologize, but I'm having trouble processing your request right now. Please try again." } }]
    }, { status: 500 });
  }
} 