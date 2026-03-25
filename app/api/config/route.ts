import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/schema'

export async function GET() {
  try {
    const config = await getConfig()
    return NextResponse.json(config)
  } catch (err) {
    return NextResponse.json({
      enableDetailedReport: true,
      enablePDFDownload: true,
      enableRating: true,
      requireEmailForDetailed: true,
      requireEmailForPDF: true,
    })
  }
}
