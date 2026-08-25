'use client'

export type RecentBusiness = {
  displayName: string
  domain: string | null
}

export default function HomepageRecentBusinesses({
  businesses,
}: {
  businesses: RecentBusiness[]
}) {
  if (!businesses.length) return null

  return (
    <section
      className="public-section-recent public-section-compact"
      aria-label="Recently analysed businesses"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-8">
          <p className="public-eyebrow public-eyebrow-on-light mb-3">SOCIAL PROOF</p>
          <h2 className="public-heading-section public-section-title">
            Recently Analysed Businesses
          </h2>
          <p className="public-body-md public-recent-intro">
            Websites analysed with SEO Snapshot — shown only when approved for public display.
          </p>
        </div>

        <ul className="public-recent-strip">
          {businesses.map((item) => (
            <li key={`${item.displayName}-${item.domain || ''}`} className="public-recent-item">
              <span className="public-recent-name">{item.displayName}</span>
              {item.domain ? <span className="public-recent-domain">{item.domain}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
