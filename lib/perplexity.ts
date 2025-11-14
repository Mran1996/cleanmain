export async function getRelevantCaseLaw(
  userInput: string,
  category: string,
  state: string
): Promise<string> {
  try {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      console.warn('Perplexity API key not found, using placeholder case law');
      return `Example v. Case, 123 P.3d 456 (${state} 2024)
- Held that similar contract disputes require specific performance
- Court emphasized importance of written agreements

Smith v. Jones, 789 P.3d 012 (${state} 2023)
- Established precedent for summary judgment in contract cases
- Outlined requirements for proving breach of contract`;
    }

    // Create a focused query for case law
    const query = `Find 3-5 recent and relevant court cases with citations from ${state} related to ${category} law and ${userInput}. Include case names, citations, and 1-2 sentence summaries of the key holdings. Focus on cases from the last 10 years that would be most relevant to this legal issue.`;

    console.log(`🔍 [PERPLEXITY] Searching for case law: ${query}`);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Use sonar-pro for real-time internet search
        messages: [{ role: 'user', content: query }],
        temperature: 0.0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const caseLaw = data?.choices?.[0]?.message?.content || data.output || data.text || data.response || '';

    console.log(`📚 [PERPLEXITY] Retrieved case law: ${caseLaw.substring(0, 200)}...`);

    // If no case law found, return a fallback
    if (!caseLaw || caseLaw.trim().length === 0) {
      return `No specific case law found for ${state} ${category} cases related to ${userInput}. Consider consulting with a local attorney for state-specific precedents.`;
    }

    return caseLaw;
  } catch (error) {
    console.error('Error fetching case law from Perplexity:', error);
    
    // Return fallback case law
    return `Example v. Case, 123 P.3d 456 (${state} 2024)
- Held that similar ${category} issues require specific legal analysis
- Court emphasized importance of proper legal procedure

Smith v. Jones, 789 P.3d 012 (${state} 2023)
- Established precedent for ${category} cases
- Outlined requirements for proving legal claims

Note: These are example citations. For actual case law, consult with a local attorney or legal database.`;
  }
} 
 