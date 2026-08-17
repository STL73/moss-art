import { useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ThemeContext } from '../hooks/useTheme';

// Dark is the design default. A stored choice always wins; otherwise we follow
// the OS, falling back to dark when the OS expresses no preference.
const systemPreference = () =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Development only. Opens a route pinned to a theme — `/products?theme=light` —
// without touching localStorage, so checking both themes never changes the one
// the browser reopens on. Built for the /lab theme sweep, which rendered a route
// twice in two iframes that would otherwise have shared the one stored value;
// that route is gone, but pinning a theme by URL is what you want any time the
// app is being driven or screenshotted, so it stays.
const forcedTheme = () => {
    if (!import.meta.env.DEV) return null;
    const requested = new URLSearchParams(window.location.search).get('theme');
    return requested === 'dark' || requested === 'light' ? requested : null;
};

export const ThemeProvider = ({ children }) => {
    const [stored, setTheme] = useLocalStorage('theme', systemPreference());
    const theme = forcedTheme() ?? stored;

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Crossfading a whole page is the browser's job, not CSS's. Transitioning
    // the colour properties instead would mean putting a transition on every
    // element on the page, which is a well-known jank source and repaints the
    // lot. The View Transitions API takes one snapshot and crossfades it on the
    // compositor, so the cost is the same whether the page has ten elements or
    // ten thousand.
    //
    // Unsupported browsers and anyone who has asked for less motion get the
    // instant swap, which is exactly the old behaviour.
    const withTransition = useCallback((swap) => {
        if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
            swap();
            return;
        }

        // startViewTransition captures the "before" frame, then expects the
        // callback to have applied the change by the time it returns. React
        // batches by default, so without flushSync the snapshot would be taken
        // and released before the theme attribute ever changed.
        document.startViewTransition(() => flushSync(swap));
    }, []);

    const toggleTheme = useCallback(
        () => withTransition(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))),
        [withTransition, setTheme]
    );

    // Choosing a theme by name rather than flipping to the other one. The
    // toggle presents both options at once, so "make it light" has to be
    // expressible without knowing what it currently is.
    //
    // The current value is read from a ref rather than from `theme` so this
    // keeps one identity for the life of the provider — consumers put it in
    // effect dependency arrays, and a callback that changed on every theme
    // change would re-run them. Same reasoning as the cart actions.
    const currentTheme = useRef(theme);
    useEffect(() => { currentTheme.current = theme; }, [theme]);

    const selectTheme = useCallback((next) => {
        // Already there: no state write, and no pointless crossfade.
        if (currentTheme.current === next) return;
        withTransition(() => setTheme(next));
    }, [withTransition, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, selectTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
