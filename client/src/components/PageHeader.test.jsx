import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
    it('renders the title and accent word', () => {
        render(<PageHeader title="The" accent="collection" />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The collection');
    });

    it('renders a lead paragraph when given', () => {
        render(<PageHeader title="The" accent="collection" lead="Preserved Nordic moss." />);
        expect(screen.getByText('Preserved Nordic moss.')).toBeInTheDocument();
    });

    // The eyebrow was a label above the title on every one of the five routes,
    // usually restating the title underneath it — "Basket" over "Your basket".
    // A rule holds the same vertical rhythm without putting a second name on
    // the page. Chosen 2026-08-16; the prop is gone, so a stray eyebrow= on a
    // call site is now dead code rather than a silent reappearance.
    it('renders a rule instead of an eyebrow label', () => {
        const { container } = render(<PageHeader eyebrow="All pieces" title="The" accent="collection" />);
        expect(screen.queryByText('All pieces')).not.toBeInTheDocument();
        expect(container.querySelector('[data-testid="header-rule"]')).toBeInTheDocument();
    });
});
