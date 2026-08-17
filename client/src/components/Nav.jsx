import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LuMenu, LuX, LuShoppingBasket } from 'react-icons/lu';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useCart } from '../hooks/useCart';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { navLinks } from '../constants';

// A droplet marking the current page, lifted from the logo's own droplet rather
// than being the whole mark.
//
// Slav asked whether the logo itself could sit on the active link. It should
// not: the mark is already in this same bar, 200px to the left beside the
// wordmark, so a second copy makes the same symbol appear twice in one
// component — and a logo says "this is us", not "you are here". One element of
// it, at 6px, is brand-derived without competing with the brand.
const Nav = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const linksRef = useRef(null);
    const [droplet, setDroplet] = useState(null);
    const { pathname, hash } = useLocation();

    // Measured and moved, rather than handed to Motion's layoutId.
    //
    // layoutId was the first attempt and it jumped: sometimes travelling
    // cleanly, sometimes appearing to come from a third place entirely. The
    // header carries backdrop-blur-md, and a filter creates a containing block
    // for absolutely positioned descendants — so Motion's layout projection,
    // which measures against the viewport, computed a delta against the wrong
    // origin. Measuring the offsets directly sidesteps the projection entirely,
    // and is what the filter tabs already do for the same reason.
    useLayoutEffect(() => {
        const list = linksRef.current;
        if (!list) return undefined;

        const measure = () => {
            const label = list.querySelector('[data-active="true"]');
            // No droplet on routes that are not in the nav — /cart and a product
            // page are reachable without any of these three being current, and a
            // dot parked under the last one visited would be a lie.
            if (!label) {
                setDroplet(null);
                return;
            }
            setDroplet({ left: label.offsetLeft + label.offsetWidth / 2 - 3 });
        };

        measure();
        // Not in jsdom, and only a refinement in any case — the measurement
        // above has already run, and this exists to catch the row rewrapping
        // without the window resizing.
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => observer.disconnect();
        // hash as well as pathname: About is /#about, so moving to it from the
        // home page changes nothing else the effect would notice.
    }, [pathname, hash]);
    const { itemCount, openDrawer } = useCart();

    // The panel claims aria-modal, so focus has to actually behave modally.
    const menuRef = useFocusTrap(menuOpen);

    // Escape closes the menu, and the body must not scroll behind it.
    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    return (
        <>
        <header className="padding-x py-6 w-full sticky top-0 z-30 bg-bg/85 backdrop-blur-md border-b border-border">
            <nav className="max-container flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2.5 text-accent">
                    <Logo size={34} />
                    <span className="font-display text-xl font-medium text-text">MossArt</span>
                </Link>

                <ul ref={linksRef} className="relative flex-1 flex justify-center items-center gap-12 max-lg:hidden">
                    {droplet && (
                        <motion.span
                            aria-hidden="true"
                            className="absolute -bottom-2 size-1.5 rounded-full bg-accent"
                            initial={false}
                            animate={{ left: droplet.left, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                    )}
                    {navLinks.map((item) => (
                        <li key={item.label}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `text-[0.95rem] transition-colors duration-200 ${
                                        isActive ? 'text-text' : 'text-text-muted hover:text-text'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    // The measured element. NavLink only hands
                                    // isActive to its className and children, so
                                    // the flag has to be written onto something
                                    // the effect below can find.
                                    <span data-active={isActive}>{item.label}</span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={openDrawer}
                        aria-label={`Open basket, ${itemCount} items`}
                        className="size-11 grid place-items-center rounded-full
                                   text-text-muted hover:text-text
                                   transition-colors duration-200 cursor-pointer"
                    >
                        {/* The count is anchored to the icon rather than to the
                            button: the button is now a 44px tap area, and a
                            badge pinned to its corner would float away from the
                            basket it is counting. */}
                        <span className="relative grid place-items-center">
                            <LuShoppingBasket size={19} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full
                                                 bg-accent text-on-accent text-[10px] font-semibold
                                                 grid place-items-center">
                                    {itemCount}
                                </span>
                            )}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                        className="size-11 grid place-items-center rounded-full
                                   text-text-muted hover:text-text
                                   transition-colors duration-200 cursor-pointer lg:hidden"
                    >
                        <LuMenu size={20} />
                    </button>
                </div>
            </nav>
        </header>

        {/* Outside the header on purpose. The header carries backdrop-blur, and
            a backdrop-filter makes an element the containing block for any
            fixed-position descendant — so in here, "fixed top-0 bottom-0"
            resolved against the header's own 86px box instead of the viewport.
            The panel's background became a strip across the top of the screen
            and the links rendered below it with nothing behind them. */}
        <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        />
                        <motion.div
                            ref={menuRef}
                            tabIndex={-1}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Site menu"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm z-50
                                       bg-surface border-l border-border p-6 lg:hidden outline-none"
                        >
                            <button
                                type="button"
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                                className="ml-auto size-11 grid place-items-center
                                           text-text-muted hover:text-text cursor-pointer"
                            >
                                <LuX size={22} />
                            </button>
                            <ul className="mt-8 flex flex-col gap-6">
                                {navLinks.map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            to={item.to}
                                            onClick={() => setMenuOpen(false)}
                                            className="font-display text-2xl text-text"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </>
                )}
        </AnimatePresence>
        </>
    );
};

export default Nav;
