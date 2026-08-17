// Every photograph the storefront renders, and nothing else. Anything exported
// here is emitted into the production bundle whether a component uses it or
// not, which is how 61 MB of unused camera-original JPEGs ended up shipping
// once already.
//
// Names describe what is in the frame rather than where it happened to be used
// first. The folder was moss1…moss11 plus product1…product4 until 2026-08-16,
// which meant nobody could tell a hillside from a jar without opening it, and
// `mossHero` was not the hero. Thirty unused files went at the same time —
// every .webp sibling (vite-imagetools makes its own now), the landscape shots
// that were standing in as product photography, and two photographs of real
// people that had no business in a public repository.
//
// Each import goes through vite-imagetools (wired in vite.config.js), which
// resizes and re-encodes the master at build time and returns
// `{ src, srcset, w, h }`. Render them through <Photo>, which requires a `sizes`
// telling the browser how wide the image will actually be drawn — without it
// the browser assumes 100vw and downloads the largest file every time.
//
// Widths are chosen per use, not per photo:
//   240   cart thumbnails (64–96 CSS px at 2x)
//   480   product cards on a phone
//   960   product cards on a desktop grid (400 CSS px at 2x)
//   1400  the product-detail gallery (722 CSS px at 2x)
//   1920+ full-bleed backdrops and the hero stage
//
// The query has to be written out on every line: Vite resolves import
// specifiers statically, so a shared constant would never be read.

// --- The hero's two shots -------------------------------------------------

// Wide on the creek. 1600 is the top rung rather than the master's full 2000,
// because the hand-cut plate this replaced was 1600 too and a 2000px encode
// measured 439 kB against its 318 kB. A desktop hero should not get heavier in
// a change made to lighten it.
import creek from './creek.jpg?w=768;1280;1600&as=img';

// The droplet macro the push-in arrives at. A 3:2 crop cut by hand from
// dropletMaster.jpg on 2026-08-16; the crop box was never written down, so this
// .webp is the only thing that reproduces the framing and it is treated as the
// source. dropletMaster.jpg stays in the folder unimported so the crop can be
// made again.
//
// quality 85 rather than the site-wide 78: encoding from a .webp makes every
// variant a second lossy pass, where every other photograph gets one from its
// master. It is also the shot where the detail is the point.
import dropletPlate from './dropletPlate.webp?w=768;1080;1440;2160&quality=85&as=img';

// --- Full-bleed section backdrops -----------------------------------------

import hillside from './hillside.jpg?w=640;1280;1920&as=img';

// Log, dried craspedia, layered moss. Only the wide ladder now: it stopped
// doubling as the Layered Panel product shot on 2026-08-17, once a real
// photograph of a mounted panel existed, and is only the full-bleed backdrop
// behind "Our process".
import logArrangement from './logArrangement.jpg?w=640;1280;1920&as=img';

// --- Product photography ---------------------------------------------------
//
// Filenames describe what is in the frame, and the product names in
// data/products.js match them. Four were renamed on 2026-08-17 — paleBowl to
// ceramicBowl, fernFrame to oakFrame, mossLetter to mossLetterM, mossWord to
// mossSign — because the old names described either the wrong thing (there is
// no fern in oakFrame, and never was) or nothing in particular.

// Grouped by the category each one sells under, in the same order as
// data/products.js, so a missing photograph is visible as a gap rather than
// having to be diffed across two files.

// Moss Pots
import glassSphere from './glassSphere.jpg?w=240;480;960;1400&as=img';
import ceramicBowl from './ceramicBowl.jpg?w=240;480;960;1400&as=img';
import stonewareCup from './stonewareCup.jpg?w=240;480;960;1400&as=img';

// Wall Art
import layeredPanel from './layeredPanel.jpg?w=240;480;960;1400&as=img';
import oakFrame from './oakFrame.jpg?w=240;480;960;1400&as=img';
import mossTiles from './mossTiles.jpg?w=240;480;960;1400&as=img';

// Planters
import concreteBowl from './concreteBowl.jpg?w=240;480;960;1400&as=img';
import concreteTrough from './concreteTrough.jpg?w=240;480;960;1400&as=img';
import concreteCylinder from './concreteCylinder.jpg?w=240;480;960;1400&as=img';

// Tabletop
import apothecaryJar from './apothecaryJar.jpg?w=240;480;960;1400&as=img';
import riverStones from './riverStones.jpg?w=240;480;960;1400&as=img';
import glassCloche from './glassCloche.jpg?w=240;480;960;1400&as=img';

// Wreaths
import mossWreath from './mossWreath.jpg?w=240;480;960;1400&as=img';
import slimWreath from './slimWreath.jpg?w=240;480;960;1400&as=img';
import lichenWreath from './lichenWreath.jpg?w=240;480;960;1400&as=img';

// Letters and Signs
import mossLetterM from './mossLetterM.jpg?w=240;480;960;1400&as=img';
import mossAmpersand from './mossAmpersand.jpg?w=240;480;960;1400&as=img';
import mossSign from './mossSign.jpg?w=240;480;960;1400&as=img';

export {
  creek,
  dropletPlate,
  hillside,
  logArrangement,
  glassSphere,
  ceramicBowl,
  stonewareCup,
  layeredPanel,
  oakFrame,
  mossTiles,
  concreteBowl,
  concreteTrough,
  concreteCylinder,
  apothecaryJar,
  riverStones,
  glassCloche,
  mossWreath,
  slimWreath,
  lichenWreath,
  mossLetterM,
  mossAmpersand,
  mossSign,
};
