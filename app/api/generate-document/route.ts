import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';
import { consumeCredit } from '@/lib/usage';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
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

// Initialize OpenAI client (used if Moonshot/Kimi is not configured)
const kimiClient = (process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY) ? new OpenAI({
  apiKey: (process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY)!,
  baseURL: 'https://api.moonshot.ai/v1',
}) : null;

export async function POST(req: NextRequest) {
  console.log(' [GENERATE DOC] API called');

  let finalUid: string;

  try {
    const body = await req.json();
    console.log(' [GENERATE DOC] Request body received:', {
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

    if (!chatHistory || chatHistory.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No real case information provided. Please complete Step 1 first.'
      }, { status: 400 });
    }

    // Authenticate user using getServerUser
    const { user, isAuthenticated, error: authError } = await getServerUser();
    if (!isAuthenticated || !user) {
      console.error(' No user authenticated');
      return NextResponse.json({
        success: false,
        error: 'User authentication required. Please log in to generate documents.',
        details: authError
      }, { status: 401 });
    }
    finalUid = user.id;

    // Check subscription status and credit availability
    console.log(' Checking credit availability for user:', finalUid);
    const supabase = await createAdminClient();

    const { data: subRows } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', finalUid)
      .order('updated_at', { ascending: false })
      .limit(1);

    const subActive = Array.isArray(subRows) && subRows[0] && ['active','trialing'].includes(subRows[0].status);

    const { data: usage } = await supabase
      .from('document_usage')
      .select('monthly_remaining, one_time_remaining')
      .eq('user_id', finalUid)
      .single();

    const monthlyRemaining = usage?.monthly_remaining || 0;
    const oneTimeRemaining = usage?.one_time_remaining || 0;
    const totalAvailable = monthlyRemaining + oneTimeRemaining;

    console.log(' Credit status:', {
      subscriptionActive: subActive,
      monthlyRemaining,
      oneTimeRemaining,
      totalAvailable
    });

    if (totalAvailable === 0) {
      // Allow generation in non-production environments for testing
      if (process.env.NODE_ENV !== 'production') {
        console.warn(' No credits available – allowing generation in non-production for testing');
      } else {
        console.error(' No credits available - blocking generation');
        return NextResponse.json({
          success: false,
          error: 'Insufficient credits. You have 0 monthly credits and 0 one-time credits. Please purchase a document pack or subscribe to continue.',
        }, { status: 402 });
      }
    }

    const creditSource = (subActive && monthlyRemaining > 0) ? 'subscription' : 'one_time';
    const creditsToUse = creditSource === 'subscription' ? monthlyRemaining : oneTimeRemaining;

    console.log(` Credits available: Will use ${creditSource} credits (${creditsToUse} available)`);

    // Declare finalUid at function scope
    // ... (rest of the original logic remains unchanged)

    // Debug logging to track what data we're receiving
    console.log(' Document Generation Debug:', {
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
    console.log(' Conversation History Content:', chatHistory.map((msg: ChatMessage, index: number) => ({
      index: index + 1,
      role: msg.role,
      contentLength: msg.content?.length || 0,
      contentPreview: msg.content?.substring(0, 200) + '...' || 'No content'
    })));

    // Log specific details that should be used
    console.log(' Key Details to Extract:', {
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
        console.log(' [PERPLEXITY] Researching case law for:', { state, county, caseNumber });
        const legalIssue = chatHistory.find((msg: ChatMessage) => msg.role === 'user')?.content?.substring(0, 100) || 'legal matter';
        caseLawResearch = await getRelevantCaseLaw(legalIssue, 'general', state);
        console.log(' [PERPLEXITY] Case law research completed:', caseLawResearch.substring(0, 200) + '...');
      } catch (error) {
        console.error(' [PERPLEXITY] Error researching case law:', error);
        caseLawResearch = 'Case law research unavailable.';
      }
    }

    // Create a comprehensive prompt for OpenAI using only real data
    const systemPrompt = `You are Khristian, a senior partner at a top 1% law firm with 25+ years of litigation experience. You have successfully argued before the Supreme Court and have a track record of winning complex, high-stakes cases. Every document you generate must be written with the strategic sophistication and persuasive power of an elite trial attorney.

 CRITICAL: YOU MUST ANALYZE THE CONVERSATION HISTORY AND UPLOADED DOCUMENTS THOROUGHLY
- The client has provided detailed information in their conversation
- You MUST extract and use ALL specific details from their conversation
- You MUST reference and analyze any uploaded documents mentioned
- You MUST create a document that addresses their SPECIFIC legal situation
- You MUST NOT create generic templates or use placeholders
- YOU MUST GENERATE AT LEAST 3000 WORDS - NO EXCEPTIONS
- ABSOLUTELY NO STARS, ASTERISKS, OR SPECIAL FORMATTING ANYWHERE
- Write in plain text only - no ** or * or # or --- anywhere
- Each paragraph must be substantial with detailed legal analysis

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

 ABSOLUTELY FORBIDDEN - VIOLATION WILL RESULT IN POOR DOCUMENT QUALITY:
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

 FINAL REMINDER:
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
    const useKimi = !!kimiClient;
    const useOpenAI = false; // Disable OpenAI fallback; use only Kimi

    // Guard against missing provider configuration
    if (!useKimi) {
      throw new Error('No AI provider configured. Set MOONSHOT_API_KEY or KIMI_API_KEY.');
    }
    
    if (useKimi) {
      try {
        const maxAttempts = 3;
        const baseDelayMs = 10000; // Start with 10s delay
        const initialTimeoutMs = 300000; // 5 minutes for initial request
        const retryTimeoutMs = 240000; // 4 minutes for retries
        console.log(` [KIMI] Starting document generation with timeouts - Initial: ${initialTimeoutMs/1000}s, Retry: ${retryTimeoutMs/1000}s`);
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const controller = new AbortController();
          // Use longer timeout for first attempt, shorter for retries
          const currentTimeoutMs = attempt === 1 ? initialTimeoutMs : retryTimeoutMs;
          const timeoutId = setTimeout(() => controller.abort(), currentTimeoutMs);

          try {
            console.log(` [KIMI] Starting API call attempt ${attempt}/${maxAttempts} (timeout: ${currentTimeoutMs/1000}s)`);

            const startTime = Date.now();
            console.log(` [KIMI] Sending request via SDK with ${userPrompt.length} characters of prompt`);
            completion = await kimiClient!.chat.completions.create({
              model: 'kimi-k2-thinking-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                ...chatHistory.map((msg: ChatMessage) => ({
                  role: msg.role as 'user' | 'assistant' | 'system',
                  content: msg.content || ''
                })),
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.6,
              max_tokens: 32768,
              top_p: 1,
              stream: false
            });
        

            const responseTime = Date.now() - startTime;
            console.log(` [KIMI] SDK responded in ${responseTime}ms`);

            clearTimeout(timeoutId);
            console.log(` [KIMI] Document generation successful on attempt ${attempt}`);
            break;

          } catch (error: any) {
            const err = error as Error & { code?: string; status?: number };
            lastError = err;
            clearTimeout(timeoutId);

            // Enhanced error logging
            const initialErrorDetails = {
              name: error.name,
              message: error.message,
              code: error.code,
              stack: error.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines of stack trace
            };

            console.error(` [KIMI] Attempt ${attempt}/${maxAttempts} failed:`, JSON.stringify(initialErrorDetails, null, 2));

            if (attempt < maxAttempts) {
              // Check if this is a retryable error
              const isNetworkError = err.name === 'AbortError' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';
              const isServerError = (err as any)?.status && [429, 500, 502, 503, 504, 520].includes((err as any).status);
              const isRetryable = isNetworkError || isServerError;

              if (isRetryable) {
                // Exponential backoff with jitter (10s, 20s, 40s)
                const jitter = Math.random() * 3000; // Add up to 3s jitter
                const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + jitter, 120000); // Max 2 minutes
                console.log(` [KIMI] ${isNetworkError ? 'Network' : 'Server'} error detected. Retrying in ${Math.round(delay/1000)}s...`);

                try {
                  await new Promise(resolve => setTimeout(resolve, delay));
                  console.log(` [KIMI] Retry #${attempt} starting...`);
                  continue;
                } catch (retryError) {
                  console.error(' [KIMI] Error during retry delay:', retryError);
                  // Continue to next iteration to try again if possible
                  continue;
                }
              }
            }

            // If we get here, either we've exhausted all retries or it's a non-retryable error
            let errorMessage = lastError.message || 'Unknown error';
            let errorDetails: any = { error: lastError };

            console.error(` [KIMI] Fatal error after ${attempt} attempt(s):`, JSON.stringify(errorDetails, null, 2));

            // Provide more helpful error message for timeouts
            if (lastError?.name === 'AbortError') {
              errorMessage = `Request timed out after ${currentTimeoutMs/1000} seconds. The server took too long to respond.`;
            }

            // At final failure, throw to outer catch
            if (attempt === maxAttempts) {
              throw new Error(`Document generation failed after ${attempt} attempt(s): ${errorMessage}`);
            }
          }
        }
      } catch (kimiErr) {
        // No fallback; rethrow to be handled by outer error handling
        throw kimiErr;
      }
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


    // Get authenticated user for linking document (use admin client for testing)
    const authSupabase = supabase;
    
    let uid = finalUid;
    let authUserEmail: string | undefined;
    const { data: { user: authUser }, error: authGetUserError } = await authSupabase.auth.getUser();
      
    if (authGetUserError) {
      console.error(' Authentication error:', authGetUserError);
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: authGetUserError.message
      }, { status: 401 });
    }
      
    if (!authUser) {
      console.error(' No authenticated user found');
      return NextResponse.json({
        success: false,
        error: 'User authentication required to save document'
      }, { status: 401 });
    }
      
    uid = authUser.id;
    authUserEmail = authUser.email;
    console.log(' Authenticated user ID:', uid);

    // Ensure user exists in users table before inserting document
    // This handles the case where foreign key references users table instead of auth.users
    try {
      const { data: existingUser, error: userCheckError } = await authSupabase
        .from('users')
        .select('id')
        .eq('id', finalUid)
        .single();

      if (userCheckError && userCheckError.code === 'PGRST116') {
        // User doesn't exist in users table, create it
        console.log(' Creating user record in users table:', finalUid);
        const { error: createUserError } = await authSupabase
          .from('users')
          .insert({
            id: finalUid,
            email: authUserEmail || 'unknown@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createUserError) {
          console.error(' Warning: Could not create user in users table:', createUserError);
          // Don't fail here - the foreign key might reference auth.users instead
        } else {
          console.log(' Created user record in users table');
        }
      } else if (userCheckError) {
        console.error(' Warning: Error checking user in users table:', userCheckError);
      } else {
        console.log(' User exists in users table');
      }
    } catch (userTableError) {
      console.error(' Warning: Could not check/create user in users table:', userTableError);
      // Don't fail here - continue with document insert
    }

    // Store document in Supabase with user_id for proper linking
    let documentData;
    let documentInsertSucceeded = false;
    
    const documentPayload = {
      id: docId,
      user_id: finalUid, // Link document to user
      title: documentTitle,
      filename: `${documentTitle.replace(/[^a-z0-9\s\-_]/gi, '_').replace(/\s+/g, '_')}.txt`,
      original_filename: `${documentTitle}.txt`,
      file_size: Buffer.byteLength(documentContent, 'utf8'),
      file_type: 'text/plain',
      content: documentContent,
      metadata: {
        ...metadata,
        generated_by_api: true,
        credit_source: 'pending', // Will be updated after credit consumption
        generation_timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    const { data: initialDocumentData, error: documentError } = await supabase
      .from('documents')
      .insert([documentPayload])
      .select()
      .single();

    if (documentError) {
      console.error(' Error storing document in Supabase:', documentError);
      console.error(' Document data:', { docId, userId: finalUid, title: documentTitle });
      console.error(' Error details:', {
        code: documentError.code,
        message: documentError.message,
        details: documentError.details,
        hint: documentError.hint
      });
      
      // Check if it's a foreign key constraint violation
      if (documentError.code === '23503' || documentError.message.includes('foreign key constraint')) {
        console.error(' Foreign key constraint violation - attempting to fix by ensuring user exists');
        
        // Try to ensure user exists and retry once
        if (authUserEmail && documentError.details?.includes('users')) {
          console.log(' Retrying after ensuring user exists in users table...');
          try {
            // Upsert user to ensure it exists
            const { error: upsertError } = await authSupabase
              .from('users')
              .upsert({
                id: finalUid,
                email: authUserEmail,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            if (!upsertError) {
              // Retry document insert
              console.log(' Retrying document insert...');
              const { data: retryData, error: retryError } = await supabase
                .from('documents')
                .insert([documentPayload])
                .select()
                .single();

              if (!retryError) {
                console.log(' Document saved successfully after retry');
                documentData = retryData;
                documentInsertSucceeded = true;
              } else {
                console.error(' Document insert still failed after retry:', retryError);
                return NextResponse.json({
                  success: false,
                  error: 'User authentication issue - please log out and log back in',
                  details: 'The user account may not be properly set up in the database'
                }, { status: 401 });
              }
            } else {
              console.error(' Could not upsert user:', upsertError);
              return NextResponse.json({
                success: false,
                error: 'User authentication issue - please log out and log back in',
                details: 'The user account may not be properly set up in the database'
              }, { status: 401 });
            }
          } catch (retryError) {
            console.error(' Error during retry:', retryError);
            return NextResponse.json({
              success: false,
              error: 'User authentication issue - please log out and log back in',
              details: 'The user account may not be properly set up in the database'
            }, { status: 401 });
          }
        } else {
          console.error(' Foreign key constraint violation - user may not exist in referenced table');
          return NextResponse.json({
            success: false,
            error: 'User authentication issue - please log out and log back in',
            details: 'The user account may not be properly set up in the database'
          }, { status: 401 });
        }
      } else {
        // Don't continue if document save fails - user paid for this!
        return NextResponse.json({
          success: false,
          error: 'Failed to save document to database',
          details: documentError.message
        }, { status: 500 });
      }
    } else {
      documentData = initialDocumentData;
      documentInsertSucceeded = true;
    }
    
    if (!documentInsertSucceeded || !documentData) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save document to database',
        details: 'Document insertion did not complete successfully'
      }, { status: 500 });
    }
    
    console.log(' Document saved to Supabase:', { docId, userId: finalUid, title: documentTitle });

    // On success, consume credit and return detailed information
    try {
      // FINAL VERIFICATION: Re-check credits immediately before consumption
      console.log(' [FINAL CHECK] Verifying credits before consumption...');
      const { data: finalCheck } = await authSupabase
        .from('document_usage')
        .select('monthly_remaining, one_time_remaining')
        .eq('user_id', finalUid)
        .single();
      
      const finalMonthly = finalCheck?.monthly_remaining || 0;
      const finalOneTime = finalCheck?.one_time_remaining || 0;
      const finalTotal = finalMonthly + finalOneTime;
      
      console.log(' [FINAL CHECK] Credits before consumption:', {
        monthly: finalMonthly,
        oneTime: finalOneTime,
        total: finalTotal
      });
      
      if (finalTotal === 0) {
        console.error(' [FINAL CHECK] Race condition: Credits consumed between check and generation');
        // Rollback document creation
        await supabase.from('documents').delete().eq('id', docId);
        return NextResponse.json({
          success: false,
          error: 'Credits were consumed during document generation. Please try again.',
        }, { status: 402 });
      }
      
      const consumed = await consumeCredit(supabase, finalUid, creditSource, creditsToUse);
      
      if (!consumed.ok) {
        console.warn(' Credit consumption failed - insufficient credits');
        console.warn(' Message:', consumed.message || 'No credits available');
        
        // Rollback document creation if credit consumption fails
        await supabase
          .from('documents')
          .delete()
          .eq('id', docId);
        
        return NextResponse.json({
          success: false,
          error: consumed.message || 'Insufficient credits. Please purchase a document pack or subscribe to continue.',
        }, { status: 402 });
      } else {
        console.log(` [TESTING MODE] Credit consumption successful - document generation allowed`);
        console.log(` [TESTING MODE] ${consumed.message}`);
        
        // Update document metadata with credit source
        await supabase
          .from('documents')
          .update({
            metadata: {
              ...metadata,
              generated_by_api: true,
              credit_source: consumed.source,
              credits_remaining_after: consumed.remaining,
              generation_timestamp: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', docId);
        
        console.log(' Document metadata updated with credit tracking');
        
        // Return success with credit information
    return NextResponse.json({
      success: true,
      data: {
        docId,
        title: documentTitle,
        document: documentContent,
        metadata
          },
          creditInfo: {
            source: consumed.source,
            remaining: consumed.remaining,
            message: consumed.message
          }
        });
      }
    } catch (consumeErr) {
      console.error(' Error consuming credit post-generation:', consumeErr);
      
      // Rollback document creation on credit error
      await supabase
        .from('documents')
        .delete()
        .eq('id', docId);
      
      return NextResponse.json({
        success: false,
        error: 'Credit system error - document generation cancelled',
        details: consumeErr instanceof Error ? consumeErr.message : String(consumeErr)
      }, { status: 500 });
    }

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
  console.log(' [GENERATE DOC] GET endpoint called - health check');
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasKimi: !!(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY)
  });
}