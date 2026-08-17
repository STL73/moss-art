import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from './ThemeContext';
import { useTheme } from '../hooks/useTheme';

const Probe = () => {
    const { theme, toggleTheme } = useTheme();
    return <button onClick={toggleTheme}>{theme}</button>;
};

const renderWithProvider = () =>
    render(
        <ThemeProvider>
            <Probe />
        </ThemeProvider>
    );

describe('ThemeContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.history.replaceState({}, '', '/');
        document.documentElement.removeAttribute('data-theme');
        window.matchMedia = vi.fn().mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    it('defaults to dark when nothing is stored', () => {
        renderWithProvider();
        expect(screen.getByRole('button')).toHaveTextContent('dark');
    });

    it('uses the stored preference', () => {
        window.localStorage.setItem('theme', JSON.stringify('light'));
        renderWithProvider();
        expect(screen.getByRole('button')).toHaveTextContent('light');
    });

    it('toggles and writes the attribute to the document', () => {
        renderWithProvider();
        act(() => screen.getByRole('button').click());
        expect(screen.getByRole('button')).toHaveTextContent('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    // Pins a route to a theme through the URL without writing to localStorage,
    // so checking both themes never changes the one the browser reopens on.
    // The must-not-work half matters as much as the must-work half: this is a
    // development affordance, and a production build has to ignore it.
    describe('the development ?theme= override', () => {
        const withSearch = (search) => window.history.replaceState({}, '', search);

        it('renders the theme named in the query string', () => {
            withSearch('/?theme=light');
            renderWithProvider();
            expect(screen.getByRole('button')).toHaveTextContent('light');
        });

        it('leaves the stored preference alone', () => {
            withSearch('/?theme=light');
            renderWithProvider();
            expect(JSON.parse(window.localStorage.getItem('theme'))).toBe('dark');
        });

        it('ignores a value that is not a theme', () => {
            withSearch('/?theme=chartreuse');
            renderWithProvider();
            expect(screen.getByRole('button')).toHaveTextContent('dark');
        });
    });

    // jsdom has no startViewTransition, so the tests above already prove the
    // unsupported-browser path works. These cover the rest of the matrix.
    describe('view transition', () => {
        const withViewTransitions = () => {
            const spy = vi.fn((callback) => {
                callback();
                return { finished: Promise.resolve(), ready: Promise.resolve() };
            });
            document.startViewTransition = spy;
            return spy;
        };

        it('crossfades the swap where the browser supports it', () => {
            const spy = withViewTransitions();
            renderWithProvider();

            act(() => screen.getByRole('button').click());

            expect(spy).toHaveBeenCalledOnce();
            expect(screen.getByRole('button')).toHaveTextContent('light');
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');

            delete document.startViewTransition;
        });

        // Animating a whole-page colour change is exactly what someone with a
        // vestibular trigger has asked not to see.
        it('swaps instantly when reduced motion is requested', () => {
            const spy = withViewTransitions();
            window.matchMedia = vi.fn().mockImplementation((query) => ({
                matches: query.includes('reduced-motion'),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }));
            renderWithProvider();

            act(() => screen.getByRole('button').click());

            expect(spy).not.toHaveBeenCalled();
            expect(screen.getByRole('button')).toHaveTextContent('light');

            delete document.startViewTransition;
        });
    });
});
