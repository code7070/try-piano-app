# Piano

A browser app for learning and practising piano from zero. It runs fully client-side and is served from Cloudflare Workers Static Assets.

Live: https://piano.the-friday.my.id

Product requirements and the task list are in [`PRD/prd-web-piano.md`](PRD/prd-web-piano.md).

## Stack

- Vite + React + TypeScript
- oxlint, Prettier, Vitest + Testing Library
- Cloudflare Workers Static Assets (no Worker script), configured in [`wrangler.jsonc`](wrangler.jsonc)

## Development

Requires Node.js 22.12 or newer (`.node-version` pins 24 for CI).

```bash
npm install
npm run dev
```

| Script                   | What it does                                                 |
| ------------------------ | ------------------------------------------------------------ |
| `npm run dev`            | Vite dev server                                              |
| `npm run check`          | Typecheck, lint, format check, and tests                     |
| `npm run build`          | Production build into `dist/`                                |
| `npm run preview`        | Build, then serve `dist/` with Wrangler (production headers) |
| `npm run deploy`         | Build and deploy to production                               |
| `npm run deploy:preview` | Build and upload a preview version (no production traffic)   |

## Deployment (Cloudflare)

`dist/` is uploaded as static assets. Routing and headers:

- Unknown paths fall back to `index.html` (`not_found_handling: single-page-application`).
- [`public/_headers`](public/_headers) sets security headers (CSP, Permissions-Policy with `midi=(self)`, HSTS) and long-lived caching for `/assets/*` and `/samples/*`.
- Piano samples are not content-hashed, so keep them under a versioned folder such as `public/samples/v1/` and bump the folder when any file changes.

### Cloudflare login

Wrangler uses this project's own login in `.wrangler-auth/` (git-ignored), not the machine-wide one. Prefix every Wrangler command with the wrapper:

```bash
scripts/with-wrangler-auth npx wrangler login
```

```bash
scripts/with-wrangler-auth npm run deploy
```

### Git-connected builds

The `piano` Worker (account `Azizditya@gmail.com's Account`) is connected to `code7070/try-piano-app` through Workers Builds:

| Setting         | Value                            |
| --------------- | -------------------------------- |
| Build command   | `npm run check && npm run build` |
| Deploy command  | `npx wrangler deploy`            |
| Preview command | `npx wrangler preview`           |

Pushes to `main` deploy to production at `piano.the-friday.my.id` (declared in `routes` in `wrangler.jsonc`; the `workers.dev` URL is off). Other branches run Preview builds.
