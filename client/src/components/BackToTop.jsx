import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LuArrowUp } from 'react-icons/lu';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Far enough down that the button never appears on a page the user can already
// see the end of, so short routes never show it at all.
const THRESHOLD_SCREENS = 1.5;

const BackToTop = () => {
    const [visible, setVisible] = useState(false);
    const reduced = useReducedMotion();

    useEffect(() => {
        const onScroll = () =>
            setVisible(window.scrollY > window.innerHeight * THRESHOLD_SCREENS);

        // Run once so a restored scroll position is accounted for on mount.
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    type="button"
                    aria-label="Back to top"
                    onClick={() => window.scrollTo({
                        top: 0,
                        behavior: reduced ? 'instant' : 'smooth',
                    })}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    // z-20 sits above page content but below the nav (30), the
                    // overlay backdrop (40), the panels (50) and the toast (60).
                    // size-11 is 44px, the minimum comfortable touch target.
                    className="fixed bottom-6 right-6 z-20 size-11 rounded-full grid place-items-center
                               bg-surface border border-border-interactive text-text cursor-pointer
                               hover:border-accent-strong hover:text-accent transition-colors duration-200"
                >
                    <LuArrowUp size={18} />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default BackToTop;
