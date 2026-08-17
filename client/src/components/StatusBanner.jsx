/**
 * A standing notice that the shop is not open for business yet.
 *
 * WHY IT EXISTS. The storefront is live at a public URL for a business that has
 * not started trading. Someone who follows a link finds a catalogue, working
 * prices and a basket, and nothing tells them that none of it can be bought
 * until they reach the checkout button and find it disabled. Saying so once, up
 * front, turns every placeholder on the site from a missing feature into a
 * stated scope decision.
 *
 * WHY IT DOES NOT MOVE. A marquee was considered — it is the obvious home for a
 * band like this — and rejected on two counts. Moving text needs a pause
 * control to satisfy WCAG 2.2.2, since it starts on its own and never ends; and
 * a marquee suits content that is plural and low-stakes, where this is a single
 * sentence whose entire job is to be read once and understood. Motion would
 * make the one line that has to land the hardest one to read.
 *
 * WHY IT IS NOT STICKY. It costs a strip of every screen it stays on. Scrolling
 * away with the page means it is unmissable on arrival and free thereafter, and
 * it needs no dismiss button or the stored state behind one. The header below
 * is the sticky element and takes over the moment this leaves.
 *
 * The drawer carries the same fact again at the point it actually bites — where
 * someone has formed the intention to buy. That is deliberate repetition, not a
 * duplicate: this one is for arriving, that one is for deciding.
 */
const StatusBanner = () => (
    <div className="bg-raised border-b border-border padding-x py-2.5">
        <p className="max-container text-center text-xs leading-relaxed text-text-muted text-balance">
            <strong className="font-medium text-text">MossArt is not trading yet.</strong>{' '}
            You can browse the collection and build a basket, but nothing can be ordered.
        </p>
    </div>
);

export default StatusBanner;
