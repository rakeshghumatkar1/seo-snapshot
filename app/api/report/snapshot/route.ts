import { NextRequest, NextResponse } from 'next/server';
import { generateSnapshotReport } from '@/lib/ai/generateSnapshotReport';
import { checkRateLimit } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/rateLimit/getIp';

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
