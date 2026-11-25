Use the imagegen skill with the built-in image_gen tool (not the CLI fallback). Do not write HTML, SVG or code to draw these.

Create the complete art set for ONE premium Christmas pop-up greeting card. Another AI will write the code that cuts
these pictures out and builds the 3D paper card from them, so follow the file list and rules exactly. Issue one
separate image_gen call per file. You choose the card's theme and story (an original Christmas scene: a snowy village,
a toy workshop, a winter forest party, a gingerbread town...): it must be coherent, charming and read instantly as
Christmas.

## Shared style (every file)

- Handmade layered cut-paper collage, like a premium pop-up book: matte cardstock layers with tiny soft shadows
  between them, a subtle paper fibre texture, crisp cut edges, flat inks in 3-5 value steps per shape.
- One palette for the whole set (pick 6-9 colours that suit your theme and stick to them; warm window light #ffc35a).
- Avoid: readable text, letters, numbers, logos, real brands or characters, photorealism, a 3D render look.

## Backgrounds (opaque, edge to edge)

1. `backdrop.png` — the inside back wall of the card, landscape about 16:10: the sky and the far distance of your scene
   (for example a night sky, a moon, far hills, a distant skyline), with NO objects in the lower 35 % except low far
   hills, because the pop-up pieces stand in front of it there.
2. `ground.png` — the inside floor of the card seen from straight above, landscape about 16:10: snowy ground with
   subtle paths, a frozen pond or other flat features of your scene. Nothing that stands up.
3. `cover.png` — the front cover of the closed card, portrait about 3:4 or landscape 4:3: a festive cut-paper design
   (an ornament, a wreath, a tree or similar), no text.

## Pop-up pieces (TRANSPARENT background, alpha channel preserved)

Each piece is cut out along its silhouette and stood up on a fold, so: one object, centred, filling about 85 % of the
frame, seen from the front (or side where it makes sense); ONE connected chunky silhouette, no thin spikes, no
floating separate parts, no see-through holes; a flat wide bottom edge where it stands; no ground patch, no sticker
border, no drop shadow.

Make 12-16 pieces that build your scene in layers: a hero centrepiece (for example a tall Christmas tree), 3-4
buildings or large set pieces, 3-4 trees or bushes in two sizes, 3-5 characters (Santa, children, animals, a
snowman...), small props (gifts, lamps, a sign post), and ONE wide side-view vehicle or flyer (for example Santa's
sleigh with reindeer, all joined into one shape) that will fly across the sky on a paper mechanism. Use short lowercase
file names with hyphens (`tree.png`, `house-a.png`, `sleigh.png`, ...).

## Finish

Look at every result. If a piece has a non-transparent background, readable text, separate floating parts or a ground
patch, regenerate it once. Copy each final file from $CODEX_HOME/generated_images/... into the folder `art/` here
(create it) under its file name. Then write `art/manifest.json`: a list of objects
`{ "file": "...", "kind": "backdrop" | "ground" | "cover" | "piece", "what": "a short description", "role": "hero | building | tree | character | prop | flyer", "size": "large | medium | small" }`
(role and size only for pieces), and `art/STORY.md` with 3 lines in Korean about the theme. Print the final file list.
