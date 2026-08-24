import { NextResponse } from 'next/server'
import { setupDatabase } from '@/lib/db/schema'

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const result = await setupDatabase()
  return NextResponse.json(result)
}
