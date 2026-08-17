import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import StatusBanner from './StatusBanner';

describe('StatusBanner', () => {
    afterEach(cleanup);

    it('says the shop is not trading', () => {
        render(<StatusBanner />);
        expect(screen.getByText(/not trading yet/i)).toBeInTheDocument();
    });

    // The claim has to be the honest one. "Coming soon" or a launch date would
    // be a commitment nobody has made, and this site has form for shipping
    // copy that was never confirmed — the hero's invented figures had to be
    // deleted for the same reason.
    it('promises nothing it cannot keep', () => {
        render(<StatusBanner />);
        const text = screen.getByText(/not trading yet/i).closest('p').textContent;

        expect(text).toMatch(/nothing can be ordered/i);
        expect(text).not.toMatch(/coming soon|launching|shortly|shipping soon/i);
    });

    // A marquee was the alternative and was rejected partly on WCAG 2.2.2:
    // content that moves on its own needs a way to stop it. Nothing here
    // animates, so there is nothing to pause — and this asserts it stays that
    // way, because "make the banner move" is an easy thing to ask for later
    // without the pause control that would have to come with it.
    it('does not animate, so it needs no pause control', () => {
        const { container } = render(<StatusBanner />);

        expect(container.innerHTML).not.toMatch(/animate-|marquee|transition-transform/);
    });
});
