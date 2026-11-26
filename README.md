<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="Openbanner logo" />
</p>

<h1 align="center">Openbanner</h1>

<p align="center">
  A free, open-source LinkedIn banner maker that lets you design on a preview of your own profile.
</p>

<p align="center">
  <a href="https://github.com/Krutik460/linkedin-banner-creator/actions/workflows/deploy.yml"><img src="https://github.com/Krutik460/linkedin-banner-creator/actions/workflows/deploy.yml/badge.svg" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" /></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" /></a>
</p>

---

Most banner tools give you a blank 1584×396 rectangle. Openbanner puts that rectangle on a mock of your LinkedIn profile, so you can see what your profile photo will cover on desktop and mobile before you upload anything.

- **Free.** No paid plan, no watermark, no export limit.
- **No account.** Nothing to sign up for.
- **Private by design.** Designs, uploads and profile details stay in your browser (IndexedDB). No analytics, no cookies, no third-party requests. Fonts are bundled, not loaded from a CDN.

## Table of contents

- [Features](#features)
- [Getting started](#getting-started)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [How the profile lookup works](#how-the-profile-lookup-works)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Start from your profile.** Paste a LinkedIn profile link and the app tries to read your name, headline and photo. If LinkedIn refuses, a ten-second form takes over. You can also skip this step entirely.
- **Design in context.** The banner sits on a mock profile card with desktop and mobile photo positions, and the editor warns you when text or an icon is hidden behind the photo.
- **Templates.** 12 starting points, filled in with your name and headline.
- **One toolbar.** Templates, Text, Shapes and icons, Image, Background. Select anything on the canvas and a small bar appears above it with just the controls that element needs.
- **Real canvas editing.** Drag, resize, rotate, snapping guides, multi-select, right-click menu, undo/redo and keyboard shortcuts.
- **Backgrounds.** Solid colors, gradients, mesh gradients and your own photos.
- **Export** to PNG or JPG at 1584×396 or 3168×792, with the file size checked against LinkedIn's 8 MB limit.
- **Autosave.** Close the tab and pick up where you left off.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 22 or newer
- npm (bundled with Node.js)

### Run locally

```bash
git clone https://github.com/Krutik460/linkedin-banner-creator.git
cd linkedin-banner-creator
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173). The dev server also serves the `/api/profile` endpoint, so the full app works locally.

### Scripts

| Command                  | What it does                                           |
| ------------------------ | ------------------------------------------------------ |
| `npm run dev`            | Start the Vite dev server with the profile lookup API  |
| `npm run build`          | Typecheck and build the production bundle into `dist/` |
| `npm run preview`        | Serve the production build locally                     |
| `npm run preview:worker` | Build and run the app inside a local Cloudflare Worker |
| `npm test`               | Run the test suite (Vitest)                            |
| `npm run typecheck`      | Typecheck the project                                  |
| `npm run deploy`         | Build and deploy to Cloudflare Workers                 |

## Keyboard shortcuts

`Mod` is `Cmd` on macOS and `Ctrl` elsewhere.

| Shortcut                     | Action                         |
| ---------------------------- | ------------------------------ |
| `Mod` + `Z` / `Mod` + `Shift` + `Z` | Undo / redo             |
| `Mod` + `C` / `X` / `V`      | Copy / cut / paste             |
| `Mod` + `D`                  | Duplicate selection            |
| `Mod` + `A`                  | Select all                     |
| `Mod` + `=` / `-` / `0`      | Zoom in / out / reset          |
| `1`                          | Fit the banner to the window   |
| `Delete` or `Backspace`      | Delete selection               |
| Arrow keys (`Shift` for 10px) | Nudge selection               |
| `[` / `]`                    | Send backward / bring forward  |
| `Enter`                      | Edit the selected text         |
| `Esc`                        | Clear selection                |

Pasting an image from the clipboard adds it to the banner.

## How the profile lookup works

LinkedIn has no public API for reading a profile, so `POST /api/profile` (JSON body `{ "handle": "..." }`) is best effort. It requests the public profile page the way a link-preview service would, identifies itself honestly, and reads the name, headline and photo the page publishes about itself ([`server/linkedin.ts`](server/linkedin.ts)).

LinkedIn often answers these requests with a login wall or HTTP 999, especially from cloud IP ranges. When that happens the app says so and asks for the details instead. Nothing else depends on the lookup succeeding. If you need it to be reliable, the supported route is "Sign in with LinkedIn" (OpenID Connect), which requires registering a LinkedIn app.

Privacy guarantees of the endpoint:

- It only contacts `www.linkedin.com/in/<handle>` and, for the photo, hosts under `licdn.com`.
- It stores nothing and responds with `Cache-Control: no-store`.
- The handle travels in the request body, not the URL, so it stays out of access logs.

This lookup is the only time anything about a visitor reaches a server, and the landing page says so. Please keep it that way in contributions.

## Deployment

Openbanner runs on [Cloudflare Workers](https://developers.cloudflare.com/workers/) with static assets ([`wrangler.jsonc`](wrangler.jsonc)). The Vite build in `dist/` is served as static files, and only `/api/*` runs code: [`worker/index.ts`](worker/index.ts) passes the profile lookup to the same handler the dev server uses. Request logging is turned off.

### Deploy your own

1. Fork this repository.
2. Add two repository secrets under **Settings → Secrets and variables → Actions**:
   - `CLOUDFLARE_API_TOKEN`: a token created from Cloudflare's "Edit Cloudflare Workers" template
   - `CLOUDFLARE_ACCOUNT_ID`: shown on the Workers & Pages overview in the Cloudflare dashboard
3. Push to `main`.

The [CI workflow](.github/workflows/deploy.yml) typechecks, tests and builds every pull request, and deploys every push to `main`.

To deploy by hand instead, log in with `npx wrangler login` and run `npm run deploy`.

## Project structure

```
worker/         Cloudflare Worker entry point for the profile lookup
server/         Profile lookup logic and its tests (shared by the dev server and the Worker)
src/lib/        Document types, templates, fonts, storage, export
src/store/      Editor state (zustand), viewport, autosave
src/canvas/     Konva rendering, the interactive stage, snapping, export render
src/features/   Welcome flow and editor UI
```

The profile photo positions in [`src/lib/constants.ts`](src/lib/constants.ts) are measured approximations of LinkedIn's current layouts. LinkedIn does not publish them, so corrections are welcome.

## Tech stack

- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for development and builds
- [Konva](https://konvajs.org/) via [react-konva](https://github.com/konvajs/react-konva) for the canvas
- [zustand](https://github.com/pmndrs/zustand) for state
- [Tailwind CSS](https://tailwindcss.com/) and [Radix UI](https://www.radix-ui.com/) for the interface
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) for browser storage
- [Vitest](https://vitest.dev/) for tests
- [Cloudflare Workers](https://workers.cloudflare.com/) for hosting

## Contributing

Contributions are welcome, whether that is a bug report, a new template, a fix to the photo positions or a new feature. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

Found a bug or have an idea? [Open an issue](https://github.com/Krutik460/linkedin-banner-creator/issues).

## License

[MIT](LICENSE) © Krutik Patel

---

Openbanner is an independent project and is not affiliated with, endorsed by or sponsored by LinkedIn.
