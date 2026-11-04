# Build and export

## Sub-features

`npm run build` compiles the deck to a static site in `low-latency-cpp-slides/dist/`; `npm run export` renders a PDF.

## How to get to it (user POV)

`cd low-latency-cpp-slides && npm install && npm run build`; open `dist/index.html` or host `dist/` on any static host.

## Driving it with the Node helper

Run the helper first for the fast structural pass, then run the real build above - it is the extended proof for this feature and must exit 0 with a populated `dist/`.

## Gotchas

- PDF export needs a Playwright Chromium download;this repo has no Playwright dependency, so plain `npm install` is enough for dev/build; export needs `npx playwright install chromium`.
- `dist/` and `node_modules/` are gitignored build output, not sources.
- Slidev serves `public/` from the project directory, so `/placeholders/...` references only resolve because `public/` lives inside `low-latency-cpp-slides/`. A previous layout had `public/` at the repository root, where every image 404s.
- `low-latency-cpp-slides/.gitignore` ignores `package-lock.json`; use `npm install` (not `npm ci`) in this project.
