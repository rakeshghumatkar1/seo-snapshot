import { NextResponse } from 'next/server'
import { setupDatabase } from '@/lib/db/schema'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }
  const result = await setupDatabase()
  return NextResponse.json(result)
}
