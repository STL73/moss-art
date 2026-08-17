import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';
import { footerLinks } from '../constants';
import { categories, products } from '../data/products';

const renderFooter = () => render(<MemoryRouter><Footer /></MemoryRouter>);

const collectionLinks = footerLinks.find((group) => group.title === 'Collections').links;

// The category in "/products?category=moss-pots".
const categoryOf = (to) => new URLSearchParams(to.split('?')[1]).get('category');

describe('Footer', () => {
    it('credits the studio with a link that actually goes there', () => {
        renderFooter();

        const credit = screen.getByRole('link', { name: /spireforge/i });
        expect(credit).toHaveAttribute('href', 'https://spireforge.co.uk');
    });

    // The shop's own line and the build credit are different statements. Merged
    // into one sentence the credit reads as part of the shop's copy.
    it('keeps the shop line and the build credit apart', () => {
        renderFooter();

        expect(screen.getByText(/handmade in manchester/i)).toBeInTheDocument();
        expect(screen.getByText(/site by/i)).toBeInTheDocument();
    });

    it('shows the current year in the copyright', () => {
        renderFooter();

        expect(screen.getByText(new RegExp(`${new Date().getFullYear()} MossArt`))).toBeInTheDocument();
    });

    // api.test.js guards the data — no category may be empty. Nothing guarded
    // the footer, which is a separate hand-maintained list: a collection link
    // could point at a category that had been renamed or deleted and the only
    // symptom would be a customer landing on an empty grid.
    describe('collection links', () => {
        it('every link points at a category that exists', () => {
            const known = categories.map((category) => category.slug);

            collectionLinks.forEach((link) => {
                expect(known, `footer links to "${categoryOf(link.to)}"`).toContain(categoryOf(link.to));
            });
        });

        it('every link lands on a category with products behind it', () => {
            collectionLinks.forEach((link) => {
                const behind = products.filter((product) => product.category === categoryOf(link.to));
                expect(behind.length, `footer links to empty "${categoryOf(link.to)}"`).toBeGreaterThan(0);
            });
        });

        // The reverse direction. A new category that never reaches the footer is
        // reachable only by the filter bar, which is how Wreaths and Letters &
        // Signs would have shipped half-linked on 2026-08-17.
        it('offers every category the shop actually has', () => {
            const linked = collectionLinks.map((link) => categoryOf(link.to));

            categories
                .filter((category) => category.slug !== 'all')
                .forEach((category) => {
                    expect(linked, `"${category.slug}" is missing from the footer`).toContain(category.slug);
                });
        });
    });
});
