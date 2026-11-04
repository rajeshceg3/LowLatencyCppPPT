# Feature map

Low Latency C++ deck is a Slidev presentation. Its user-facing features are the ways a person consumes or produces the deck.

- [Slide deck content integrity](deck-content-integrity.md): every slide parses, config stays in frontmatter, all local assets resolve. **Proven journey** - the static helper drives this on every run.
- [View the presentation locally](view-the-deck.md): `npm run dev` serves the deck at localhost:3030.
- [Build and export](build-and-export.md): `npm run build` produces the static site; `npm run export` produces a PDF.

No accounts, persistence or network services exist in this project. Add mapped journeys when new behavior is introduced.
