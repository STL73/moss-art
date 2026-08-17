import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useReducedMotion } from '../hooks/useReducedMotion';

// React Router does not scroll on navigation. Without this, a /#about link
// clicked from another route changes the URL and leaves you at the top of the
// page, and every route change inherits the previous page's scroll position.
const ScrollToHash = () => {
    const { pathname, hash } = useLocation();
    const reduced = useReducedMotion();

    useEffect(() => {
        // Arriving at a new page is a jump, not a journey — animating it means
        // watching the old page scroll past on the way out.
        if (!hash) {
            window.scrollTo({ top: 0, behavior: 'instant' });
            return;
        }

        // Moving to a section of the page you are already on is a journey, so
        // it animates unless the user has asked for less motion.
        document.getElementById(hash.slice(1))?.scrollIntoView({
            behavior: reduced ? 'instant' : 'smooth',
        });
    }, [pathname, hash, reduced]);

    return null;
};

export default ScrollToHash;
