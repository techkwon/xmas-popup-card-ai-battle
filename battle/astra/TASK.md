# Task: two Christmas pop-up greeting cards, code only

You are one of several AI models building the same brief independently; the results are shown side by side in a video.
Work alone (no sub-agents, no web browsing or web search) and finish the whole task in this session without asking
questions: make reasonable decisions yourself.

## What to build

Two **original** Christmas pop-up greeting cards as web pages, built with three.js and the papercraft kit, **drawn
entirely in code**. Each card is a physical paper greeting card on a table: it starts **closed**, **opens by itself**,
and the paper world inside **keeps moving** once it is open. Aim for the quality of a premium handmade pop-up book.

- `design-1/` and `design-2/` (inside your current folder), each with `index.html`, your `.js` modules, and `NOTES.md`
  (3-5 lines in Korean: the concept, the card structure, the moving mechanisms).
- The two designs must differ clearly: a different concept and scene, a different card structure (for example a
  90-degree card with a back wall, a 180-degree book spread with V-folds, or another real pop-up structure you choose),
  and a different palette. Both must read instantly as Christmas.

## The kit (read first)

- The kit is at `../../kit/` relative to each `design-N/index.html` (that is `../kit/` from your current folder). It is
  read-only: do not change anything in it.
- Start with `../kit/docs/papercraft/PAPERCRAFT.md`, then read the references you need in
  `../kit/docs/papercraft/references/` (most useful: `mechanisms.md`, `structures.md`, `motion.md`, `three-js.md`,
  `look.md`, `procedural-art.md`, `palettes.md`). Example code is in `../kit/docs/papercraft/assets/`.
- Library modules: `../kit/lib/paperkit-2d.js` (print cards in code: shapes, layers, marks, glow), `paperkit-3d.js`
  (makeCard, paper textures and lights, soft shadows, PaperPost lens), `paper-life.js` (snow, smoke puffs, ambient life),
  `paper-motion.js`.
- Use this import map in every `index.html` (exactly these two entries; you may add your own relative modules):
  ```html
  <script type="importmap">{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js", "papercraft/": "../../kit/" } }</script>
  ```
  Then `import ... from 'papercraft/lib/paperkit-3d.js'` and so on.

## Hard requirements

1. **Code only.** No image files, no image generation, no copied art. Every piece is drawn in code (the kit's 2D print
   tools on canvas). Google Fonts are allowed for text.
2. **The card opens.** At t = 0 the card lies closed (its cover visible). It opens by itself and is fully open by about
   t = 3.5 s, with paper-like motion (pieces rise on their folds, nothing pops in or fades in). After that at least
   two paper mechanisms move (sliders in slots, spinners on pins, swinging arms, volvelles, pull-tab motion, and so on)
   plus ambient life such as falling snow. Every moving thing must be a believable paper mechanism.
3. **The message.** `import { getMessage, loadMessageFont, wrapLines, mountMessageUI } from '../../kit/message.js'`.
   `getMessage()` returns `{ to, msg, from }` read from the URL (Korean by default). Print all three on paper inside the
   card (a sign, a note, a banner, a tag: your choice), legible in a 1920x1080 frame once the card is open. Await
   `loadMessageFont()` before printing (the default handwriting font is "Nanum Pen Script": add its Google Fonts
   `<link>` to the page, or load a font of your choice the same way). Long messages must still fit (wrap and shrink).
   Call `mountMessageUI()` once after the scene is built: it adds the "✉ 메시지 쓰기" panel and the share link.
4. **Capture contract** (our renderer drives the page through it; the video is 10 s at 1920x1080, 30 fps):
   - `?capture` in the URL hides any on-screen hints; `?size=WxH` renders exactly that size at pixel ratio 1.
   - `new THREE.WebGLRenderer({ preserveDrawingBuffer: true, ... })`.
   - A fixed-step simulation clock: `restart()` puts everything back to the closed state at t = 0, `step(sec)` advances
     the simulation deterministically by `sec` (in small fixed substeps) and then renders one frame.
   - When the build is finished: `window.__papercraft = { ready: true, buildMs, pieces, restart, step, frame: { w, h, fovY } }`.
     In normal (non-capture) viewing the page animates by itself in real time, and a click on the scene restarts the opening.
   - The camera is yours to direct (a gentle move is welcome), but the whole card must stay inside a 16:9 frame from
     t = 0 to t = 10 and the opened card should fill most of the frame.
5. **Page rules.** No network requests other than the three.js CDN above and Google Fonts. No storage, analytics or
   tracking. It must build in under 15 s and run in desktop Chrome. User-facing text on the page is Korean.

## Check your work

Look at your cards, more than once, and improve them:

```bash
python3 ../kit/tools/shot.py design-1 0.5 2 3.5 6 9.5
python3 ../kit/tools/shot.py design-1 8 --q "to=할머니께&msg=건강하시고 행복한 크리스마스 보내세요! 사랑해요&from=손주 올림"
```

It saves PNG frames to `design-1/shots/` and prints the build time and every console error. Open the PNGs and judge
them as a picky art director: does it read as a real paper pop-up card, is the opening convincing, is the message
legible, is anything clipped, floating, intersecting or edge-on, does every fold go the right way with the printed side facing the viewer (never the blank back), is the frame well composed? Fix what you find. Finish
only when both designs build with no console errors and look their best.

## When you finish

Reply with a short summary: the two concepts, the files you made, and anything that is still not right.
