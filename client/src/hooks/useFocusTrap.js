import { useEffect, useRef } from 'react';

// Anything the browser will hand focus to via Tab. Elements opted out with
// tabindex="-1" are excluded — the panel container itself carries that, so it
// receives focus on open without ever becoming a Tab stop.
const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Keeps keyboard focus inside a panel for as long as it is open.
 *
 * `aria-modal="true"` is a promise to assistive tech, not an enforcement — the
 * browser will still tab straight out into the page behind an overlay. This
 * supplies the three behaviours that make the promise true: focus moves in on
 * open, Tab cycles within, and focus returns to the trigger on close.
 *
 * @param {boolean} active whether the panel is currently open
 * @returns {import('react').RefObject<HTMLElement>} ref to attach to the panel
 */
export const useFocusTrap = (active) => {
    const panelRef = useRef(null);

    useEffect(() => {
        if (!active) return;

        const panel = panelRef.current;
        if (!panel) return;

        // Captured before focus moves, so it still points at the trigger.
        const previouslyFocused = document.activeElement;
        panel.focus();

        const onKeyDown = (event) => {
            if (event.key !== 'Tab') return;

            const focusable = Array.from(panel.querySelectorAll(FOCUSABLE));
            if (focusable.length === 0) {
                // Nothing to tab to; keep focus on the panel rather than
                // letting it escape to the page behind.
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const current = document.activeElement;

            // Leaving the front edge backwards, or the back edge forwards,
            // wraps to the opposite end. The panel counts as the front edge so
            // Shift+Tab immediately after opening lands on the last control.
            if (event.shiftKey && (current === first || current === panel)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && current === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            // Returning focus is what stops a keyboard user being dumped at the
            // top of the document every time they close an overlay.
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [active]);

    return panelRef;
};
