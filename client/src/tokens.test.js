import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// This suite guards the palette itself rather than any component. Contrast is a
// property of the token values, so asserting it here catches a regression at
// the point it is introduced instead of in whichever component notices first.

// Relative to the client root, which is where Vitest runs. import.meta.url is
// not a file URL under Vite's transform, and process is not in scope for the
// browser-targeted ESLint config, so a plain relative path is the way in.
const css = readFileSync('src/index.css', 'utf-8');

// Pull the custom properties out of a given selector block.
const tokensIn = (selector) => {
    const block = css.slice(css.indexOf(selector));
    const body = block.slice(block.indexOf('{') + 1, block.indexOf('}'));
    return Object.fromEntries(
        [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]])
    );
};

const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Accepts a hex string or an [r, g, b] triple, so a colour that only exists as
// a mix can be measured next to one written literally in the stylesheet.
const luminance = (colour) => {
    const [r, g, b] = typeof colour === 'string' ? hexToRgb(colour) : colour;
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
};

// --control is a color-mix rather than a literal, so this suite has to do the
// mixing itself to measure it. oklab, not sRGB — that is what the stylesheet
// asks for, and the two disagree enough to matter. The implementation was
// verified against Chrome's own resolution of the same declaration when the
// token was introduced; under the Nordic palette it resolves to #27333c in dark
// and #c7d3d7 in light.
const srgbToLinear = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);

const linearToSrgb = (c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
};

const toOklab = (hex) => {
    const [R, G, B] = hexToRgb(hex).map(srgbToLinear);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return [
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ];
};

const fromOklab = ([L, A, B]) => {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
    return [
        linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
    ];
};

const mixOklab = (base, target, ratio) => {
    const [a, b] = [toOklab(base), toOklab(target)];
    return fromOklab(a.map((value, i) => value * (1 - ratio) + b[i] * ratio));
};

// Read the declaration rather than restating it, so changing which tokens are
// mixed or by how much is caught here instead of shipping.
const CONTROL = css.match(
    /--control:\s*color-mix\(in oklab,\s*var\(--([\w-]+)\),\s*var\(--([\w-]+)\)\s*([\d.]+)%\)/
);

const themes = { dark: tokensIn(':root'), light: tokensIn('[data-theme="light"]') };

const controlFill = (theme) => {
    const [, base, target, percent] = CONTROL;
    return mixOklab(themes[theme][base], themes[theme][target], Number(percent) / 100);
};

describe('palette contrast', () => {
    it.each(['dark', 'light'])('reads the %s palette from index.css', (name) => {
        expect(themes[name].bg).toMatch(/^#[0-9a-f]{6}$/i);
    });

    // WCAG 2.1 SC 1.4.11: boundaries that identify a control need 3:1. The
    // outline Button, filter chips, sort select, quantity stepper and footer
    // socials are all identified by nothing but their border.
    describe.each(['dark', 'light'])('%s theme', (name) => {
        const t = () => themes[name];

        it.each(['bg', 'surface', 'raised'])(
            'interactive borders clear 3:1 against --%s',
            (surface) => {
                expect(contrast(t()['border-interactive'], t()[surface])).toBeGreaterThanOrEqual(3);
            }
        );

        // --accent-strong, because that is what the outline Button, filter
        // chips, sort select, back-to-top and footer socials hover their border
        // to since the accent tokens were split on 2026-08-17.
        it('hover borders are at least as strong as the resting state', () => {
            expect(contrast(t()['accent-strong'], t().surface))
                .toBeGreaterThanOrEqual(contrast(t()['border-interactive'], t().surface));
        });

        it.each(['bg', 'surface'])('body text clears 4.5:1 against --%s', (surface) => {
            expect(contrast(t().text, t()[surface])).toBeGreaterThanOrEqual(4.5);
        });

        it.each(['bg', 'surface'])('muted text clears 4.5:1 against --%s', (surface) => {
            expect(contrast(t()['text-muted'], t()[surface])).toBeGreaterThanOrEqual(4.5);
        });

        it('button labels clear 4.5:1 against the accent fill', () => {
            expect(contrast(t()['on-accent'], t().accent)).toBeGreaterThanOrEqual(4.5);
        });

        // Both clearing 3:1 individually says nothing about whether the swap
        // between them is visible. Before the accent tokens were split, the
        // light chips moved by 1.01:1 — a hover you could not see at all. The
        // fix is rarely more contrast: it is more chroma, because a near-neutral
        // resting border hovering to a saturated one reads as a change of
        // colour, which the eye catches far more readily than brightness.
        it('hovers to a border you can actually see', () => {
            const rest = contrast(t()['border-interactive'], t().bg);
            const hover = contrast(t()['accent-strong'], t().bg);
            expect(hover / rest).toBeGreaterThanOrEqual(1.5);
        });

        // --accent is rendered as text on hover in the footer, cart, contact
        // page and product cards, so it is held to the text threshold rather
        // than the 3:1 that would be enough for a border or an icon. This is
        // the ceiling on how light it can be made.
        it('stays legible where it is used as text', () => {
            expect(contrast(t().accent, t().bg)).toBeGreaterThanOrEqual(4.5);
        });

        // Not a WCAG rule — a design one, and the whole point of having an
        // accent. The previous light accent sat 1.92:1 from body text, so
        // prices and italics read as body copy rather than as an accent.
        it('is distinguishable from body text', () => {
            expect(contrast(t().accent, t().text)).toBeGreaterThanOrEqual(2.1);
        });

        // --control is the resting fill of a control sitting on a card. It is
        // deliberately NOT held to 3:1 against the card: the --accent ring is
        // what identifies the button, and forcing the fill to carry that job as
        // well leaves no legal colour in dark theme at all — the band that
        // clears 3:1 on the card and 4.5:1 under the label is empty.
        describe('the resting control fill', () => {
            it('keeps its label legible', () => {
                expect(contrast(t().text, controlFill(name))).toBeGreaterThanOrEqual(4.5);
            });

            it('is ringed by something that clears 3:1 against the card', () => {
                expect(contrast(t().accent, t().surface)).toBeGreaterThanOrEqual(3);
            });

            // The bug this token exists to fix: the Add button's hover moved the
            // background by 1.13:1 in dark and 1.04:1 in light, which is no
            // visible change. Anything under 3:1 here is that bug returning.
            it('is visibly different from the state it hovers into', () => {
                expect(contrast(controlFill(name), t().accent)).toBeGreaterThanOrEqual(3);
            });
        });
    });
});
