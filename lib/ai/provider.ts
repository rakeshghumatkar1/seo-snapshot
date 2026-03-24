export async function callAIProvider(prompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER || 'mock';
  
  if (provider === 'mock') {
    return 'Mock AI response. Set AI_PROVIDER and OPENAI_API_KEY to enable real AI.';
  }
  
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO consultant providing business-focused advisory guidance.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  throw new Error(`Unknown AI provider: ${provider}`);
}
