import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Covia.ai Docs',
  tagline: 'Universal Grid for AI',
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
