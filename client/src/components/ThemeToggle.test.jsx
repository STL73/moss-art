import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

const setup = () => render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
const option = (name) => screen.getByRole('button', { name: new RegExp(`use ${name} theme`, 'i') });

describe('ThemeToggle', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
        window.matchMedia = vi.fn().mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    // Both symbols are on screen, so each has to be a real choice rather than
    // one button that flips whichever you happen to hit.
    it('offers both themes as separate controls', () => {
        setup();
        expect(option('dark')).toBeInTheDocument();
        expect(option('light')).toBeInTheDocument();
    });

    it('marks the current theme as pressed', () => {
        setup();
        expect(option('dark')).toHaveAttribute('aria-pressed', 'true');
        expect(option('light')).toHaveAttribute('aria-pressed', 'false');
    });

    it('switches when the other theme is chosen', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(option('light'));

        expect(option('light')).toHaveAttribute('aria-pressed', 'true');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    // The defect this replaced: a single button meant clicking the lit symbol
    // flipped the theme away from the one it represents.
    it('does nothing when the active theme is chosen again', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(option('dark'));
        await user.click(option('dark'));

        expect(option('dark')).toHaveAttribute('aria-pressed', 'true');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    // Not `disabled`: removing it from the tab order would stop a keyboard user
    // discovering which theme is currently on.
    it('marks the active option unactionable but keeps it reachable', () => {
        setup();

        expect(option('dark')).toHaveAttribute('aria-disabled', 'true');
        expect(option('dark')).not.toBeDisabled();
        expect(option('light')).not.toHaveAttribute('aria-disabled');
    });

    // The defect this replaced: the shapes swapped along with the positions, so
    // after switching to light the "use dark theme" control rendered a sun. The
    // symbols have to keep their meaning in every state.
    it('keeps each symbol on its own control in both themes', async () => {
        const user = userEvent.setup();
        setup();

        // Rays are the sun's tell; the moon is a masked disc with no strokes.
        const shapeOf = (name) => (option(name).querySelector('line') ? 'sun' : 'moon');

        expect(shapeOf('light')).toBe('sun');
        expect(shapeOf('dark')).toBe('moon');

        await user.click(option('light'));
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');

        // Same two symbols, same two controls, opposite theme.
        expect(shapeOf('light')).toBe('sun');
        expect(shapeOf('dark')).toBe('moon');
    });

    it('keeps the symbols out of the accessibility tree', () => {
        const { container } = setup();
        container.querySelectorAll('svg').forEach((svg) => {
            expect(svg).toHaveAttribute('aria-hidden', 'true');
        });
    });
});
