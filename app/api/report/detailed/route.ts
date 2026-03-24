import { NextRequest, NextResponse } from 'next/server';
import { ReportResponse } from '@/types/report';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl, email, name, company } = body;

    if (!websiteUrl || !email) {
      return NextResponse.json(
        { error: 'Website URL and email are required' },
        { status: 400 }
      );
    }

    const mockDetailedReport: ReportResponse = {
      type: "detailed",
      websiteUrl: websiteUrl,
      sections: {
        introduction: "Your website has a solid foundation, but several key SEO opportunities remain untapped. This detailed report provides a comprehensive analysis of your current position and a roadmap for improvement.",
        whySeoMatters: "Over 90% of online experiences begin with a search engine. Without a strong organic presence, your business is invisible to potential customers who are actively searching for what you offer. SEO is not just about rankings—it's about building sustainable, scalable customer acquisition.",
        currentVisibility: "Based on your website structure and content signals, your current organic visibility is limited. Your site is not fully optimized to appear for the queries your ideal customers are using. This represents a significant opportunity cost in terms of traffic and conversions.",
        contentAuthority: "Your content shows some topical relevance, but lacks the depth and structure needed to build authority in your niche. This is one of the highest-leverage areas for improvement. Building content authority requires consistent, high-quality content that addresses user intent.",
        technicalStructure: "The technical foundation of your website is functional, but there are structural improvements that would help search engines better understand and index your content. Key areas include site architecture, internal linking, and page speed optimization.",
        opportunities: "The strongest opportunity areas are content expansion, clearer site structure, and improving how your pages communicate their purpose to both users and search engines. Additionally, there are quick wins available in on-page optimization and metadata improvements.",
        nextSteps: "Focus first on clarifying the core pages of your website, then build out supporting content around your main services. A clear structure and relevant content will drive the most results in the short term.",
        currentPositioning: "Your website currently positions itself in a competitive landscape, but lacks differentiation in key areas. To stand out, you need to clarify your unique value proposition and ensure it's reflected consistently across all pages.",
        technicalReview: "A comprehensive technical audit reveals opportunities in page speed, mobile optimization, structured data implementation, and crawl efficiency. These technical improvements will create a stronger foundation for your content efforts.",
        competitorPresence: "Your main competitors are establishing strong organic presence in your target keywords. They're investing in content depth, user experience, and technical excellence. To compete effectively, you'll need a strategic approach that leverages your unique strengths.",
        keywordDirection: "The keyword landscape in your niche shows clear opportunities in long-tail, intent-driven queries. Rather than competing head-on for broad terms, focus on specific problem-solving content that addresses your ideal customer's pain points.",
        contentStrategy: "A successful content strategy for your business should focus on three pillars: educational content that builds trust, service-specific pages that convert, and supporting content that captures long-tail traffic. Consistency and quality are more important than volume.",
        roadmap: "Month 1-2: Optimize existing core pages and fix technical issues. Month 3-4: Launch targeted content addressing key customer questions. Month 5-6: Build supporting content and strengthen internal linking. This phased approach ensures quick wins while building long-term momentum.",
        conclusion: "Your website has strong potential for organic growth. By focusing on the strategic priorities outlined in this report—technical foundation, content authority, and clear positioning—you can build a sustainable SEO presence that drives meaningful business results."
      }
    };

    await new Promise(resolve => setTimeout(resolve, 3000));

    return NextResponse.json(mockDetailedReport);
  } catch (error) {
    console.error('Error generating detailed report:', error);
    return NextResponse.json(
      { error: 'Failed to generate detailed report' },
      { status: 500 }
    );
  }
}
