# Product image prompts — ChatGPT version

A parallel set of the same eighteen product shots, rewritten for ChatGPT's image
generator so the two can be compared on the same catalogue.

The Cloudflare Workers AI version lives in
[product-image-prompts.md](product-image-prompts.md)
and is the one wired into `client/scripts/generate-product-images.mjs`. This file
is not wired to anything — it is for pasting by hand.

## Why these are not the same prompts

Four differences make a straight copy fail.

### Negative instructions backfire

The Workers AI pack leans on them heavily: *no window, no screw thread, never a
cactus.* ChatGPT's image model is much more likely to render the thing you named,
because naming it puts it in the description. Every exclusion below is rewritten
as a positive statement of what is there instead. "No window in the background"
becomes "an unbroken plain sage-grey wall".

### There is no separate house style block

The Workers AI script pastes a fixed style block in front of every subject. Here
each prompt is self-contained, with the camera, light, surface and background
folded into it. That costs repetition but survives a new chat, a lost thread, or
generating them weeks apart.

### ChatGPT rewrites what you give it

It expands and "improves" prompts before generating, which is the enemy of a
consistent set. Send the setup message below first, once per conversation.

### Prompts want prose, not specification

Flux responds to a list of constraints. ChatGPT responds better to a described
scene in flowing sentences. These read like a photographer's brief.

## How to use it

Paste this first, once, at the start of the conversation:

```text
I am generating a set of product photographs for one shop catalogue. They must
look like the same photographer shot them in the same session, so consistency
between images matters more than any single image.

For every prompt I send: use my wording as written rather than rewriting or
expanding it, generate a square 1:1 image, and produce one image at a time. If
something in my prompt is unclear, ask me instead of inventing a detail.
```

Then send each prompt below on its own. Save the result as the filename in the
heading, into `client/src/assets/images/`, so the two sets stay comparable
file-for-file.

Two practical notes. Image generation is rate-limited on the free tier, so
eighteen shots may need spreading across a day. And if the set starts drifting
after five or six images, re-send the setup message — the style instruction
decays as the conversation grows.

## What to compare

Judge these four things against the Workers AI sheet at
`catalogue-contact-sheet_2026-08-17_v2.jpg`:

1. **Text.** Products 16, 17 and 18 are the real test. GPT's model renders
   lettering far better than flux, and `mossWord` is the weakest shot in the
   flux set — crude, lumpy letterforms.
2. **Consistency.** Flux wins here by construction: an identical style block on
   every call. ChatGPT has to hold it in conversation, and usually drifts.
3. **Material.** Flux needed to be told at length that pillow moss is many small
   cushions, or it produced a cactus. Whether GPT needs the same hand-holding is
   the useful thing to learn.
4. **Cost.** Flux ran the full eighteen for about 4,220 neurons of a free daily
   10,000. Count how many ChatGPT generations the same eighteen take, including
   rejects.

## The eighteen prompts

### 1. Glass Sphere — `glassSphere.jpg`

```text
A product photograph of a hand-blown clear glass sphere about 18cm across,
standing on a pale warm oak table. The sphere has a wide circular opening cut at
a slant across the top, and its thin transparent curve is visible all the way
round. The lower two thirds inside are filled with preserved reindeer moss —
soft, dry, matte clusters that branch like small coral heads, packed in three
colours as separate clumps: undyed cream, acid yellow-green, and light green.
Shot on an 85mm lens at f/5.6 from about a metre away, slightly above eye level,
so the whole sphere is sharp and the oak grain softens. Soft directional daylight
from the left, gentle fill from the right. Behind it, an unbroken plain sage-grey
wall, evenly lit and completely empty. The sphere is centred and fills about 70
percent of the frame height with even margins on all four sides. Square image.
```

### 2. Ceramic Bowl — `ceramicBowl.jpg`

```text
A product photograph of a shallow ceramic bowl about 22cm across, wide and low,
glazed matte bone white with a slightly uneven rim, standing on a pale warm oak
table. The bowl itself is plain white throughout. Mounded inside it is preserved
reindeer moss — soft, dry, matte clusters that branch like small coral heads —
mostly a soft pale blue-grey, with a wide sweep of warm grey clusters across one
side and a scatter of undyed cream at the front edge. Shot on an 85mm lens at
f/5.6 from about a metre away, slightly above eye level. Soft directional
daylight from the left, gentle fill from the right, no harsh shadows. Behind it,
an unbroken plain sage-grey wall, evenly lit and completely empty. The bowl is
centred and fills about 70 percent of the frame height with even margins on all
four sides. Square image.
```

### 3. Stoneware Cup — `stonewareCup.jpg`

```text
A product photograph of a small footed stoneware cup about 12cm tall, glazed a
speckled grey-blue that breaks to bare clay at the lip, standing on a pale warm
oak table. Filling it and mounding just above the rim is preserved pillow moss —
eight or nine separate rounded velvety cushions of noticeably different sizes,
each smooth like a small green pebble, packed against one another with narrow
dark seams between them and their tops at different heights so the surface is
bumpy. Most cushions are a strong medium green, three are deep emerald, and near
the front rim sit two bright lemon yellow cushions and one rust orange one. Shot
on an 85mm lens at f/5.6 from about a metre away, slightly above eye level. Soft
directional daylight from the left, gentle fill from the right. Behind it, an
unbroken plain sage-grey wall, evenly lit and completely empty. Centred, filling
about 70 percent of the frame height. Square image.
```

### 4. Layered Panel — `layeredPanel.jpg`

```text
A product photograph of a rectangular moss wall panel roughly 60cm by 40cm, built
on a reclaimed pale birch backing board whose edge shows all the way round, hung
flat against the wall and photographed square on. Its face is packed edge to edge
with two preserved mosses at different depths: rounded velvety pillow cushions
standing proud, and a fine flat mat of sheet moss recessed between them, so the
surface has real depth and casts small shadows across itself. Four greens in
irregular drifts — deep emerald across the lower left, strong medium green
through the centre, light green upper right, and a narrow run of acid yellow-green
along one edge. Shot on an 85mm lens at f/5.6 from about a metre away. Soft
directional daylight from the left, gentle fill from the right. The wall behind is
plain sage-grey, evenly lit and completely empty. The panel is centred and fills
about 70 percent of the frame height. Square image.
```

### 5. Oak Frame — `oakFrame.jpg`

```text
A product photograph of a slim square picture frame in pale oak, about 30cm
square, hung flat against the wall and photographed square on. The frame is a
plain narrow oak moulding, clearly visible on all four sides, with a narrow
off-white shadow-gap mount just inside it. The opening is filled corner to corner
with preserved reindeer moss — soft, dry, matte clusters that branch like small
coral heads, each thumb-sized and standing proud so it casts a small shadow onto
the mount. The moss reaches every corner and fills the whole opening. Three warm
colours meet along soft, uneven, organic edges: deep wine red across roughly
half, warm rust orange through the middle, and bright lemon yellow filling one
corner. This panel is red, rust and yellow, entirely without green. Shot on an
85mm lens at f/5.6. Soft daylight from the left. The wall behind is plain
sage-grey, evenly lit and empty. Centred, filling about 70 percent of the frame
height. Square image.
```

### 6. Moss Tiles — `mossTiles.jpg`

```text
A product photograph of four separate square moss tiles arranged in a two-by-two
grid on a shared pale birch backing board, roughly 40cm square overall, hung flat
against the wall and photographed square on. There are exactly four tiles, all
the same size, with an even gap between them showing the birch underneath so the
grid and its cross-shaped gap are obvious. Each tile is packed with preserved
reindeer moss — soft, dry, matte clusters that branch like small coral heads —
standing proud of the board with a soft bumpy surface, springy and clearly
three-dimensional. Each tile is one flat colour and the four are strongly
different from one another: acid yellow-green top left, undyed cream top right,
strong medium green bottom left, deep emerald bottom right. Shot on an 85mm lens
at f/5.6. Soft daylight from the left. The wall behind is plain sage-grey, evenly
lit and empty. Centred, filling about 70 percent of the frame height. Square
image.
```

### 7. Concrete Bowl — `concreteBowl.jpg`

```text
A product photograph of a hand-poured concrete bowl about 20cm across, heavy and
low, the concrete pale grey with a slightly rough unpolished rim, standing on a
pale warm oak table. It is filled flush to the rim with preserved pillow moss —
many separate rounded velvety cushions of different sizes packed against one
another, each smooth like a small green pebble. The surface is an uneven field
rather than a dome: some cushions sit higher than their neighbours, with a
shallow valley across the middle where the smaller ones gather. Mostly deep
emerald, with a broad drift of strong medium green across one half and three
light green cushions near the rim. Shot on an 85mm lens at f/5.6 from about a
metre away, slightly above eye level. Soft daylight from the left, gentle fill
from the right. Behind it, a plain sage-grey wall, evenly lit and empty. Centred,
filling about 70 percent of the frame height. Square image.
```

### 8. Concrete Trough — `concreteTrough.jpg`

```text
A product photograph of a long low rectangular concrete trough about 40cm wide
and only 12cm tall, standing on a pale warm oak table. It is a straight-sided
rectangular box, three times as wide as it is tall, and its board-formed outside
face shows faint horizontal grain. Packed level inside it is preserved pillow
moss — many separate rounded velvety cushions of different sizes — with two thin
upright pieces of grey slate standing in the moss off-centre. The moss runs as
three soft horizontal bands along its length: dark cool forest green at the left
end, strong medium green through the middle, light green at the right end. Shot
on an 85mm lens at f/5.6 from about a metre away, slightly above eye level. Soft
daylight from the left, gentle fill from the right. Behind it, a plain sage-grey
wall, evenly lit and empty. Centred, filling about 70 percent of the frame
height. Square image.
```

### 9. Concrete Cylinder — `concreteCylinder.jpg`

```text
A product photograph of a tall narrow raw concrete column standing upright on a
pale warm oak table, about 28cm tall and only 12cm across — roughly two and a
half times as tall as it is wide, straight-sided and unpolished, like a short
section of pipe stood on end. The whole outside face of the concrete is bare
plain grey from base to rim, clean and uninterrupted. Preserved reindeer moss —
soft dry clusters that branch like small coral heads — fills the circular opening
at the very top only, sitting level and flush with the rim like a plug contained
inside the mouth. Two thirds of it is warm rust orange-brown, with a crescent of
bright lemon yellow along one side and a few medium green clusters at the centre.
Shot on an 85mm lens at f/5.6. Soft daylight from the left. Behind it, a plain
sage-grey wall, evenly lit and empty. Centred, filling about 70 percent of the
frame height. Square image.
```

### 10. Apothecary Jar — `apothecaryJar.jpg`

```text
A product photograph of a wide straight-sided cylindrical clear glass jar about
25cm tall, standing on a pale warm oak table. It is the same diameter from base
to top with no neck and no taper, its rim a plain smooth cut edge, and a flat
circular disc of glass with a small glass knob rests loose on top as a lid. The
glass is unbroken, smooth and completely plain all the way round, like a
laboratory specimen jar. Inside, filling the lower third, is preserved pillow
moss — separate rounded velvety cushions of different sizes in deep emerald and
strong medium green — finished with three smooth grey river stones and one short
piece of pale driftwood. Shot on an 85mm lens at f/5.6 from about a metre away,
slightly above eye level. Soft daylight from the left, gentle fill from the
right. Behind it, a plain sage-grey wall, evenly lit and empty. Centred, filling
about 70 percent of the frame height. Square image.
```

### 11. River Stones — `riverStones.jpg`

```text
A product photograph of a thin dark slate base about 35cm wide lying flat on a
pale warm oak table, low and horizontal. Arranged along it in a loose line are
five or six smooth grey river stones of varying size alternating with separate
cushions of preserved pillow moss — small rounded velvety mounds, each smooth
like a green pebble. Stone, moss, stone, moss along the length, with clear space
between each. Two cushions are strong medium green, one is dark forest green, one
is bright lemon yellow and the smallest is rust orange, so the line runs from
green to warm along its length. Shot on an 85mm lens at f/5.6 from about a metre
away, slightly above eye level. Soft daylight from the left, gentle fill from the
right. Behind it, a plain sage-grey wall, evenly lit and empty. Centred, filling
about 70 percent of the frame height. Square image.
```

### 12. Glass Cloche — `glassCloche.jpg`

```text
A product photograph of a clear glass cloche with a small round knob on top,
about 22cm tall, sitting on a turned pale oak base on a pale warm oak table. The
cloche is a thin, clean, transparent bell of glass, its full curved outline
visible against the background, covering everything beneath it. Under the glass
is a flat low carpet of preserved sheet moss covering the whole base like a lawn,
with three small rounded velvety pillow moss cushions of different sizes resting
on it toward the back. The carpet is light green and the three cushions are deep
emerald. Everything under the glass is low and flat rather than mounded. Shot on
an 85mm lens at f/5.6 from about a metre away, slightly above eye level. Soft
daylight from the left with no bright reflections on the glass. Behind it, a
plain sage-grey wall, evenly lit and empty. Centred, filling about 70 percent of
the frame height. Square image.
```

### 13. Moss Wreath — `mossWreath.jpg`

```text
A product photograph of a circular wreath on a woven willow base, about 40cm
across, hung flat against the wall and photographed square on, with a clean open
circle of wall showing through the middle. The ring is evenly packed with
preserved reindeer moss — soft dry clusters that branch like small coral heads —
so the willow is hidden and the outer edge has a soft irregular outline. Six
colours are mixed in irregular patches around the ring with no repeating pattern:
deep emerald, strong medium green and light green through most of it, with three
or four distinct patches of rust orange, two of bright lemon yellow and two of
deep wine red worked in among them, so the ring reads as a warm autumn mix rather
than a plain green one. Shot on an 85mm lens at f/5.6. Soft daylight from the
left. The wall behind is plain sage-grey, evenly lit and empty. Centred, filling
about 70 percent of the frame height. Square image.
```

### 14. Slim Wreath — `slimWreath.jpg`

```text
A product photograph of a slim minimal wreath about 30cm across, hung flat
against the wall and photographed square on. It is a narrow ring no more than 5cm
deep, leaving a large clean circle of wall showing through the middle. The ring is
densely packed with preserved reindeer moss — soft dry clusters that branch like
small coral heads — so its outer edge has a soft irregular outline and its surface
is visibly three-dimensional and springy. Four colours are worked through the ring
in irregular patches with no repeating pattern: undyed cream dominant, with soft
pale blue-grey, warm grey, and a scatter of acid yellow-green. Shot on an 85mm
lens at f/5.6 from about a metre away. Soft directional daylight from the left,
gentle fill from the right. The wall behind is plain sage-grey, evenly lit and
completely empty. The wreath is centred and fills about 70 percent of the frame
height with even margins on all four sides. Square image.
```

### 15. Lichen Wreath — `lichenWreath.jpg`

```text
A product photograph of a loose textured wreath about 45cm across, hung flat on
the wall and photographed square on, with clear empty wall below and around it.
Its outline is deliberately uneven so it reads as gathered by hand rather than
machined. It is made of preserved reindeer moss in deep dusky aubergine purple —
soft dry clusters that branch like small coral heads — with clusters of soft pale
blue moss and pale grey lichen scattered through it and a few small dried seed
heads. The aubergine purple dominates and covers most of the ring; this wreath is
purple, not green. Shot on an 85mm lens at f/5.6 from about a metre away. Soft
directional daylight from the left, gentle fill from the right. The wall behind is
plain sage-grey, evenly lit and completely empty. The wreath is centred and fills
about 70 percent of the frame height with even margins on all four sides. Square
image.
```

### 16. Moss Letter M — `mossLetterM.jpg`

```text
A product photograph of a freestanding capital letter M about 25cm tall and 6cm
deep, cut from plywood and standing upright on a pale warm oak table. The shape is
clearly readable as the letter M: two upright strokes joined by a V in the middle.
Its narrow sides are bare pale plywood so the construction reads, and its entire
front face is packed flush with preserved pillow moss — many separate rounded
velvety cushions of different sizes, each smooth like a small green pebble —
covering every part of the face so no wood shows on the front. The cushions are
strong medium green with four or five deep emerald ones worked in at random. The
letter M is the only character in the picture. Shot on an 85mm lens at f/5.6 from
about a metre away, slightly above eye level. Soft daylight from the left. Behind
it, a plain sage-grey wall, evenly lit and empty. Centred, filling about 70
percent of the frame height. Square image.
```

### 17. Moss Ampersand — `mossAmpersand.jpg`

```text
A product photograph of a freestanding ampersand symbol, the "&" character, about
25cm tall and 6cm deep, cut from plywood and standing upright on a pale warm oak
table. The shape is clearly readable as an ampersand: a single looping stroke that
crosses itself. Its narrow sides are bare pale plywood, and its entire front face
is packed flush with preserved reindeer moss — soft dry clusters that branch like
small coral heads — covering every part of the curve so no wood shows on the
front, standing proud so the surface is soft and irregular. The clusters mix four
colours in random clumps across the face: acid yellow-green, light green, strong
medium green and deep emerald, with four or five undyed cream clusters scattered
among them. The ampersand is the only character in the picture. Shot on an 85mm
lens at f/5.6. Soft daylight from the left. Behind it, a plain sage-grey wall,
evenly lit and empty. Centred, filling about 70 percent of the frame height.
Square image.
```

### 18. Moss Sign — `mossSign.jpg`

```text
A product photograph of a flat wall sign spelling the word HOME, about 50cm wide,
cut from one piece of pale plywood as a single connected sign, hung flat against
the wall and photographed square on. It reads as four capital letters in a row: H,
then O, then M, then E. The letters are bold and chunky with thick heavy strokes,
all the same height, evenly spaced, correctly formed and sitting on one level
line. The front face of every letter is packed completely full, edge to edge, with
preserved pillow moss — many separate rounded velvety cushions of different sizes,
each smooth like a small green pebble — standing proud of the plywood so each
letter has a bumpy three-dimensional surface and no wood shows on the front. The
cushions are strong medium green and deep emerald through most of it, with rust
orange and bright lemon yellow cushions scattered across all four letters. The
word HOME is the only text in the picture. Shot on an 85mm lens at f/5.6. Soft
daylight from the left. The wall behind is plain sage-grey, evenly lit and empty.
Centred, filling about 70 percent of the frame height. Square image.
```

## Filenames

The filenames here match the repo. The rename landed on 2026-08-17 — `paleBowl`
became `ceramicBowl`, `fernFrame` became `oakFrame`, `mossLetter` became
`mossLetterM`, `mossWord` became `mossSign` — across the image files, the image
barrel, `data/products.js` and eight test files.

**Do not overwrite the existing files while comparing.** Save ChatGPT's versions
somewhere separate, or suffix them, so both sets survive long enough to judge
side by side. The Workers AI set cost a full day's free allocation and there is
no way to regenerate it identically — the model takes no seed on this wire
format.
