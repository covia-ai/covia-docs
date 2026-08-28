/**
 * Wraps the search page from `@easyops-cn/docusaurus-search-local` to emit
 * `content_doc_search` (D070 §3.2).
 *
 * That plugin has no analytics hook — no `onSearchClick`, no result callback,
 * nothing on the worker — so the count is read back off the rendered results.
 * The wrapper deliberately renders the original component unchanged rather
 * than nesting it in a container, because the search page renders the whole
 * `<Layout>` and an extra wrapper element breaks the sticky footer.
 *
 * Only the search *page* is instrumented, not the navbar type-ahead: the page
 * reflects a deliberate search, whereas the dropdown fires on every keystroke.
 */

import React, {useEffect} from 'react';
import SearchPage from '@theme-original/SearchPage';
import {trackDocSearch} from '@site/src/lib/analytics';

/**
 * How long the results must stay unchanged before we count them. Also covers
 * the gap while the Lunr worker fetches the index and runs the query.
 */
const SETTLE_DELAY_MS = 900;

/** CSS-module class fragments (the built classes are hashed suffixes). */
const RESULT_ITEM_SELECTOR = 'article[class*="searchResultItem"]';
const LOADING_SELECTOR = '[class*="loadingRing"]';

/**
 * True while the search page is still fetching the index or running the query.
 *
 * The navbar search box keeps its own loading ring in the DOM permanently, so
 * a document-wide lookup would report "still loading" forever — hence the
 * navbar exclusion rather than a plain `querySelector`.
 */
function isSearchInFlight(): boolean {
  return Array.from(document.querySelectorAll(LOADING_SELECTOR)).some(
    (element) => !element.closest('.navbar'),
  );
}

function useSearchTelemetry(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastReported: string | null = null;

    function report(): void {
      const query =
        new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
      if (!query) {
        return;
      }
      // Index still loading or query still running — the next DOM mutation
      // will reschedule us.
      if (isSearchInFlight()) {
        return;
      }
      // The plugin rewrites `?q=` as the user types, so the same settled query
      // can be observed several times.
      if (lastReported === query) {
        return;
      }
      lastReported = query;
      void trackDocSearch(
        query,
        document.querySelectorAll(RESULT_ITEM_SELECTOR).length,
      );
    }

    function schedule(): void {
      clearTimeout(timer);
      timer = setTimeout(report, SETTLE_DELAY_MS);
    }

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {childList: true, subtree: true});
    // Cover a direct load of /search?q=... , where results may already be in.
    schedule();

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);
}

export default function SearchPageWrapper(
  props: Record<string, unknown>,
): React.ReactElement {
  useSearchTelemetry();
  return <SearchPage {...props} />;
}
