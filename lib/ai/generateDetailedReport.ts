import { ReportResponse } from '@/types/report';
import { getDetailedPrompt } from './prompts/detailedPrompt';
import { generateWithAI } from './provider';
import { parseDetailedReport } from './parseReport';

export async function generateDetailedReport(websiteUrl: string): Promise<ReportResponse> {
  const prompt = getDetailedPrompt(websiteUrl);

  const result = await generateWithAI({
    prompt,
    systemPrompt: 'You are an expert SEO consultant providing comprehensive business-focused advisory guidance. Respond using EXACT section keys in ALL CAPS followed by a colon. No markdown headers, no bullet points, just plain paragraphs.',
  });

  if (!result.success || !result.text) {
    throw new Error(result.error || 'Failed to generate report');
  }

  const parsedSections = parseDetailedReport(result.text);

  if (!parsedSections) {
    throw new Error('Failed to parse AI response into report sections');
  }

  return {
    type: 'detailed',
    websiteUrl,
    sections: parsedSections,
  };
}
