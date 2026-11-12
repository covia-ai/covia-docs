// Copies the Privacy Policy and Terms of Service from the frontend repo into
// src/pages/legal/, so docs.covia.ai keeps a readable copy if covia.ai or
// app.covia.ai is down (security OI-39). The frontend's
// src/content/legal/*.ts files are the source of truth; never edit the
// generated pages by hand.
//
// Usage: node scripts/sync-legal.mjs <path to a frontend checkout>
// Run it whenever a policy's version changes, and commit the result.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const frontend = process.argv[2];
if (!frontend) {
  console.error('usage: node scripts/sync-legal.mjs <frontend checkout>');
  process.exit(1);
}

const pages = [
  {
    source: 'src/content/legal/privacy.ts',
    constant: 'PRIVACY_POLICY_MD',
    target: 'src/pages/legal/privacy.md',
    title: 'Privacy Policy',
    canonical: 'https://covia.ai/legal/privacy',
  },
  {
    source: 'src/content/legal/terms.ts',
    constant: 'TERMS_OF_SERVICE_MD',
    target: 'src/pages/legal/terms.md',
    title: 'Terms of Service',
    canonical: 'https://covia.ai/legal/terms',
  },
];

mkdirSync('src/pages/legal', { recursive: true });

for (const page of pages) {
  const text = readFileSync(join(frontend, page.source), 'utf8');
  const match = text.match(new RegExp(`${page.constant} = \`([\\s\\S]*?)\`;`));
  if (!match) throw new Error(`${page.constant} not found in ${page.source}`);
  if (match[1].includes('${')) throw new Error(`${page.source} uses template interpolation`);
  // The policies link to each other by their app.covia.ai paths.
  const body = match[1]
    .replaceAll('\\`', '`')
    .replaceAll('](/privacypolicy)', '](/legal/privacy)')
    .replaceAll('](/terms)', '](/legal/terms)')
    .trim();
  const version = body.match(/Version ([0-9.]+)/)?.[1] ?? 'unknown';

  writeFileSync(page.target, `---
title: ${page.title}
description: Covia ${page.title}, version ${version}. A copy of ${page.canonical}.
---

# ${page.title}

:::note
This is a copy of the [${page.title}](${page.canonical}), kept here so it stays readable if covia.ai is unavailable. If the two differ, the version on covia.ai applies.
:::

${body}
`);
  console.log(`${page.target}: version ${version}`);
}
