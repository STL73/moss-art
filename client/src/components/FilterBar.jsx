import { useState, useRef, useLayoutEffect } from 'react';
import { indicatorBox } from '../utils/indicatorBox';
import { motion } from 'motion/react';
import { categories } from '../data/products';

// The leading edge: quick and critically damped, so it arrives without
// wobbling. The trailing edge: softer and slower, so it is still catching up
// when the front has landed. The gap between them IS the stretch — there is no
// scale anywhere in this component, the shape changes because its two sides are
// travelling at different speeds.
const LEAD = { type: 'spring', stiffness: 280, damping: 32, mass: 0.8 };
const TRAIL = { type: 'spring', stiffness: 130, damping: 24, mass: 1 };

/**
 * Variant B — browser tabs, with the fill moving like an inchworm.
 *
 * Four attempts to get here, recorded so nobody repeats them. The first only
 * moved A's chips onto their own line, which is a reflow rather than a
 * redesign. The second drew plain text with a hairline rule under the active
 * tab. The third put inset pills back inside each tab, which was not the brief
 * either. The fourth was the right shape — a fill spanning the whole tab with
 * rounded top corners, sitting on the rule, like a browser tab against its
 * toolbar — but it travelled as one rigid box with a squash bolted on, and the
 * squash read as a tic rather than as movement.
 *
 * This is the fifth, and the difference is structural rather than cosmetic.
 *
 * layoutId is gone. It animates one element between two measured positions,
 * which is by definition a rigid translation: the box can only move, never
 * change shape on the way. So the indicator is now a single element outside the
 * tab list, positioned by its LEFT and RIGHT edges independently, and each edge
 * gets its own spring. Going right, the right edge leads and the left edge
 * lags, so the fill stretches out of the old tab, spans the gap, and gathers
 * itself into the new one. Going left, the springs swap. Nothing is scaled, so
 * the rounded corners never distort — a scaleX approach would have turned them
 * into ellipses.
 *
 * On the performance rule this project follows — animate transform and opacity
 * only: this animates left and right, which are layout properties. It is a
 * deliberate exception and a narrow one. The indicator is absolutely
 * positioned, so it has no siblings to push around and its geometry changes
 * cannot reflow anything else on the page. The alternative that stays on the
 * compositor is translate plus scaleX, and scaling a rounded rectangle warps
 * the radius, which is the one thing this shape cannot afford.
 *
 * Kept from A: aria-pressed on every tab, 44px minimum targets, and the native
 * select with its themed options.
 */
const FilterBar = ({ active, onCategoryChange, sort, onSortChange, count }) => {
    const listRef = useRef(null);
    // Direction lives in state beside the geometry rather than in a ref,
    // because it is read during render to pick which edge leads — and reading a
    // ref during render is exactly what React forbids. It is derived where the
    // measurement happens, which is also the only place that knows what the
    // previous position was.
    const [box, setBox] = useState(null);

    const activeName = categories.find((category) => category.slug === active)?.name;
    const isFiltered = active && active !== 'all';

    // useLayoutEffect, not useEffect: measuring after paint would show the
    // indicator at its old size for one frame every time the tabs re-render.
    //
    // A ResizeObserver rather than a resize listener, because the row wraps at
    // the sm breakpoint and rewrapping changes every tab's position without the
    // window ever changing size.
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return undefined;

        const measure = () => {
            const tab = list.querySelector('[data-active="true"]');
            if (!tab) return;
            // clientWidth, not scrollWidth — see utils/indicatorBox.js, which
            // holds the arithmetic and the reason it is measured against the
            // list's padding box. Getting it wrong is invisible on a desktop
            // and collapses the indicator to nothing on a narrow screen.
            setBox((current) => indicatorBox(tab, list.clientWidth, current));
        };

        measure();
        // Not in jsdom, and only a refinement in any case — the measurement
        // above has already run, and this exists to catch the row rewrapping
        // without the window resizing.
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => observer.disconnect();
    }, [active]);

    return (
        <div className="flex flex-col">
            {/* relative, because the indicator is positioned against this box.
                -mx-* with matching px-* lets the row bleed to the screen edges
                when it scrolls, so a tab is never clipped mid-word. The border
                is here rather than on the block below, because the fill has to
                sit ON the rule for the browser-tab shape to read. */}
            <div
                ref={listRef}
                role="group"
                aria-label="Filter by category"
                className="relative -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4
                           [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                           sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            >
                {box && (
                    <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute rounded-t-lg bg-accent"
                        initial={false}
                        animate={{ left: box.left, right: box.right, top: box.top, height: box.height }}
                        transition={{
                            left: box.movingRight ? TRAIL : LEAD,
                            right: box.movingRight ? LEAD : TRAIL,
                            top: LEAD,
                            height: LEAD,
                        }}
                    />
                )}

                {categories.map((category) => {
                    const isActive = category.slug === active;
                    return (
                        <button
                            key={category.slug}
                            type="button"
                            data-active={isActive}
                            aria-pressed={isActive}
                            onClick={() => onCategoryChange(category.slug)}
                            // z-10 keeps every label above the indicator, so the
                            // fill passes behind the words it travels across
                            // rather than blanking them out one by one.
                            className={`relative z-10 shrink-0 min-h-11 rounded-t-lg px-4 text-sm cursor-pointer
                                        transition-colors duration-200
                                        focus-visible:outline-none focus-visible:ring-2
                                        focus-visible:ring-accent focus-visible:ring-offset-2
                                        focus-visible:ring-offset-bg ${
                                isActive ? 'font-medium text-on-accent' : 'text-text-muted hover:text-text'
                            }`}
                        >
                            {category.name}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between gap-6 pt-4">
                {/* aria-live so a screen reader is told the grid changed size.
                    Changing a filter re-renders the list silently otherwise —
                    the tabs announce their own pressed state, but nothing says
                    how many products that left. */}
                <p aria-live="polite" className="text-sm text-text-muted">
                    <span className="text-text">{count}</span>
                    {count === 1 ? ' piece' : ' pieces'}
                    {isFiltered && <> in <span className="text-text">{activeName}</span></>}
                </p>

                <div className="flex items-center gap-3">
                    <label htmlFor="sort" className="text-sm text-text-muted">Sort</label>
                    {/* The popup list is painted by the browser, not by this
                        element, and it takes its colours from the <option>s.
                        With the control set to bg-transparent the options had no
                        background of their own, so Chrome drew a default light
                        list and put the near-white --text on top of it. */}
                    <select
                        id="sort"
                        value={sort}
                        onChange={(event) => onSortChange(event.target.value)}
                        className="select-themed cursor-pointer border-0 bg-transparent
                                   min-h-11 pr-1 text-sm text-text
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-accent focus-visible:ring-offset-2
                                   focus-visible:ring-offset-bg focus-visible:rounded-sm"
                    >
                        <option value="newest">Newest</option>
                        <option value="price-asc">Price: low to high</option>
                        <option value="price-desc">Price: high to low</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
