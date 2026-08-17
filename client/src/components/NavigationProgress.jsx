import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * A hairline across the top of the window while the next route is being fetched.
 *
 * Routes became separate files on 2026-08-16, so a link click now waits on a
 * network request before anything moves. Measured on Slow 4G that is about
 * 600ms — almost all of it latency, since the chunks are only a kilobyte or
 * two. The router deliberately keeps the current page on screen for that whole
 * time, which avoids a blank flash but leaves the click looking ignored. This
 * is the acknowledgement.
 *
 * Three phases, not two. The obvious version — visible while loading, hidden
 * otherwise — makes the bar slide back to the left on arrival, and a progress
 * bar running backwards reads as "cancelled" rather than "done". So arriving
 * gets its own phase: the bar completes to full width, fades, and only then
 * snaps back to zero with the transition off, where nobody can see it.
 */
const RESET_AFTER = 260;

const NavigationProgress = () => {
    const { state } = useNavigation();
    const reduced = useReducedMotion();
    const loading = state !== 'idle';

    // Adjusted during render rather than in an effect. The alternative — an
    // effect that mirrors `state` into a phase — is a cascading render, and
    // React lints against it: the value is derivable, so it gets derived.
    const [wasLoading, setWasLoading] = useState(false);
    const [finishing, setFinishing] = useState(false);

    if (loading !== wasLoading) {
        setWasLoading(loading);
        // Only a navigation that was actually running has something to finish,
        // which is what stops the bar flashing on the first paint of a cold load.
        setFinishing(wasLoading && !loading);
    }

    useEffect(() => {
        if (!finishing) return;
        const timer = setTimeout(() => setFinishing(false), RESET_AFTER);
        return () => clearTimeout(timer);
    }, [finishing]);

    const phase = loading ? 'loading' : finishing ? 'done' : 'idle';

    // The width is not a real measure of progress — nothing reports that — so
    // it eases towards 90% and waits there. Stopping short while still waiting
    // is honest in a way that claiming to have finished would not be.
    const width = { idle: '0%', loading: '90%', done: '100%' }[phase];

    return (
        <div
            // The route change is announced by the page that arrives. A live
            // region here would say the same thing twice, so this is decoration.
            aria-hidden="true"
            className="fixed top-0 left-0 right-0 h-0.5 z-[70] pointer-events-none"
        >
            <div
                className="h-full bg-accent origin-left"
                style={{
                    width,
                    opacity: phase === 'loading' ? 1 : 0,
                    transition: phase === 'idle'
                        // Snapping back to zero must not be animated, or the
                        // retraction is exactly what the phases exist to avoid.
                        ? 'none'
                        : reduced
                            // Reduced motion still gets the acknowledgement,
                            // just without the crawl across the screen.
                            ? 'opacity 120ms linear'
                            : 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms linear',
                }}
            />
        </div>
    );
};

export default NavigationProgress;
