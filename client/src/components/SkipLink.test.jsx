import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import SkipLink from './SkipLink';

describe('SkipLink', () => {
    it('points at the main landmark', () => {
        render(<SkipLink />);
        expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main');
    });

    // The failure mode this guards against is a skip link hidden with
    // `display: none` or `visibility: hidden` — both of which remove it from
    // the tab order, so the one input method it exists for can never reach it.
    // jsdom applies no stylesheet, so the class contract is what is asserted;
    // that it is genuinely reachable is proved by the tab test below.
    it('is hidden visually but not removed from the tab order', () => {
        render(<SkipLink />);
        const link = screen.getByRole('link', { name: /skip to content/i });

        expect(link).toHaveClass('sr-only');
        expect(link).toHaveClass('focus:not-sr-only');
    });

    it('is reachable on the first tab press', async () => {
        const user = userEvent.setup();
        render(<SkipLink />);

        await user.tab();
        expect(screen.getByRole('link', { name: /skip to content/i })).toHaveFocus();
    });
});
