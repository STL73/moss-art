import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import Photo from './Photo';
import { formatPrice } from '../utils/formatPrice';

// Identical to variant A's, and for the same reason: what the photograph is
// actually drawn at, not what the card is. The photo is now flush to the card
// edges rather than inset by 12px of padding, so the widest case gains those
// 24px back — still inside the 400px rung, so the ladder is unchanged.
const CARD_SIZES = '(min-width: 1440px) 400px, (min-width: 1024px) 28vw, (min-width: 640px) 44vw, calc(100vw - 72px)';

// The hover halo, as a single declaration so the weight can be changed in one
// place while it is being judged. 1px reads as a hairline and disappears against
// a busy photograph; 2px reads as a deliberate edge. The second value is the
// bloom — a negative spread keeps it tight to the card instead of hazing the
// gap between cards in the grid.
const RING = '0 0 0 2px var(--accent), 0 0 22px -2px var(--accent)';

/**
 * Variant B — a gallery wall label.
 *
 * Two things variant A got wrong, and what changed:
 *
 * 1. NO HIERARCHY. Name and price were both 0.95rem font-medium, so the row
 *    read as two equal labels. Here the name is the display serif and the price
 *    is larger again and in --accent, so the eye lands on the price without the
 *    name ceasing to be the thing you read first.
 *
 * 2. THE ADD BUTTON COMPETED WITH THE PRICE. Both sat in the lower block,
 *    similar in size, one of them a pill. They still share a row — Slav asked
 *    for the action in the bottom-right corner — but the competition is settled
 *    by weight rather than by separation: the price is display serif at
 *    1.15rem, the action is 0.75rem in a quiet outline. One is the headline of
 *    the row and the other is a control, and they no longer look alike.
 *
 * NO STOCK MESSAGING. An earlier draft surfaced the stock count as "Only 2
 * left". Removed 2026-08-17: nothing is held in stock, every piece is made
 * after it is ordered, so scarcity would have been a lie told by the interface.
 * The `stock` field stays in the data because the server schema has it; it just
 * does not mean what a shop usually means by it.
 *
 * The photograph is flush to the card edges here rather than inset. A 12px
 * frame around a photograph on a card that is itself on a page reads as three
 * nested boxes; letting the image be the top of the card leaves one.
 */
const ProductCard = ({ product, onAdd }) => {
    const { search } = useLocation();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            // NOT overflow-hidden. It was, and that is why the halo below could
            // not be seen at all: a clip on the card cuts anything drawn outside
            // its box, which is the entire point of a glow. The clip only ever
            // existed to keep the scaling photograph inside the corner radius,
            // and the image wrapper does that for itself.
            className="card-surface group relative flex h-full flex-col"
        >
            {/* The halo. Sits exactly on the card's own edge, invisible at rest
                because it is drawn at zero opacity, and crossfades in on hover
                with a soft bloom outside it.

                It is a real element rather than a hover:shadow on the card
                because only opacity is animated here. Transitioning box-shadow
                itself repaints the card on every frame; transitioning the
                opacity of a shadow that already exists is compositor work.

                -inset-px so the ring covers the card's 1px border rather than
                sitting inside or outside it, and rounded-[inherit] so it follows
                the card's radius without restating it. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px z-20 rounded-[inherit]
                           opacity-0 transition-opacity duration-300
                           group-hover:opacity-100 group-focus-within:opacity-100
                           motion-reduce:transition-none"
                style={{ boxShadow: RING }}
            />

            {/* The clip that used to be on the card. rounded-t-2xl matches
                card-surface's own radius, so the photograph still meets the
                card's top corners cleanly now that the card no longer clips.
                The scale is on the image and not the card so the card's own
                edges stay put — a card that grows nudges its neighbours in a
                grid, and this one sits in a `layout`-animated list that would
                then re-flow. */}
            <div className="overflow-hidden rounded-t-2xl">
                <Photo
                    photo={product.images[0]}
                    sizes={CARD_SIZES}
                    alt={product.name}
                    loading="lazy"
                    className="w-full aspect-square object-cover
                               transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                               group-hover:scale-[1.04] motion-reduce:transition-none
                               motion-reduce:group-hover:scale-100"
                />
            </div>

            <div className="flex flex-1 flex-col gap-1 px-4 pt-4 pb-5">
                <h3 className="font-display text-[1.05rem] leading-snug">
                    <Link
                        // Carrying the query forward is what lets the product
                        // page send the customer back to the list they were
                        // actually browsing, filters and sort intact.
                        //
                        // Stretched over the whole card, so the card is
                        // clickable without nesting the Add button inside an
                        // anchor — which would be invalid HTML and would break
                        // screen-reader navigation.
                        to={{ pathname: `/products/${product.slug}`, search }}
                        className="after:absolute after:inset-0 after:z-0"
                    >
                        {product.name}
                    </Link>
                </h3>

                <p className="text-xs italic text-text-muted">{product.species}</p>

                {/* mt-auto pins this to the foot whatever the name wraps to, so
                    prices line up across a row of cards with one-line and
                    two-line names. */}
                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <span className="font-display text-[1.15rem] leading-none text-accent">
                        {formatPrice(product.price)}
                    </span>

                    {/* z-10 clears the title's stretched overlay so this is
                        clickable without being nested inside the anchor.

                        Hidden until hover on pointer devices and revealed on
                        focus, so a keyboard user can still reach it and can see
                        where they are. A touch device has no hover to wait for,
                        so the hover:none query keeps it permanently visible
                        rather than leaving a phone with a button it can never
                        summon.

                        Touch also gets the FILLED treatment, not the outline.
                        The outline is a resting state designed to resolve into
                        a fill on hover; on a phone that resolution never comes,
                        so the button sat permanently in a state meant to be
                        temporary and read as unfinished. This ships the hover
                        appearance as the resting one where hover does not
                        exist. No new colours, so the contrast is the figure
                        already measured for the hover state — 5.87:1 in dark
                        and 4.98:1 in light. */}
                    <button
                        type="button"
                        onClick={() => onAdd(product)}
                        aria-label={`Add ${product.name} to basket`}
                        className="relative z-10 -mt-2 -mr-1 inline-flex min-h-11 min-w-32 items-center
                                   justify-center rounded-full border border-accent bg-control
                                   px-5 text-xs font-medium text-text cursor-pointer opacity-0
                                   transition-[opacity,background-color,border-color,color] duration-200
                                   hover:bg-accent hover:text-on-accent
                                   focus-visible:opacity-100 focus-visible:outline-none
                                   focus-visible:ring-2 focus-visible:ring-accent
                                   focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                                   group-hover:opacity-100
                                   [@media(hover:none)]:opacity-100
                                   [@media(hover:none)]:bg-accent
                                   [@media(hover:none)]:text-on-accent
                                   motion-reduce:transition-none"
                    >
                        Add to basket
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
