import { NextRequest, NextResponse } from 'next/server'
import { insertLead } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, company, websiteUrl, actionType } = body

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await insertLead({
      email,
      name,
      company,
      websiteUrl,
      requestedReportType: actionType || 'detailed',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API/leads]', err)
    return NextResponse.json(
      { error: 'Failed to save.' },
      { status: 500 }
    )
  }
}
