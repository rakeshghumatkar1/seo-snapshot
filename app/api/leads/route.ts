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

    if (!websiteUrl?.trim()) {
      return NextResponse.json(
        { error: 'websiteUrl is required' },
        { status: 400 }
      )
    }

    const result = await insertLead({
      email,
      name,
      company,
      websiteUrl,
      requestedReportType: actionType || 'detailed',
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API/leads]', err)
    return NextResponse.json(
      { error: 'Failed to save.' },
      { status: 500 }
    )
  }
}
