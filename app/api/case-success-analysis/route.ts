import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

async function getCaseLaw(state: string, category: string) {
  try {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) return '';

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a legal research assistant. Provide accurate case law citations and summaries.'
          },
          {
            role: 'user',
            content: `Find 3 recent and relevant court cases with citations from ${state} related to ${category}. Include case names, citations, and brief summaries.`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error fetching case law:', error);
    return '';
  }
}

async function analyzeWithPerplexity(documentText: string, caseInfo: any, relevantCaseLaw: string): Promise<any> {
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!perplexityKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const analysisPrompt = `You are an expert legal analyst with deep knowledge of case law, legal strategy, and realistic case outcome assessment. Analyze the following legal document and provide a comprehensive, REALISTIC case success analysis with detailed explanations and actionable improvement strategies.

CRITICAL: Be realistic and conservative in your success rate assessment. Do not inflate success rates. Base your assessment on:
1. Actual document quality and legal arguments
2. Strength of evidence presented
3. Jurisdiction-specific case law and precedents
4. Common challenges and counterarguments
5. Real-world case outcomes for similar matters

Document Content:
${documentText.substring(0, 15000)}${documentText.length > 15000 ? '... [document truncated for analysis]' : ''}

Case Information:
- Category: ${caseInfo.legalCategory || 'Not specified'}
- State: ${caseInfo.state || 'Not specified'}
- Court: ${caseInfo.courtName || 'Not specified'}
- Case Number: ${caseInfo.caseNumber || 'Not specified'}
- Legal Issue: ${caseInfo.legalIssue || 'Not specified'}
- Desired Outcome: ${caseInfo.desiredOutcome || 'Not specified'}
- Opposing Party: ${caseInfo.opposingParty || 'Not specified'}

Relevant Case Law:
${relevantCaseLaw || 'No case law provided'}

Analyze the document thoroughly and provide a COMPREHENSIVE, REALISTIC assessment with detailed explanations. Return ONLY a valid JSON object with these exact fields:

{
  "successRate": number (0-100, be realistic and conservative),
  "successRateExplanation": "A detailed 2-3 paragraph explanation of why the success rate is what it is. Explain the key factors that influenced this assessment, including document quality, evidence strength, legal arguments, and how similar cases have fared. Be specific and educational.",
  "title": "Case Title",
  "jurisdiction": "Court/Jurisdiction",
  "caseType": "Type of Case",
  "primaryIssues": ["issue1", "issue2", "issue3"],
  "statutes": ["statute1", "statute2"],
  "outcomeEstimate": "Detailed, realistic outcome prediction based on actual case law and precedents. Explain what is most likely to happen and why.",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "improvementStrategies": [
    "Specific, actionable strategy 1 to improve success chances (e.g., 'Gather additional witness statements from [specific people] to strengthen your factual narrative')",
    "Specific, actionable strategy 2 (e.g., 'Cite the recent case [Case Name] which supports your position on [specific legal point]')",
    "Specific, actionable strategy 3 (e.g., 'Address the weakness in [specific area] by [specific action]')",
    "Specific, actionable strategy 4 (e.g., 'Strengthen your argument on [specific issue] by [specific method]')"
  ],
  "keyRecommendations": [
    "Priority recommendation 1 - most important action to take",
    "Priority recommendation 2 - second most important action",
    "Priority recommendation 3 - third most important action"
  ],
  "criticalActions": [
    "Critical action 1 that must be done to improve chances (be specific)",
    "Critical action 2 that must be done (be specific)",
    "Critical action 3 that must be done (be specific)"
  ],
  "timeline": "Estimated timeline based on similar cases, with explanation of key milestones",
  "actionPlan": "Comprehensive, step-by-step action plan with specific next steps the user should take",
  "riskStrategy": "Detailed risk mitigation strategies with specific steps to address each major risk"
}

IMPORTANT INSTRUCTIONS: 
- Success rate should be realistic (typically 20-70% for most cases, only go higher if the case is exceptionally strong)
- successRateExplanation must be detailed and educational - explain WHY the rate is what it is
- improvementStrategies must be SPECIFIC and ACTIONABLE - tell the user exactly what to do, not just general advice
- keyRecommendations should be prioritized (most important first)
- criticalActions are things the user MUST do to improve their chances - be specific
- Base your assessment on actual legal standards and precedents
- Identify real weaknesses, not just strengths
- Be honest about challenges the case may face
- Consider jurisdiction-specific factors and recent case law trends
- Make all recommendations practical and achievable
- Explain how each improvement strategy will increase their success rate`;

  try {
    console.log('🔍 [PERPLEXITY] Analyzing document with Perplexity AI...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal analyst. Provide realistic, data-driven case success analysis. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [PERPLEXITY] API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content || '';
    
    if (!analysisText) {
      throw new Error('No analysis generated from Perplexity');
    }

    console.log('✅ [PERPLEXITY] Analysis received, length:', analysisText.length);

    // Parse JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ [PERPLEXITY] Success rate:', parsed.successRate);
      return parsed;
    } else {
      throw new Error('No valid JSON found in Perplexity response');
    }
  } catch (error) {
    console.error('❌ [PERPLEXITY] Error analyzing with Perplexity:', error);
    throw error;
  }
}



export async function POST(req: Request) {
  try {
    // Check if Perplexity is configured (required for analysis)
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return NextResponse.json({ 
        error: "Perplexity API not configured", 
        message: "PERPLEXITY_API_KEY is required for case success analysis" 
      }, { status: 503 });
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
        title: (userInfo?.firstName || 'Plaintiff') + ' v. ' + (caseInfo?.opposingParty || 'Defendant'),
        jurisdiction: (courtName || 'Court') + ', ' + (state || 'State'),
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

    // Use Perplexity to analyze the document
    console.log('🔍 [PERPLEXITY] Starting document analysis with Perplexity...');
    
    let structuredAnalysis;
    try {
      structuredAnalysis = await analyzeWithPerplexity(documentText, {
        legalCategory,
        state,
        courtName,
        caseNumber,
        legalIssue: caseInfo?.legalIssue,
        desiredOutcome: caseInfo?.desiredOutcome,
        opposingParty: caseInfo?.opposingParty
      }, relevantCaseLaw);
      
      // Ensure success rate is realistic (cap at reasonable levels)
      if (structuredAnalysis.successRate > 85) {
        console.warn('⚠️ [PERPLEXITY] Success rate seems high, capping at 85% for realism');
        structuredAnalysis.successRate = Math.min(85, structuredAnalysis.successRate);
      }
      
      console.log('✅ [PERPLEXITY] Analysis complete. Success rate:', structuredAnalysis.successRate);
    } catch (perplexityError) {
      console.error('❌ [PERPLEXITY] Error in Perplexity analysis, using fallback:', perplexityError);
      // Fallback to structured response if Perplexity fails
      structuredAnalysis = {
        successRate: 45, // Conservative fallback
        successRateExplanation: "Analysis service temporarily unavailable. A conservative estimate of 45% has been assigned. For a detailed assessment, please try generating the analysis again.",
        title: (userInfo?.firstName || 'Plaintiff') + ' v. ' + (caseInfo?.opposingParty || 'Defendant'),
        jurisdiction: (courtName || 'Court') + ', ' + (state || 'State'),
        caseType: legalCategory || "Legal Matter",
        primaryIssues: ["Document analysis required", "Evidence review needed"],
        statutes: ["Relevant statutes to be determined"],
        outcomeEstimate: "Analysis pending document review - Perplexity analysis service temporarily unavailable",
        strengths: ["Document submitted for review"],
        weaknesses: ["Requires detailed analysis", "Perplexity analysis service unavailable"],
        improvementStrategies: [
          "Try generating the analysis again when the service is available",
          "Review your document for completeness and accuracy",
          "Ensure all relevant evidence is included in your filing"
        ],
        keyRecommendations: [
          "Retry the case analysis generation",
          "Review document for any missing information",
          "Consult with legal counsel for guidance"
        ],
        criticalActions: [
          "Ensure document contains all necessary legal arguments",
          "Verify all evidence is properly cited",
          "Review document for completeness before filing"
        ],
        timeline: "30-90 days",
        actionPlan: "Complete document analysis and gather additional evidence. Retry analysis generation when service is available.",
        riskStrategy: "Consult with legal counsel for specific guidance. Ensure all documentation is complete before proceeding."
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