import React from 'react';
import {Redirect} from '@docusaurus/router';

// The homepage is the docs overview: redirect via a real route at '/' so the
// redirect also works in the dev server (plugin-client-redirects only runs at
// build time).
export default function Home(): React.ReactElement {
  return <Redirect to="/docs/overview/" />;
}
