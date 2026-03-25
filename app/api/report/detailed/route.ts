import { NextRequest, NextResponse } from 'next/server';
import { generateDetailedReport } from '@/lib/ai/generateDetailedReport';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl, email, name, company } = body;

    if (!websiteUrl || typeof websiteUrl !== 'string' || !email) {
      return NextResponse.json(
        { error: 'Website URL and email are required' },
        { status: 400 }
      );
    }

    const cleanUrl = websiteUrl.trim().replace(/\/+$/, '');

    // Store lead BEFORE generating report
    try {
      await fetch(new URL('/api/leads', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || null,
          company: company || null,
          websiteUrl: cleanUrl,
          actionType: 'detailed',
        }),
      });
    } catch (leadErr) {
      console.error('Lead storage failed (non-critical):', leadErr);
    }

    const report = await generateDetailedReport(cleanUrl);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating detailed report:', error);
    return NextResponse.json(
      { error: 'Failed to generate detailed report. Please try again.' },
      { status: 500 }
    );
  }
}
