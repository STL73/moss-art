// Contact sheet builder for the product photography.
//
// Judging eighteen shots one file at a time is how a mismatched set gets
// approved — the whole point of the prompt pack is that the grid reads as one
// catalogue, and that is only visible with every shot side by side at once.
//
// Reads the prompt pack for the product order, names and colours, so the sheet
// can never drift out of step with what was actually generated.
//
// Run: node contact-sheet.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const REPO = 'D:/MY PROJECTS/moss';
const PACK = resolve(REPO, 'docs/product-image-prompts.md');
const IMAGES = resolve(REPO, 'client/src/assets/images');
const OUT = resolve(REPO, 'outputs/catalogue-contact-sheet_2026-08-17_v2.jpg');

const COLUMNS = 6;
const CELL = 360; // Image edge in the sheet. Six across gives a 2160px sheet.
const LABEL = 66; // Caption strip: product name, filename, colours.

// Colours the pack draws from, longest first so "Dark Green" is matched before
// "Green" would be. Used to caption each cell with what the prompt asked for,
// which is what makes a wrong colour obvious rather than merely unfamiliar.
const COLOURS = [
    'Natural Pale', 'Spring Green', 'Light Green', 'Medium Green', 'Dark Green',
    'Forest Green', 'Old Green', 'Ice Blue', 'Lemon Yellow', 'Burgundy',
    'Aubergine', 'Sienna', 'Grey',
];

// Same pattern the generator uses, so both read the pack identically.
const parsePack = (markdown) => {
    const pattern = /### \d+\.\s*(.+?)\s*—\s*`([^`]+)`[^\n]*\n+```text\n([\s\S]*?)```/g;

    return [...markdown.matchAll(pattern)].map(([, name, file, body]) => ({
        name: name.trim(),
        file: file.trim(),
        // Order of first appearance, so the caption reads dominant colour first
        // the same way the prompt does.
        colours: COLOURS
            .map((colour) => ({ colour, at: body.toLowerCase().indexOf(colour.toLowerCase()) }))
            .filter(({ at }) => at !== -1)
            .sort((a, b) => a.at - b.at)
            .map(({ colour }) => colour),
    }));
};

// Escaped for SVG: an ampersand in "Merkki Ampersand" would otherwise break the
// document and sharp would reject the whole overlay.
const escapeXml = (text) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The filename is on the sheet deliberately. Reviewing by product name alone
// means guessing which file to open to regenerate a reject, and the two names
// do not resemble each other — "Lampi Jar" lives in apothecaryJar.jpg.
const caption = ({ name, file, colours }) => {
    // Non-greens are the ones worth spotting at a glance, so they are coloured
    // in the caption and the greens are left grey.
    const accent = colours.some((c) => !c.endsWith('Green') && c !== 'Natural Pale');
    const text = colours.slice(0, 3).join(' · ') || 'no colour named';

    return Buffer.from(`<svg width="${CELL}" height="${LABEL}">
        <rect width="${CELL}" height="${LABEL}" fill="#ffffff"/>
        <text x="10" y="19" font-family="monospace" font-size="14" fill="#111">${escapeXml(name)}</text>
        <text x="10" y="38" font-family="monospace" font-size="13" fill="#2b6cb0">${escapeXml(file)}</text>
        <text x="10" y="57" font-family="monospace" font-size="12" fill="${accent ? '#b0243a' : '#777'}">${escapeXml(text)}</text>
    </svg>`);
};

const main = async () => {
    const subjects = parsePack(await readFile(PACK, 'utf8'));
    const rows = Math.ceil(subjects.length / COLUMNS);

    // Each cell is its image squashed to a square plus the caption strip below.
    const cells = await Promise.all(
        subjects.map(async (subject) => ({
            subject,
            image: await sharp(resolve(IMAGES, subject.file))
                .resize(CELL, CELL, { fit: 'cover' })
                .toBuffer(),
        })),
    );

    const composites = cells.flatMap(({ subject, image }, index) => {
        const left = (index % COLUMNS) * CELL;
        const top = Math.floor(index / COLUMNS) * (CELL + LABEL);

        return [
            { input: image, left, top },
            { input: caption(subject), left, top: top + CELL },
        ];
    });

    const sheet = await sharp({
        create: {
            width: COLUMNS * CELL,
            height: rows * (CELL + LABEL),
            channels: 3,
            background: '#ffffff',
        },
    })
        .composite(composites)
        .jpeg({ quality: 88 })
        .toBuffer();

    await writeFile(OUT, sheet);
    console.log(`wrote ${OUT}  ${(sheet.length / 1024).toFixed(0)} kB  ${subjects.length} products`);
};

await main();
