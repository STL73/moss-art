import { motion } from 'motion/react';

// The bowl's rim, as one open arc.
const BOWL = 'M26.2 16.5 A10.2 10.2 0 1 1 16 6.3';

// The moss cushion sitting on the base. Uses the circle's inner radius (9.3 vs
// the outer 10.2) so it meets the stroke exactly at every size.
const MOSS = `M9 18 Q9.9 13.8 11.9 15.9 Q13.2 12 15.2 15 Q16.8 11.4 18.8 14.8
              Q20.6 13 21.9 16.4 Q22.7 15.4 23 18 Q23.9 19.4 24.14 21
              A9.3 9.3 0 0 1 7.86 21 Q8.1 19.4 9 18 Z`;

// Drawn in the order the object would be made: the vessel, then what goes in
// it, then the droplet that lands on top. Roughly 1.2 seconds end to end, which
// is slow enough to read as drawing rather than as a flicker.
const DRAW = {
    bowl: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    moss: { duration: 0.5, delay: 0.45, ease: 'easeOut' },
    drop: { type: 'spring', stiffness: 400, damping: 18, delay: 0.9 },
};

/**
 * Cut glass bowl with a moss cushion on the base and a droplet in the opening.
 * Drawn entirely in currentColor so one component serves both themes.
 *
 * `draw` makes the mark build itself once on mount: the rim strokes on, the
 * moss fades up into it, the droplet drops in. It is off everywhere by default
 * — the mark in the navigation is a logo, not an animation, and redrawing it on
 * every route change would be noise.
 *
 * Where it is used is the point. It fills the empty basket, which is a large
 * panel with one line of text in it and nothing else. That is a place the brand
 * can occupy without taking meaning away from anything, which is the difference
 * between this and swapping the mark into a delete button: an X on a button is
 * not decoration, it is the label, and the moment somebody looks at it is the
 * moment they are deciding whether to press it.
 *
 * MotionConfig in RootLayout carries reducedMotion="user", so the whole build
 * collapses to its finished state for anyone who has asked for less movement.
 */
const Logo = ({ size = 32, className = '', draw = false }) => {
    // pathLength is normalised 0..1 by Motion regardless of the real path
    // length, so the same numbers work at any size.
    const hidden = draw ? { pathLength: 0, opacity: 0 } : false;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            role="img"
            aria-label="MossArt"
            className={className}
        >
            <motion.path
                d={BOWL}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                initial={hidden}
                animate={draw ? { pathLength: 1, opacity: 1 } : undefined}
                transition={DRAW.bowl}
            />
            <motion.path
                d={MOSS}
                fill="currentColor"
                // A filled shape cannot be stroked on, so it rises into place
                // instead. originY 1 pins the bottom edge, so it grows out of
                // the base of the bowl rather than inflating from its middle.
                style={draw ? { originX: 0.5, originY: 1 } : undefined}
                initial={draw ? { opacity: 0, scaleY: 0.4 } : false}
                animate={draw ? { opacity: 1, scaleY: 1 } : undefined}
                transition={DRAW.moss}
            />
            <motion.circle
                cx="21.6"
                cy="9.6"
                r="2"
                fill="currentColor"
                opacity="0.85"
                initial={draw ? { scale: 0, y: -4 } : false}
                animate={draw ? { scale: 1, y: 0 } : undefined}
                transition={DRAW.drop}
                style={draw ? { originX: '21.6px', originY: '9.6px' } : undefined}
            />
        </svg>
    );
};

export default Logo;
