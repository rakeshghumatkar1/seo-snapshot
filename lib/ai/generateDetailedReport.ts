import { ReportResponse } from '@/types/report';
import { buildDetailedPrompt, DETAILED_SYSTEM_PROMPT } from './prompts/detailedPrompt';
import { generateWithAI } from './provider';
import { parseDetailedReport } from './parseReport';

export async function generateDetailedReport(websiteUrl: string): Promise<ReportResponse> {
  const prompt = buildDetailedPrompt(websiteUrl);

  const result = await generateWithAI({
    prompt,
    systemPrompt: DETAILED_SYSTEM_PROMPT,
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
