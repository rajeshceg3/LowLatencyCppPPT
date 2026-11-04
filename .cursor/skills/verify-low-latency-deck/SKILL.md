---
name: verify-low-latency-deck
description: Verify the Low Latency C++ deck Slidev deck (slides.md structure, config placement, local asset resolution, code fences) after changing deck source, assets or Slidev dependencies.
---
# Verify Low Latency C++ deck

Low Latency C++ deck is a [Slidev](https://sli.dev/) slide deck whose project directory is `low-latency-cpp-slides/`. The user-facing product is the rendered presentation: slides on low-latency C++ techniques served from the `low-latency-cpp-slides/` project directory, seriph theme, diagrams and memes under `low-latency-cpp-slides/public/placeholders/`. There is no server, account, database or external service.

## Launch

Two levels, pick by need:

- **Static drive (no install, default):** from the repository root run `node .cursor/skills/verify-low-latency-deck/helpers/drive.mjs`. It needs only Node 18+ and the checkout itself - no `npm install`, no network, no ports. It is ready when it prints the proof JSON.
- **Full app (extended proof):** `cd low-latency-cpp-slides && npm install && npm run dev`, ready when Vite prints `Local: http://localhost:3030/`. `npm run build` compiles the real deck to `low-latency-cpp-slides/dist/`. PDF export (`npm run export`, `--dark`) needs Playwright Chromium via `npx playwright install chromium`.

## Doctor

Run the static helper first whenever anything looks off. If its `package`, `slides` or `headmatter` checks fail, the checkout is not worth building or serving - fix that first. Those three checks are read-only and answer "is this deck structurally drivable?".

## Drive

The helper performs the real user-path checks for a deck repo, in order:

1. `package.json` parses as JSON and declares Slidev scripts (a deck that npm cannot parse cannot be installed, served or built).
2. `slides.md` exists at `low-latency-cpp-slides/slides.md` and is SHA256-hashed into evidence.
3. Headmatter frontmatter holds `theme:` and `title:`.
4. Every `layout:`/`class:`/slide-config line sits in frontmatter position. Config text after markdown content renders as literal visible text on the slide - this is a real rendering bug class, not style.
5. Every local reference in `slides.md` (markdown images, `<img src>`, `background:`, `favicon:`, `style:`) resolves the way Slidev serves it: `/x` maps to `low-latency-cpp-slides/public/x`, `./x` maps to `low-latency-cpp-slides/x`.
6. Code fences balance.
7. `url(...)` references inside `low-latency-cpp-slides/styles/*.css` resolve.

The extended drive is the real Slidev build: `cd low-latency-cpp-slides && npm install && npm run build` must exit 0 and produce `dist/`. Do not treat the static helper as a build substitute when dependencies or Slidev config changed; run the real build then.

## Evidence

The helper writes `artifacts/verification/verify-low-latency-deck.json`: Node version, deck directory, slides.md SHA256, per-check results, slide count, referenced/missing assets, warnings (unreferenced public files), and the final verdict. Exit code is non-zero on any failed check. Evidence is gitignored (`artifacts/verification/`) and survives every run. An extended build proof additionally names the `dist/` output; do not commit `dist/` or `node_modules`.

## Cleanup

The helper starts no processes, servers or scratch state, so there is nothing to tear down beyond the evidence file it intentionally leaves behind. If a full build ran, `rm -rf low-latency-cpp-slides/node_modules low-latency-cpp-slides/dist` returns the checkout to clean; both are gitignored. Never delete `artifacts/verification/` as part of cleanup.

## Helpers

`node .cursor/skills/verify-low-latency-deck/helpers/drive.mjs` - full static journey, exits non-zero on failure. To update this map after deck behavior changes, use `/maintain-verification-skill`; never weaken a check to bless a regression.

## Rendered regression path

After building, serve the production `dist/` directory with SPA fallback. From the repository root run `DECK_URL=http://localhost:PORT node .cursor/skills/verify-low-latency-deck/helpers/render.mjs`. This saves full-size 1280x720 images and runtime evidence under `artifacts/verification/rendered/`. Inspect every saved image individually for clipping, overflow, contrast and missing glyphs. A passing runtime check is not a visual pass.

The static drive also checks the bundled emoji fallback. The C++ decks pin Fuse 7.1.0 because later empty-query semantics expose Slidev's closed Goto results; their rendered drive verifies closed/open/search/select/closed, not a CSS-hidden workaround.
