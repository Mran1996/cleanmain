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

  const analysisPrompt = `You are an expert legal analyst with deep knowledge of case law, legal strategy, and realistic case outcome assessment. Analyze the following legal document and provide a comprehensive, REALISTIC case success analysis with detailed explanations and actionable improvement recommendations.

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

Analyze the document thoroughly and provide a REALISTIC assessment with detailed explanations. Return ONLY a valid JSON object with these exact fields:

{
  "successRate": number (0-100, be realistic and conservative),
  "title": "Case Title",
  "jurisdiction": "Court/Jurisdiction",
  "caseType": "Type of Case",
  "primaryIssues": ["issue1", "issue2", "issue3"],
  "statutes": ["statute1", "statute2"],
  "outcomeEstimate": "Detailed, realistic outcome prediction based on actual case law and precedents. Explain WHY this outcome is likely, citing specific factors.",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "timeline": "Estimated timeline based on similar cases",
  "actionPlan": "Recommended next steps",
  "riskStrategy": "Risk mitigation strategies",
  "successRateExplanation": "A clear, detailed explanation of what the success rate means. Explain the factors that contribute to this assessment, what it means in practical terms, and what level of confidence this represents.",
  "howToImprove": "Detailed, actionable recommendations on how to improve the chances of success. Include specific steps the user can take, additional evidence they should gather, arguments they should strengthen, and strategies they should consider. Be specific and practical.",
  "keyFactors": "The 3-5 most important factors that will determine the outcome of this case. Explain each factor clearly.",
  "comparisonToSimilarCases": "How this case compares to similar cases in this jurisdiction. Include success rates and outcomes of comparable cases if available.",
  "criticalNextSteps": ["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4", "Specific action 5"]
}

IMPORTANT: 
- Success rate should be realistic (typically 20-70% for most cases, only go higher if the case is exceptionally strong)
- Base your assessment on actual legal standards and precedents
- Identify real weaknesses, not just strengths
- Be honest about challenges the case may face
- Consider jurisdiction-specific factors and recent case law trends
- Provide EDUCATIONAL explanations that help the user understand their case better
- Give SPECIFIC, ACTIONABLE recommendations for improvement
- Explain the "why" behind the success rate, not just the number
- Make recommendations practical and achievable`;

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
        title: (userInfo?.firstName || 'Plaintiff') + ' v. ' + (caseInfo?.opposingParty || 'Defendant'),
        jurisdiction: (courtName || 'Court') + ', ' + (state || 'State'),
        caseType: legalCategory || "Legal Matter",
        primaryIssues: ["Document analysis required", "Evidence review needed"],
        statutes: ["Relevant statutes to be determined"],
        outcomeEstimate: "Analysis pending document review - Perplexity analysis unavailable",
        strengths: ["Document submitted for review"],
        weaknesses: ["Requires detailed analysis", "Perplexity analysis service unavailable"],
        timeline: "30-90 days",
        actionPlan: "Complete document analysis and gather additional evidence",
        riskStrategy: "Consult with legal counsel for specific guidance",
        successRateExplanation: "This is a conservative estimate. A detailed analysis by Perplexity AI was unavailable. The actual success rate may vary based on case-specific factors, evidence strength, and legal arguments.",
        howToImprove: "To improve your chances: 1) Ensure all evidence is properly documented and organized, 2) Strengthen legal arguments with relevant case law, 3) Address any weaknesses identified in your document, 4) Consider consulting with legal counsel for case-specific guidance, 5) Gather additional supporting documentation if available.",
        keyFactors: "The outcome will depend on: 1) Strength of legal arguments, 2) Quality and completeness of evidence, 3) Jurisdiction-specific case law and precedents, 4) Court's interpretation of facts, 5) Opposing party's response and counterarguments.",
        comparisonToSimilarCases: "Unable to compare to similar cases - Perplexity analysis service unavailable. Generally, cases with strong evidence, clear legal arguments, and favorable precedents have higher success rates.",
        criticalNextSteps: [
          "Review the document for completeness and accuracy",
          "Gather any missing evidence or documentation",
          "Strengthen weak arguments with additional case law",
          "Consider professional legal review",
          "Prepare for potential counterarguments"
        ]
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