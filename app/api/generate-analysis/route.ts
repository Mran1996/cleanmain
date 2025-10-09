import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      legalDocument,
      caseNumber,
      jurisdiction,
      uploadedFileName,
      regenerateCount,
      lastDocumentHash,
      caseLawMatches,
    } = body;

    // --- Safeguards ---
    if (regenerateCount >= 3) {
      return NextResponse.json({ error: 'Limit reached: You can only generate 3 case success analyses per document.' }, { status: 403 });
    }

    if (!legalDocument || legalDocument.length < 50) {
      return NextResponse.json({ error: 'Legal document content is too short or missing.' }, { status: 400 });
    }

    console.log("Attempting to generate analysis...");
    console.log("Using AI provider:", process.env.MOONSHOT_API_KEY ? "Kimi" : (process.env.OPENAI_API_KEY ? "OpenAI" : "None"));

    // OPTIONAL: Add SHA256 hash check here for unchanged document (if supported)

    const useKimi = !!process.env.MOONSHOT_API_KEY;
    const openai = !useKimi && process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

    const systemPrompt = `
You are a legal strategist generating a case success analysis.
Review the legal document and determine:
- Main legal issues
- Strengths and weaknesses
- Likely outcome
- Relevant statutes/case law
- Timeline
- Risk mitigation

📏 LENGTH ENFORCEMENT
- For uploadedPages ≈ 30–40, produce MINIMUM 8 pages of analysis (target 8–15 pages).
- If the first pass is <60% of target, expand with additional record cites and authority until the target is met.
- Always include a "Standard of Review" section and argue why the result must change even under that standard.
- CRITICAL: Generate at least 8 pages of comprehensive analysis - do not stop short.

📚 CASE LAW CITATION REQUIREMENTS
Cite controlling authority with short parentheticals and apply it:
- People v. Gentile (SB 1437 context)
- People v. Clements (post-SB 1437 resentencing / substantial evidence)
- People v. Powell, People v. Valenzuela, People v. Vizcarra (implied malice / aider & abettor analysis as relevant)
Use targeted, not boilerplate, applications.

📄 RECORD CITATION REQUIREMENTS
Tie every key factual assertion to a record cite (PDF p. __ / Ex. __ / CT __ / ER __). If unknown, insert [Record cite: p. __].

🎯 ADVOCACY APPROACH
Do not adopt adverse characterizations. Reframe facts for the movant. Avoid praising the trial court or "affirming."

Respond in JSON.
`;

    let completion: any;
    if (useKimi) {
      const r = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MOONSHOT_API_KEY}` },
        body: JSON.stringify({
          model: 'kimi-k2-0905-preview',
          temperature: 0.4,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: legalDocument },
            ...(caseLawMatches ? [{ role: 'user', content: `Relevant case law:\n${caseLawMatches}` }] : []),
          ]
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
        temperature: 0.4,
        max_tokens: 8000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: legalDocument },
          ...(caseLawMatches ? [{ role: "user", content: `Relevant case law:\n${caseLawMatches}` }] : []),
        ],
      });
    }

    return NextResponse.json({ content: completion.choices?.[0]?.message?.content });
  } catch (err) {
    console.error('[generate-analysis-error]', err);
    return NextResponse.json({ error: 'Failed to generate case analysis.' }, { status: 500 });
  }
} 