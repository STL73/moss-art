// Mirrors the server's Product schema so lib/api.js can swap to real fetch
// calls without any component changing. Prices are integers in pence.
// slug and species do not yet exist server-side — see the spec's backend
// dependencies section.
//
// Eighteen products across six categories as of 2026-08-17, up from six across
// four. The catalogue was cut to six on 2026-08-16 because half the products
// were illustrated with landscape photography — creek water, hillside texture,
// forest floor — which is scenery, not something a customer can buy. Every
// product below now has a photograph of a finished piece, generated from
// outputs/product-image-prompts_2026-08-16_v1.md.
//
// Three products per category, deliberately. A filter chip that returns a
// single item looks broken, and that is the failure that got the wreaths
// category deleted the first time round. api.test.js enforces the weaker
// version of this — no category may be empty — and will fail the build if a
// product is removed without its category being reconsidered.
//
// Product names describe what is in the photograph, in plain English, and match
// the image filename. They were invented Finnish words until 2026-08-17 — Kivi,
// Metsä, Rauha, Lampi, Aurora, Talvi — which meant nothing to a shopper and
// forced a lookup every time a file had to be matched to a product. The real
// business has not named anything yet, so inventing a language for it was a
// decision nobody had asked for.
//
// Species are the real Latin names for the three trade types: Cladonia
// stellaris and Cladonia rangiferina are reindeer moss, Leucobryum glaucum and
// Grimmia pulvinata are the cushion or pillow mosses, Hypnum cupressiforme is
// the flat carpet moss. They match the moss actually in each photograph.
//
// Every product carries one image. The gallery hides its thumbnail strip below
// two, so a single honest photograph looks deliberate where a repeated one
// would look like a mistake.
import {
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
} from '../assets/images';

export const categories = [
    { slug: 'all', name: 'All' },
    { slug: 'moss-pots', name: 'Moss Pots' },
    { slug: 'wall-art', name: 'Wall Art' },
    { slug: 'planters', name: 'Planters' },
    { slug: 'tabletop', name: 'Tabletop' },
    { slug: 'wreaths', name: 'Wreaths' },
    { slug: 'letters-signs', name: 'Letters & Signs' },
];

export const products = [
    // --- Moss Pots ---------------------------------------------------------
    {
        id: '1', slug: 'glass-sphere', name: 'Glass Sphere', species: 'Cladonia stellaris',
        description: 'Reindeer moss in a hand-blown glass sphere, cut open at an angle so the texture catches the light. Cream, spring green and light green packed together.',
        price: 8500, images: [glassSphere], category: 'moss-pots', stock: 6, isAvailable: true,
    },
    {
        id: '2', slug: 'ceramic-bowl', name: 'Ceramic Bowl', species: 'Cladonia rangiferina',
        description: 'Ice-blue reindeer moss in a shallow ceramic bowl, glazed in a matte bone white. The palest thing we make.',
        price: 5500, images: [ceramicBowl], category: 'moss-pots', stock: 4, isAvailable: true,
    },
    {
        id: '3', slug: 'stoneware-cup', name: 'Stoneware Cup', species: 'Leucobryum glaucum',
        description: 'Cushion moss mounded above the rim of a small footed cup, glazed a speckled grey-blue that breaks to bare clay. Two yellow cushions and one rust sit near the front.',
        price: 3800, images: [stonewareCup], category: 'moss-pots', stock: 9, isAvailable: true,
    },

    // --- Wall Art ----------------------------------------------------------
    {
        id: '4', slug: 'layered-panel', name: 'Layered Panel', species: 'Leucobryum glaucum',
        description: 'Cushion moss standing proud of a flat moss ground, layered for depth on reclaimed birch. Four greens in irregular drifts, sixty centimetres across.',
        price: 24000, images: [layeredPanel], category: 'wall-art', stock: 2, isAvailable: true,
    },
    {
        id: '5', slug: 'oak-frame', name: 'Oak Frame', species: 'Cladonia stellaris',
        description: 'Reindeer moss in burgundy, rust and yellow, filling a slim oak frame corner to corner. Reads almost as a painting from across a room.',
        price: 11000, images: [oakFrame], category: 'wall-art', stock: 3, isAvailable: true,
    },
    {
        id: '6', slug: 'moss-tiles', name: 'Moss Tiles', species: 'Cladonia stellaris',
        description: 'Four square tiles on a shared birch board, each one a single colour — acid green, cream, medium green, deep emerald. A tonal ladder you can read from across the hall.',
        price: 14500, images: [mossTiles], category: 'wall-art', stock: 4, isAvailable: true,
    },

    // --- Planters ----------------------------------------------------------
    {
        id: '7', slug: 'concrete-bowl', name: 'Concrete Bowl', species: 'Leucobryum glaucum',
        description: 'Cushion moss set in a hand-poured concrete bowl. Weighty, quiet, and entirely maintenance-free.',
        price: 4500, images: [concreteBowl], category: 'planters', stock: 11, isAvailable: true,
    },
    {
        id: '8', slug: 'concrete-trough', name: 'Concrete Trough', species: 'Leucobryum glaucum',
        description: 'A long board-formed trough packed level with cushion moss in three bands, forest green through to light, with two slate uprights set off-centre.',
        price: 7500, images: [concreteTrough], category: 'planters', stock: 5, isAvailable: true,
    },
    {
        id: '9', slug: 'concrete-cylinder', name: 'Concrete Cylinder', species: 'Cladonia stellaris',
        description: 'A tall unpolished concrete column with rust and lemon reindeer moss filling the open top. The only piece we make that is taller than it is wide.',
        price: 6800, images: [concreteCylinder], category: 'planters', stock: 7, isAvailable: true,
    },

    // --- Tabletop ----------------------------------------------------------
    {
        id: '10', slug: 'apothecary-jar', name: 'Apothecary Jar', species: 'Grimmia pulvinata',
        description: 'Preserved cushion moss in a wide apothecary jar, finished with river stones and a single piece of driftwood.',
        price: 6000, images: [apothecaryJar], category: 'tabletop', stock: 8, isAvailable: true,
    },
    {
        id: '11', slug: 'river-stones', name: 'River Stones', species: 'Leucobryum glaucum',
        description: 'Cushions and smooth grey stones alternating along a thin slate base, the colour running from green to rust across its length.',
        price: 7200, images: [riverStones], category: 'tabletop', stock: 6, isAvailable: true,
    },
    {
        id: '12', slug: 'glass-cloche', name: 'Glass Cloche', species: 'Hypnum cupressiforme',
        description: 'A flat carpet of moss under a thin glass cloche, with three cushions resting on it. Low, still, and lit from one side.',
        price: 6500, images: [glassCloche], category: 'tabletop', stock: 5, isAvailable: true,
    },

    // --- Wreaths -----------------------------------------------------------
    {
        id: '13', slug: 'moss-wreath', name: 'Moss Wreath', species: 'Cladonia stellaris',
        description: 'A willow ring packed with reindeer moss in six colours — three greens with rust, lemon and wine red worked through. Forty centimetres across.',
        price: 9500, images: [mossWreath], category: 'wreaths', stock: 4, isAvailable: true,
    },
    {
        id: '14', slug: 'slim-wreath', name: 'Slim Wreath', species: 'Cladonia stellaris',
        description: 'A narrow ring no more than five centimetres deep, in cream with pale blue and grey. Leaves a large clean circle of wall showing through.',
        price: 7000, images: [slimWreath], category: 'wreaths', stock: 6, isAvailable: true,
    },
    {
        id: '15', slug: 'lichen-wreath', name: 'Lichen Wreath', species: 'Cladonia rangiferina',
        description: 'Deep aubergine reindeer moss with pale lichen and dried seed heads scattered through it, the outline left deliberately uneven. The loudest piece we make.',
        price: 12000, images: [lichenWreath], category: 'wreaths', stock: 3, isAvailable: true,
    },

    // --- Letters and Signs -------------------------------------------------
    {
        id: '16', slug: 'moss-letter-m', name: 'Moss Letter M', species: 'Leucobryum glaucum',
        description: 'A freestanding plywood M, its face packed with cushion moss and its sides left bare so the construction shows. Twenty-five centimetres tall.',
        price: 4200, images: [mossLetterM], category: 'letters-signs', stock: 12, isAvailable: true,
    },
    {
        id: '17', slug: 'moss-ampersand', name: 'Moss Ampersand', species: 'Cladonia stellaris',
        description: 'The same build as the letters but faced in reindeer moss, mixing four greens with scattered cream. Softer and more irregular up close.',
        price: 4600, images: [mossAmpersand], category: 'letters-signs', stock: 8, isAvailable: true,
    },
    {
        id: '18', slug: 'moss-sign', name: 'Moss Sign', species: 'Leucobryum glaucum',
        description: 'HOME cut from one piece of plywood and packed with cushion moss, rust and lemon scattered among the greens. Fifty centimetres wide.',
        price: 8800, images: [mossSign], category: 'letters-signs', stock: 5, isAvailable: true,
    },
];
