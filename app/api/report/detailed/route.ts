import { NextRequest, NextResponse } from 'next/server';
import { generateDetailedReport } from '@/lib/ai/generateDetailedReport';
import { checkRateLimit } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/rateLimit/getIp';
import { getConfig } from '@/lib/db/schema';
import { insertArchivedReport } from '@/lib/db/reportArchive';

export async function POST(request: NextRequest) {
  try {
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
    const { websiteUrl, email } = body;

    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      )
    }

    const config = await getConfig()
    if (config.requireEmailForDetailed && !email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const cleanUrl = websiteUrl.trim().replace(/\/+$/, '');

    const result = await generateDetailedReport(cleanUrl);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate detailed report. Please try again.' },
        { status: 500 }
      );
    }

    const report = {
      type: 'detailed' as const,
      websiteUrl: cleanUrl,
      sections: result.sections,
    };

    // Finish archiving before responding so the report and PDF are not lost
    // when the serverless request ends.
    try {
      await insertArchivedReport({
        websiteUrl: cleanUrl,
        reportType: 'detailed',
        email,
        status: 'success',
        sectionsJson: result.sections,
      });
    } catch (err) {
      console.error('[Detailed] Report archive failed:', err)
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating detailed report:', error);
    return NextResponse.json(
      { error: 'Failed to generate detailed report. Please try again.' },
      { status: 500 }
    );
  }
}
