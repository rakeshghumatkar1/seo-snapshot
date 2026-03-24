import { ReportResponse } from '@/types/report';
import { getDetailedPrompt } from './prompts/detailedPrompt';
import { callAIProvider } from './provider';
import { parseReport } from './parseReport';

export async function generateDetailedReport(websiteUrl: string): Promise<ReportResponse> {
  const prompt = getDetailedPrompt(websiteUrl);
  const aiResponse = await callAIProvider(prompt);
  const parsedSections = parseReport(aiResponse, 'detailed');
  
  return {
    type: 'detailed',
    websiteUrl,
    sections: parsedSections,
  };
}
