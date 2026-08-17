import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// jsdom runs no animations, so the only thing worth asserting is the props
// handed to Motion. Standing the motion elements up as plain SVG elements lets
// the initial and animate targets be read back directly.
const captured = [];

vi.mock('motion/react', () => {
    const record = (tag) => ({ children, initial, animate, transition, ...rest }) => {
        captured.push({ tag, initial, animate, transition });
        return <g data-tag={tag} {...rest}>{children}</g>;
    };

    return {
        motion: { circle: record('circle'), g: record('g'), line: record('line') },
    };
});

import SunMoon from './SunMoon';

const first = (tag) => captured.find((c) => c.tag === tag);
const all = (tag) => captured.filter((c) => c.tag === tag);

describe('SunMoon', () => {
    afterEach(() => {
        cleanup();
        captured.length = 0;
    });

    // The regression this file exists for. initial={false} renders an element
    // at its animate target and skips the mount animation, which for a looping
    // animation means it never starts at all. On a cold load, whichever icon
    // was active sat frozen at its last keyframe until the theme was toggled —
    // reported as "the moon doesn't move", but the sun was equally stuck when
    // the page loaded in light theme.
    describe('the idle animation starts on mount, not on the first theme change', () => {
        it('never renders an animated element with initial={false}', () => {
            render(<><SunMoon shape="moon" active /><SunMoon shape="sun" active /></>);

            captured.forEach(({ tag, initial }) => {
                expect(initial, `${tag} must name its first keyframe`).not.toBe(false);
            });
        });

        it("starts the moon's shadow at the beginning of its sweep", () => {
            render(<SunMoon shape="moon" active />);

            const shadow = first('circle');
            // Whatever the sweep animates through, the element has to start on
            // the first value of it or the loop begins mid-pass.
            expect(shadow.initial.cx).toBe(shadow.animate.cx[0]);
        });

        it('starts each sun ray on the first value of its own sequence', () => {
            render(<SunMoon shape="sun" active />);

            const rays = all('line');
            expect(rays).toHaveLength(8);

            rays.forEach((ray, index) => {
                expect(ray.initial.pathLength, `ray ${index}`).toBe(ray.animate.pathLength[0]);
            });
        });
    });

    // The dimmed icon is a control waiting to be pressed. Animating it would
    // make it compete with the state it is offering to change.
    describe('the inactive icon', () => {
        it('parks the moon shadow rather than sweeping it', () => {
            render(<SunMoon shape="moon" />);

            const shadow = first('circle');
            expect(Array.isArray(shadow.animate.cx)).toBe(false);
            expect(shadow.initial.cx).toBe(shadow.animate.cx);
        });

        it('leaves the sun rays at full length', () => {
            render(<SunMoon shape="sun" />);

            all('line').forEach((ray) => {
                expect(ray.initial.pathLength).toBe(1);
                expect(ray.animate.pathLength).toBe(1);
            });
        });
    });
});
