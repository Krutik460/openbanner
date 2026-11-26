# Openbanner

The simplest way to make a LinkedIn banner. You design it on a preview of your own profile, so you can see what the profile photo will cover before you upload anything.

Three promises the product is built around:

- **Free.** No paid plan, no watermark, no export limit.
- **No account.** Nothing to sign up for.
- **Private by design.** Designs, uploads and profile details are stored in the visitor's browser (IndexedDB). There are no analytics, cookies or third-party requests; fonts are bundled, not loaded from a CDN. Keep it that way if you want the landing page to stay true.

## What it does

- **Start from your profile.** Paste a LinkedIn profile link; the app tries to read your name, headline and photo, and falls back to a ten-second form when LinkedIn refuses. Or skip the link entirely.
- **Design in context.** The banner sits on a mock profile card with desktop and mobile photo positions, and the editor warns when text or an icon is hidden behind the photo.
- **One toolbar.** Templates (12, filled in with your name and headline), Text, Shapes and icons, Image, Background. Click anything on the banner and a small bar appears above it with just the controls that thing needs.
- **The usual canvas manners.** Drag, resize, rotate, snapping guides, multi-select, right-click menu, undo/redo, keyboard shortcuts.
- **Export** PNG or JPG at 1584×396 or 3168×792, with the file size checked against LinkedIn's 8 MB limit.
- **Picks up where you left off.** Everything autosaves in the browser.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm test`, `npm run typecheck`.

## Profile lookup, and its limits

LinkedIn has no public API for reading a profile, so `POST /api/profile` (JSON body `{ "handle": "…" }`) is best effort. It requests the public profile page the way a link-preview service would, identifies itself honestly, and reads the name, headline and photo the page publishes about itself (`server/linkedin.ts`).

LinkedIn frequently answers these requests with a login wall or HTTP 999, especially from cloud IP ranges. When that happens the app says so and asks for the details instead; nothing else depends on the lookup succeeding. If you need it to be reliable, the supported route is "Sign in with LinkedIn" (OpenID Connect), which returns name and photo and requires registering a LinkedIn app.

The endpoint only ever contacts `www.linkedin.com/in/<handle>` and, for the photo, hosts under `licdn.com`. It stores nothing, responds with `Cache-Control: no-store`, and takes the handle in the request body rather than the URL so it does not end up in access logs. This lookup is the only time anything about a visitor reaches a server, and the landing page says so.

## Deploying

The app runs on Cloudflare Workers with static assets (`wrangler.jsonc`). The Vite build in `dist/` is served as static files, which Cloudflare does not meter. Only `/api/*` runs code: `worker/index.ts` passes the profile lookup to the same handler that `vite dev` mounts locally. Request logging is turned off in the config.

### Automatic deploys

`.github/workflows/deploy.yml` typechecks, tests and builds every pull request, and deploys every push to `main`. It needs two repository secrets (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN`: a token made from Cloudflare's "Edit Cloudflare Workers" template
- `CLOUDFLARE_ACCOUNT_ID`: shown on the Workers & Pages overview in the Cloudflare dashboard

### By hand

```bash
npm run deploy
```

To try the Worker locally, run `npm run preview:worker`.

## Layout

```
worker/         Cloudflare Worker entry point for the profile lookup
server/         lookup logic and its tests (shared by dev server and function)
src/lib/        document types, templates, fonts, storage, export
src/store/      editor state (zustand), viewport, autosave
src/canvas/     Konva rendering, the interactive stage, snapping, export render
src/features/   welcome flow and editor UI
```

The profile photo positions in `src/lib/constants.ts` are measured approximations of LinkedIn's current layouts; LinkedIn does not publish them.

Not affiliated with LinkedIn.
