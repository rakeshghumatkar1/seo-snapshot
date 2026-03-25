import { NextRequest, NextResponse } from 'next/server';
import { generateSnapshotReport } from '@/lib/ai/generateSnapshotReport';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl } = body;

    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    const cleanUrl = websiteUrl.trim().replace(/\/+$/, '');

    const report = await generateSnapshotReport(cleanUrl);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating snapshot report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report. Please try again.' },
      { status: 500 }
    );
  }
}
