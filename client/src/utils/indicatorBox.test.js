import { describe, it, expect } from 'vitest';
import { indicatorBox, resolvedWidth } from './indicatorBox';

// A tab as the DOM reports it. Only the four offset properties matter.
const tab = ({ left, width, top = 0, height = 44 }) => ({
    offsetLeft: left,
    offsetWidth: width,
    offsetTop: top,
    offsetHeight: height,
});

describe('indicatorBox', () => {
    // The whole job: whatever the numbers, the indicator ends up exactly as
    // wide as the tab it is marking.
    it('resolves to the tab width when the row wraps', () => {
        const clientWidth = 1297;
        const box = indicatorBox(tab({ left: 0, width: 49 }), clientWidth);

        expect(resolvedWidth(box, clientWidth)).toBe(49);
    });

    // The regression, with the numbers measured off a folded Z Fold 7 at 360px:
    // the list is 329 wide and scrolls to 683, and the active tab is 49 wide.
    // Measuring `right` against scrollWidth resolved this to -305, which clamps
    // to zero — the tab lost its fill and its label with it.
    it('resolves to the tab width when the row scrolls instead', () => {
        const clientWidth = 329;
        const box = indicatorBox(tab({ left: 16, width: 49 }), clientWidth);

        expect(resolvedWidth(box, clientWidth)).toBe(49);
        expect(resolvedWidth(box, clientWidth)).toBeGreaterThan(0);
    });

    // The same list, scrolled far enough that the active tab sits past the
    // visible right edge. A negative `right` is correct here — it is what puts
    // the indicator in the scrollable content rather than the visible box.
    it('handles a tab beyond the visible edge', () => {
        const clientWidth = 329;
        const box = indicatorBox(tab({ left: 520, width: 84 }), clientWidth);

        expect(box.right).toBeLessThan(0);
        expect(resolvedWidth(box, clientWidth)).toBe(84);
    });

    it('carries the tab vertical box through untouched', () => {
        const box = indicatorBox(tab({ left: 16, width: 49, top: 8, height: 44 }), 329);

        expect(box.top).toBe(8);
        expect(box.height).toBe(44);
    });

    describe('direction of travel', () => {
        it('leads right when there is nothing to compare against', () => {
            expect(indicatorBox(tab({ left: 16, width: 49 }), 329).movingRight).toBe(true);
        });

        it('leads right when the new tab is further along', () => {
            const current = { left: 16 };
            expect(indicatorBox(tab({ left: 120, width: 60 }), 329, current).movingRight).toBe(true);
        });

        it('leads left when the new tab is behind', () => {
            const current = { left: 120 };
            expect(indicatorBox(tab({ left: 16, width: 49 }), 329, current).movingRight).toBe(false);
        });
    });
});
