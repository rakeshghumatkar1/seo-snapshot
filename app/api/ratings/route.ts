import { NextRequest, NextResponse } from 'next/server'
import { insertRating } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { websiteUrl, email, rating, comment } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be 1-5' },
        { status: 400 }
      )
    }

    await insertRating({
      websiteUrl,
      email,
      rating: Number(rating),
      comment,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API/ratings]', err)
    return NextResponse.json(
      { error: 'Failed to save rating.' },
      { status: 500 }
    )
  }
}
