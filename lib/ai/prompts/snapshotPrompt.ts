export function getSnapshotPrompt(websiteUrl: string): string {
  return `You are an expert SEO consultant providing business-focused advisory guidance.

Analyze the website: ${websiteUrl}

Provide a strategic SEO snapshot report with the following sections:

1. Introduction - Brief overview of the website's SEO position
2. Why SEO Matters - Explain the business value of SEO for this specific site
3. Current Visibility - Assessment of organic visibility potential
4. Content Authority - Evaluation of content depth and topical relevance
5. Technical Structure - Overview of technical foundation
6. Opportunities - Key areas for improvement
7. Next Steps - Clear, actionable recommendations

Write in plain language for business owners. Focus on strategic guidance, not technical jargon.
Avoid mentioning specific metrics, scores, or crawl data.
Keep each section concise but valuable (2-4 sentences).`;
}
