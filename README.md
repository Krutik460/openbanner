# Openbanner

A free, open design canvas for LinkedIn banners. You design the banner on top of a preview of your own profile, so you can see what the profile photo will cover before you upload anything.

No account, no watermark. Designs, uploads and profile details are stored in the visitor's browser.

## What it does

- **Start from your profile.** Paste a LinkedIn profile link; the app tries to read your name, headline and photo, and falls back to a ten-second form when LinkedIn refuses.
- **Design in context.** The canvas sits inside a mock profile card, with desktop and mobile photo positions and an optional "photo zones" overlay.
- **12 templates**, each filled in with your name and headline.
- **Editor:** text (18 fonts), shapes, 110+ icons, image uploads, solid / gradient / mesh / photo backgrounds, textures, layers, snapping guides, multi-select, undo/redo, keyboard shortcuts.
- **Export** PNG or JPG at 1584×396 or 3168×792, with the file size checked against LinkedIn's 8 MB limit.
- **Picks up where you left off.** Everything autosaves to IndexedDB; multiple designs are supported.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm test`, `npm run typecheck`.

## Profile lookup, and its limits

LinkedIn has no public API for reading a profile, so `GET /api/profile?handle=…` is best effort. It requests the public profile page the way a link-preview service would, identifies itself honestly, and reads the name, headline and photo the page publishes about itself (`server/linkedin.ts`).

LinkedIn frequently answers these requests with a login wall or HTTP 999, especially from cloud IP ranges. When that happens the app says so and asks for the details instead; nothing else depends on the lookup succeeding. If you need it to be reliable, the supported route is "Sign in with LinkedIn" (OpenID Connect), which returns name and photo and requires registering a LinkedIn app.

The endpoint only ever contacts `www.linkedin.com/in/<handle>` and, for the photo, hosts under `licdn.com`.

## Deploying

The front end is a static Vite build (`dist/`). The lookup endpoint is `api/profile.ts`, a web-standard `GET(request)` handler in the layout Vercel uses for functions; the same handler is mounted by `vite dev` and `vite preview`. On a purely static host the app still works — the lookup step reports that it is unavailable and goes to the manual form.

The serverless entry point has been exercised through the Vite middleware and unit tests, not on a live Vercel deployment.

## Layout

```
api/            serverless entry point for the profile lookup
server/         lookup logic and its tests (shared by dev server and function)
src/lib/        document types, templates, fonts, storage, export
src/store/      editor state (zustand), viewport, autosave
src/canvas/     Konva rendering, the interactive stage, snapping, export render
src/features/   welcome flow and editor UI
```

The profile photo positions in `src/lib/constants.ts` are measured approximations of LinkedIn's current layouts; LinkedIn does not publish them.

Not affiliated with LinkedIn.
