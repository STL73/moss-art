import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HERO_CLAIMS } from '../constants';
import Hero from './Hero';

const renderHero = () => render(<MemoryRouter><Hero /></MemoryRouter>);

describe('Hero', () => {
    beforeEach(() => {
        window.matchMedia = vi.fn().mockReturnValue({
            matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
        });
    });

    it('renders the claims band', () => {
        renderHero();
        HERO_CLAIMS.forEach(({ label }) => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    // The band, the hero paragraph and the footer all carried "no water, no
    // light, no upkeep" at once. The band kept it; this pins the paragraph so
    // the duplication cannot creep back in through a copy edit.
    it('does not repeat the claims in the paragraph above them', () => {
        renderHero();
        const paragraph = screen.getByText(/Preserved Nordic moss, arranged by hand/);
        expect(paragraph.textContent).not.toMatch(/without water|no upkeep|any attention/i);
    });

    // The figures these replaced were invented, and the dev-only marker that
    // warned about them is gone with them. Nothing may reintroduce it silently.
    it('carries no sample-data marker', () => {
        renderHero();
        expect(screen.queryByTestId('placeholder-warning')).not.toBeInTheDocument();
    });
});
