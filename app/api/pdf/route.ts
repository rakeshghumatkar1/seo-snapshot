import { NextRequest, NextResponse } from 'next/server'
import { insertLead } from '@/lib/db/schema'
import { buildPDFHTML } from '@/lib/pdf/generatePDF'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, company, websiteUrl, sections, reportType } = body

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      )
    }

    if (!websiteUrl || !sections) {
      return NextResponse.json(
        { error: 'Report data is missing.' },
        { status: 400 }
      )
    }

    // Store lead first — never lose it
    await insertLead({
      email,
      name,
      company,
      websiteUrl,
      requestedReportType: 'pdf',
    }).catch(err =>
      console.error('[PDF] Lead storage failed', err)
    )

    // Build PDF HTML
    const html = buildPDFHTML({
      websiteUrl,
      reportType: reportType || 'snapshot',
      sections,
    })

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
