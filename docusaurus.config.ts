import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Covia.ai Docs',
  tagline: 'The Universal Grid for the Agent Economy',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://docs.covia.ai',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'covia-ai', // Usually your GitHub org/user name.
  projectName: 'covia', // Usually your repo name.

  // Broken internal links, anchors, and markdown links all FAIL the build —
  // this is the docs link-integrity gate (enforced in CI on every push/PR).
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // "Edit this page" links point at the covia-docs repo (develop branch)
          editUrl:
            'https://github.com/covia-ai/covia-docs/tree/develop/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // Local full-text search (no external service needed)
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  // GA4 loading, the docs custom events, and the search-page instrumentation
  // all live in this client module. See src/lib/analytics.ts for why the
  // built-in @docusaurus/plugin-google-gtag is not used.
  clientModules: ['./src/clientModules/analytics.ts'],

  // Redirects for retired URLs. The homepage redirect lives in
  // src/pages/index.tsx instead, so it also works in the dev server.
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          // Retired auto-generated category pages: the sidebar categories now
          // open the hand-written section overviews directly.
          { from: ['/docs/category/mcp-integration'], to: '/docs/user-guide/mcp/' },
          { from: ['/docs/category/api-reference'], to: '/docs/user-guide/api/' },
          { from: ['/docs/category/sdk'], to: '/docs/user-guide/sdk/' },
          { from: ['/docs/category/agents'], to: '/docs/user-guide/agents/' },
          { from: ['/docs/category/adapters'], to: '/docs/user-guide/adapters/' },
        ],
      },
    ],
    [
      'docusaurus-plugin-llms',
      {
        // llms.txt is hand-curated in static/llms.txt — don't overwrite it
        generateLLMsTxt: false,
        // Full concatenated docs for LLM ingestion at /llms-full.txt
        generateLLMsFullTxt: true,
        // Per-page markdown mirrors (llmstxt.org spec)
        generateMarkdownFiles: true,
        docsDir: 'docs',
        title: 'Covia',
        description:
          'Covia is an open-source runtime for federated AI orchestration: venues host self-describing operations, run stateful agents, and keep an auditable job record. Speaks REST, MCP, A2A, and DID.',
        includeOrder: [
          'overview/index*',
          'overview/grid*',
          'overview/venues*',
          'overview/*',
          'user-guide/quick-start*',
          'user-guide/api/*',
          'user-guide/sdk/*',
          'user-guide/agents/*',
          'user-guide/capabilities*',
          'user-guide/adapters/*',
          'user-guide/mcp/*',
          'operator-guide/*',
          'protocol/*',
        ],
        includeUnmatchedLast: true,
      },
    ],
    [
      // Consent gate for GA4 (D070 §5.1). The banner is the only thing that
      // can switch analytics on — src/lib/analytics.ts subscribes to it and
      // injects gtag.js only once the `analytics` category is granted.
      'docusaurus-plugin-cookie-consent',
      {
        title: 'Cookies on the Covia docs',
        description:
          'We use essential cookies to run this site, and — only if you ' +
          'agree — analytics cookies to see which pages are read. Read the ' +
          '[privacy policy](https://covia.ai/legal/privacy).',
        // No `links` array: the description already links the privacy policy
        // inline, and configuring both renders it twice.
        preferencesHref: '/cookie-preferences',
        acceptAllText: 'Accept all',
        rejectText: 'Essential only',
        toastMode: true,
        orientation: 'horizontal',
        // The per-category breakdown lives on /cookie-preferences instead of
        // an expander in the banner — with only one optional category left
        // there is nothing worth expanding.
        showDetailsButton: false,
        // Distinct from the mirrored `covia-consent` record that
        // src/lib/analytics.ts writes in covia.ai's schema.
        storageKey: 'covia-consent-docs',
        categories: {
          necessary: {
            label: 'Essential',
            description:
              'Required for the site to work — page routing, your theme ' +
              'choice, and this consent record itself. Always on.',
          },
          analytics: {
            label: 'Analytics',
            description:
              'Google Analytics, so we can see which pages are read and what ' +
              'is searched for. IP addresses are anonymised and search queries ' +
              'are hashed before they are sent.',
          },
          // Off until something actually sets these. D070 §5.1 reserves a
          // marketing category for future retargeting, but nothing on the
          // docs site uses one — asking about a category we never set is
          // noise, and re-adding it later re-prompts for consent anyway.
          // covia.ai still offers three; the difference is deliberate.
          marketing: {enabled: false, label: 'Marketing'},
          functional: {enabled: false, label: 'Functional'},
        },
      },
    ],
  ],

  themeConfig: {
    // Image for social card
    image: 'img/covia.png',

    // Main navigation bar
    navbar: {
      // title: 'covia.ai',  // Hide this, the logo does the job
      logo: {
        alt: 'Covia Logo',
        src: 'img/covia.png',
        // Deep-link straight to the docs landing page rather than '/', which
        // is just a redirect to it (src/pages/index.tsx).
        href: '/docs/overview/'
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'overviewSidebar',
          position: 'left',
          label: 'Overview',
        },
        {
          type: 'docSidebar',
          sidebarId: 'userGuideSidebar',
          position: 'left',
          label: 'User Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'operatorGuideSidebar',
          position: 'left',
          label: 'Operator Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'protocolSidebar',
          position: 'left',
          label: 'Protocol',
        },

        {
          href: 'https://github.com/covia-ai/covia',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://covia.ai',
          label: 'Covia.ai',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Overview',
              to: '/docs/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/orgs/covia-ai/discussions',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/fywdrKd8QT',
            },
            {
              label: 'X',
              href: 'https://x.com/CoviaAI',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/covia-ai',
            },
            {
              label: 'Privacy',
              href: 'https://covia.ai/legal/privacy',
            },
            {
              label: 'Cookie preferences',
              to: '/cookie-preferences',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Covia Labs Pte Ltd. Built with Docusaurus.`,
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      // Languages used in doc code fences beyond the Prism defaults
      additionalLanguages: ['java', 'bash', 'json5', 'clojure'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
