<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="Openbanner logo" />
</p>

<h1 align="center">Openbanner</h1>

<p align="center">
  A free, open-source LinkedIn banner maker that lets you design on a preview of your own profile.
</p>

<p align="center">
  <a href="https://github.com/Krutik460/openbanner/actions/workflows/deploy.yml"><img src="https://github.com/Krutik460/openbanner/actions/workflows/deploy.yml/badge.svg" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" /></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" /></a>
</p>

---

Most banner tools give you a blank 1584×396 rectangle. Openbanner puts that rectangle on a mock of your LinkedIn profile, so you can see what your profile photo will cover on desktop and mobile before you upload anything.

- **Free.** No paid plan, no watermark, no export limit.
- **No account.** Nothing to sign up for.
- **Private by design.** Designs, uploads and profile details stay in your browser (IndexedDB). There is no server code, no analytics, no cookies and no third-party requests. Fonts are bundled, not loaded from a CDN.

## Table of contents

- [Features](#features)
- [Getting started](#getting-started)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Start in one click.** Preview the templates on a placeholder profile, pick one and start editing. Add your name, headline and photo whenever you like, right on the preview.
- **Design in context.** The banner sits on a mock profile card with desktop and mobile photo positions, and the editor warns you when text or an icon is hidden behind the photo.
- **Your profile, in place.** Type your name, headline and location straight into the preview, add a photo, and try LinkedIn's #OpenToWork frame. None of it is part of the exported image.
- **Templates.** 24 starting points with placeholder text that is easy to replace.
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
git clone https://github.com/Krutik460/openbanner.git
cd openbanner
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Scripts

| Command                  | What it does                                           |
| ------------------------ | ------------------------------------------------------ |
| `npm run dev`            | Start the Vite dev server                              |
| `npm run build`          | Typecheck and build the production bundle into `dist/` |
| `npm run preview`        | Serve the production build locally                     |
| `npm run preview:worker` | Build and serve the app locally with Wrangler          |
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

## Deployment

Openbanner runs on [Cloudflare Workers](https://developers.cloudflare.com/workers/) with static assets ([`wrangler.jsonc`](wrangler.jsonc)). The Vite build in `dist/` is served as static files and no server code runs at all, so nothing about a visitor ever reaches a server. Request logging is turned off.

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
src/lib/        Document types, templates, fonts, storage, export
src/store/      Editor state (zustand), viewport, autosave
src/canvas/     Konva rendering, the interactive stage, snapping, export render
src/features/   Landing page and editor UI
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

Found a bug or have an idea? [Open an issue](https://github.com/Krutik460/openbanner/issues).

## License

[MIT](LICENSE) © Krutik Patel

---

Openbanner is an independent project and is not affiliated with, endorsed by or sponsored by LinkedIn.
