import { NextResponse } from 'next/server'
import { getPublicHomepageShowcase } from '@/lib/db/homepageShowcase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await getPublicHomepageShowcase()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (err) {
    console.error('[public/homepage-showcase]', err)
    return NextResponse.json(
      {
        stats: {
          websitesAnalysed: 0,
          reportsGenerated: 0,
          detailedReportsCreated: 0,
        },
        sampleReports: [],
        recentBusinesses: [],
      },
      { status: 200 }
    )
  }
}
