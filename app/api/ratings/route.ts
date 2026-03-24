import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl, email, rating, comment } = body;

    if (!websiteUrl || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid website URL and rating (1-5) are required' },
        { status: 400 }
      );
    }

    const db = getDbClient();
    
    if (db) {
      try {
        await db`
          INSERT INTO ratings (website_url, email, rating, comment)
          VALUES (${websiteUrl}, ${email || null}, ${rating}, ${comment || null})
        `;
      } catch (dbError) {
        console.error('Database error (non-critical):', dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { error: 'Failed to save rating' },
      { status: 500 }
    );
  }
}
