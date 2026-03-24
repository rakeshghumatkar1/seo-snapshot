import { ReportResponse } from '@/types/report';
import { getSnapshotPrompt } from './prompts/snapshotPrompt';
import { callAIProvider } from './provider';
import { parseReport } from './parseReport';

export async function generateSnapshotReport(websiteUrl: string): Promise<ReportResponse> {
  const prompt = getSnapshotPrompt(websiteUrl);
  const aiResponse = await callAIProvider(prompt);
  const parsedSections = parseReport(aiResponse, 'snapshot');
  
  return {
    type: 'snapshot',
    websiteUrl,
    sections: parsedSections,
  };
}
