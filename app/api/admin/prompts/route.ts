import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'

export async function GET() {
  const auth = await isAdminAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await dbQuery(
      `SELECT key, content, updated_at FROM prompts WHERE key IN ('snapshot_system_prompt', 'detailed_system_prompt')`
    )

    const map: Record<string, { content: string; updated_at: string | null }> = {}
    for (const row of rows) {
      map[row.key] = { content: row.content, updated_at: row.updated_at }
    }

    return NextResponse.json({
      snapshot: map['snapshot_system_prompt']?.content ?? '',
      detailed: map['detailed_system_prompt']?.content ?? '',
      snapshotUpdatedAt: map['snapshot_system_prompt']?.updated_at ?? null,
      detailedUpdatedAt: map['detailed_system_prompt']?.updated_at ?? null,
    })
  } catch (err) {
    console.error('[Admin/prompts GET]', err)
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
  }
}

const SECTION_KEYS: Record<string, string[]> = {
  snapshot_system_prompt: [
    'BUSINESS_CUSTOMER_UNDERSTANDING:',
    'SEARCH_OPPORTUNITY:',
    'WEBSITE_OFFER_CLARITY:',
    'TRUST_REPUTATION:',
    'TRADITIONAL_SEARCH_READINESS:',
    'AI_DISCOVERY_READINESS:',
    'CUSTOMER_CONTENT_OPPORTUNITIES:',
    'ENQUIRY_READINESS:',
    'TOP_PRIORITY_ACTIONS:',
    'LIMITS_NEXT_STEP:',
  ],
  detailed_system_prompt: [
    'EXECUTIVE_BUSINESS_ASSESSMENT:',
    'SEARCH_AS_GROWTH_CHANNEL:',
    'CUSTOMER_INTENT_DISCOVERY:',
    'POSITIONING_OFFER_CLARITY:',
    'COMMERCIAL_PAGE_READINESS:',
    'CONTENT_INFORMATION_ASSETS:',
    'AUTHORITY_REPUTATION_TRUST:',
    'TRADITIONAL_SEARCH_READINESS:',
    'AI_DISCOVERY_READINESS:',
    'LOCAL_SEARCH_READINESS:',
    'COMPETITIVE_SEARCH_EVIDENCE:',
    'CONVERSION_ENQUIRY_READINESS:',
    'MEASUREMENT_LIMITATIONS:',
    'PRIORITY_INVESTMENT_PLAN:',
    'ACTION_ROADMAP:',
    'EVIDENCE_LIMITATIONS:',
  ],
}

export async function POST(req: NextRequest) {
  const auth = await isAdminAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { key, content, skipValidation } = body

    if (!key || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    if (content.length > 20000) {
      return NextResponse.json(
        { success: false, error: 'Prompt exceeds 20,000 character limit' },
        { status: 400 }
      )
    }

    if (!skipValidation && content.length > 0 && SECTION_KEYS[key]) {
      const missing = SECTION_KEYS[key].filter(k => !content.includes(k))
      if (missing.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required section keys',
            missing: missing.map(k => k.replace(':', '')),
          },
          { status: 400 }
        )
      }
    }

    const existing = await dbQuery(
      `SELECT content FROM prompts WHERE key = $1`,
      [key]
    )
    if (existing.length > 0 && existing[0].content) {
      await dbQuery(
        `INSERT INTO prompt_history (key, content, saved_at) VALUES ($1, $2, NOW())`,
        [key, existing[0].content]
      )
      await dbQuery(
        `DELETE FROM prompt_history WHERE key = $1 AND id NOT IN (
          SELECT id FROM prompt_history WHERE key = $1 ORDER BY saved_at DESC LIMIT 10
        )`,
        [key]
      )
    }

    const rows = await dbQuery(
      `INSERT INTO prompts (key, content, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE
       SET content = EXCLUDED.content, updated_at = NOW()
       RETURNING id`,
      [key, content]
    )
    if (!rows.length) {
      return NextResponse.json(
        { error: 'Failed to save prompt' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Admin/prompts POST]', err)
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
  }
}
