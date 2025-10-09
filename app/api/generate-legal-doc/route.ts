import { OpenAI } from 'openai';
import { getRelevantCaseLaw } from '@/lib/perplexity';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
}) : null;

export async function POST(req: Request) {
  try {
    const {
      userInput,
      selectedState,
      selectedCategory,
      opposingParty,
      caseNumber,
      courtName,
      plaintiffName,
      includeCaseLaw,
    } = await req.json();

    let basePrompt = `You are a highly skilled ${selectedState} attorney specializing in ${selectedCategory}.
You are deeply familiar with ${selectedState} court rules, formatting, statutes, and real case law.

DO NOT use any instructional placeholders like:
- "Insert here"
- "Double-spaced"
- "12pt font"
- "1-inch margin"
- "CASE DETAILS:"

INSTEAD, return only a full, professional, legally formatted document using this structure:

---

IN THE SUPERIOR COURT OF ${selectedState?.toUpperCase()} COUNTY  
STATE OF ${selectedState?.toUpperCase()}

${plaintiffName || "UNKNOWN PLAINTIFF"},                      )  
       Plaintiff,                         )     Case No. ${caseNumber || "[To Be Added]"}  
                                          )  
vs.                                       )     ${uploadedData?.text ? "RESPONSE TO MOTION" : "LEGAL MOTION"}  
                                          )  
${opposingParty || "UNKNOWN DEFENDANT"},   )  
       Defendant.                         )  

---

[Generate full document here]

Use real section titles:
- I. INTRODUCTION
- II. STATEMENT OF FACTS
- III. LEGAL ARGUMENT
- IV. RELIEF REQUESTED
- V. CONCLUSION

📚 If case law is enabled, cite real cases like: "See State v. Smith, 150 Wn. App. 123 (2012)"  
📜 If no case law is enabled, just use statutes or factual argument.

SIGNATURE:

Respectfully submitted,  
${plaintiffName || "UNKNOWN PLAINTIFF"}  
${selectedState?.toUpperCase()}  
Dated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

__________________________  
${plaintiffName || "UNKNOWN PLAINTIFF"}

CERTIFICATE OF SERVICE:
I certify that I served a copy of this document on the opposing party on the date above via email.

__________________________  
${plaintiffName || "UNKNOWN PLAINTIFF"}

DO NOT return a`;

    let caseLaw = '';
    if (includeCaseLaw) {
      caseLaw = await getRelevantCaseLaw(userInput, selectedCategory, selectedState);
    }

    const fullPrompt = `
${basePrompt}

Use the following information:
- Plaintiff: ${plaintiffName || 'UNKNOWN PLAINTIFF'}
- Defendant: ${opposingParty || 'UNKNOWN DEFENDANT'}
- Case No.: ${caseNumber || 'UNKNOWN CASE NO.'}
- Court: ${courtName || 'SUPERIOR COURT OF WASHINGTON, COUNTY OF KING'}

Facts:
${userInput}

${includeCaseLaw ? `Relevant Case Law:\n${caseLaw}` : ''}

Generate a complete legal document in HTML format using the provided CSS classes. Ensure proper formatting and spacing for court filing.`;

    const useKimi = !!process.env.MOONSHOT_API_KEY;
    let response: any;
    if (useKimi) {
      // Non-streaming from Kimi; we will stream the full content as one event
      const r = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MOONSHOT_API_KEY}` },
        body: JSON.stringify({
          model: 'kimi-k2-0905-preview',
          messages: [ { role: 'system', content: fullPrompt } ],
          temperature: 0.4
        })
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Kimi API error: ${r.status} - ${text}`);
      }
      response = await r.json();
    } else {
      if (!openai) throw new Error('OpenAI not configured');
      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        stream: true,
        temperature: 0.4,
        messages: [
          { role: 'system', content: fullPrompt },
        ],
      });
    }

    // Set up Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (useKimi) {
            const content = response?.choices?.[0]?.message?.content || '';
            if (content) controller.enqueue(encoder.encode(`data: ${content}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } else {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(`data: ${content}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error generating legal document:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate legal document' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 
 