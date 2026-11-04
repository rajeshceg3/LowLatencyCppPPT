# View the presentation locally

## Sub-features

Dev server with hot reload; slide navigation; theme and custom styles applied; images render.

## How to get to it (user POV)

`cd low-latency-cpp-slides && npm install && npm run dev`, then open http://localhost:3030 and page through with Space.

## Driving it with the Node helper

The static helper proves the sources the dev server will consume (config placement, asset paths) are sound before you spend an install. It does not replace watching the rendered deck; for visual verification, run the dev server and look.

## Gotchas

- npm installs several hundred MB; this repo has no Playwright dependency, so plain `npm install` is enough for dev/build; export needs `npx playwright install chromium`.
- Port 3030 must be free. Stop the server with Ctrl-C when done.
- Slidev serves `public/` from the project directory, so `/placeholders/...` references only resolve because `public/` lives inside `low-latency-cpp-slides/`. A previous layout had `public/` at the repository root, where every image 404s.
- `low-latency-cpp-slides/.gitignore` ignores `package-lock.json`; use `npm install` (not `npm ci`) in this project.
