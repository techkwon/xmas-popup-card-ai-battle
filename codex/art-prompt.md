Use the imagegen skill with the built-in image_gen tool (not the CLI fallback). Do not write HTML, SVG or code to draw these.

Generate a set of illustration pieces for a Christmas pop-up greeting card. Each piece will be cut out along its silhouette and stood up in a paper pop-up card, so it must read as ONE solid cut-out shape. Issue one separate image_gen call per piece.

Every piece:
- A genuinely TRANSPARENT background (preserve the alpha channel). One single object, centered, filling about 85% of the frame, seen straight from the front (or from the side where noted).
- ONE connected silhouette with chunky rounded lobes: no thin spikes, no floating separate parts, no holes you can see through. The bottom edge is flat and wide where the object stands (it stands on a fold line).
- Style: handmade layered cut-paper collage, like a premium pop-up book. Matte cardstock layers with tiny soft shadows between the layers, a subtle paper fibre texture, crisp cut edges. Flat inks in 3-5 value steps per piece, no gradients that look digital, no gloss, no outline glow, no white sticker border, no drop shadow under the object, no ground or snow patch under it.
- Palette (consistent across the whole set): spruce greens #2f5a46 / #3c6b52, berry red #b23a32, deep red #86302c, warm gold #d9a441, cream #f3ede0, snow white #f8f7f3 with lilac-blue shading #b8c0d4, warm brown #6b4a34, plum ink #2e2230 for small details. Windows and lamps glow warm yellow #ffc35a.
- Avoid: readable text, letters, numbers, logos, real brands, photorealism, 3D render look.

Pieces (exact filenames):
1. `tree.png`: a tall village Christmas tree, symmetric left to right, five layered tiers with scalloped hems and snow on the hems, cream garland swags, red / gold / cream baubles, a gold star on top, a short trunk. Portrait, about 2:3.
2. `pine-a.png`: a snowy pine tree, four tiers, snow caps on each tier, short trunk. Portrait.
3. `pine-b.png`: a smaller, rounder snowy fir tree, three tiers, a little different from pine-a. Portrait.
4. `house-a.png`: a cosy cream timber cottage, front view, a snow-covered gable roof, a brick chimney with snow, two lit windows, a green arched door with a wreath, a string of coloured fairy lights under the eave. Square.
5. `house-b.png`: a small red brick cottage, front view, one lit window, a green door, snow on the roof and chimney, icicles. Square.
6. `house-c.png`: a narrow tall honey-yellow house with a steep snowy roof, two stacked lit windows, a red door. Portrait.
7. `santa.png`: Santa Claus standing, front view, waving one mittened hand, a big cream sack of gifts over his shoulder, red coat with white fur trim, black belt with gold buckle, black boots, big white beard. Portrait.
8. `reindeer.png`: a reindeer standing, side view facing right, antlers, cream belly, a red scarf with a gold bell. Square.
9. `snowman.png`: a snowman, three snowballs, black top hat with red band, red scarf, carrot nose, twig arms close to the body (touching it). Portrait.
10. `skater-a.png`: a child ice skating, side-ish view gliding to the right, arms out for balance, red coat, cream scarf, bobble hat, skates. Portrait.
11. `skater-b.png`: another child ice skating gliding to the left, blue coat, red scarf and hat. Portrait.
12. `sleigh.png`: side view: Santa in a red sleigh full of gifts pulled by two leaping reindeer to the right, all joined by the harness so it is one connected shape. Wide, about 5:2.
13. `gifts.png`: a small stack of three wrapped gift boxes with ribbons and bows (red with gold, green with cream, cream with red). Square.
14. `lamp.png`: an old street lamp post with a glowing lantern, a small wreath with a red bow on the post, snow on top of the lantern. Tall portrait.

## Finish
Look at every result. If a piece has a non-transparent background, readable text, separate floating parts or a ground patch, regenerate that one once. Copy each final file from $CODEX_HOME/generated_images/... into the folder `art/` here (create it) under the exact filename. Print the final file paths and nothing else.
