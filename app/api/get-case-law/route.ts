import { NextResponse } from 'next/server';

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { topic, state } = await req.json();
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    if (!perplexityKey) {
      return NextResponse.json({ error: 'Missing Perplexity API Key' }, { status: 500 });
    }

    const prompt = `Provide the 3 most relevant court cases with citations from ${state} related to the topic: ${topic}. Include case names, citations, and 1-2 sentence summaries.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Use sonar-pro for real-time internet search
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Perplexity API error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch case law: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const caseLaw = data?.choices?.[0]?.message?.content || data.output || data.text || '';
    return NextResponse.json({ caseLaw });
  } catch (error) {
    console.error('Error fetching case law:', error);
    return NextResponse.json({ error: 'Failed to fetch case law' }, { status: 500 });
  }
} 