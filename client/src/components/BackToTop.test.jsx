import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BackToTop from './BackToTop';

const matchMedia = (matches) => vi.fn().mockReturnValue({
    matches, addEventListener: vi.fn(), removeEventListener: vi.fn(),
});

// jsdom reports innerHeight 768 and never scrolls on its own, so the position
// is set directly and the listener fired by hand.
const scrollTo = (y) => act(() => {
    window.scrollY = y;
    window.dispatchEvent(new Event('scroll'));
});

const button = () => screen.queryByRole('button', { name: /back to top/i });

describe('BackToTop', () => {
    beforeEach(() => {
        window.scrollY = 0;
        window.scrollTo = vi.fn();
        window.matchMedia = matchMedia(false);
    });

    it('stays hidden near the top of the page', () => {
        render(<BackToTop />);
        expect(button()).not.toBeInTheDocument();
    });

    // A button that appears after half a screen is noise on a short page.
    it('stays hidden until well past one screen', () => {
        render(<BackToTop />);
        scrollTo(window.innerHeight);
        expect(button()).not.toBeInTheDocument();
    });

    it('appears once the page is scrolled far enough', async () => {
        render(<BackToTop />);
        scrollTo(window.innerHeight * 2);
        await waitFor(() => expect(button()).toBeInTheDocument());
    });

    it('returns to the top when pressed', async () => {
        const user = userEvent.setup();
        render(<BackToTop />);
        scrollTo(window.innerHeight * 2);
        await waitFor(() => expect(button()).toBeInTheDocument());

        await user.click(button());

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('jumps rather than animates under reduced motion', async () => {
        window.matchMedia = matchMedia(true);
        const user = userEvent.setup();
        render(<BackToTop />);
        scrollTo(window.innerHeight * 2);
        await waitFor(() => expect(button()).toBeInTheDocument());

        await user.click(button());

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    });
});
