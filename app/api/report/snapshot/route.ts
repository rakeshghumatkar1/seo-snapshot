import { NextRequest, NextResponse } from 'next/server';
import { ReportResponse } from '@/types/report';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl } = body;

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    const mockReport: ReportResponse = {
      type: "snapshot",
      websiteUrl: websiteUrl,
      sections: {
        introduction: "Your website has a solid foundation, but several key SEO opportunities remain untapped. This report gives you a high-level view of where you stand and what matters most for growth.",
        whySeoMatters: "Over 90% of online experiences begin with a search engine. Without a strong organic presence, your business is invisible to potential customers who are actively searching for what you offer.",
        currentVisibility: "Based on your website structure and content signals, your current organic visibility is limited. Your site is not fully optimized to appear for the queries your ideal customers are using.",
        contentAuthority: "Your content shows some topical relevance, but lacks the depth and structure needed to build authority in your niche. This is one of the highest-leverage areas for improvement.",
        technicalStructure: "The technical foundation of your website is functional, but there are structural improvements that would help search engines better understand and index your content.",
        opportunities: "The strongest opportunity areas are content expansion, clearer site structure, and improving how your pages communicate their purpose to both users and search engines.",
        nextSteps: "Focus first on clarifying the core pages of your website, then build out supporting content around your main services. A clear structure and relevant content will drive the most results in the short term."
      }
    };

    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json(mockReport);
  } catch (error) {
    console.error('Error generating snapshot report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
