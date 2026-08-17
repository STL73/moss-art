import { useId } from 'react';
import { motion } from 'motion/react';

// Eight rays at 45 degree steps, drawn from the disc outward.
const RAYS = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    return {
        x1: 12 + Math.cos(angle) * 8,
        y1: 12 + Math.sin(angle) * 8,
        x2: 12 + Math.cos(angle) * 10.5,
        y2: 12 + Math.sin(angle) * 10.5,
    };
});

// Deliberately far slower than anything else on the site. These run for as long
// as the page is open, in the navigation, in peripheral vision. Anything quick
// enough to notice directly would be a permanent distraction sitting next to
// the basket.
//
// 40 seconds is one revolution, but the rays sit at identical 45 degree steps,
// so the figure repeats visually every 5 seconds. What the eye gets is a slow
// shimmer rather than a wheel going round.
const SUN_TURN = { duration: 40, repeat: Infinity, ease: 'linear' };

// The twinkle, over the top of that rotation. Alternate rays run full length
// while their neighbours retract to a quarter — nearly a dot at this stroke
// weight — and then they trade. The star keeps its overall mass and simply
// stops being regular, which is what reads as shining.
//
// A first pass used 0.55 and the two sets were almost indistinguishable: the
// rays are only 2.5 units long, so a 45% difference is barely a pixel on an
// 18px icon. A quarter is the difference you can actually see.
//
// Animated through pathLength rather than by scaling the group. Scaling would
// push the rays away from the disc and open a gap; pathLength retracts each ray
// into its own inner end and leaves both radii where they are.
const SUN_SHINE = { duration: 3.4, repeat: Infinity, ease: 'easeInOut' };
const SHINE_SHORT = 0.25;

/**
 * The moon's shadow, as a single sweep that wraps.
 *
 * Three attempts before this one, worth recording. The first drifted the shadow
 * 1.4 units, which at an 18px render is under a screen pixel and was invisible.
 * The second travelled far enough to see, but ran out to nearly-full and then
 * reversed — and a phase cycle that plays backwards is a bounce, not a cycle.
 * The third orbited the shadow around the disc, which fixed the reversing and
 * introduced a worse problem: an occluder going round in a circle just rotates
 * the crescent, which is the banana-on-a-stick this component's own comments
 * warned against.
 *
 * This is the real thing. The shadow crosses the disc once, in one direction,
 * from well clear on one side to well clear on the other, and then starts again
 * from the beginning. Because both ends of the sweep are far enough out to miss
 * the disc entirely, the icon at the end of a pass and at the start of the next
 * are the same picture — a full disc — so the wrap is invisible and the shadow
 * appears to come back round from the opposite side and keep going.
 *
 * That single pass is the whole run of phases: full, waning gibbous, last
 * quarter, waning crescent, almost nothing, waxing crescent, first quarter,
 * waxing gibbous, full.
 *
 * Two numbers make it work. The shadow is r=10 against the disc's r=9, because
 * a smaller occluder leaves a ring around its edge at the midpoint instead of a
 * crescent. And it rides 2 units low, so at the closest point the top of the
 * disc still escapes it by half a unit — "almost invisible" rather than gone,
 * which keeps the button from looking broken once a cycle.
 */
const MOON_SHADOW = { r: 10, cy: 14 };
const MOON_SWEEP = { duration: 16, repeat: Infinity, ease: 'linear' };

// Clear of the disc at both ends: 9 + 10 is 19, so anything past that overlaps
// nothing and draws a plain full disc.
const MOON_FROM = -7;
const MOON_TO = 31;

/**
 * A sun or a moon, drawn from one disc.
 *
 * These deliberately do not morph into each other. An earlier version animated
 * between the two shapes, which looked good and was wrong: the sun means light
 * and the moon means dark, so a sun that turns into a moon makes the control
 * state a falsehood halfway through. The motion in the toggle is travel only.
 *
 * The crescent is a masked-out circle rather than a second path, so both shapes
 * share one geometry and stay optically consistent.
 *
 * `active` drives an idle animation, and only the icon for the theme in use
 * gets one. The dimmed option is a control waiting to be pressed, and animating
 * it would make it compete with the state it is offering to change. Motion's
 * MotionConfig in RootLayout carries reducedMotion="user", so all of this stops
 * dead for anyone who has asked the OS for less movement.
 */
const SunMoon = ({ shape, size = 18, active = false }) => {
    // Masks are referenced by id, so two of these on one page would collide.
    const maskId = useId();
    const isMoon = shape === 'moon';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >
            {isMoon && (
                <defs>
                    <mask id={maskId}>
                        {/* White keeps, black removes. */}
                        <rect x="0" y="0" width="24" height="24" fill="white" />
                        <motion.circle
                            r={MOON_SHADOW.r}
                            cy={MOON_SHADOW.cy}
                            fill="black"
                            initial={false}
                            animate={active ? { cx: [MOON_FROM, MOON_TO] } : { cx: 18 }}
                            transition={active ? MOON_SWEEP : { duration: 0 }}
                        />
                    </mask>
                </defs>
            )}

            <circle
                cx="12"
                cy="12"
                // The moon has no rays, so its disc carries the whole icon and
                // has to be larger to keep the optical weight even.
                r={isMoon ? 9 : 5}
                fill="currentColor"
                stroke="none"
                mask={isMoon ? `url(#${maskId})` : undefined}
            />

            {!isMoon && (
                <motion.g
                    // transformBox: fill-box makes 50% 50% resolve to the centre
                    // of the rays' own bounding box, which is the centre of the
                    // disc. Without it the origin is the SVG viewport's corner
                    // and the rays orbit off the edge of the icon.
                    style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}
                    initial={false}
                    animate={active ? { rotate: 360 } : { rotate: 0 }}
                    transition={active ? SUN_TURN : { duration: 0 }}
                >
                    {RAYS.map((ray, index) => (
                        <motion.line
                            key={`${ray.x1}-${ray.y1}`}
                            {...ray}
                            initial={false}
                            // Odd and even in opposite phase. Both sequences
                            // start and end on the same value so the loop is
                            // seamless without a reverse.
                            animate={
                                active
                                    ? {
                                        pathLength: index % 2
                                            ? [1, SHINE_SHORT, 1]
                                            : [SHINE_SHORT, 1, SHINE_SHORT],
                                    }
                                    : { pathLength: 1 }
                            }
                            transition={active ? SUN_SHINE : { duration: 0 }}
                        />
                    ))}
                </motion.g>
            )}
        </svg>
    );
};

export default SunMoon;
