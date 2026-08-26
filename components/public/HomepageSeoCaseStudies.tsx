import {
  ALL_WEBSITES_SEO_CASE_STUDIES_HREF,
  HOMEPAGE_SEO_CASE_STUDIES,
} from '@/components/public/homepageSeoCaseStudiesData'

export default function HomepageSeoCaseStudies() {
  const studies = HOMEPAGE_SEO_CASE_STUDIES

  return (
    <section className="public-section-case-studies public-section-compact" aria-label="SEO case studies">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10 lg:mb-12">
          <p className="public-eyebrow public-eyebrow-on-light mb-3">PROJECTS WE HAVE DONE</p>
          <h2 className="public-heading-section public-section-title">SEO Work in Practice</h2>
          <p className="public-body-lg public-case-studies-intro">
            See how Think Big Digital has approached search visibility, website improvement and
            organic growth across real client projects.
          </p>
        </div>

        <div className="public-case-studies-grid">
          {studies.map((study) => (
            <article key={study.href} className="public-case-study-card">
              <a
                href={study.href}
                target="_blank"
                rel="noopener noreferrer"
                className="public-case-study-media"
                aria-label={`${study.title} — open case study`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={study.imageUrl}
                  alt=""
                  className="public-case-study-image"
                  loading="lazy"
                  decoding="async"
                />
              </a>

              <div className="public-case-study-body">
                <span className="public-case-study-label">SEO CASE STUDY</span>
                <h3 className="public-case-study-title">
                  <a href={study.href} target="_blank" rel="noopener noreferrer">
                    {study.title}
                  </a>
                </h3>
                <p className="public-case-study-summary">{study.summary}</p>
                {study.tag ? <span className="public-case-study-tag">{study.tag}</span> : null}
                <a
                  href={study.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-case-study-link"
                >
                  View Case Study →
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="public-case-studies-footer">
          <a
            href={ALL_WEBSITES_SEO_CASE_STUDIES_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="public-case-studies-all-link"
          >
            View All Website & SEO Case Studies →
          </a>
        </div>
      </div>
    </section>
  )
}
