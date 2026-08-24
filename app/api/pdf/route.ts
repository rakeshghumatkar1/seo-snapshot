import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/schema'
import { buildPDFHTML } from '@/lib/pdf/generatePDF'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, company, websiteUrl, sections, reportType } = body

    if (!websiteUrl || !sections) {
      return NextResponse.json(
        { error: 'Report data is missing.' },
        { status: 400 }
      )
    }

    const config = await getConfig()
    if (config.requireEmailForPDF && !email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Build PDF HTML
    const html = buildPDFHTML({
      websiteUrl,
      reportType: reportType || 'snapshot',
      sections,
    })

    if (!html?.trim()) {
      return NextResponse.json(
        { error: 'Failed to generate PDF content' },
        { status: 500 }
      )
    }

    const filename = `seo-report-${websiteUrl
      .replace(/https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    }.html`

    return NextResponse.json({
      success: true,
      html,
      filename,
    })
  } catch (err) {
    console.error('[API/pdf]', err)
    return NextResponse.json(
      { error: 'PDF generation failed.' },
      { status: 500 }
    )
  }
}
