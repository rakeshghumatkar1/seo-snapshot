import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface AIProviderInput {
  prompt: string
  systemPrompt: string
  model?: string
}

export interface AIProviderOutput {
  text: string
  success: boolean
  error?: string
}

export async function generateWithAI(
  input: AIProviderInput
): Promise<AIProviderOutput> {
  const provider = process.env.AI_PROVIDER || 'mock'

  if (provider === 'mock') {
    return {
      text: getMockResponse(input.prompt),
      success: true,
    }
  }

  if (provider === 'groq') {
    try {
      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: input.systemPrompt,
          },
          {
            role: 'user',
            content: input.prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      })

      const text = completion.choices[0]?.message?.content || ''

      if (!text) {
        return {
          text: '',
          success: false,
          error: 'Empty response from AI provider',
        }
      }

      return { text, success: true }
    } catch (err: any) {
      console.error('[Groq Error]', err?.message)
      return {
        text: '',
        success: false,
        error: 'AI provider unavailable',
      }
    }
  }

  return {
    text: '',
    success: false,
    error: 'Unknown AI provider configured',
  }
}

function getMockResponse(prompt: string): string {
  return `
INTRODUCTION: Your website has a solid foundation, but several 
key SEO opportunities remain untapped. This report gives you a 
high-level view of where you stand and what matters most.

WHY_SEO_MATTERS: Over 90% of online experiences begin with a 
search engine. Without strong organic presence, your business 
is invisible to customers actively searching for what you offer.

CURRENT_VISIBILITY: Based on your website structure and content 
signals, your current organic visibility is limited. Your site 
is not fully optimized for the queries your ideal customers use.

CONTENT_AUTHORITY: Your content shows topical relevance but 
lacks the depth needed to build authority in your niche. This 
is one of the highest-leverage areas for improvement.

TECHNICAL_STRUCTURE: The technical foundation is functional 
but structural improvements would help search engines better 
understand and index your content.

OPPORTUNITIES: The strongest opportunities are content 
expansion, clearer site structure, and improving how pages 
communicate their purpose to users and search engines.

NEXT_STEPS: Focus first on clarifying core pages, then build 
supporting content around your main services. Clear structure 
and relevant content will drive the most results short term.
  `
}

