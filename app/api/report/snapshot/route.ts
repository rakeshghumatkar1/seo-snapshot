import { NextRequest, NextResponse } from 'next/server';
import { generateSnapshotReport } from '@/lib/ai/generateSnapshotReport';
import { checkRateLimit } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/rateLimit/getIp';
import { insertArchivedReport } from '@/lib/db/reportArchive';

export async function POST(request: NextRequest) {
  try {
    console.log('[Snapshot Route] Called')
    console.log('[Snapshot Route] AI_PROVIDER:', process.env.AI_PROVIDER)
    console.log('[Snapshot Route] OPENAI_KEY present:', !!process.env.OPENAI_API_KEY)

    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: `You've reached the daily limit of 20 reports. Please try again later.`,
          retryAfterMs: rateLimit.retryAfterMs,
          retryAfterFormatted: rateLimit.retryAfterFormatted,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    console.log(`[RateLimit] IP ${ip}: ${rateLimit.remaining} remaining today`);

    const body = await request.json();
    const { websiteUrl } = body;

    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    const cleanUrl = websiteUrl.trim().replace(/\/+$/, '');

    const result = await generateSnapshotReport(cleanUrl);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate report. Please try again.' },
        { status: 500 }
      );
    }

    const report = {
      type: 'snapshot' as const,
      websiteUrl: cleanUrl,
      reportVersion: 3 as const,
      sections: result.sections,
    };

    // Finish archiving before responding so the report and PDF are not lost
    // when the serverless request ends.
    try {
      await insertArchivedReport({
        websiteUrl: cleanUrl,
        reportType: 'snapshot',
        email: undefined,
        status: 'success',
        sectionsJson: {
          reportVersion: 3,
          ...result.sections,
        },
      });
    } catch (err) {
      console.error('[Snapshot] Report archive failed:', err)
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating snapshot report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report. Please try again.' },
      { status: 500 }
    );
  }
}
