import {
  THINK_BIG_CONTACT_FORM,
  SEO_SUPPORT_EMAIL,
  SEO_SUPPORT_PHONE_DISPLAY,
  SEO_SUPPORT_PHONE_LINK,
} from '@/lib/brand/links'
import { BRAND_NAME } from '@/lib/report/presentation'

type ServiceHelpCTAProps = {
  variant?: 'compact' | 'full'
}

export default function ServiceHelpCTA({ variant = 'full' }: ServiceHelpCTAProps) {
  return (
    <aside
      className={`report-contact-cta${variant === 'compact' ? ' report-contact-cta-compact' : ''}`}
      aria-labelledby="report-contact-cta-heading"
    >
      <p className="report-contact-cta-kicker">{BRAND_NAME}</p>
      <h2 id="report-contact-cta-heading" className="report-contact-cta-title">
        Need help implementing these recommendations?
      </h2>
      <p className="report-contact-cta-body">
        {BRAND_NAME} can help turn the findings into a practical search, content and website
        improvement plan.
      </p>
      <a
        href={THINK_BIG_CONTACT_FORM}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary report-contact-cta-button"
      >
        Contact {BRAND_NAME}
      </a>
      <div className="report-contact-cta-meta">
        <a href={SEO_SUPPORT_EMAIL}>{SEO_SUPPORT_EMAIL.replace('mailto:', '').split('?')[0]}</a>
        <span aria-hidden="true">·</span>
        <a href={SEO_SUPPORT_PHONE_LINK}>{SEO_SUPPORT_PHONE_DISPLAY}</a>
      </div>
    </aside>
  )
}
