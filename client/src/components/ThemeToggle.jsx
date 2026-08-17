import { motion } from 'motion/react';
import { useTheme } from '../hooks/useTheme';
import SunMoon from './SunMoon';

// 24, not 18: the two controls are 44px wide each now, so their resting places
// have to be far enough apart that their tap areas do not overlap. Centres 48px
// apart leaves a 4px gap between them, so a thumb can only ever hit one.
const SLOT = 24;      // horizontal distance from centre to each resting place
const ARC = 9;        // how far above or below the line each one travels
const TRAVEL = 0.66;  // seconds end to end

const EASE = [0.16, 1, 0.3, 1];

// Three keyframes make the curve: start, apex, finish. The horizontal midpoint
// is the centre of the control, so the apex falls exactly halfway.
const arc = (from, to, lift) => ({ x: [from, 0, to], y: [0, lift, 0] });

// The sun is light and the moon is dark, permanently. Only their positions and
// their emphasis change; the symbols themselves never do.
const OPTIONS = [
    { value: 'light', shape: 'sun' },
    { value: 'dark', shape: 'moon' },
];

/**
 * Two controls, one per theme, arranged as a horizon.
 *
 * The theme in use rests on the left and is lit; the one a press away rests on
 * the right, dimmed. Choosing the other sends them along opposite arcs, the
 * incoming one rising over the top as the outgoing one sets beneath, so they
 * trade places without ever occupying the same point.
 *
 * Pressing the theme already in use does nothing. The active option keeps
 * aria-pressed and stays focusable but carries aria-disabled: a real disabled
 * attribute would remove it from the tab order and stop a keyboard user
 * discovering which theme is on.
 */
const ThemeToggle = () => {
    const { theme, selectTheme } = useTheme();

    const glide = {
        duration: TRAVEL,
        ease: EASE,
        // Eased separately so the rise feels weighted rather than linear
        // against the horizontal travel.
        y: { duration: TRAVEL, ease: 'easeInOut' },
    };

    return (
        <div role="group" aria-label="Theme" className="relative h-11 w-24">
            {OPTIONS.map(({ value, shape }) => {
                const active = theme === value;

                return (
                    <motion.button
                        key={value}
                        type="button"
                        aria-label={`Use ${value} theme`}
                        aria-pressed={active}
                        aria-disabled={active || undefined}
                        onClick={() => selectTheme(value)}
                        initial={false}
                        // Active rests left and travels over the top; available
                        // rests right and passes underneath.
                        animate={arc(
                            active ? SLOT : -SLOT,
                            active ? -SLOT : SLOT,
                            active ? -ARC : ARC
                        )}
                        transition={glide}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                    size-11 grid place-items-center rounded-full
                                    transition-colors duration-200 ${
                            active
                                ? 'text-accent cursor-default'
                                : 'text-text-muted/45 hover:text-text-muted cursor-pointer'
                        }`}
                    >
                        {/* Only the theme in use idles. The other icon is an
                            offer, and an animated offer competes with the state
                            it is offering to change. */}
                        <SunMoon shape={shape} active={active} />
                    </motion.button>
                );
            })}
        </div>
    );
};

export default ThemeToggle;
