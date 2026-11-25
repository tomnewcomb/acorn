# The Acorn Archive

Source code, notes and browser demonstrations of the Newcomb brothers’ early Acorn programs.

Website: https://tomnewcomb.github.io/acorn/

This repository contains the complete static website. No build step or external hosting platform is required. Relative asset links and hash routes support hosting under `/acorn/`.

## Publishing

Push to `main`. GitHub Pages publishes directly from the root of this branch. Under Settings → Pages, the source is **Deploy from a branch**, branch **main**, folder **/ (root)**. The `.nojekyll` file preserves the static files without Jekyll processing.

## Content

Wire Cutter was coded by Thomas Newcomb. Jonathan Newcomb drove its user-interface design and designed and built the cutter and hardware protocol. Menubu was coded by David Newcomb. Halls of the Things was coded by Thomas Newcomb and credits August 1996 in its title text. Its original tokenised BASIC program is preserved alongside a complete decoded listing, annotated reading copy, extracted sprites and a maze-generation demonstration.

The program order is Wire Cutter, Halls of the Things, 3DTron, Bill, SlipperTron and Menubu. The three recovered games have complete original and annotated listings, conservative bug audits, decoded artifacts, browser demonstrations and direct auto-launch links to Archimedes Live. Bill also includes its level editor; 3DTron includes nine decoded sound effects and a perspective sampling map recovered from its supplied renderer.

Original source and binary downloads are preserved. Annotated listings and browser demonstrations are retrospective additions. Publication does not grant a new software licence.

The original Wire Cutter archive includes its historical help file and contact details.

## Euclid models

The !Euclid collection contains Thomas’s Conservatory, Kitchen, Room, Mouse and 3DGlasses plus David’s Jonny and MyRoom, with original downloads and rotatable wireframe/coloured-surface reconstructions. See `models/euclid/README.md` for decoder assumptions and instructions for adding models.

## Recovered-game exhibits

`programs/games/catalog.js` supplies the three newer game entries, while `programs/games-page.js` provides their shared tabs. Each program has `exhibit.json` with retrospective annotations and audit findings, decoded listings, derived images, and an `originals/` directory. The downloadable ZIPs are byte-for-byte copies of the supplied uploads. File timestamps are evidence about these copies, not necessarily creation dates. Code credits do not imply authorship of bundled music or playback modules.

Regenerate the derived listings, images, maps, font, sample WAVs and perspective spans with `python tools/archive-games.py` (requires Pillow). Validate them with `python tools/check-games.py`. The converter reads originals and never changes them. `tools/bbc-tokens.json` describes the on-disk BASIC keyword tokens; spellings were cross-checked against Matrix Brandy’s token definitions. Neither the tools nor the browser demonstrations execute the recovered original programs.

The browser demos explain selected algorithms rather than replacing emulation. Bill uses the ten original maps with safe boundary handling and local block edits; SlipperTron shows trail growth and local steering; 3DTron shows original AI decisions and recovered pixel-span perspective sampling. Differences from the originals are described beside each demo. Sound previews are isolated sample reconstructions; the EMR envelopes and complete analogue output are not emulated.
