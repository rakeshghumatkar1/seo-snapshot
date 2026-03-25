import { NextRequest, NextResponse } from 'next/server';
import { generateDetailedReport } from '@/lib/ai/generateDetailedReport';
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
