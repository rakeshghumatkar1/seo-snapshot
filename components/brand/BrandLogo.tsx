import Image from 'next/image';
import Link from 'next/link';
import {
  LOGO_STACKED_DARK_HEADER_TRIMMED_SRC,
  LOGO_STACKED_TRIMMED_INTRINSIC,
} from '@/lib/brand/assets';
import { THINK_BIG_HOME } from '@/lib/brand/links';

type BrandLogoProps = {
  size?: 'header' | 'footer';
  href?: string;
  className?: string;
};

/**
 * Genuine Think Big stacked dark-background logo for navy header/footer.
 * Uses margin-trimmed derivative so visible artwork scales correctly.
 */
export default function BrandLogo({
  size = 'header',
  href = THINK_BIG_HOME,
  className = '',
}: BrandLogoProps) {
  const sizeClass =
    size === 'footer' ? 'public-brand-logo-footer' : 'public-brand-logo-header';

  const image = (
    <Image
      src={LOGO_STACKED_DARK_HEADER_TRIMMED_SRC}
      alt="Think Big Digital Solutions"
      width={LOGO_STACKED_TRIMMED_INTRINSIC.width}
      height={LOGO_STACKED_TRIMMED_INTRINSIC.height}
      sizes={
        size === 'footer'
          ? '(max-width: 640px) 96px, 120px'
          : '(max-width: 640px) 56px, (max-width: 1023px) 64px, 68px'
      }
      quality={92}
      className={`object-contain object-left ${sizeClass} ${className}`.trim()}
      priority={size === 'header'}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Think Big Digital Solutions — visit parent website (opens in new tab)"
        className="inline-flex shrink-0 items-center"
      >
        {image}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0 items-center">{image}</span>;
}
