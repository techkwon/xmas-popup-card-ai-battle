# Task: one Christmas pop-up greeting card from a ready-made art set (bonus round)

Another AI already painted every picture for this card. Your job is the code: cut those pictures out as paper, build
the 3D pop-up card from them, make it open and come alive, and print the message. Work alone (no sub-agents, no web
browsing or web search) and finish the whole task in this session without asking questions.

## Inputs

- `art/` (in your current folder): `backdrop.png` (the inside back wall), `ground.png` (the inside floor, seen from
  above), `cover.png` (the front cover), and 12-16 transparent pop-up pieces. `art/manifest.json` says what each file
  is (kind, role, size) and `art/STORY.md` gives the theme. Use every piece at least once; you may use a piece twice.
  Do not draw new pictures and do not edit the PNGs; small code-drawn paper parts (strips, tabs, a sign, frames,
  borders, snow) are fine.
- The papercraft kit at `../kit/` (read-only). Read `../kit/docs/papercraft/PAPERCRAFT.md` and the references you need
  (`mechanisms.md`, `structures.md`, `motion.md`, `three-js.md`, `look.md`).
- `../kit/art.js`: `loadArt(names, base)` trims each transparent PNG to its silhouette and finds its warm glow pixels;
  `artPiece(a, h)` returns `[pts, paint]` for `makeCard` (the cut follows the picture's outline, the glow map lights
  windows and lamps). The opaque backgrounds you load as textures yourself (they are not cut out).

## What to build

`design-1/` with `index.html`, your `.js` modules and `NOTES.md` (3-5 lines in Korean). Load the art with paths
relative to the page (`../art/`). The card is a physical paper greeting card on a table: closed at t = 0 showing the
cover, it opens by itself (choose the structure that suits the art: a 90-degree card with the backdrop as its back
wall is the natural fit), the pieces rise on believable paper folds in layers, and once open the world keeps moving:
the flyer crosses the sky on a paper mechanism, at least one more paper mechanism moves, and there is ambient life
(snow, chimney smoke). Aim for the quality of a premium handmade pop-up book.

Use this import map in `index.html`:
```html
<script type="importmap">{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js", "papercraft/": "../../kit/" } }</script>
```

## Hard requirements (same as the main battle)

1. **The message.** `import { getMessage, loadMessageFont, wrapLines, mountMessageUI } from '../../kit/message.js'`.
   Print `{ to, msg, from }` on paper inside the card, legible in a 1920x1080 frame when open; await `loadMessageFont()`
   first (add the Google Fonts `<link>` for "Nanum Pen Script" or your chosen font); long messages wrap and shrink.
   Call `mountMessageUI()` once after the scene is built.
2. **Capture contract** (the video is 10 s at 1920x1080, 30 fps): `?capture` hides hints; `?size=WxH` renders exactly
   that size at pixel ratio 1; `preserveDrawingBuffer: true`; a fixed-step clock with `restart()` (closed, t = 0) and
   `step(sec)` (advance deterministically, then render one frame); when built,
   `window.__papercraft = { ready: true, buildMs, pieces, restart, step, frame: { w, h, fovY } }`. In normal viewing it
   animates in real time and a click restarts the opening. The whole card stays inside a 16:9 frame from t = 0 to 10,
   and the open card fills most of the frame.
3. **Page rules.** No network requests other than the three.js CDN and Google Fonts; no storage or tracking; builds in
   under 15 s in desktop Chrome; user-facing text in Korean.

## Check your work

```bash
python3 ../kit/tools/shot.py design-1 0.5 2 3.5 6 9.5
python3 ../kit/tools/shot.py design-1 8 --q "to=할머니께&msg=건강하시고 행복한 크리스마스 보내세요! 사랑해요&from=손주 올림"
```

Open the PNGs in `design-1/shots/` and judge them as a picky art director (paper feel, opening, layering, legibility,
clipping, floating or intersecting pieces, folds that go the wrong way or show the blank back, composition). Fix what you find; finish only when it builds with no console
errors and looks its best. Reply with a short summary when done.
