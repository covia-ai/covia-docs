/**
 * GA4 instrumentation for docs.covia.ai.
 *
 * Implements Phase 2 of the D070 analytics strategy
 * (`docs/ANALYTICS-STRATEGY.md` in the `covia-website` repo):
 *
 *   §2.1 / §8.1 — one measurement ID across the estate + cross-domain linker
 *   §3.2        — `content_doc_page_view`, `content_doc_search`
 *   §5.1        — cookie consent gates all web analytics
 *   §5.3        — Do Not Track respected
 *
 * Why this is hand-rolled instead of `@docusaurus/plugin-google-gtag`:
 * that plugin's whole options schema is `trackingID` + `anonymizeIP`, and it
 * injects the gtag `<script>` into `<head>` at build time. It cannot be gated
 * on consent and gives no way to pass `linker`, both of which are
 * non-negotiable here. The config below is otherwise identical to the
 * covia.ai implementation in `src/components/analytics/GoogleAnalytics.tsx`.
 *
 * Note on Do Not Track: gtag.js has no DNT setting of its own (unlike the
 * PostHog SDK's `respect_dnt`), so DNT is honoured by declining to load the
 * tag at all.
 */

import {subscribeToCookieConsent} from 'docusaurus-plugin-cookie-consent/client';
// The `/client` entry re-exports the runtime helpers but not this type, so it
// comes from the package root. Type-only, so no server code is pulled in.
import type {ConsentState} from 'docusaurus-plugin-cookie-consent';

/** Shared across covia.ai, docs, app and preview — never create a second property. */
export const GA_MEASUREMENT_ID = 'G-CS4QNLYT4M';

/** The `property` param carried on every event (D070 §3.3). */
export const ANALYTICS_PROPERTY = 'docs.covia.ai';

/**
 * Cross-domain linker domains (D070 §8.1). Must stay identical to the array in
 * covia-website's `GoogleAnalytics.tsx`, or `client_id` stops surviving the hop.
 */
export const LINKER_DOMAINS = [
  'covia.ai',
  'docs.covia.ai',
  'app.covia.ai',
  'preview.covia.ai',
];

/** localStorage key owned by `docusaurus-plugin-cookie-consent` on this site. */
export const CONSENT_STORAGE_KEY = 'covia-consent-docs';

/**
 * Mirror of the consent record written by covia.ai's `src/lib/consent.ts`, so
 * that a future shared consent layer can read either property's record without
 * a migration. See `mirrorConsentToCoviaRecord` for the caveats.
 */
const COVIA_CONSENT_KEY = 'covia-consent';
const COVIA_CONSENT_CHANGE_EVENT = 'covia-consent-change';

/** Keep in step with `PRIVACY_POLICY_VERSION` in covia-website `src/lib/consent.ts`. */
const PRIVACY_POLICY_VERSION = '2026-04-11';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

let gtagLoaded = false;
let analyticsGranted = false;

/**
 * True when the browser asks not to be tracked. gtag has no native support,
 * so callers must check this before loading anything.
 */
export function isDoNotTrackEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const legacy = window as unknown as {
    doNotTrack?: string;
    navigator: {doNotTrack?: string; msDoNotTrack?: string};
  };
  const signals = [
    legacy.doNotTrack,
    legacy.navigator?.doNotTrack,
    legacy.navigator?.msDoNotTrack,
  ];
  return signals.some((signal) => signal === '1' || signal === 'yes');
}

/**
 * Injects gtag.js and applies the shared config. Idempotent — the `config`
 * call fires the initial `page_view`, so callers must not fire one themselves
 * on the load that first brings the tag in.
 */
function ensureGtag(): void {
  if (gtagLoaded) {
    return;
  }
  gtagLoaded = true;

  window.dataLayer = window.dataLayer || [];
  // Must forward `arguments`, so this cannot be an arrow function.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: true,
    // Rewrites in-site links to carry `_gl=...` so `client_id` survives the
    // hop to covia.ai / app.covia.ai / preview.covia.ai, and accepts the same
    // parameter on the way in. Same measurement ID on all four properties.
    linker: {
      domains: LINKER_DOMAINS,
      accept_incoming: true,
    },
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/**
 * Sends a custom event, adding the `property` param every D070 event carries.
 * A no-op until analytics consent has been granted.
 */
export function track(event: string, params: Record<string, unknown> = {}): void {
  if (!analyticsGranted || typeof window === 'undefined' || !window.gtag) {
    return;
  }
  window.gtag('event', event, {property: ANALYTICS_PROPERTY, ...params});
}

/**
 * Derives the `section` param from a docs path: the segment after `/docs/`,
 * e.g. `/docs/user-guide/sdk/python` → `user-guide`.
 */
export function sectionFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return 'home';
  }
  if (segments[0] !== 'docs') {
    return segments[0];
  }
  return segments[1] ?? 'docs-root';
}

/** `content_doc_page_view` (D070 §3.2). */
export function trackDocPageView(pathname: string): void {
  track('content_doc_page_view', {
    path: pathname,
    section: sectionFromPath(pathname),
  });
}

/**
 * Fires the GA4 `page_view` for a client-side navigation, then the custom
 * docs event. Only for route changes — the initial view comes from `config`.
 */
export function trackRouteChange(location: {
  pathname: string;
  search: string;
  hash: string;
}): void {
  if (!analyticsGranted || typeof window === 'undefined' || !window.gtag) {
    return;
  }
  window.gtag(
    'set',
    'page_path',
    location.pathname + location.search + location.hash,
  );
  window.gtag('event', 'page_view');
  trackDocPageView(location.pathname);
}

/**
 * SHA-256 of the normalised query, truncated to 16 hex chars — matching the
 * `sha256(...).slice(0, 16)` convention D070 §4.2 uses for `user_id`.
 *
 * Returns null when the query is empty or WebCrypto is unavailable (an
 * insecure origin). We drop the event rather than fall back to a weaker hash:
 * raw search queries must never reach GA4.
 */
export async function hashSearchQuery(query: string): Promise<string | null> {
  const normalised = query.trim().toLowerCase();
  if (!normalised) {
    return null;
  }
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return null;
  }
  const digest = await subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalised),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

/** `content_doc_search` (D070 §3.2). The raw query never leaves the browser. */
export async function trackDocSearch(
  query: string,
  resultsCount: number,
): Promise<void> {
  if (!analyticsGranted) {
    return;
  }
  const queryHash = await hashSearchQuery(query);
  if (!queryHash) {
    return;
  }
  track('content_doc_search', {
    query_hash: queryHash,
    results_count: resultsCount,
  });
}

/**
 * Writes the consent decision in covia.ai's record shape and fires the same
 * `covia-consent-change` event, so a shared consent layer can later read this
 * property without a migration.
 *
 * This does NOT yet unify consent across the two domains: covia.ai writes a
 * host-only cookie, so its decision is invisible here (and vice versa).
 * Unifying means covia-website scoping its cookie to `domain=.covia.ai`, and
 * this site seeding the plugin from that cookie. Out of scope for Phase 2.
 */
function mirrorConsentToCoviaRecord(consent: ConsentState): void {
  const categories = {
    essential: true as const,
    analytics: consent.analytics,
    marketing: consent.marketing,
  };

  // Only rewrite on a real change, so `givenAt` keeps meaning "when the user
  // decided" rather than "when this page last loaded".
  try {
    const existing = localStorage.getItem(COVIA_CONSENT_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as {
        categories?: typeof categories;
        version?: string;
      };
      if (
        parsed.version === PRIVACY_POLICY_VERSION &&
        parsed.categories?.analytics === categories.analytics &&
        parsed.categories?.marketing === categories.marketing
      ) {
        return;
      }
    }
  } catch {
    // Unreadable or unparseable — fall through and overwrite.
  }

  const value = JSON.stringify({
    categories,
    version: PRIVACY_POLICY_VERSION,
    givenAt: new Date().toISOString(),
  });

  try {
    localStorage.setItem(COVIA_CONSENT_KEY, value);
  } catch {
    // Storage disabled — the cookie below is still written.
  }
  document.cookie = `${COVIA_CONSENT_KEY}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  window.dispatchEvent(new Event(COVIA_CONSENT_CHANGE_EVENT));
}

function handleConsentChange(consent: ConsentState | null): void {
  if (consent) {
    mirrorConsentToCoviaRecord(consent);
  }

  const granted = consent?.analytics === true;
  if (granted === analyticsGranted) {
    return;
  }
  analyticsGranted = granted;

  if (granted) {
    const isFirstLoad = !gtagLoaded;
    ensureGtag();
    if (isFirstLoad) {
      // `config` above emitted the GA4 `page_view`; pair it with the custom
      // docs event for the page the user granted consent on.
      trackDocPageView(window.location.pathname);
    } else {
      // Re-granted after a withdrawal — let GA4 use storage again.
      window.gtag('consent', 'update', {analytics_storage: 'granted'});
    }
    return;
  }

  if (gtagLoaded) {
    // gtag.js cannot be unloaded, so tell it to stop using storage. `track()`
    // and `trackRouteChange()` also stop emitting via `analyticsGranted`.
    window.gtag('consent', 'update', {analytics_storage: 'denied'});
  }
}

/**
 * Subscribes to the consent banner and loads GA4 once (and only once)
 * analytics consent is granted. Safe to call during SSR; does nothing there.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (isDoNotTrackEnabled()) {
    return;
  }
  // Same guard the built-in gtag plugin applies: never send development
  // traffic to the production property. Note this is a *build-time* flag, so
  // `pnpm build && pnpm serve` does emit real events — useful for verifying,
  // but prefer verifying against the deployed site.
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  subscribeToCookieConsent(handleConsentChange, {
    storageKey: CONSENT_STORAGE_KEY,
    emitCurrent: true,
  });
}
