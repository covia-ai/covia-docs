/**
 * Cookie preferences page.
 *
 * GDPR requires withdrawing consent to be as easy as granting it, and the
 * banner only appears until a choice is made — so there has to be a permanent
 * place to change it. `preferencesHref` in `docusaurus.config.ts` points the
 * banner's "Manage preferences" link here, and suppresses the banner on this
 * path so the form stays reachable.
 */

import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
// Must be a static ESM import. `require()` resolves the package's CJS build,
// which carries its own copy of the React context — the provider rendered by
// the plugin's theme Root lives in the ESM graph, so the hook would throw
// "useCookieConsent must be used within CookieConsentProvider".
import {CookieConsentPreferences} from 'docusaurus-plugin-cookie-consent/client';
import {usePluginData} from '@docusaurus/useGlobalData';
import type {CookieConsentOptions} from 'docusaurus-plugin-cookie-consent';

export default function CookiePreferencesPage(): React.ReactElement {
  // Without an explicit `categories` prop the component falls back to its own
  // defaults, which re-introduces the Functional category we switch off in
  // docusaurus.config.ts. Read the real config so this page and the banner
  // always offer the same choices.
  const pluginData = usePluginData('docusaurus-plugin-cookie-consent') as
    | {options?: {categories?: CookieConsentOptions['categories']}}
    | undefined;
  const categories = pluginData?.options?.categories;

  return (
    <Layout
      title="Cookie preferences"
      description="Choose which cookies Covia's documentation site may use.">
      <main className="container margin-vert--lg">
        <h1>Cookie preferences</h1>
        <p>
          Essential cookies keep this site working and cannot be switched off.
          Analytics cookies help us see which documentation pages are read and
          what people search for, so we know what to improve. You can change
          these choices at any time, and this site honours your browser's{' '}
          <Link href="https://en.wikipedia.org/wiki/Do_Not_Track">
            Do Not Track
          </Link>{' '}
          setting regardless of what you choose here.
        </p>
        <p>
          Full detail on what we collect is in the{' '}
          <Link href="https://covia.ai/legal/privacy">privacy policy</Link>.
        </p>
        {/* Client-only: the form's state comes from localStorage. */}
        <BrowserOnly>
          {() => <CookieConsentPreferences categories={categories} />}
        </BrowserOnly>
      </main>
    </Layout>
  );
}
