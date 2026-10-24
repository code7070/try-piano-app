# Piano

Client-side web app for learning piano from zero. Requirements and task status live in `PRD/prd-web-piano.md`; update task status there as work lands (see its Maintenance Protocol).

## Commands

- `npm run check` — typecheck, oxlint, Prettier check, Vitest. Run before committing.
- `npm run build` / `npm run preview` — production build, served locally by Wrangler with production headers.

## Cloudflare Authentication

Wrangler commands must use the project-scoped login in `.wrangler-auth/`, not the machine-wide wrangler login. Prefix every wrangler call or deploy script with the wrapper, for example `scripts/with-wrangler-auth npm run deploy` or `scripts/with-wrangler-auth npx wrangler whoami`. If it reports no login or the wrong account, ask Jojo to run `scripts/with-wrangler-auth npx wrangler login`. Do not set `XDG_CONFIG_HOME` globally.

## Conventions

- The audio, input, and lesson engines live outside React (plain TS modules); keep the input → sound path free of React renders.
- Security and cache headers live in `public/_headers`. Adding a third-party origin (analytics, fonts, CDN) requires updating the CSP there.
- Samples go under a versioned folder (`public/samples/v1/`) because they are cached as immutable.
