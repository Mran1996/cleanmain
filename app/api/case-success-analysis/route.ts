import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Initialize OpenAI client with error handling
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

async function getCaseLaw(state: string, category: string) {
  try {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) return '';

    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `Find 3 recent and relevant court cases with citations from ${state} related to ${category}. Include case names, citations, and brief summaries.`,
        model: 'llama-3-70b-instruct'
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch case law');
    const data = await response.json();
    return data.output || data.text || '';
  } catch (error) {
    console.error('Error fetching case law:', error);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
    }

    console.log('🔍 Case analysis API called');
    const data = await req.json();
    const { 
      documentText,
      state,
      legalCategory,
      courtName,
      caseNumber,
      userInfo,
      caseInfo,
      documentId // Add documentId to store analysis
    } = data;

    // ✅ Check if document was generated or if we need to create blank analysis
    const hasDocumentContent = documentText && documentText.trim().length > 0;
    
    if (!hasDocumentContent) {
      // ✅ Generate blank analysis when no document was created
      const blankAnalysis = {
        successRate: 0,
        title: `${userInfo?.firstName || 'Plaintiff'} v. ${caseInfo?.opposingParty || 'Defendant'}`,
        jurisdiction: `${courtName || 'Court'}, ${state || 'State'}`,
        caseType: legalCategory || "Legal Matter",
        primaryIssues: ["Document not generated - insufficient information provided"],
        statutes: ["No statutes analyzed - document not available"],
        outcomeEstimate: "Cannot estimate outcome - legal document not generated due to missing information",
        strengths: ["No strengths identified - document not available for analysis"],
        weaknesses: ["Document not generated - critical information missing"],
        timeline: "Cannot determine timeline - document not available",
        actionPlan: "Complete Steps 1-4 with sufficient information to generate legal document",
        riskStrategy: "Provide complete case information to enable proper legal document generation"
      };

      // Store the blank analysis in the database if documentId is provided
      if (documentId && userInfo?.id) {
        try {
          await supabase
            .from('case_analyses')
            .insert([{ 
              user_id: userInfo.id, 
              document_id: documentId, 
              analysis_data: blankAnalysis,
              title: blankAnalysis.title || 'Case Success Analysis - No Document Generated',
              created_at: new Date().toISOString()
            }]);
        } catch (dbError) {
          console.error('Error storing blank analysis in database:', dbError);
          // Continue even if database storage fails
        }
      }

      return NextResponse.json(blankAnalysis);
    }

    // ✅ Proceed with normal analysis when document content is available
    console.log('🔍 Analyzing generated document for case success insights...');
    console.log('📄 Document length:', documentText.length, 'characters');
    console.log('📋 Document ID:', documentId);
    
    // Get relevant case law first
    const relevantCaseLaw = await getCaseLaw(state, legalCategory);

    // Construct a detailed prompt for case analysis
    const prompt = `As an expert legal analyst, provide a comprehensive case success analysis. Use the following information:

Document Content:
${documentText}

Case Information:
- Category: ${legalCategory}
- State: ${state}
- Court: ${courtName}
- Case Number: ${caseNumber}
- Legal Issue: ${caseInfo?.legalIssue || 'Not specified'}
- Desired Outcome: ${caseInfo?.desiredOutcome || 'Not specified'}
- Opposing Party: ${caseInfo?.opposingParty || 'Not specified'}

Relevant Case Law:
${relevantCaseLaw}

Analyze the document content and provide a structured analysis. Return ONLY a JSON object with these exact fields:

{
  "successRate": number (0-100),
  "title": "Case Title",
  "jurisdiction": "Court/Jurisdiction",
  "caseType": "Type of Case",
  "primaryIssues": ["issue1", "issue2", "issue3"],
  "statutes": ["statute1", "statute2"],
  "outcomeEstimate": "Detailed outcome prediction",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "timeline": "Estimated timeline",
  "actionPlan": "Recommended next steps",
  "riskStrategy": "Risk mitigation strategies"
}

Base your analysis on:
1. Document content quality and completeness
2. Alignment with relevant statutes
3. Strength of evidence presented
4. Jurisdiction-specific factors
5. Similar case outcomes
6. Potential challenges and counterarguments

Provide realistic, data-driven assessments.`;

    // Generate analysis using OpenAI
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert legal analyst with deep knowledge of case law and legal strategy. Provide detailed, practical analysis with specific citations and recommendations. Return only valid JSON.

📏 LENGTH ENFORCEMENT
- For uploadedPages ≈ 30–40, produce MINIMUM 8 pages of analysis (target 8–15 pages).
- If the first pass is <60% of target, expand with additional record cites and authority until the target is met.
- Always include a "Standard of Review" section and argue why the result must change even under that standard.

📚 CASE LAW CITATION REQUIREMENTS
Cite controlling authority with short parentheticals and apply it:
- People v. Gentile (SB 1437 context)
- People v. Clements (post-SB 1437 resentencing / substantial evidence)
- People v. Powell, People v. Valenzuela, People v. Vizcarra (implied malice / aider & abettor analysis as relevant)
Use targeted, not boilerplate, applications.

📄 RECORD CITATION REQUIREMENTS
Tie every key factual assertion to a record cite (PDF p. __ / Ex. __ / CT __ / ER __). If unknown, insert [Record cite: p. __].

🎯 ADVOCACY APPROACH
Do not adopt adverse characterizations. Reframe facts for the movant. Avoid praising the trial court or "affirming."`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4096  // Maximum allowed for GPT-4 Turbo
    });

    // Extract the generated analysis
    const analysisText = completion.choices[0].message.content;
    
    if (!analysisText) {
      throw new Error('No analysis generated');
    }

    // Parse the JSON response
    let structuredAnalysis;
    try {
      // Clean up the response to extract JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to structured response
      structuredAnalysis = {
        successRate: 50,
        title: `${userInfo?.firstName || 'Plaintiff'} v. ${caseInfo?.opposingParty || 'Defendant'}`,
        jurisdiction: `${courtName || 'Court'}, ${state || 'State'}`,
        caseType: legalCategory || "Legal Matter",
        primaryIssues: ["Document analysis required", "Evidence review needed"],
        statutes: ["Relevant statutes to be determined"],
        outcomeEstimate: "Analysis pending document review",
        strengths: ["Document submitted for review"],
        weaknesses: ["Requires detailed analysis"],
        timeline: "30-90 days",
        actionPlan: "Complete document analysis and gather additional evidence",
        riskStrategy: "Consult with legal counsel for specific guidance"
      };
    }

    // Store the analysis in the database if documentId is provided
    if (documentId && userInfo?.id) {
      try {
        await supabase
          .from('case_analyses')
          .insert([{ 
            user_id: userInfo.id, 
            document_id: documentId, 
            analysis_data: structuredAnalysis,
            title: structuredAnalysis.title || 'Case Success Analysis',
            created_at: new Date().toISOString()
          }]);
      } catch (dbError) {
        console.error('Error storing analysis in database:', dbError);
        // Continue even if database storage fails
      }
    }

    return NextResponse.json(structuredAnalysis);

  } catch (error) {
    console.error('Error generating analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate case analysis' },
      { status: 500 }
    );
  }
} 