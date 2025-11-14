export async function getCaseLaw(topic: string, jurisdiction: string) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const query = `recent case law in ${jurisdiction} about ${topic}`;
  
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "sonar-pro", // Use sonar-pro for real-time internet search
      messages: [{ role: "user", content: query }],
      temperature: 0.0
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const citations = data?.citations || [];
  
  // Format citations if available
  if (citations.length > 0) {
    const citationList = citations.map((citation: string, index: number) => 
      `• ${citation}`
    ).join("\n");
    return `${content}\n\nSources:\n${citationList}`;
  }
  
  return content;
} 