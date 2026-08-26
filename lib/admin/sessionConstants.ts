/** Shared Admin session lifetime constants (safe for Edge + Node). */

export const COOKIE_NAME = 'admin_session'

/** 30 days in seconds — cookie maxAge and DB expires_at both use this. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

/** Only refresh last_seen / extend expiry if idle longer than this. */
export const SESSION_TOUCH_THRESHOLD_HOURS = 12
