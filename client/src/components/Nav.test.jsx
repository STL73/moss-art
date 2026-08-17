import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import { CartProvider } from '../context/CartContext';
import { navLinks } from '../constants';
import Nav from './Nav';

const navLinkCount = navLinks.length;

const renderNav = () =>
    render(
        <MemoryRouter>
            <ThemeProvider>
                <CartProvider><Nav /></CartProvider>
            </ThemeProvider>
        </MemoryRouter>
    );

describe('Nav', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.matchMedia = vi.fn().mockReturnValue({
            matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
        });
    });

    it('renders the primary links', () => {
        renderNav();
        expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/products');
    });

    it('opens the mobile menu when the toggle is pressed', async () => {
        const user = userEvent.setup();
        renderNav();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /open menu/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // The panel used to sit inside <header>, which carries backdrop-blur. A
    // backdrop-filter makes an element the containing block for fixed-position
    // descendants, so "fixed top-0 bottom-0" resolved against an 86px-tall
    // header rather than the viewport: the panel's background was a thin strip
    // at the top of the screen and the links rendered outside it with nothing
    // behind them. jsdom has no layout and cannot catch that, so the invariant
    // is enforced structurally instead.
    it('renders the mobile menu outside the blurred header', async () => {
        const user = userEvent.setup();
        renderNav();
        await user.click(screen.getByRole('button', { name: /open menu/i }));

        const dialog = screen.getByRole('dialog');
        expect(dialog.closest('header')).toBeNull();
    });

    // aria-modal="true" is a claim the browser does not enforce; without a trap
    // keyboard users tab straight out into the inert page behind the overlay.
    it('keeps Tab inside the mobile menu', async () => {
        const user = userEvent.setup();
        renderNav();
        await user.click(screen.getByRole('button', { name: /open menu/i }));

        const close = screen.getByRole('button', { name: /close menu/i });
        await user.tab();
        expect(close).toHaveFocus();

        // Tab through every link, then once more off the end.
        for (let i = 0; i < navLinkCount + 1; i += 1) await user.tab();
        expect(close).toHaveFocus();
    });

    it('returns focus to the toggle when the menu closes', async () => {
        const user = userEvent.setup();
        renderNav();

        const toggle = screen.getByRole('button', { name: /open menu/i });
        await user.click(toggle);
        await user.click(screen.getByRole('button', { name: /close menu/i }));

        await waitFor(() => expect(toggle).toHaveFocus());
    });

    it('closes the mobile menu on Escape', async () => {
        const user = userEvent.setup();
        renderNav();
        await user.click(screen.getByRole('button', { name: /open menu/i }));
        await user.keyboard('{Escape}');
        // AnimatePresence keeps the panel mounted until its exit animation
        // finishes, so the removal is asynchronous.
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
});
