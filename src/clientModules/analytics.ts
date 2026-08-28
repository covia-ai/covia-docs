/**
 * Wires the D070 Phase 2 analytics into the Docusaurus lifecycle.
 *
 * Registered via `clientModules` in `docusaurus.config.ts`. `initAnalytics()`
 * runs on first evaluation in the browser; `onRouteDidUpdate` covers the
 * client-side navigations that would otherwise never reach GA4.
 */

import type {ClientModule} from '@docusaurus/types';
import {initAnalytics, trackRouteChange} from '../lib/analytics';

initAnalytics();

const clientModule: ClientModule = {
  onRouteDidUpdate({location, previousLocation}) {
    // No previous location means the initial render, whose page_view comes
    // from the gtag `config` call instead.
    if (!previousLocation) {
      return;
    }
    // Deliberately ignores query-string-only changes. The search page
    // rewrites `?q=` as the user types, which would otherwise emit a
    // page_view per keystroke against the same `/search` path.
    if (
      location.pathname === previousLocation.pathname &&
      location.hash === previousLocation.hash
    ) {
      return;
    }
    // react-helmet-async updates document.title on the next tick, and GA4
    // reads the title off the document — defer so the new one is picked up.
    // See facebook/docusaurus#7420.
    setTimeout(() => trackRouteChange(location));
  },
};

export default clientModule;
