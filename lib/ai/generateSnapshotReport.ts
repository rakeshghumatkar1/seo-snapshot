import { ReportResponse } from '@/types/report';
import { buildSnapshotPrompt, SNAPSHOT_SYSTEM_PROMPT } from './prompts/snapshotPrompt';
import { generateWithAI } from './provider';
import { parseSnapshotReport } from './parseReport';

export async function generateSnapshotReport(websiteUrl: string): Promise<ReportResponse> {
  const prompt = buildSnapshotPrompt(websiteUrl);

  const result = await generateWithAI({
    prompt,
    systemPrompt: SNAPSHOT_SYSTEM_PROMPT,
  });

  if (!result.success || !result.text) {
    throw new Error(result.error || 'Failed to generate report');
  }

  const parsedSections = parseSnapshotReport(result.text);

  if (!parsedSections) {
    throw new Error('Failed to parse AI response into report sections');
  }

  return {
    type: 'snapshot',
    websiteUrl,
    sections: parsedSections,
  };
}

