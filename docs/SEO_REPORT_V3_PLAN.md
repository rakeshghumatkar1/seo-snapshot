# SEO Report Tool ΓÇö Version 3 Locked Plan

**Status:** Planning approved through Step 8.  
**Important:** This document records agreed decisions only. It does **not** mean the V3 crawler, prompts, parser, UI, PDF, or database prompts have been implemented yet.

## Purpose of V3

The reports should help a business owner answer:

> Can search realistically help this business get discovered, trusted and contacted, and what should the business improve first?

The business path is:

**Customer need ΓåÆ Search / AI-powered discovery ΓåÆ Website ΓåÆ Understanding ΓåÆ Trust ΓåÆ Evaluation ΓåÆ Enquiry / Purchase**

Technical SEO supports this path. It is not the centre of the report.

AI search is treated as part of the evolving search ecosystem, not as a separate ΓÇ£AI SEO auditΓÇ¥.

---

# Step 1 ΓÇö Locked Reporting Specification

## Snapshot V3 ΓÇö 10 sections

1. Business & Customer Understanding
2. Search Opportunity
3. Website & Offer Clarity
4. Trust & Reputation
5. Traditional Search Readiness
6. AI Discovery Readiness
7. Customer & Content Opportunities
8. Enquiry Readiness
9. Top Priority Actions
10. Limits & Next Step

### Snapshot role

Answer:

- Does search likely matter to this business?
- Is the website prepared for traditional and AI-powered discovery?
- Does it communicate enough trust?
- Can visitors easily move to enquiry or purchase?
- What are the top 3ΓÇô5 priorities?

Target length: approximately **800ΓÇô1,100 words**.

## Detailed V3 ΓÇö 16 sections

1. Executive Business Assessment
2. Search as a Growth Channel
3. Customer Intent & Discovery
4. Positioning & Offer Clarity
5. Commercial Page Readiness
6. Content & Information Assets
7. Authority, Reputation & Trust
8. Traditional Search Readiness
9. AI Discovery Readiness
10. Local Search Readiness ΓÇö conditional
11. Competitive Search Evidence ΓÇö conditional / future external data
12. Conversion & Enquiry Readiness
13. Measurement Limitations
14. Priority Investment Plan
15. Action Roadmap
16. Evidence & Limitations

### Detailed role

Answer:

- How should search fit into customer acquisition?
- Which pages, content and trust assets need strengthening?
- What should management invest in first?
- What belongs in Foundation, Growth, and Monitor & Improve?

Target length: approximately **1,800ΓÇô2,600 words**.

## Locked rating language

### Search Opportunity

- Likely
- Conditional
- Uncertain

With confidence:

- High
- Moderate
- Low

### Readiness / Trust

- Strong
- Developing
- Limited

Use qualitative ratings rather than arbitrary percentage scores.

## Locked roadmap

**Foundation ΓåÆ Growth ΓåÆ Monitor & Improve**

Do not force every business into an artificial 30/60/90-day plan.

---

# Step 2 ΓÇö Locked Layer 1 Website Evidence

The collector should eventually gather:

1. Smarter **8ΓÇô12 page selection**
2. Meta description
3. Canonical URL
4. Meta robots / noindex
5. robots.txt
6. Sitemap
7. OAI-SearchBot access
8. Structured data / JSON-LD
9. Better internal-link evidence
10. Founder / team / authorship evidence
11. Testimonials / case studies / certifications
12. CTA / forms / phone / email / booking / contact-path evidence
13. Business / service / location extraction
14. HTTP status and final URL after redirects
15. Existing visible content and headings
16. Rendered-page fallback only when normal fetching is clearly incomplete

## Layer 1 rule

Layer 1 measures:

- website readiness
- search readiness
- AI discovery readiness
- on-site trust evidence
- enquiry readiness

It does **not** claim:

- actual rankings
- actual traffic
- backlinks
- external authority
- actual AI visibility
- leads
- revenue

---

# Step 3 ΓÇö External Layer Decision

## Current testing phase

**DataForSEO is deferred.**

Do not add it yet while the product is still being tested.

Future optional external evidence may include:

- keyword/search-demand validation
- sampled Google SERPs
- search competitors
- external reviews
- backlinks / referring domains
- local search evidence

No custom Google scraper is planned.

The V3 architecture should work correctly even when external evidence is unavailable.

---

# Step 4 ΓÇö Locked Evidence Architecture

Create one reusable **Website Evidence Package** shared by Snapshot and Detailed.

Conceptual structure:

- Analysis Coverage
- Site-wide Search Evidence
- Business Evidence
- On-site Trust Evidence
- Content & Customer-Decision Evidence
- Enquiry & Conversion Evidence
- Per-page Evidence
- External Evidence
- Limitations

## Evidence labels

Use:

- **Observed ΓÇö Website**
- **Observed ΓÇö External**
- **Inferred**
- **Not Verified**

## Important absence rule

Distinguish:

- Found
- Not observed in analysed pages
- Verified unavailable / absent

Example:

Correct: ΓÇ£No case-study evidence was observed in the pages reviewed.ΓÇ¥

Incorrect: ΓÇ£The website has no case studies.ΓÇ¥

## Trust rule

Keep **on-site trust evidence** separate from **external reputation**.

Website testimonials, founder bios and case studies do not prove strong independent external reputation.

## Shared crawl principle

Snapshot and Detailed should use the same underlying evidence package where practical, so the two reports do not contradict each other because they crawled different pages.

---

# Step 5 ΓÇö Snapshot Prompt V3

Snapshot Prompt V3 has been drafted and conceptually approved.

Locked output keys:

- BUSINESS_CUSTOMER_UNDERSTANDING
- SEARCH_OPPORTUNITY
- WEBSITE_OFFER_CLARITY
- TRUST_REPUTATION
- TRADITIONAL_SEARCH_READINESS
- AI_DISCOVERY_READINESS
- CUSTOMER_CONTENT_OPPORTUNITIES
- ENQUIRY_READINESS
- TOP_PRIORITY_ACTIONS
- LIMITS_NEXT_STEP

Important rules include:

- business-first language
- no fake rankings / traffic / backlinks / leads / revenue
- no invented competitors
- no fake AI visibility
- AI Discovery Readiness is not proof of AI citation
- 3ΓÇô5 priorities maximum
- no automatic ΓÇ£publish blogs every monthΓÇ¥ advice

---

# Step 6 ΓÇö Detailed Prompt V3

Detailed Prompt V3 has been drafted and conceptually approved.

Locked output keys:

- EXECUTIVE_BUSINESS_ASSESSMENT
- SEARCH_AS_GROWTH_CHANNEL
- CUSTOMER_INTENT_DISCOVERY
- POSITIONING_OFFER_CLARITY
- COMMERCIAL_PAGE_READINESS
- CONTENT_INFORMATION_ASSETS
- AUTHORITY_REPUTATION_TRUST
- TRADITIONAL_SEARCH_READINESS
- AI_DISCOVERY_READINESS
- LOCAL_SEARCH_READINESS
- COMPETITIVE_SEARCH_EVIDENCE
- CONVERSION_ENQUIRY_READINESS
- MEASUREMENT_LIMITATIONS
- PRIORITY_INVESTMENT_PLAN
- ACTION_ROADMAP
- EVIDENCE_LIMITATIONS

Important rule:

Detailed must provide **deeper reasoning**, not merely more SEO errors or repeated Snapshot content.

---

# Step 7 ΓÇö Snapshot vs Detailed Alignment

## Snapshot

Short management decision report:

- Is search likely useful?
- How prepared is the website?
- Are trust and enquiry paths strong enough?
- What 3ΓÇô5 things matter first?

## Detailed

Strategic implementation report:

- Customer discovery journey
- Commercial page analysis
- content assets
- trust/authority depth
- technical readiness
- AI discovery readiness
- local readiness when relevant
- investment priorities
- Foundation ΓåÆ Growth ΓåÆ Monitor & Improve roadmap

## Additional locked refinements

- Customer journey framework is mainly visible in Detailed.
- Commercial Page Readiness is a dedicated Detailed section.
- Local Search is a standalone Detailed section only when relevant.
- Snapshot should not contain competitor analysis without real external data.
- Detailed competitor section remains conditional and short when external evidence is unavailable.
- No separate repetitive generic conclusion section.

---

# Step 8 ΓÇö Approved Implementation Plan

## Core principle

Do **not** replace prompts alone.

V3 affects the connected chain:

**Crawler ΓåÆ Evidence Package ΓåÆ AI generators ΓåÆ Prompts ΓåÆ Parser ΓåÆ Types ΓåÆ Report UI ΓåÆ PDF ΓåÆ Admin Prompt Validation ΓåÆ Archived Reports**

These must be coordinated.

## Recommended implementation order

1. Define Evidence Package TypeScript types
2. Improve crawler and smarter page selection
3. Validate collector on real websites
4. Update V3 report types and parser
5. Finalize and measure Snapshot Prompt V3
6. Finalize and measure Detailed Prompt V3
7. Update Snapshot and Detailed generators to use structured evidence
8. Update report UI section keys / labels
9. Update PDF section keys / labels
10. Add report versioning (`reportVersion: 3` for new reports)
11. Update Admin Prompt Editor validation keys
12. Test using V3 code / fallback before changing live database prompts
13. Only after code works, install V3 prompts into Admin/database
14. Run full workflow test: URL ΓåÆ Snapshot ΓåÆ Detailed ΓåÆ PDF ΓåÆ Archive ΓåÆ Admin
15. Production release

## Important safety rule

**Do not change the live Admin/database prompts before the code required to parse and render V3 is already deployed and tested.**

The database prompts currently override GitHub fallback prompts, so switching them too early could break production report parsing/rendering.

## Prompt-size guardrail

The current Admin Prompt API has a **20,000-character limit**.

Before installation:

- measure both V3 prompts
- tighten wording if needed
- increase the limit only if genuinely necessary

## Report history / compatibility

Do not rewrite old V2 archived reports into V3.

Add versioning so:

- historical V2 reports remain readable
- new V3 reports are identifiable
- future V4 migration is easier

## PDF wording

The current PDF label ΓÇ£AI SEO Advisory ReportΓÇ¥ should be reconsidered for V3 because the product is not positioned as an AI-only SEO audit.

Possible direction:

- Search & Business Growth Report
- SEO & AI Search Business Report

Final wording to be agreed before implementation.

---

# Files Already Identified as Likely V3 Change Points

- `lib/ai/fetchWebsite.ts`
- `lib/ai/generateSnapshotReport.ts`
- `lib/ai/generateDetailedReport.ts`
- `lib/ai/prompts/snapshotPrompt.ts`
- `lib/ai/prompts/detailedPrompt.ts`
- `lib/ai/parseReport.ts`
- `types/report.ts`
- `app/report/page.tsx`
- `app/api/pdf/route.ts`
- `lib/pdf/generatePDF.ts`
- `app/admin/dashboard/page.tsx`
- `app/api/admin/prompts/route.ts`
- `app/api/report/snapshot/route.ts`
- corresponding Detailed report route

New Evidence Package files may be created rather than overloading `fetchWebsite.ts`.

---

# Features Deliberately Not Added in This V3 Testing Phase

- DataForSEO
- Search Console
- Analytics
- CRM
- custom Google scraping
- continuous AI monitoring
- major unrelated Admin redesign
- major homepage redesign

---

# Testing Plan

## Collector testing

Check across different websites:

- correct services/business understanding
- page selection quality
- robots/sitemap behavior
- CTA detection
- founder/team/case study detection
- trust evidence accuracy
- correct ΓÇ£not observedΓÇ¥ wording

## Snapshot testing

Check:

- Search Opportunity quality
- business specificity
- AI Discovery Readiness
- trust/reputation separation
- no fabricated external evidence
- only 3ΓÇô5 priorities
- usefulness to a non-technical business owner

## Detailed testing

Check:

- substantially deeper than Snapshot
- no unnecessary repetition
- useful prioritisation
- commercial page and customer-journey reasoning
- Foundation ΓåÆ Growth ΓåÆ Monitor & Improve roadmap

## Business types to test

- local professional service
- B2B company
- SaaS/technology
- ecommerce/product
- established company
- new company
- strong website
- weak website

## Final production-flow test

**URL ΓåÆ Snapshot ΓåÆ Detailed ΓåÆ PDF ΓåÆ Archive ΓåÆ Admin ΓåÆ Rating**

---

# Current Status / Next Action

Steps 1ΓÇô8 are approved conceptually.

**No V3 production code or database prompt has been implemented yet.**

The next action, when approved, is to start implementation from the **Evidence Package types + improved Layer 1 collector**, then validate the collector before installing the V3 prompts.
