import { useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LuX, LuTrash2 } from 'react-icons/lu';
import { useCart } from '../hooks/useCart';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { formatPrice } from '../utils/formatPrice';
import Button from './Button';
import Photo from './Photo';
import QuantityStepper from './QuantityStepper';
import Logo from './Logo';

/**
 * Variant B — the basket you can actually use.
 *
 * Variant A's structure is genuinely good and is kept wholesale: the focus
 * trap, the aria-live total, Escape to close, the scroll lock and the overlay
 * are all correct and none of them are touched here.
 *
 * What changed is what the panel lets you do and what it tells you:
 *
 * - QUANTITY. A had Remove and nothing else, so changing "2" to "1" meant
 *   leaving the drawer for /cart. The stepper already exists and is already
 *   tested; it just was not here.
 * - LINE TOTALS. A showed "2 x £85.00" and left the multiplication to the
 *   reader. The quantity is now the control, so the line shows what that line
 *   costs.
 * - A SHIPPING LINE. A showed a subtotal and a button, which reads as the
 *   final number. Saying delivery is calculated later is the difference between
 *   a price and a surprise.
 * - REMOVE became an icon with an accessible name rather than a text button
 *   competing with the product name for the eye at the same size.
 *
 * The empty state is carried over from the fix applied to A on 2026-08-17.
 */
const CartDrawer = () => {
    const { items, total, itemCount, drawerOpen, closeDrawer, removeItem, setQuantity } = useCart();

    // Focus in on open, contained while open, back to the trigger on close.
    const panelRef = useFocusTrap(drawerOpen);

    // Escape closes, and the body must not scroll behind the panel.
    useEffect(() => {
        if (!drawerOpen) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') closeDrawer();
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [drawerOpen, closeDrawer]);

    return (
        <AnimatePresence>
            {drawerOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                        className="fixed inset-0 bg-black/55 z-40"
                    />
                    <motion.aside
                        ref={panelRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Basket"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50
                                   bg-surface border-l border-border flex flex-col outline-none"
                    >
                        <header className="flex items-center justify-between gap-4 border-b border-border p-6">
                            <h2 className="font-display text-xl">
                                Basket <span className="text-sm text-text-muted">({itemCount})</span>
                            </h2>
                            <button
                                type="button"
                                onClick={closeDrawer}
                                aria-label="Close basket"
                                className="size-11 grid place-items-center rounded-full
                                           text-text-muted hover:text-text hover:bg-raised cursor-pointer
                                           transition-colors duration-200"
                            >
                                <LuX size={20} />
                            </button>
                        </header>

                        <div aria-live="polite" className="sr-only">
                            {itemCount} items in basket, total {formatPrice(total)}
                        </div>

                        {items.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
                                {/* The one place on the site the mark is allowed
                                    to perform. An empty basket is a large panel
                                    holding a single line of text, so the brand
                                    fills a space rather than displacing
                                    anything — unlike putting it in a delete
                                    button, where the glyph IS the label. */}
                                <Logo size={64} draw className="text-accent/70" />
                                <p className="text-text-muted">Your basket is empty.</p>
                                <Button as={Link} to="/products" onClick={closeDrawer} variant="outline">
                                    Browse the collection
                                </Button>
                            </div>
                        ) : (
                            <ul className="flex-1 divide-y divide-border overflow-y-auto">
                                {items.map((item) => (
                                    <li key={item.id} className="flex gap-4 p-6">
                                        <Photo
                                            photo={item.images[0]}
                                            // Fixed 80px box at every breakpoint,
                                            // so the 240px variant still covers it
                                            // to 3x.
                                            sizes="80px"
                                            alt={item.name}
                                            className="size-20 shrink-0 rounded-lg object-cover"
                                        />

                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{item.name}</p>
                                                    <p className="mt-0.5 text-xs text-text-muted">
                                                        {formatPrice(item.price)} each
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    aria-label={`Remove ${item.name}`}
                                                    // A bin, not a cross. The X
                                                    // in the header dismisses the
                                                    // panel; the same glyph on a
                                                    // row said "close this line",
                                                    // which is not what it does.
                                                    className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center
                                                               rounded-full text-text-muted hover:bg-raised
                                                               hover:text-text cursor-pointer
                                                               transition-colors duration-200"
                                                >
                                                    <LuTrash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <QuantityStepper
                                                    value={item.quantity}
                                                    onChange={(next) => setQuantity(item.id, next)}
                                                />
                                                <span className="text-sm font-medium tabular-nums">
                                                    {formatPrice(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {items.length > 0 && (
                            <footer className="border-t border-border p-6">
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Subtotal</span>
                                    <span className="font-display text-lg text-accent tabular-nums">
                                        {formatPrice(total)}
                                    </span>
                                </div>
                                <p className="mt-1 mb-5 text-xs text-text-muted">
                                    Delivery calculated at checkout.
                                </p>
                                <Button as={Link} to="/cart" onClick={closeDrawer} fullWidth>
                                    View basket
                                </Button>
                            </footer>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
