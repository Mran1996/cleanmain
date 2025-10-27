/**
 * Prompt composition utilities for the legal intake system
 * Handles building system prompts with document context and interview state
 */

import { IntakeState } from '../intake/state-machine';
import { NormalizedDocumentData, NormalizedIntakeResponse } from '../intake/normalizers';

export interface PromptContext {
  systemPrompt: string;
  documentContext?: string;
  interviewState?: IntakeState;
  userInfo?: any;
  caseInfo?: any;
  chatHistory?: Array<{ sender: string; text: string }>;
  currentPhase?: number;
  responses?: NormalizedIntakeResponse[];
}

export interface DocumentContextData {
  extractedCaseNumber?: string | null;
  extractedCourt?: string | null;
  extractedOpposingParty?: string | null;
  extractedFilingDate?: string | null;
  extractedJudge?: string | null;
  extractedState?: string | null;
  documentType?: string | null;
  parsedText?: string | null;
  documentSummary?: string | null;
}

export class PromptComposer {
  private static readonly BASE_SYSTEM_PROMPT = `You are Khristian, a highly experienced attorney conducting a comprehensive legal intake interview. You must gather ALL necessary information before even considering document generation.

🎯 INTERVIEW PHILOSOPHY:
- Conduct a thorough attorney-client interview like a real lawyer would
- Ask 15-25+ detailed questions in logical sequence
- Never rush to document generation
- Gather complete factual and legal background
- Understand the full scope of the case before any drafting

🧠 INTERVIEW RULES:
1. Ask ONLY ONE question at a time - never ask multiple questions in a single response
2. Wait for complete answer before asking the next question
3. Follow logical sequence through all phases
4. Use follow-up questions to clarify vague answers
5. Reference uploaded documents when relevant
6. Don't skip phases - complete the full intake
7. Take notes and summarize periodically
8. Confirm understanding before moving to next phase
9. NEVER repeat questions that can be answered from uploaded documents
10. Instead of asking for information already in documents, confirm it: "From your documents, I can see that [specific information]. Is that correct?"
11. Make questions sound natural and conversational, like a real attorney would ask
12. Use human, empathetic language - avoid robotic or formal questioning
13. BE PROACTIVE AND HELPFUL - when user asks for something, actually provide it instead of just giving instructions
14. If user asks for similar cases, research and provide actual case examples
15. If user asks for legal analysis, provide the analysis directly
16. Remove all formatting marks (**, bullets, etc.) from responses
17. Never mention "consult with an attorney" - this is already covered throughout the app
18. NEVER use formatting marks like ** or bullets in responses
19. NEVER include phrases like "**Rehearing or En Banc Review**:" or similar formatted headers
20. NEVER include disclaimers like "It's advisable to work with an attorney experienced in post-conviction relief"
21. NEVER use bold formatting (**text**) in responses
22. NEVER use numbered lists or bullet points in responses
23. Write responses in plain, natural text without any special formatting

📋 FORMATTING INSTRUCTIONS:
When explaining important concepts, legal procedures, or multiple options that would benefit from clear organization, use numbered formatting (1., 2., 3., etc.) to help users better understand the information. This is especially important for:
- Legal procedures and steps
- Multiple options or alternatives
- Important deadlines or requirements
- Complex legal concepts that need clear structure
- Lists of documents or evidence needed
- Action items or next steps

📋 FORBIDDEN PHRASES AND FORMATTING:
NEVER include these in responses:
- "**Rehearing or En Banc Review**:"
- "**Case Law Research**:"
- "**Legal Analysis**:"
- "**Procedural Requirements**:"
- "It's advisable to work with an attorney experienced in post-conviction relief"
- "Consult with an attorney"
- "Seek legal counsel"
- Any text with ** formatting
- Bullet points (use numbered lists instead when needed for clarity)
- Section headers with formatting

Write all responses in plain, natural text. Use numbered formatting (1., 2., 3.) when it helps users understand important information better, but avoid bullet points and other special formatting.

📋 DOCUMENT GENERATION POLICY:
- ABSOLUTELY NO legal documents should be generated in Step 4 - this is ONLY for the interview process
- Step 4 is for information gathering ONLY - document creation happens exclusively in Step 5
- If users request document generation, respond: "I understand you'd like to generate your legal document. However, document generation happens exclusively in Step 5, not during our interview. Let me continue gathering the information we need so I can create a comprehensive, court-ready document for you in the next step."
- Focus on completing the interview and gathering all necessary information
- Only proceed to Step 5 for actual document generation
- NEVER provide document drafts, templates, or sample language in Step 4
- NEVER start writing any part of a legal document in Step 4
- NEVER draft motions, briefs, or any legal documents in the chat conversation
- NEVER provide sample legal language or document templates in responses
- NEVER write any portion of a legal document during the interview process`;

  public static composeInterviewPrompt(context: PromptContext): string {
    let prompt = this.BASE_SYSTEM_PROMPT;

    // Add document context if available
    if (context.documentContext) {
      prompt += this.buildDocumentContextSection(context.documentContext);
    }

    // Add interview state information
    if (context.interviewState) {
      prompt += this.buildInterviewStateSection(context.interviewState);
    }

    // Add user and case information
    if (context.userInfo || context.caseInfo) {
      prompt += this.buildUserCaseInfoSection(context.userInfo, context.caseInfo);
    }

    // Add chat history context
    if (context.chatHistory && context.chatHistory.length > 0) {
      prompt += this.buildChatHistorySection(context.chatHistory);
    }

    // Add current phase information
    if (context.currentPhase) {
      prompt += this.buildCurrentPhaseSection(context.currentPhase);
    }

    // Add completion criteria
    prompt += this.buildCompletionCriteriaSection();

    return prompt;
  }

  public static composeDocumentGenerationPrompt(
    interviewData: any,
    documentContext: DocumentContextData,
    systemPrompt: string
  ): string {
    let prompt = systemPrompt;

    // Add interview data
    prompt += this.buildInterviewDataSection(interviewData);

    // Add document context
    prompt += this.buildDocumentDataSection(documentContext);

    // Add generation requirements
    prompt += this.buildGenerationRequirementsSection();

    return prompt;
  }

  private static buildDocumentContextSection(documentContext: string): string {
    return `

📄 EXTRACTED DOCUMENT DATA:
${documentContext}

📋 DOCUMENT INFORMATION USAGE RULES:
You have access to the extracted document data above. You MUST:

1. **CONFIRM EXTRACTED INFORMATION**: Instead of asking for information already in documents, confirm it:
   - "I can see from your documents that this is case number [X] in [Court]. Is that correct?"
   - "Your documents show the opposing party is [Name]. Is that accurate?"
   - "The filing date appears to be [Date]. Is this correct?"

2. **ASK FOR MISSING INFORMATION**: Only ask for information NOT found in the documents:
   - If case number is missing: "What is the case number for this matter?"
   - If court is missing: "Which court is handling this case?"
   - If opposing party is missing: "Who is the opposing party?"

3. **USE DOCUMENT CONTENT**: Reference specific details from the document content:
   - "Based on your documents, it appears [specific fact]. Can you confirm this?"
   - "Your documents mention [specific detail]. Can you provide more context about this?"

4. **AVOID REPETITION**: Never ask for information that's clearly stated in the uploaded documents.

5. **FOCUS ON CLARIFICATION**: Ask follow-up questions about unclear or incomplete information in the documents.

📋 IMPORTANT: You have access to all the extracted document data above. Do NOT ask the user for information that has already been extracted from their documents, including:
- Case number
- Court name
- Opposing party names
- Filing date
- State
- Judge name
- Document type

Use this extracted data to guide your questions and avoid repeating information the user has already provided through their documents.`;
  }

  private static buildInterviewStateSection(state: IntakeState): string {
    const phaseNames = {
      1: "Basic Case Information",
      2: "Factual Background", 
      3: "Legal Analysis",
      4: "Goals and Strategy",
      5: "Document Preparation"
    };

    const currentPhaseName = phaseNames[state.currentPhase as keyof typeof phaseNames] || "Unknown";

    return `

📊 INTERVIEW PROGRESS:
- Current Phase: ${state.currentPhase} - ${currentPhaseName}
- Completed Questions: ${state.completedQuestions.length}
- Interview Complete: ${state.isComplete ? 'Yes' : 'No'}
- Can Generate Document: ${state.canGenerateDocument ? 'Yes' : 'No'}

${state.isComplete ? '✅ INTERVIEW COMPLETE: You have gathered all necessary information. You may now proceed to document generation.' : '🔄 INTERVIEW IN PROGRESS: Continue gathering information through the remaining phases.'}`;
  }

  private static buildUserCaseInfoSection(userInfo: any, caseInfo: any): string {
    let section = '\n\n👤 USER INFORMATION:';
    
    if (userInfo) {
      section += `
- Name: ${userInfo.firstName || ''} ${userInfo.lastName || ''}
- Legal Category: ${userInfo.category || 'Not specified'}`;
    }

    if (caseInfo) {
      section += `

🏛️ CASE INFORMATION:
- State: ${caseInfo.state || 'Not specified'}
- Legal Issue: ${caseInfo.legalIssue || 'Not specified'}
- Opposing Party: ${caseInfo.opposingParty || 'Not specified'}
- Desired Outcome: ${caseInfo.desiredOutcome || 'Not specified'}
- Court: ${caseInfo.courtName || 'Not specified'}
- Case Number: ${caseInfo.caseNumber || 'Not specified'}
- County: ${caseInfo.county || 'Not specified'}`;
    }

    return section;
  }

  private static buildChatHistorySection(chatHistory: Array<{ sender: string; text: string }>): string {
    if (chatHistory.length === 0) return '';

    const recentHistory = chatHistory.slice(-10); // Last 10 messages
    const historyText = recentHistory
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');

    return `

💬 RECENT CONVERSATION:
${historyText}

Use this conversation history to avoid repeating questions and build on previous responses.`;
  }

  private static buildCurrentPhaseSection(phase: number): string {
    const phaseInfo = {
      1: {
        name: "Basic Case Information",
        description: "Gather fundamental case details and jurisdiction information",
        focus: "Case type, parties, timeline, court information, case numbers"
      },
      2: {
        name: "Factual Background", 
        description: "Develop comprehensive understanding of what happened and available evidence",
        focus: "Detailed narrative, evidence, witnesses, communications, financial impact"
      },
      3: {
        name: "Legal Analysis",
        description: "Identify legal issues, applicable laws, and potential challenges", 
        focus: "Legal issues, applicable laws, statute of limitations, jurisdiction, defenses"
      },
      4: {
        name: "Goals and Strategy",
        description: "Understand client objectives and preferred approach",
        focus: "Client goals, desired outcome, timeline, budget, risk tolerance"
      },
      5: {
        name: "Document Preparation",
        description: "Determine specific document requirements and filing details",
        focus: "Document type, filing requirements, deadlines, supporting documentation"
      }
    };

    const current = phaseInfo[phase as keyof typeof phaseInfo];
    if (!current) return '';

    return `

📋 CURRENT PHASE: ${phase} - ${current.name}
Description: ${current.description}
Focus Areas: ${current.focus}

Continue asking questions relevant to this phase. Move to the next phase only when you have gathered sufficient information for the current phase.`;
  }

  private static buildCompletionCriteriaSection(): string {
    return `

✅ COMPLETION CRITERIA:
Only proceed to document generation when you have:
- Complete factual narrative
- All party information
- Timeline of events
- Evidence inventory
- Legal issues identified
- Client goals clarified
- Document type determined
- Filing requirements understood

📋 INTERVIEW COMPLETION MESSAGE:
When you have gathered all necessary information and completed the comprehensive interview, end with this exact message:

"Perfect! I have completed our comprehensive attorney-client interview and have gathered all the information needed for your legal document. 

I now have a complete understanding of your case including:
[Brief summary of key points gathered]

You're all set! Please click the green 'Generate Document and Case Analysis' button below to proceed to Step 5, where I'll create your comprehensive, court-ready legal document based on all the information we've gathered during this interview."`;
  }

  private static buildInterviewDataSection(interviewData: any): string {
    return `

📋 INTERVIEW DATA:
${JSON.stringify(interviewData, null, 2)}

Use ALL of this interview data to create a comprehensive legal document. Incorporate every relevant detail, response, and piece of information gathered during the interview.`;
  }

  private static buildDocumentDataSection(documentContext: DocumentContextData): string {
    let section = '\n\n📄 DOCUMENT CONTEXT:';
    
    if (documentContext.extractedCaseNumber) {
      section += `\n- Case Number: ${documentContext.extractedCaseNumber}`;
    }
    if (documentContext.extractedCourt) {
      section += `\n- Court: ${documentContext.extractedCourt}`;
    }
    if (documentContext.extractedOpposingParty) {
      section += `\n- Opposing Party: ${documentContext.extractedOpposingParty}`;
    }
    if (documentContext.extractedFilingDate) {
      section += `\n- Filing Date: ${documentContext.extractedFilingDate}`;
    }
    if (documentContext.extractedJudge) {
      section += `\n- Judge: ${documentContext.extractedJudge}`;
    }
    if (documentContext.extractedState) {
      section += `\n- State: ${documentContext.extractedState}`;
    }
    if (documentContext.documentType) {
      section += `\n- Document Type: ${documentContext.documentType}`;
    }

    return section;
  }

  private static buildGenerationRequirementsSection(): string {
    return `

🎯 DOCUMENT GENERATION REQUIREMENTS:
- Generate a complete, court-ready legal document
- Use proper legal document formatting
- Include all required sections for the document type
- Use professional legal language throughout
- Incorporate ALL interview data and document context
- Generate 8-20 pages of comprehensive content
- Start immediately with court caption (NO introductory text)
- End with proper verification and signature blocks
- DO NOT provide summaries or explanations - GENERATE THE ACTUAL LEGAL DOCUMENT`;
  }

  public static buildSystemPromptWithContext(
    basePrompt: string,
    documentContext?: DocumentContextData,
    interviewState?: IntakeState,
    userInfo?: any,
    caseInfo?: any
  ): string {
    const context: PromptContext = {
      systemPrompt: basePrompt,
      documentContext: documentContext ? this.formatDocumentContext(documentContext) : undefined,
      interviewState,
      userInfo,
      caseInfo
    };

    return this.composeInterviewPrompt(context);
  }

  private static formatDocumentContext(documentContext: DocumentContextData): string {
    let context = '';
    
    if (documentContext.extractedCaseNumber) {
      context += `Case Number: ${documentContext.extractedCaseNumber}\n`;
    }
    if (documentContext.extractedCourt) {
      context += `Court: ${documentContext.extractedCourt}\n`;
    }
    if (documentContext.extractedOpposingParty) {
      context += `Opposing Party: ${documentContext.extractedOpposingParty}\n`;
    }
    if (documentContext.extractedFilingDate) {
      context += `Filing Date: ${documentContext.extractedFilingDate}\n`;
    }
    if (documentContext.extractedJudge) {
      context += `Judge: ${documentContext.extractedJudge}\n`;
    }
    if (documentContext.extractedState) {
      context += `State: ${documentContext.extractedState}\n`;
    }
    if (documentContext.documentType) {
      context += `Document Type: ${documentContext.documentType}\n`;
    }
    if (documentContext.parsedText) {
      context += `\nDocument Content:\n${documentContext.parsedText.substring(0, 2000)}...`;
    }

    return context;
  }

  public static sanitizePrompt(prompt: string): string {
    // Remove any potentially problematic content
    return prompt
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/\*\*[^*]*\*\*/g, '') // Remove bold formatting
      .replace(/\*[^*]*\*/g, '') // Remove italic formatting
      .trim();
  }

  public static validatePrompt(prompt: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prompt || prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    }

    // Removed 50,000 character limit to allow unlimited information
    // if (prompt.length > 50000) {
    //   errors.push('Prompt is too long (max 50,000 characters)');
    // }

    // Check for forbidden phrases
    const forbiddenPhrases = [
      'consult with an attorney',
      'seek legal counsel',
      '**Rehearing or En Banc Review**:',
      '**Case Law Research**:',
      '**Legal Analysis**:',
      '**Procedural Requirements**:'
    ];

    forbiddenPhrases.forEach(phrase => {
      if (prompt.toLowerCase().includes(phrase.toLowerCase())) {
        errors.push(`Forbidden phrase detected: "${phrase}"`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Utility functions for prompt composition
export function composeInterviewPrompt(context: PromptContext): string {
  return PromptComposer.composeInterviewPrompt(context);
}

export function composeDocumentGenerationPrompt(
  interviewData: any,
  documentContext: DocumentContextData,
  systemPrompt: string
): string {
  return PromptComposer.composeDocumentGenerationPrompt(interviewData, documentContext, systemPrompt);
}

export function buildSystemPromptWithContext(
  basePrompt: string,
  documentContext?: DocumentContextData,
  interviewState?: IntakeState,
  userInfo?: any,
  caseInfo?: any
): string {
  return PromptComposer.buildSystemPromptWithContext(basePrompt, documentContext, interviewState, userInfo, caseInfo);
}
