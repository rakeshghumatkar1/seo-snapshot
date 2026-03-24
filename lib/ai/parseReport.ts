import { SnapshotSections, DetailedSections } from '@/types/report';

export function parseReport(
  aiResponse: string,
  type: 'snapshot' | 'detailed'
): SnapshotSections | DetailedSections {
  const sections: any = {};
  
  const sectionPatterns = {
    introduction: /introduction[:\s]+(.*?)(?=\n\n|why seo matters|$)/is,
    whySeoMatters: /why seo matters[:\s]+(.*?)(?=\n\n|current visibility|$)/is,
    currentVisibility: /current visibility[:\s]+(.*?)(?=\n\n|content authority|$)/is,
    contentAuthority: /content authority[:\s]+(.*?)(?=\n\n|technical structure|$)/is,
    technicalStructure: /technical structure[:\s]+(.*?)(?=\n\n|opportunities|$)/is,
    opportunities: /opportunities[:\s]+(.*?)(?=\n\n|next steps|$)/is,
    nextSteps: /next steps[:\s]+(.*?)(?=\n\n|current positioning|$)/is,
  };
  
  if (type === 'detailed') {
    Object.assign(sectionPatterns, {
      currentPositioning: /current positioning[:\s]+(.*?)(?=\n\n|technical review|$)/is,
      technicalReview: /technical review[:\s]+(.*?)(?=\n\n|competitor presence|$)/is,
      competitorPresence: /competitor presence[:\s]+(.*?)(?=\n\n|keyword direction|$)/is,
      keywordDirection: /keyword direction[:\s]+(.*?)(?=\n\n|content strategy|$)/is,
      contentStrategy: /content strategy[:\s]+(.*?)(?=\n\n|roadmap|$)/is,
      roadmap: /roadmap[:\s]+(.*?)(?=\n\n|conclusion|$)/is,
      conclusion: /conclusion[:\s]+(.*?)$/is,
    });
  }
  
  for (const [key, pattern] of Object.entries(sectionPatterns)) {
    const match = aiResponse.match(pattern);
    if (match && match[1]) {
      sections[key] = match[1].trim();
    } else {
      sections[key] = `Content for ${key} section.`;
    }
  }
  
  return sections;
}
