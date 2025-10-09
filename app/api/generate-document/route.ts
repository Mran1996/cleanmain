import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';

// Initialize OpenAI client (used if Moonshot is not configured)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
}) : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      userId,
      title,
      state,
      county,
      caseNumber,
      opposingParty,
      courtName,
      includeCaseLaw,
      chatHistory
    } = body;

    // Check if we have real data - if not, return error
    if (!chatHistory || chatHistory.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No real case information provided. Please complete Step 1 first.'
      }, { status: 400 });
    }

    // Debug logging to track what data we're receiving
    console.log('📊 Document Generation Debug:', {
      chatHistoryLength: chatHistory.length,
      state: state,
      county: county,
      caseNumber: caseNumber,
      opposingParty: opposingParty,
      courtName: courtName,
      includeCaseLaw: includeCaseLaw,
      title: title
    });

    // Generate unique document ID using UUID
    const docId = uuidv4();

    // Create a comprehensive prompt for OpenAI using only real data
    const systemPrompt = `You are Khristian, an AI legal assistant trained to draft professional, court-ready legal documents. Every document you generate must be written in a humane, compassionate, and persuasive tone — as if by a seasoned trial attorney at a top 1% law firm.

CRITICAL REQUIREMENTS:
1. Generate a complete, court-ready legal document using ONLY the information provided in the conversation history and case details
2. Do NOT use any placeholders, fake data, or generic information
3. If information is missing, simply omit or rephrase naturally so the document still reads professionally
4. Use proper legal document formatting with court headers, case captions, and professional structure
5. Generate comprehensive content (target 8-15 pages) based on the provided information
6. Write with empathy and humanity, highlighting rehabilitation, remorse, and growth
7. Make arguments persuasive but respectful, focusing on fairness and justice
8. MUST incorporate ALL details from the conversation history - this is the client's actual case information
9. MUST use the specific case details provided (state, county, case number, opposing party, court)
10. MUST create a document that directly addresses the client's specific legal situation

DOCUMENT STRUCTURE (Each section must be detailed and comprehensive):
1. Court Caption (with correct jurisdiction, parties, and case number)
2. Title of the Filing
3. Introduction / Relief Requested
4. Procedural History (if applicable)
5. Statement of Facts
6. Issues Presented
7. Legal Argument (with statutes and case law citations)
8. Evidence & Exhibits Summary (Exhibit A, B, C…)
9. Conclusion & Proposed Order
10. Verification / Declaration under penalty of perjury
11. Signature Block (include full name, institution address if available, but no placeholders)

EXHIBITS:
Always reference exhibits clearly in the body of the motion and list them at the end:
- Exhibit A – Rehabilitation Program Certificates
- Exhibit B – Disciplinary Record
- Exhibit C – Forensic Report
- Exhibit D – Letters of Support

TONE & STYLE:
- Write with empathy and humanity, highlighting rehabilitation, remorse, and growth
- Make arguments persuasive but respectful, focusing on fairness and justice
- Ensure the document sounds like it was written by an experienced attorney who believes in the client's case
- Expand each section into detailed paragraphs with legal reasoning
- Always meet or exceed the target page count
- Never output incomplete placeholders — documents must always read as polished and ready to file

CRITICAL FORMATTING RULES:
- Do NOT use Markdown or special characters such as **, *, #, or --- in the generated legal documents
- All headings, captions, and section titles must appear in plain text with standard capitalization
- Use proper court document formatting with centered text for court headers
- Example format:
  IN THE SUPERIOR COURT OF THE STATE OF CALIFORNIA
  IN AND FOR THE COUNTY OF LOS ANGELES

  PEOPLE OF THE STATE OF CALIFORNIA,
  Plaintiff,

  vs.

  MARCUS JOHNSON,
  Defendant.
  Case No. BA123456

MANDATORY CLOSING:
Every document must end with:
- A humane declaration of good faith
- A verification under penalty of perjury (formatted in plain text, no brackets)
- A professional signature block

Use the following information to create the document:`;

    // Build comprehensive user prompt with all available information
    let userPrompt = `Create a comprehensive legal document using ALL the information provided below:

CONVERSATION HISTORY:
${chatHistory.map((msg: any, index: number) => 
  `${msg.role === 'user' ? 'CLIENT' : 'ATTORNEY'}: ${msg.content}`
).join('\n\n')}

CASE DETAILS:
- State: ${state || 'Not provided'}
- County: ${county || 'Not provided'}
- Case Number: ${caseNumber || 'Not provided'}
- Opposing Party: ${opposingParty || 'Not provided'}
- Court: ${courtName || 'Not provided'}
- Include Case Law: ${includeCaseLaw ? 'Yes' : 'No'}

INSTRUCTIONS:
1. Use ALL the conversation history above to understand the client's situation
2. Incorporate the case details provided
3. Generate a comprehensive legal document (target 8-15 pages minimum)
4. Use proper legal formatting with court headers, case captions, and professional structure
5. Include all relevant legal arguments based on the conversation
6. Do not use placeholders or generic information - use only the specific details provided
7. Ensure the document is court-ready and professional
8. Write with empathy and humanity, highlighting rehabilitation and growth
9. Include exhibits and evidence references
10. End with proper verification and signature block

CRITICAL FORMATTING REQUIREMENTS:
- Do NOT use Markdown formatting (**, *, #, ---) in the legal document
- Use plain text formatting only, as it would appear in a filed court document
- Court headers should be centered and properly formatted
- All section headings should be in plain text with standard capitalization
- Example: "STATEMENT OF FACTS" not "**Statement of Facts**"
- Example: "LEGAL ARGUMENT" not "## Legal Argument"

PAGE LENGTH REQUIREMENTS:
- Motions (criminal, civil, family, immigration): 8–10 pages minimum
- Briefs (appellate, constitutional, federal): 12–15 pages minimum
- Legal Letters / Demand Letters: 3–5 pages minimum
- Complex Petitions (habeas corpus, post-conviction relief): 15–20 pages minimum

Generate a complete, professional legal document using ONLY the information provided above.`;

    // Call AI provider to generate the document
    let completion: any;
    if (process.env.MOONSHOT_API_KEY) {
      const r = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MOONSHOT_API_KEY}` },
        body: JSON.stringify({
          model: 'kimi-k2-0905-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
        })
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Kimi API error: ${r.status} - ${text}`);
      }
      completion = await r.json();
    } else {
      if (!openai) throw new Error('OpenAI not configured');
      completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4096
      });
    }

    const documentContent = completion.choices?.[0]?.message?.content || 'Failed to generate document content.';

    // Store the document in Supabase
    const documentTitle = title || 'Legal Document';
    const metadata = {
      userId,
      state,
      county,
      caseNumber,
      opposingParty,
      courtName,
      includeCaseLaw,
      generatedAt: new Date().toISOString(),
      wordCount: documentContent.split(' ').length,
      pageCount: Math.ceil(documentContent.length / 2500)
    };

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Store document in Supabase
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert([{
        id: docId,
        title: documentTitle,
        content: documentContent,
        metadata: metadata,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (documentError) {
      console.error('Error storing document in Supabase:', documentError);
      // Continue anyway - we'll still return the document
    }

    return NextResponse.json({
      success: true,
      data: {
        docId,
        title: documentTitle,
        document: documentContent,
        metadata
      }
    });

  } catch (error) {
    console.error('Document generation error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Document generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}