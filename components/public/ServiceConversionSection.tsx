import {
  THINK_BIG_CONTACT_FORM,
  THINK_BIG_SERVICES,
  SEO_SUPPORT_EMAIL,
  SEO_SUPPORT_PHONE_DISPLAY,
  SEO_SUPPORT_PHONE_LINK,
} from '@/lib/brand/links';

export default function ServiceConversionSection() {
  return (
    <section className="public-section-service" aria-labelledby="service-conversion-heading">
      <div className="max-w-3xl mx-auto px-6 py-16 lg:py-20 text-center">
        <div className="public-service-insight-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M7 23.5 13 17l4 3 8-10" />
            <path d="M20 10h5v5" />
            <path d="M7 8.5h7M7 12h4" />
          </svg>
        </div>
        <p className="public-eyebrow public-eyebrow-on-light mb-4">
          NEED HELP IMPLEMENTING THE FINDINGS?
        </p>
        <h2 id="service-conversion-heading" className="public-heading-section public-service-heading">
          Want Help Turning These Insights Into Improvements?
        </h2>
        <p className="public-body-lg public-service-body">
          Think Big Digital can help you review the priorities, strengthen your website and turn
          the findings into a practical SEO and content improvement plan.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <a
            href={THINK_BIG_CONTACT_FORM}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-lg public-service-btn"
          >
            Discuss Your SEO Requirements
          </a>
          <a
            href={THINK_BIG_SERVICES}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-lg public-service-btn"
          >
            Explore Think Big Services
          </a>
        </div>

        <div className="public-service-contact">
          <a href={SEO_SUPPORT_EMAIL} className="public-link public-service-contact-link">
            grow@thinkbigdigital.in
          </a>
          <span className="public-service-contact-sep" aria-hidden="true">
            ·
          </span>
          <a href={SEO_SUPPORT_PHONE_LINK} className="public-link public-service-contact-link">
            {SEO_SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}
