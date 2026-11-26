# Contributing to Openbanner

Thanks for taking the time to contribute. This guide covers how to report issues, propose changes and get a pull request merged.

## Reporting bugs and requesting features

Search [existing issues](https://github.com/Krutik460/openbanner/issues) first. If nothing matches, open a new one with:

- What you did, what you expected, and what happened instead
- Your browser and operating system
- A screenshot or exported banner if the problem is visual

Please do not include anyone's LinkedIn profile details in an issue unless they are your own.

## Development setup

You need Node.js 22 or newer.

```bash
git clone https://github.com/<your-username>/openbanner.git
cd openbanner
npm install
npm run dev
```

## Making a change

1. Fork the repository and create a branch from `main`.
2. Make your change. Keep pull requests focused on one thing.
3. Add or update tests when you change behavior that can be tested (see `src/lib/templates.test.ts` for an example).
4. Make sure everything passes locally:

   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

5. Open a pull request that explains what changed and why. Include before and after screenshots for UI changes.

CI runs the same checks on every pull request.

## Project principles

Please keep these in mind, since they are promises the landing page makes to users:

- **Private by design.** No analytics, cookies, trackers or third-party requests. Assets such as fonts are bundled, never loaded from a CDN. User data stays in the browser.
- **Free and account-free.** No feature should require signing up or paying.
- **Simple.** The editor deliberately has one toolbar and a contextual bar. New controls should earn their place.

## Code style

- TypeScript throughout, with the strict settings in `tsconfig.app.json`.
- Match the style of the surrounding code: small components, state in the zustand stores under `src/store/`, canvas logic under `src/canvas/`.
- Write comments that explain why, not what.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
