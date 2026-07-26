# DSA Coach web application

The extension experience is available as a web application beside the browser extension. It reuses
the extension dashboard, revision store, analysis workspace, and design system without changing the
extension build or permissions.

The web application persists its own workspace in browser-local storage. A normal website cannot
read LeetCode tabs or the extension's private Chrome storage, so automatic detection and shared
cross-device state remain extension or future authenticated-sync capabilities.

## Local development

```bash
npm install
npm run dev
```

## Production validation

```bash
npm run check
npm run build
npm run preview
```

The browser-ready static output is written to `website/dist/client/`. A tiny Cloudflare-compatible
worker is emitted beside it for owner-only Sites previews; it contains no application data or API
logic.

## Vercel

Create a Vercel project with `website` as the root directory. Vercel reads `vercel.json`, runs
`npm run build`, and publishes `dist/client`.

## Netlify

Create a Netlify site with `website` as the base directory. Netlify reads `netlify.toml`, runs
`npm run build`, and publishes `dist/client`.

No environment variables are required. If a custom domain is added, update the canonical and
social metadata in `index.html` to use that final URL.
