import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScrollToHash from './ScrollToHash';

const matchMedia = (matches) => vi.fn().mockReturnValue({
    matches, addEventListener: vi.fn(), removeEventListener: vi.fn(),
});

describe('ScrollToHash', () => {
    beforeEach(() => {
        window.scrollTo = vi.fn();
        window.matchMedia = matchMedia(false);
    });

    // scroll-behavior used to be smooth globally, which applied to this call
    // too — so landing on a new route animated the whole page height.
    it('jumps instantly to the top on a route change', () => {
        render(<MemoryRouter initialEntries={['/contact']}><ScrollToHash /></MemoryRouter>);

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    });

    it('scrolls smoothly to an in-page anchor', () => {
        const target = document.createElement('div');
        target.id = 'about';
        target.scrollIntoView = vi.fn();
        document.body.appendChild(target);

        render(<MemoryRouter initialEntries={['/#about']}><ScrollToHash /></MemoryRouter>);

        expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
        expect(window.scrollTo).not.toHaveBeenCalled();
        target.remove();
    });

    it('does not animate the anchor scroll under reduced motion', () => {
        window.matchMedia = matchMedia(true);
        const target = document.createElement('div');
        target.id = 'about';
        target.scrollIntoView = vi.fn();
        document.body.appendChild(target);

        render(<MemoryRouter initialEntries={['/#about']}><ScrollToHash /></MemoryRouter>);

        expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
        target.remove();
    });
});
