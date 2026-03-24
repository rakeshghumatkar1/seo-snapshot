import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, company, websiteUrl, actionType } = body;

    if (!email || !websiteUrl || !actionType) {
      return NextResponse.json(
        { error: 'Email, website URL, and action type are required' },
        { status: 400 }
      );
    }

    const db = getDbClient();
    
    if (db) {
      try {
        await db`
          INSERT INTO leads (email, name, company, website_url, requested_report_type)
          VALUES (${email}, ${name || null}, ${company || null}, ${websiteUrl}, ${actionType})
        `;
      } catch (dbError) {
        console.error('Database error (non-critical):', dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { error: 'Failed to save lead' },
      { status: 500 }
    );
  }
}
