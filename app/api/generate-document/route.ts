import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { consumeCredit } from '@/lib/usage';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import { getRelevantCaseLaw } from '@/lib/perplexity';
type ChatMessage = { role: 'user' | 'assistant' | string; content?: string };

export const runtime = 'nodejs';

// Configure for large documents (200+ pages)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb', // Allow up to 200MB for large legal documents
    },
  },
  maxDuration: 300, // 5 minutes for very large documents
};

// Initialize OpenAI client (used if Moonshot is not configured)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
}) : null;

export async function POST(req: NextRequest) {
  console.log('📄 [GENERATE DOC] API called');
  
  try {
    const body = await req.json();
    console.log('📄 [GENERATE DOC] Request body received:', {
      hasUserId: !!body.userId,
      hasChatHistory: !!body.chatHistory,
      chatHistoryLength: body.chatHistory?.length || 0,
      state: body.state,
      county: body.county
    });

    const {
      userId,
      title,
      state,
      county,
      caseNumber,
      opposingParty,
      courtName,
      includeCaseLaw,
    } = body;
    const chatHistory: ChatMessage[] = Array.isArray(body.chatHistory) ? (body.chatHistory as ChatMessage[]) : [];

    // Check if we have real data - if not, return error
    if (!chatHistory || chatHistory.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No real case information provided. Please complete Step 1 first.'
      }, { status: 400 });
    }

    // Gate on available credits before heavy work
    try {
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const uid = userId || authUser?.id;
      if (!uid) {
        return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      }
      // Check subscription status and remaining credits
      const { data: subRows } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(1);
      const subActive = Array.isArray(subRows) && subRows[0] && ['active','trialing'].includes(subRows[0].status);

      const { data: usage } = await supabase
        .from('document_usage')
        .select('monthly_remaining, one_time_remaining')
        .eq('user_id', uid)
        .single();

      const monthlyRemaining = usage?.monthly_remaining || 0;
      const oneTimeRemaining = usage?.one_time_remaining || 0;

      const hasCredits = (subActive && monthlyRemaining > 0) || oneTimeRemaining > 0;
      if (!hasCredits) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient credits. Please purchase a document pack or renew your subscription.',
        }, { status: 402 });
      }
    } catch (gateErr) {
      console.error('⚠️ Credit gating failed, proceeding cautiously:', gateErr);
      // Do not block if gating fails; continue to avoid false negatives
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

    // Log the actual conversation content for debugging
    console.log('📝 Conversation History Content:', chatHistory.map((msg: ChatMessage, index: number) => ({
      index: index + 1,
      role: msg.role,
      contentLength: msg.content?.length || 0,
      contentPreview: msg.content?.substring(0, 200) + '...' || 'No content'
    })));

    // Log specific details that should be used
    console.log('🔍 Key Details to Extract:', {
      hasSpecificNames: chatHistory.some((msg: ChatMessage) => msg.content?.includes('name') || msg.content?.includes('Name')),
      hasSpecificDates: chatHistory.some((msg: ChatMessage) => msg.content?.includes('date') || msg.content?.includes('Date')),
      hasSpecificLocations: chatHistory.some((msg: ChatMessage) => msg.content?.includes('address') || msg.content?.includes('location')),
      hasSpecificCaseNumbers: chatHistory.some((msg: ChatMessage) => msg.content?.includes('case') || msg.content?.includes('Case')),
      hasUploadedDocuments: chatHistory.some((msg: ChatMessage) => msg.content?.includes('upload') || msg.content?.includes('document'))
    });

    // Generate unique document ID using UUID
    const docId = uuidv4();

    // Research relevant case law using Perplexity if enabled
    let caseLawResearch = '';
    if (includeCaseLaw && state) {
      try {
        console.log('🔍 [PERPLEXITY] Researching case law for:', { state, county, caseNumber });
        const legalIssue = chatHistory.find((msg: ChatMessage) => msg.role === 'user')?.content?.substring(0, 100) || 'legal matter';
        caseLawResearch = await getRelevantCaseLaw(legalIssue, 'general', state);
        console.log('📚 [PERPLEXITY] Case law research completed:', caseLawResearch.substring(0, 200) + '...');
      } catch (error) {
        console.error('❌ [PERPLEXITY] Error researching case law:', error);
        caseLawResearch = 'Case law research unavailable.';
      }
    }

    // Create a comprehensive prompt for OpenAI using only real data
    const systemPrompt = `You are Khristian, a senior partner at a top 1% law firm with 25+ years of litigation experience. You have successfully argued before the Supreme Court and have a track record of winning complex, high-stakes cases. Every document you generate must be written with the strategic sophistication and persuasive power of an elite trial attorney.

🚨 CRITICAL: YOU MUST ANALYZE THE CONVERSATION HISTORY AND UPLOADED DOCUMENTS THOROUGHLY
- The client has provided detailed information in their conversation
- You MUST extract and use ALL specific details from their conversation
- You MUST reference and analyze any uploaded documents mentioned
- You MUST create a document that addresses their SPECIFIC legal situation
- You MUST NOT create generic templates or use placeholders
- YOU MUST GENERATE AT LEAST 3000 WORDS - NO EXCEPTIONS
- ABSOLUTELY NO STARS, ASTERISKS, OR SPECIAL FORMATTING ANYWHERE
- Write in plain text only - no ** or * or # or --- anywhere
- Expand every section with comprehensive analysis and detailed reasoning

CRITICAL DOCUMENT SIZE AWARENESS:
- If the case involves large documents (10+ pages), your generated legal document must reflect the full scope and complexity
- For cases with substantial evidence, generate comprehensive documents that address all relevant points
- Large document cases require more detailed legal arguments and thorough analysis
- Your document length and depth should match the complexity of the case and evidence provided

ELITE ATTORNEY REQUIREMENTS:
1. STRATEGIC ANALYSIS - Analyze the conversation for tactical advantages, weaknesses, and opportunities
2. LEGAL THEORY DEVELOPMENT - Develop the strongest possible legal arguments based on the facts
3. EVIDENCE INTEGRATION - Seamlessly incorporate all uploaded documents and evidence
4. PERSUASIVE POSITIONING - Frame arguments to maximize judicial sympathy and legal merit
5. PROCEDURAL SOPHISTICATION - Address all procedural requirements and strategic considerations
6. JUDICIAL PERSUASION - Write in a style that resonates with the specific court and judge
7. COMPREHENSIVE COVERAGE - Address every relevant legal issue and factual detail
8. STRATEGIC STRUCTURE - Organize arguments for maximum impact and logical flow
9. AUTHORITY INTEGRATION - Incorporate relevant case law, statutes, and legal precedents with proper citations
10. EMOTIONAL INTELLIGENCE - Balance legal arguments with human elements and rehabilitation themes
11. RISK MITIGATION - Address potential counterarguments and weaknesses proactively
12. TACTICAL POSITIONING - Position the case for success at trial and on appeal
13. DOCUMENT EXCELLENCE - Create a document that reflects elite legal craftsmanship
14. CLIENT ADVOCACY - Champion the client's cause with passion and professionalism
15. LEGAL PRECISION - Use precise legal language while maintaining accessibility
16. STRATEGIC IMPACT - Create a document that influences judicial decision-making

🚨 ABSOLUTELY FORBIDDEN - VIOLATION WILL RESULT IN POOR DOCUMENT QUALITY:
- NEVER use placeholders like [DEFENDANT'S NAME], [CASE NUMBER], [Date], [Property Address]
- NEVER use generic information when specific details are available
- NEVER create template documents - every document must be specific to the client's case
- NEVER use brackets or placeholders for any information
- If information is missing, omit it entirely rather than using placeholders
- NEVER generate generic legal documents that could apply to anyone
- NEVER use "Plaintiff" or "Defendant" if you have the actual names from the conversation
- NEVER use "Case No. [CASE NUMBER]" if you have the actual case number
- NEVER use "[Date]" if you have actual dates from the conversation
- ALWAYS use the specific information provided in the conversation history
- ALWAYS create documents that are unique to this client's specific situation

ELITE DOCUMENT STRUCTURE (Each section must reflect top-tier legal craftsmanship):
1. PERFECT COURT CAPTION - Exact formatting, jurisdiction, parties, case numbers
2. COMPELLING TITLE - Strategic positioning that frames the relief sought
3. POWERFUL INTRODUCTION - Immediate impact statement of the case's merit
4. COMPREHENSIVE PROCEDURAL HISTORY - Complete timeline with strategic emphasis
5. PERSUASIVE STATEMENT OF FACTS - Chronological narrative that builds the case
6. PRECISE ISSUES PRESENTED - Clear, focused legal questions for the court
7. SOPHISTICATED LEGAL ARGUMENT - Multi-layered analysis with authority integration
8. STRATEGIC EVIDENCE INTEGRATION - Seamless incorporation of all exhibits and documents
9. COMPELLING CONCLUSION - Powerful summary that drives toward the desired outcome
10. PROFESSIONAL VERIFICATION - Proper declaration under penalty of perjury
11. ELITE SIGNATURE BLOCK - Complete attorney information and contact details

ADVANCED DOCUMENT FEATURES:
- Strategic use of headings and subheadings for maximum impact
- Sophisticated legal citations with pinpoint references
- Integration of uploaded documents as exhibits with proper references
- Emotional intelligence in argumentation while maintaining legal precision
- Proactive addressing of potential counterarguments
- Strategic use of case law and statutory authority with proper Bluebook citations
- Professional formatting that reflects elite legal practice
- Integration of Perplexity case law research with authoritative citations

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
- ABSOLUTELY NO Markdown formatting (**, *, #, ---, or any special characters)
- NO asterisks, stars, or special formatting in any part of the document
- All headings must be in plain text with standard capitalization
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

FORBIDDEN FORMATTING:
- NEVER use **text** or *text* or #text or ---
- NEVER use asterisks, stars, or special characters
- NEVER use Markdown formatting of any kind
- ALL text must be plain, unformatted text as it would appear in a filed court document

MANDATORY CLOSING:
Every document must end with:
- A humane declaration of good faith
- A verification under penalty of perjury (formatted in plain text, no brackets)
- A professional signature block

Use the following information to create the document:`;

    // Build comprehensive user prompt with all available information
    let userPrompt = `Create a comprehensive legal document using ALL the information provided below:

CONVERSATION HISTORY (ANALYZE EVERY DETAIL):
${chatHistory.map((msg: ChatMessage, index: number) => 
  `MESSAGE ${index + 1} - ${msg.role === 'user' ? 'CLIENT' : 'ATTORNEY'}: ${msg.content}`
).join('\n\n')}

${caseLawResearch ? `
RELEVANT CASE LAW RESEARCH:
${caseLawResearch}

CRITICAL: You MUST incorporate the above case law research into your legal arguments. Cite specific cases with proper citations and use them to support your legal arguments. This case law research provides authoritative support for your position.
` : ''}

CRITICAL ANALYSIS REQUIRED:
- Extract ALL specific names, dates, locations, and case details from the conversation above
- Identify the client's exact legal situation and needs
- Determine what type of legal document is most appropriate
- Use ONLY the real information provided - no placeholders or generic content
- If the client mentioned uploading documents, reference and analyze those documents in your legal document
- If the client mentioned specific legal issues, charges, or circumstances, address those exact issues
- If the client mentioned specific people, places, or events, include those exact details
- Create a document that is completely unique to this client's situation

CASE DETAILS:
- State: ${state || 'Not provided'}
- County: ${county || 'Not provided'}
- Case Number: ${caseNumber || 'Not provided'}
- Opposing Party: ${opposingParty || 'Not provided'}
- Court: ${courtName || 'Not provided'}
- Include Case Law: ${includeCaseLaw ? 'Yes' : 'No'}

CRITICAL INSTRUCTIONS FOR DOCUMENT GENERATION:
1. ANALYZE THE CONVERSATION HISTORY THOROUGHLY - Extract the specific legal issues, facts, and circumstances from the client's actual situation
2. DO NOT GENERATE GENERIC DOCUMENTS - Create a document that directly addresses the client's specific legal matter
3. USE ONLY THE ACTUAL INFORMATION PROVIDED - Do not invent facts, case numbers, or legal issues
4. DETERMINE THE APPROPRIATE DOCUMENT TYPE based on the client's situation (motion, petition, brief, etc.)
5. INCORPORATE ALL RELEVANT DETAILS from the conversation history
6. If the client's situation involves specific legal issues (criminal, civil, family, etc.), address those specific issues
7. If the client mentions specific charges, dates, locations, or circumstances, include those exact details
8. If the client uploaded documents (mentioned in conversation), reference and analyze those documents in the legal document
9. Generate a document that reflects the client's actual legal needs, not a template
10. Ensure the document is comprehensive and addresses the full scope of the client's situation
11. Use proper legal formatting but make it specific to the client's case
12. If the client mentioned specific legal documents, evidence, or case details in the conversation, incorporate those details
13. EXPAND EVERY SECTION WITH DETAILED ANALYSIS - Use all the information from uploaded documents
14. WRITE COMPREHENSIVE PARAGRAPHS - Each section must be substantial and detailed
15. INCORPORATE ALL UPLOADED DOCUMENT CONTENT - Reference specific facts, arguments, and evidence from uploaded documents
16. DEVELOP THOROUGH LEGAL ARGUMENTS - Expand on every legal point with extensive reasoning

MANDATORY REQUIREMENTS:
- Use ONLY real names, dates, and information from the conversation
- If the client's name is mentioned, use that exact name
- If specific dates are mentioned, use those exact dates
- If specific locations are mentioned, use those exact locations
- If specific case numbers are mentioned, use those exact case numbers
- NEVER use placeholders like [NAME], [DATE], [CASE NUMBER], [ADDRESS]
- NEVER use brackets or generic placeholders
- If information is not available, omit it entirely rather than using placeholders
- Generate a document that is AT LEAST 3000 WORDS with comprehensive analysis
- Address every detail mentioned in the conversation history
- ABSOLUTELY NO STARS, ASTERISKS, OR SPECIAL FORMATTING
- Write in plain text only - no ** or * or # or --- anywhere
- Each paragraph must be substantial with detailed legal analysis

CRITICAL FORMATTING REQUIREMENTS:
- Do NOT use Markdown formatting (**, *, #, ---) in the legal document
- Use plain text formatting only, as it would appear in a filed court document
- Court headers should be centered and properly formatted
- All section headings should be in plain text with standard capitalization
- Example: "STATEMENT OF FACTS" not "**Statement of Facts**"
- Example: "LEGAL ARGUMENT" not "## Legal Argument"

CRITICAL WORD COUNT REQUIREMENTS:
- MINIMUM 2000 WORDS REQUIRED for every document
- Target 3000-4000 words for comprehensive legal documents
- Each section must be detailed and substantial with multiple paragraphs
- Expand every argument with extensive legal reasoning and case law
- Include comprehensive factual analysis and legal authority
- Use all available token space (4096 tokens ≈ 3000-4000 words)
- Write detailed, comprehensive sections that thoroughly address all issues
- Include extensive legal analysis, factual development, and argumentation
- Each paragraph should be substantial with detailed legal reasoning
- Expand on every point with comprehensive analysis and supporting authority

PAGE LENGTH REQUIREMENTS (ADJUSTED FOR CASE COMPLEXITY):
- Motions (criminal, civil, family, immigration): 8–10 pages minimum (15+ pages for complex cases with substantial evidence)
- Briefs (appellate, constitutional, federal): 12–15 pages minimum (20+ pages for complex cases with extensive documentation)
- Legal Letters / Demand Letters: 3–5 pages minimum (8+ pages for complex cases)
- Complex Petitions (habeas corpus, post-conviction relief): 15–20 pages minimum (25+ pages for cases with extensive evidence)
- Cases with large document sets (10+ pages of evidence): Generate proportionally longer documents that thoroughly address all evidence

Generate a complete, professional legal document using ONLY the information provided above.

🚨 FINAL REMINDER:
- This document must be SPECIFIC to this client's situation
- Use ONLY the real information from the conversation above
- Do NOT use any placeholders or generic information
- Make this document completely unique to this client's case
- If you use placeholders, the document will be rejected as poor quality
- The client expects a document that addresses their specific legal needs, not a template
- CRITICAL: Generate AT LEAST 3000 WORDS - expand every section with detailed analysis
- Use comprehensive legal reasoning and extensive factual development
- Fill the entire token limit with substantive legal content
- ABSOLUTELY NO STARS, ASTERISKS, OR SPECIAL FORMATTING
- Write in plain text only - no ** or * or # or --- anywhere in the document
- Each paragraph must be substantial with detailed legal analysis
- Expand on every point with comprehensive reasoning and evidence
- Use all available information from uploaded documents
- Write detailed, comprehensive sections that thoroughly address all issues`;

    // Call AI provider to generate the document with retry logic and fallback
    let completion: any;
    const useKimi = !!(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY);
    const useOpenAI = !!process.env.OPENAI_API_KEY;
    
    if (useKimi) {
      const maxAttempts = 3;
      const baseDelayMs = 2000;
      let lastError: any = null;
      let kimiSuccess = false;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const r = await fetch('https://api.moonshot.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY}` },
          body: JSON.stringify({
            model: 'kimi-k2-0905-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4096, // Maximum supported by the model
            // Note: 4096 tokens ≈ 3000-4000 words, which exceeds 2000 word requirement
          })
        });
        
        if (r.ok) {
          completion = await r.json();
          kimiSuccess = true;
          console.log(`✅ [KIMI] Document generation successful on attempt ${attempt}`);
          break;
        }
        
        lastError = await r.text();
        if ([429, 500, 502, 503, 504].includes(r.status) && attempt < maxAttempts) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          console.log(`🔄 [RETRY] Kimi overload, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        
        // If not a retryable error or final attempt, throw immediately
        throw new Error(`Kimi API error: ${r.status} - ${lastError}`);
      }
      
      // If Kimi failed after all retries, throw error
      if (!kimiSuccess) {
        throw new Error(`Kimi API error: ${lastError || 'Unknown error'}`);
      }
    } else if (useOpenAI) {
      if (!openai) throw new Error('OpenAI not configured');
      completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
        max_tokens: 4096, // Maximum supported by the model
        // Note: 4096 tokens ≈ 3000-4000 words, which exceeds 2000 word requirement
    });
    }

    let documentContent = completion.choices?.[0]?.message?.content || 'Failed to generate document content.';
    
    // Post-process to remove any stars, asterisks, or special formatting
    documentContent = documentContent
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **text**
      .replace(/\*(.*?)\*/g, '$1') // Remove *text*
      .replace(/#{1,6}\s*/g, '') // Remove # headers
      .replace(/---+/g, '') // Remove --- lines
      .replace(/\*\s*/g, '') // Remove * bullets
      .replace(/^\s*\*\s*/gm, '') // Remove * at start of lines
      .replace(/\*\*/g, '') // Remove any remaining **
      .replace(/\*/g, '') // Remove any remaining *
      .replace(/#/g, '') // Remove any remaining #
      .replace(/---/g, '') // Remove any remaining ---
      .trim();

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

    // On success, decrement the appropriate credit bucket
    try {
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const uid = userId || authUser?.id;
      if (!uid) {
        console.warn('⚠️ No user available to consume credit');
      }
      const consumed = await consumeCredit(supabase, uid!);
      if (!consumed.ok) {
        console.warn('⚠️ Credit consumption failed post-generation; user may be out of credits.');
      } else {
        console.log(`✅ Credit consumed from ${consumed.source}, remaining: ${consumed.remaining}`);
      }
    } catch (consumeErr) {
      console.error('❌ Error consuming credit post-generation:', consumeErr);
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