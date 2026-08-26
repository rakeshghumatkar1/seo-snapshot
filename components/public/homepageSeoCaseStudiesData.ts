export type SeoCaseStudyTeaser = {
  title: string
  summary: string
  imageUrl: string
  href: string
  tag?: string
}

/**
 * Curated Websites & SEO case studies from thinkbigdigital.co.
 * Titles, hrefs, and cover images were taken from the live published pages —
 * do not invent slugs or image paths.
 */
export const HOMEPAGE_SEO_CASE_STUDIES: SeoCaseStudyTeaser[] = [
  {
    title: 'SEO-Led Digital Growth & Organic Search Transformation',
    summary:
      'Think Big Digital partnered with PriceWise Insulation to improve search visibility, grow organic traffic, and build a scalable acquisition channel through long-term SEO strategy and optimisation.',
    imageUrl:
      'https://74mokfvmy50sn9yo.public.blob.vercel-storage.com/case-studies/items/csi_fa67a46a31a94412bc4b5e4db5115102/cover-1782221795713.webp',
    href: 'https://thinkbigdigital.co/case-studies/seo-led-digital-growth-organic-search-transformation',
    tag: 'Organic Growth',
  },
  {
    title: 'Spinifex Sheds Local SEO Growth & Lead Generation Transformation',
    summary:
      'Think Big Digital helped Spinifex Sheds strengthen local online visibility and turn organic search into a stronger lead-generation channel for sheds and outdoor structures across Australia.',
    imageUrl:
      'https://74mokfvmy50sn9yo.public.blob.vercel-storage.com/case-studies/items/csi_e10d5ca9739f448b915efe049f537cba/cover-1782284160202.webp',
    href: 'https://thinkbigdigital.co/case-studies/spinifex-sheds-local-seo-growth-lead-generation-transformation',
    tag: 'Local SEO',
  },
  {
    title:
      'How a Donor Education & Nonprofit Resource Platform Expanded Organic Search Visibility, Traffic and AI Search Coverage',
    summary:
      'SEO work expanded keyword coverage, organic traffic, and Google AI Overview visibility for a donor-education and nonprofit resource platform across fundraising and planned-giving topics.',
    imageUrl:
      'https://74mokfvmy50sn9yo.public.blob.vercel-storage.com/case-studies/items/csi_62d60a2f03964a03b849756bb7e40f85/cover-1782369711247.webp',
    href: 'https://thinkbigdigital.co/case-studies/how-a-donor-education-nonprofit-resource-platform-expanded-organic-search-visibility-traffic-and-ai-search-coverage',
    tag: 'AI Search Visibility',
  },
]

export const ALL_WEBSITES_SEO_CASE_STUDIES_HREF =
  'https://thinkbigdigital.co/case-studies?service=websites-seo'
