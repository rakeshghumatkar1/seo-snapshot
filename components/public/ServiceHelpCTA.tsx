import {
  THINK_BIG_CONTACT_FORM,
  SEO_SUPPORT_EMAIL,
  SEO_SUPPORT_PHONE_DISPLAY,
  SEO_SUPPORT_PHONE_LINK,
} from '@/lib/brand/links';

type ServiceHelpCTAProps = {
  variant?: 'compact' | 'full';
};

export default function ServiceHelpCTA({ variant = 'full' }: ServiceHelpCTAProps) {
  if (variant === 'compact') {
    return (
      <aside
        className="public-service-help-compact mt-6 p-5 text-center"
        aria-label="SEO implementation support"
      >
        <p className="public-body-sm" style={{ marginBottom: '12px' }}>
          Need help acting on these priorities? Think Big Digital can support implementation.
        </p>
        <a
          href={THINK_BIG_CONTACT_FORM}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ padding: '10px 20px', fontSize: '14px' }}
        >
          Discuss SEO Support
        </a>
      </aside>
    );
  }

  return (
    <aside
      className="public-service-help-full mt-8 p-8 sm:p-10 text-center"
      aria-labelledby="service-help-heading"
    >
      <h2 id="service-help-heading" className="public-heading-card" style={{ marginBottom: '12px' }}>
        Want Help Acting on This Report?
      </h2>
      <p className="public-body-md" style={{ maxWidth: '480px', margin: '0 auto 24px' }}>
        Think Big Digital can help turn these priorities into a practical website, SEO and content
        improvement plan based on your business goals.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <a
          href={THINK_BIG_CONTACT_FORM}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-lg"
        >
          Discuss Your SEO Requirements
        </a>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center public-body-sm">
        <a href={SEO_SUPPORT_EMAIL} className="public-link">
          grow@thinkbigdigital.in
        </a>
        <span className="hidden sm:inline public-text-muted" aria-hidden="true">
          ·
        </span>
        <a href={SEO_SUPPORT_PHONE_LINK} className="public-link">
          {SEO_SUPPORT_PHONE_DISPLAY}
        </a>
      </div>
    </aside>
  );
}
