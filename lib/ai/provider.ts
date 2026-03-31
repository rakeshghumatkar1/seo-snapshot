import OpenAI from 'openai'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

export interface AIProviderInput {
  prompt: string
  systemPrompt: string
  reportType?: 'snapshot' | 'detailed'
}

export interface AIProviderOutput {
  text: string
  success: boolean
  error?: string
}

export async function generateWithAI(
  input: AIProviderInput
): Promise<AIProviderOutput> {
  const provider = process.env.AI_PROVIDER || 'openai'

  console.log('[AI] Using provider:', provider)
  console.log('[AI] API Key present:', !!process.env.OPENAI_API_KEY)

  if (provider === 'mock') {
    console.log('[AI] Using mock response')
    return {
      text: getMockResponse(),
      success: true,
    }
  }

  if (provider === 'openai') {
    try {
      console.log('[OpenAI] Calling GPT-4 Turbo...')

      const maxTokens = input.reportType === 'detailed' ? 4000 : 3000

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4-turbo',
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
        temperature: 0.3,
        max_tokens: maxTokens,
      })

      const text = completion.choices[0]?.message?.content || ''

      if (!text) {
        console.error('[OpenAI] Empty response received')
        return {
          text: '',
          success: false,
          error: 'Empty response from OpenAI',
        }
      }

      console.log('[OpenAI] Success, length:', text.length)
      return { text, success: true }

    } catch (err: any) {
      console.error('[OpenAI Error]', err?.message)
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

function getMockResponse(): string {
  return `INTRODUCTION: This is a mock report for testing.

WHY_SEO_MATTERS: SEO matters for this business.

FIRST_IMPRESSION: The website appears professional.

CONTENT_VISIBILITY: Content appears moderate.

COMPETITOR_PRESENCE: Competitors seem active.

KEYWORD_OPPORTUNITIES: Several opportunities appear available.

TECHNICAL_OBSERVATIONS: Structure appears functional.

WHAT_CAN_BE_IMPROVED: Several areas could be strengthened.

NEXT_STEPS: A detailed report would help.

CONCLUSION: Good potential for growth.`
}
