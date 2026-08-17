# Product image prompts — MossArt

Written 2026-08-16, extended to eighteen prompts on 2026-08-17, then rewritten
twice the same day. One prompt per product, for generating placeholder product
photography.

The point of a prompt pack rather than eighteen separate asks is **consistency**.
A shop grid falls apart when one photo is lit from the left on a warm oak table
and the next is overhead on white — it stops reading as one catalogue. So the
house style block below is fixed and goes into every prompt unchanged. Only the
subject line changes.

## How to use it

`client/scripts/generate-product-images.mjs` reads this file directly, so it is
the single source of truth — edit here, re-run, done. From `client/`:

```bash
npm run images:generate                                 # everything missing
npm run images:generate -- --only glassSphere.jpg       # one product
npm run images:generate -- --force                      # replace what exists
npm run images:generate -- --dry-run                    # print prompts, call nothing
```

Then build a contact sheet to judge the set as a set, which is the only way the
consistency problem is visible at all:

```bash
node scripts/contact-sheet.mjs
```

The filename keeps its original date on purpose. This is a working source file
that a script parses, not a dated deliverable — renaming it to `_v2` would break
the script's path for no gain, and the revision history is in git.

## The rule that governs this pack

**The house style block must never outweigh the subject line.**

This was learned expensively. The second draft put a 350-word block into the
house style describing all three moss types, with the pillow moss entry carrying
heavy negative emphasis — *never one single large ball, must not resemble a
cactus, a succulent, a topiary ball or a hedgehog*. Because that block precedes
the subject in every prompt, `flux-2-klein-4b` spent its whole attention budget
on moss texture. Eleven of eighteen images came back with no object at all: no
glass sphere, no frame, no tiles, no letters, just a mound of cushions on a
table. Seven pieces that asked for reindeer or flat moss got cushions anyway,
because sixty words of emphasis beat a two-word mention.

Three rules follow from that, and they are why the subjects below are shaped the
way they are:

1. **The object leads, in capitals.** `A CUT-OPEN CLEAR GLASS SPHERE, about 18cm
   across…` The vessel, frame or letterform is named before any moss is
   mentioned.
2. **Only the moss type that piece uses is described**, as one short clause
   inside the subject. Never all three, and never in the house style.
3. **The house style carries camera, light, surface, background and framing
   only.** Anything about the object or the material belongs in the subject.

## What the material actually looks like

Checked against [Preserved Moss UK](https://www.preservedmoss.co.uk/) on
2026-08-17, a wholesaler selling the raw material by the box.

### The colour is vivid, not muted

The first draft told the model the colour was "even and slightly muted". That is
wrong, and it is why the first set looked dusty. Dyed preserved moss is
**saturated** — the greens are strong, and Spring Green is nearly an acid lime.
Matte, yes. Faded, no.

### The four greens are trade colours and are sold pre-mixed

From lightest to darkest: **Spring Green** (acid yellow-green, almost lime),
**Light Green**, **Medium Green**, **Dark Green** (deep emerald). The Alpine
Tyrolean moss adds **Forest Green**, a darker cooler green.

Their bestselling reindeer moss box is "Mix 4 colors" — all four greens packed
into one tray as separate adjacent clumps. That is the look. A piece made from
one flat green is the exception in this trade, not the rule.

Beyond the greens: Natural Pale (undyed cream), Ice Blue, Grey, Lemon Yellow,
Sienna, Burgundy, Aubergine, Old Green.

### The three moss types, and which products use which

These descriptions are the exact wording used in the subject lines. Keeping them
identical across products is what makes the texture consistent without a shared
block that drowns the object.

| Type | Wording used in the subject | Products |
| --- | --- | --- |
| Reindeer | soft fluffy branching clusters like small coral heads | 1, 2, 5, 6, 9, 13, 14, 15, 17 |
| Pillow / bun | many small velvety rounded cushions of different sizes packed side by side | 3, 7, 8, 10, 11, 16, 18 |
| Flat / sheet | a fine even mat like green felt laid flat | 4 and 12 only, as a secondary |

The Letter M (16) and the Ampersand (17) deliberately use different types. When
both were pillow moss they read as the same object photographed twice.

### Flat sheet moss does not render, and is no longer used on its own

Four products were originally faced in flat sheet moss: the Oak Frame, the Moss
Tiles, the Slim Wreath and the Moss Sign. All four came back wrong and all four
were rejected on sight — the frame read as sand or soil, the tiles and the sign
as mown grass, the wreath as felt. The model cannot tell "a fine even mat" from a
lawn, and no amount of extra wording separated them.

All four moved to reindeer moss, whose fluffy three-dimensional clusters are
unmistakably moss in every shot that has used them. Flat moss now survives only
as a secondary material in products 4 and 12, where pillow cushions stand proud
of it and carry the read.

The wider lesson: **prefer the material with the most distinctive silhouette.**
Reindeer moss has a shape nothing else shares. Flat moss is defined by being
flat, which is exactly what makes it indistinguishable from every other flat
green thing the model knows.

### The mix is by clump, never by blend

Adjacent patches and bands of separate colours. Each individual cushion or
cluster is one flat colour throughout; the mixing is visible at the scale of the
piece, not the scale of the fibre. No gradients, no ombre.

## House style — paste this into every prompt

```text
Product photograph for a small independent homeware shop, shot slightly above
eye level at roughly 30 degrees. One object only, centred.

THE OBJECT IS NAMED FIRST IN THE SUBJECT LINE BELOW. Build that object exactly
as described. Its shape, material and proportions matter more than anything else
in this prompt, and it must be clearly present and recognisable in the picture.

The moss is PRESERVED and dyed: matte and dry, never glossy or wet, each piece
of moss one strong even colour. No new growth, no upright shoots reaching for
light, no water droplets, no soil, no roots, no flowers. Where the subject names
more than one colour, they sit as separate adjacent clumps and never blend.

Camera: 85mm prime on a full-frame body, f/5.6, tripod, roughly one metre from
the object. The whole object stays sharp front to back; the surface and the wall
behind it fall away.

Lighting: soft directional light from the left as though from a large window,
gentle fill from the right, no hard shadows, no visible highlights on glass.

Surface: pale warm oak, lightly grained, for pieces that sit. Wall-mounted
pieces hang flat against the background wall with no surface in shot.

Background: a plain soft muted sage-grey wall, evenly lit, filling the entire
background edge to edge. No window, no window frame, no sill, no curtain, no
skirting, no corner, no furniture, no plants, no props, no text, no watermark,
no hands, no people. The light source itself is never in frame.

Framing: the object is centred left to right and sits on the horizontal middle
of the frame, filling about 70 percent of the frame height, with even margins on
all four sides. It must never touch or run off any edge, and the composition
must survive a square crop taken from any side.
```

## Moss Pots

### 1. Glass Sphere — `glassSphere.jpg`

```text
Subject: A CUT-OPEN HAND-BLOWN CLEAR GLASS SPHERE, about 18cm across, standing
on the oak surface. The glass ball has a wide circular opening cut at a slant
across the top. The glass is thin, clean and fully transparent, and its curved
edge is visible all the way round against the background. Filling the lower two
thirds of the inside, and nowhere else, is reindeer moss — soft fluffy branching
clusters like small coral heads — in three colours packed as separate clumps:
Natural Pale undyed cream, Spring Green and Light Green.
```

### 2. Ceramic Bowl — `ceramicBowl.jpg`

```text
Subject: A SHALLOW CERAMIC BOWL, about 22cm across, wide and low, glazed matte
bone white with a slightly uneven rim, standing on the oak surface. The bowl is
plain white and carries no colour of its own. Mounded inside it is reindeer moss
— soft fluffy branching clusters like small coral heads — mostly ICE BLUE, a
soft pale blue-grey, with a wide sweep of GREY clusters across one side and a
scatter of Natural Pale cream at the front edge.
```

### 3. Stoneware Cup — `stonewareCup.jpg`

```text
Subject: A SMALL FOOTED STONEWARE CUP, about 12cm tall, glazed a speckled
grey-blue that breaks to bare clay at the lip, standing on the oak surface.
Filling it and mounding just above the rim is pillow moss — many small velvety
rounded cushions of different sizes packed side by side, each one smooth like a
green pebble, their tops at slightly different heights so the surface is bumpy
rather than a smooth dome. Most cushions are Medium Green and three are Dark
Green, and among them sit two LEMON YELLOW cushions and one SIENNA rust orange
cushion near the front rim, bright against the greens.
```

## Wall Art

### 4. Layered Panel — `layeredPanel.jpg`

```text
Subject: A RECTANGULAR WALL PANEL, roughly 60cm by 40cm, built on a reclaimed
pale birch backing board whose edge shows all the way round. Hung flat against
the wall and photographed square on. Its face is packed edge to edge with two
mosses at different depths: pillow moss cushions standing proud, and flat sheet
moss recessed between them, so the surface has real depth and casts small shadows
across itself. Four greens in irregular drifts — Dark Green across the lower
left, Medium Green through the centre, Light Green upper right, and a narrow run
of Spring Green along one edge.
```

### 5. Oak Frame — `oakFrame.jpg`

```text
Subject: A SLIM SQUARE PICTURE FRAME MADE OF PALE OAK, about 30cm square, hung
flat against the wall and photographed square on. The frame is a plain narrow
oak moulding and is clearly visible on all four sides, with a narrow off-white
shadow-gap mount just inside it. Inside that mount is a solid square panel of
reindeer moss — soft fluffy branching clusters like small coral heads, each
cluster thumb-sized and clearly three-dimensional — filling the entire opening
edge to edge and corner to corner, standing proud so it casts a small shadow onto
the mount. The moss reaches every corner: no white space, no empty mount and no
gap anywhere inside the frame. It must read as springy moss with visible depth
and separate clusters: never flat sand, soil, sawdust, dried herbs, felt or
fabric. Three warm colours meet along soft, uneven, organic edges the way patches
of real moss meet, with no straight lines, no triangles and no geometric pattern
of any kind: BURGUNDY, a deep wine red, across roughly half of it; SIENNA, a warm
rust orange, through the middle; and LEMON YELLOW filling one corner. This panel
is red, rust and yellow, with no green in it at all.
```

### 6. Moss Tiles — `mossTiles.jpg`

```text
Subject: FOUR SEPARATE SQUARE TILES ARRANGED IN A TWO-BY-TWO GRID on a shared
pale birch backing board, roughly 40cm square overall, hung flat against the wall
and photographed square on. There are exactly four tiles, all the same size, with
an even gap between them showing the birch board underneath, so the grid and its
cross-shaped gap are obvious. Each tile is packed with reindeer moss — soft
fluffy branching clusters like small coral heads — standing proud of the board
with a soft bumpy surface. It must read as springy three-dimensional moss with
separate visible clusters: never flat lawn, grass, turf, felt or carpet. Each
tile is one flat colour and the four are strongly different from one another:
SPRING GREEN, an acid yellow-green, top left; NATURAL PALE undyed cream top
right; MEDIUM GREEN bottom left; DARK GREEN, a deep emerald, bottom right.
```

## Planters

### 7. Concrete Bowl — `concreteBowl.jpg`

```text
Subject: A HAND-POURED CONCRETE BOWL, about 20cm across, heavy and low, the
concrete pale grey with a slightly rough unpolished rim, standing on the oak
surface. Filling it flush to the rim is pillow moss — many small velvety rounded
cushions of different sizes packed side by side. Not a dome: an uneven field
where some cushions sit higher than their neighbours, with a shallow valley
across the middle where the smaller ones gather. Mostly Dark Green, with a broad
drift of Medium Green across one half and three Light Green cushions near the
rim.
```

### 8. Concrete Trough — `concreteTrough.jpg`

```text
Subject: A LONG LOW RECTANGULAR CONCRETE TROUGH, about 40cm wide and only 12cm
tall, standing on the oak surface. It is clearly a straight-sided rectangular
box, three times as wide as it is tall, and its board-formed outside face shows
faint horizontal grain. Packed level inside it is pillow moss — many small
velvety rounded cushions of different sizes packed side by side — with two thin
upright pieces of grey slate standing in the moss off-centre. The moss runs as
three soft horizontal bands along the length: Forest Green at the left end,
Medium Green through the middle, Light Green at the right end.
```

### 9. Concrete Cylinder — `concreteCylinder.jpg`

```text
Subject: A TALL NARROW RAW CONCRETE COLUMN standing upright on the oak surface,
about 28cm tall and only 12cm across — roughly two and a half times as tall as
it is wide, straight-sided and unpolished, like a short section of pipe stood on
end. The whole outside face of the concrete is bare plain grey from base to rim,
with nothing on it and nothing hanging over it. Reindeer moss — soft fluffy
branching clusters like small coral heads — fills the circular opening at the
very top only, sitting level and flush with the rim like a plug contained inside
the mouth. Two thirds of it is SIENNA, a warm rust orange-brown, with a crescent
of LEMON YELLOW along one side and a few Medium Green clusters at the centre.
```

## Tabletop

### 10. Apothecary Jar — `apothecaryJar.jpg`

```text
Subject: A WIDE STRAIGHT-SIDED CYLINDRICAL CLEAR GLASS JAR, about 25cm tall,
standing on the oak surface. It is the same diameter from base to top with no
neck and no taper, its rim a plain smooth cut edge, and a flat circular disc of
glass with a small glass knob rests loose on top as a lid. The glass is unbroken
and completely smooth all the way round: no screw thread, no moulded ridges, no
metal, no clamp, no hinge, no seal, no label. Inside, filling the lower third, is
pillow moss — many small velvety rounded cushions of different sizes packed side
by side — in Dark Green and Medium Green, finished with three smooth grey river
stones and one short piece of pale driftwood.
```

### 11. River Stones — `riverStones.jpg`

```text
Subject: A THIN DARK SLATE BASE, about 35cm wide, lying flat on the oak surface,
low and horizontal. Arranged along it in a loose line are five or six smooth grey
river stones of varying size alternating with separate cushions of pillow moss —
small velvety rounded mounds, each one smooth like a green pebble. Stone, moss,
stone, moss along the length, none of them touching. Two cushions are Medium
Green, one is Forest Green, one is LEMON YELLOW and the smallest is SIENNA rust
orange, so the line runs from green to warm along its length.
```

### 12. Glass Cloche — `glassCloche.jpg`

```text
Subject: A CLEAR GLASS CLOCHE WITH A SMALL ROUND KNOB ON TOP, about 22cm tall,
sitting on a turned pale oak base on the oak surface. The cloche is a thin clean
bell of transparent glass, its full curved outline visible against the
background, and it covers everything beneath it. Under the glass is a flat low
carpet of sheet moss covering the whole base like a lawn, with three small pillow
moss cushions of different sizes resting on it toward the back. The carpet is
Light Green and the three cushions are Dark Green. Everything under the glass is
low and flat rather than mounded.
```

## Wreaths

### 13. Moss Wreath — `mossWreath.jpg`

```text
Subject: A CIRCULAR WREATH ON A WOVEN WILLOW BASE, about 40cm across, hung flat
against the wall and photographed square on, with a clean open circle of wall
showing through the middle. The ring is evenly packed with reindeer moss — soft
fluffy branching clusters like small coral heads — so no willow shows through and
the outer edge has a soft irregular outline. Six colours mixed in irregular
patches around the ring with no repeating pattern: Dark Green, Medium Green and
Light Green through most of it, with three or four distinct patches of SIENNA
rust orange, two of LEMON YELLOW and two of BURGUNDY wine red worked in among
them, so the ring reads as a warm autumn mix rather than a plain green one.
```

### 14. Slim Wreath — `slimWreath.jpg`

```text
Subject: A SLIM MINIMAL WREATH, about 30cm across, hung flat against the wall and
photographed square on. It is a narrow ring no more than 5cm deep, leaving a
large clean circle of wall showing through the middle. The ring is densely packed
with reindeer moss — soft fluffy branching clusters like small coral heads — so
its outer edge has a soft irregular outline and its surface is visibly
three-dimensional. It must read as springy moss with separate visible clusters:
never fabric, felt, foam, rope or braid. Four colours are worked through the ring
in irregular patches with no repeating pattern: NATURAL PALE undyed cream
dominant, with ICE BLUE, GREY, and a scatter of SPRING GREEN.
```

### 15. Lichen Wreath — `lichenWreath.jpg`

```text
Subject: A LOOSE TEXTURED WREATH, about 45cm across, hung flat on the wall and
photographed square on, with nothing underneath it — no pot, no stand, no shelf,
no table, no surface anywhere in the frame. Its outline is deliberately uneven so
it reads as gathered rather than machined. It is made of AUBERGINE reindeer moss,
a deep dusky purple — this wreath is purple, not green — in soft fluffy branching
clusters like small coral heads, with clusters of ICE BLUE moss and pale grey
lichen scattered through it and a few small dried seed heads. The aubergine
purple dominates and covers most of the ring.
```

## Letters and Signs

Text is the weakest thing an image model does. Expect more rejects here than
anywhere else in the pack, and check the letterforms carefully before accepting a
shot — a subtly malformed letter is worse than an obviously broken one, because
it survives a glance and fails on the product page.

### 16. Moss Letter M — `mossLetterM.jpg`

```text
Subject: A FREESTANDING CAPITAL LETTER M, about 25cm tall and 6cm deep, cut from
plywood and standing upright on the oak surface. The letter M is the object: two
upright strokes joined by a V in the middle, its shape clearly readable as the
letter M against the background. Its narrow sides are bare pale plywood so the
construction reads, and its entire front face is packed flush with pillow moss —
many small velvety rounded cushions of different sizes packed side by side —
covering every part of the face with no bare wood showing on the front. The
cushions are Medium Green with four or five Dark Green ones worked in at random.
Exactly one letter, the letter M, and no other characters anywhere in the frame.
```

### 17. Moss Ampersand — `mossAmpersand.jpg`

```text
Subject: A FREESTANDING AMPERSAND SYMBOL, the "&" character, about 25cm tall and
6cm deep, cut from plywood and standing upright on the oak surface. The ampersand
is the object: a single looping stroke that crosses itself, clearly readable as
an "&" against the background. Its narrow sides are bare pale plywood, and its
entire front face is packed flush with reindeer moss — soft fluffy branching
clusters like small coral heads — covering every part of the curve with no bare
wood showing on the front, standing proud so the surface is soft and irregular
rather than smooth. The clusters are a deliberate mix of four colours in random
clumps across the whole face — Spring Green, Light Green, Medium Green and Dark
Green — with four or five Natural Pale cream clusters scattered among them, so
the face reads as many different colours rather than one. Exactly one ampersand,
and no letters or numbers anywhere in the frame.
```

### 18. Moss Sign — `mossSign.jpg`

```text
Subject: A FLAT WALL SIGN SPELLING THE WORD HOME, about 50cm wide, cut from one
piece of pale plywood as a single connected sign, hung flat against the wall and
photographed square on. It reads as four capital letters in a row: H, then O,
then M, then E. The letters are bold and chunky with thick heavy strokes, all the
same height, evenly spaced, correctly formed and sitting on one level line. The
front face of every letter is packed completely full, edge to edge, with pillow
moss — many small velvety rounded cushions of different sizes packed side by
side, each one smooth like a green pebble — standing proud of the plywood so each
letter has a bumpy three-dimensional surface. It must read as springy moss:
never flat grass, lawn, turf or felt. No bare plywood is visible on the front of
any letter. The cushions mix warm colours in among the greens in random clumps:
Medium Green and Dark Green through most of it, with SIENNA rust orange and LEMON
YELLOW cushions scattered across all four letters. Exactly four letters spelling
HOME, and no other text anywhere in the frame.
```

## The green-only and mixed split

An earlier draft kept thirteen of the eighteen green-only, on the reasoning that
a grid where every item is a different colour reads as a supplier's sample card
rather than a shop. Slav overruled that on 2026-08-17: red, orange and yellow are
part of the material and were nowhere on the grid, which made a range built from
a fifteen-colour palette look like it only had one.

The split now, so a future pass can see the balance rather than guess it:

| Colour | Products carrying it |
| --- | --- |
| Green only | Layered Panel, Concrete Bowl, Concrete Trough, Apothecary Jar, Glass Cloche, Letter M, Ampersand |
| Pale and cream | Glass Sphere, Moss Tiles, Slim Wreath |
| Blue | Ceramic Bowl, Slim Wreath, Lichen Wreath |
| Purple | Lichen Wreath |
| Yellow and rust | Stoneware Cup, Concrete Cylinder, River Stones, Moss Sign, Moss Wreath, Oak Frame |
| Wine red | Oak Frame, Moss Wreath |

Seven pieces stay green so the coloured ones have something to be read against.
That is the part of the original reasoning worth keeping.

## What was learned generating these

- **The house style must not outweigh the subject.** The expensive one, written
  up in full at the top of this file.
- **Do not use `--reference`.** It enforced lighting beautifully and then dragged
  the anchor's *shape* into four subjects — the wreath came out as a ball in a
  pot, the ampersand as bare plywood. The house style block alone gives enough
  consistency without that cost.
- **Naming the colour explicitly works.** "ICE BLUE reindeer moss" landed
  cleanly. Vague terms like "pale silver-green" did not.
- **Negative shape instructions do not work on their own.** `apothecaryJar` was
  told "not a mason or kilner jar, no screw thread" and produced a mason jar
  anyway. Describe the shape wanted first and in detail; list exclusions after.
- **Name the material's texture or the model invents one.** "A tight dome of
  cushion moss" produced two spiky succulents. Pillow moss had to be described as
  many separate velvety cushions before it stopped looking like a cactus — but
  see the first bullet for what happens when that description is put in the wrong
  place.
- **Banning the window mattered.** The first attempt put a window in frame; an
  explicit list of what is not in the background fixed it for all eighteen.
- Budget on 2026-08-17: about 234 neurons per 1400x1400 image on `klein-4b`, so
  a full eighteen-image pass is roughly 4,220 of the free 10,000 per day. Two
  full passes in a day is the practical ceiling — test on two or three shots
  before committing to a third.

## Ideas parked for a later pass

Two forms on the supplier's site are better than anything in this pack and are
worth adding once these eighteen are accepted:

- **A silhouette panel** — a bonsai, an oak with visible roots, or an owl on a
  branch, rendered as a moss shape on a plain white or black framed board. It is
  the most distinctive thing they sell and nothing here resembles it.
- **A frameless round island** — a bare disc of mixed-colour moss, 32cm to 52cm
  across, hung with no frame and no backing visible at all.

Both are held back deliberately. They take the catalogue from eighteen to twenty,
which cascades into `products.js`, the image barrel and four test files, and that
is a separate job from getting the photography right.

## Naming

Product names describe what is in the frame, in plain English. An earlier draft
used invented Finnish names — Kivi, Sammal, Routa, Koti — which meant nothing to
anyone reading the shop and forced a lookup every time a file needed matching to
a product. The sign in product 18 spelled KOTI for the same reason and now spells
HOME.

Four files carried names from that draft and were renamed on 2026-08-17:
`paleBowl` to `ceramicBowl`, `fernFrame` to `oakFrame` (there is no fern in it
and never was), `mossLetter` to `mossLetterM`, and `mossWord` to `mossSign`. The
image barrel, `data/products.js` and eight test files were updated in the same
pass, and the six existing products lost their Finnish names at the same time.

## What this replaces

Four of the original eight products were illustrated with landscape photography —
creek water over rocks, hillside texture, forest floor. Scenery, not something a
customer can buy. The catalogue was cut to six on 2026-08-16 so that every card
shows a finished piece.

Generating the full eighteen restores two dropped products, brings back the
`wreaths` category, and adds `letters-signs`. It also takes every category to
three products, so no filter chip ever returns a single item — which is the
failure that got `wreaths` deleted in the first place.

## When the business is real

Replace all of it with photographs of actual pieces. Generated imagery is fine
for a portfolio build where nothing is for sale; it is not fine on a shop that
takes money, because the customer receives the thing in the photograph.
