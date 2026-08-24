/** Local copies of approved Think Big Digital brand assets (public/). */

/** Full stacked dark logo (white/blue on transparent) — canonical source */
export const LOGO_STACKED_DARK_SRC =
  '/images/brand/thinkbig-logo-primary-stacked-dark-v1-transparent.png';

/**
 * Stacked dark logo with fully transparent outer margins trimmed.
 * Use for header/footer so visible artwork fills the display height.
 */
export const LOGO_STACKED_DARK_HEADER_TRIMMED_SRC =
  '/images/brand/thinkbig-logo-stacked-dark-header-trimmed.png';

export const LOGO_STACKED_LIGHT_SRC =
  '/images/brand/thinkbig-logo-primary-stacked-light-v1-transparent.png';

/** Favicon / browser icon only — not for header or footer */
export const FAVICON_SYMBOL_SRC =
  '/images/brand/thinkbig-symbol-favicon-v1-transparent.png';

export const LOGO_STACKED_INTRINSIC = {
  width: 947,
  height: 846,
} as const;

/** Intrinsic size after transparent-margin trim */
export const LOGO_STACKED_TRIMMED_INTRINSIC = {
  width: 787,
  height: 686,
} as const;
