import { defineConfig } from 'astro/config';

// The address of the site is not hard-coded. On GitHub Pages the deploy
// workflow passes SITE_URL and BASE_PATH (see .github/workflows/deploy.yml),
// so renaming the repository or adding a custom domain needs no code change.
// Locally the site simply runs at http://localhost:4321/.
const site = process.env.SITE_URL || 'http://localhost:4321';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // Keep ordinary HTML whitespace handling, so spaces between inline elements
  // (links, badges) are never swallowed.
  compressHTML: true,
  image: {
    responsiveStyles: true,
    layout: 'constrained',
  },
  devToolbar: { enabled: false },
});
