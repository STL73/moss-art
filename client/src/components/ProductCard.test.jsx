import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductCard from './ProductCard';

const product = {
    id: '1', slug: 'glass-sphere', name: 'Glass Sphere', species: 'Cladonia stellaris',
    price: 8500, images: ['a.jpg'], category: 'moss-pots', stock: 6, isAvailable: true,
};

const renderCard = (onAdd = vi.fn()) =>
    render(<MemoryRouter><ProductCard product={product} onAdd={onAdd} /></MemoryRouter>);

describe('ProductCard', () => {
    beforeEach(() => window.localStorage.clear());

    it('links to the product page', () => {
        renderCard();
        expect(screen.getByRole('link', { name: /glass sphere/i })).toHaveAttribute('href', '/products/glass-sphere');
    });

    // The product page reads this query back into its breadcrumb, so a customer
    // who filters, opens a piece and goes back lands on the list they left
    // rather than the full catalogue.
    it('carries the current filter query into the product link', () => {
        render(
            <MemoryRouter initialEntries={['/products?category=wreaths&sort=price-asc']}>
                <ProductCard product={product} onAdd={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /glass sphere/i }))
            .toHaveAttribute('href', '/products/glass-sphere?category=wreaths&sort=price-asc');
    });

    it('shows the formatted price', () => {
        renderCard();
        expect(screen.getByText('£85.00')).toBeInTheDocument();
    });

    it('shows the species', () => {
        renderCard();
        expect(screen.getByText('Cladonia stellaris')).toBeInTheDocument();
    });

    it('calls onAdd without navigating', async () => {
        const onAdd = vi.fn();
        const user = userEvent.setup();
        renderCard(onAdd);
        await user.click(screen.getByRole('button', { name: /add glass sphere/i }));
        expect(onAdd).toHaveBeenCalledWith(product);
    });

    // On a pointer device the button rests as an outline and fills on hover. A
    // touch device never gets that hover, so without this it sits permanently
    // in a state designed to be temporary and reads as unfinished. Expressible
    // as a class, so it is pinned as one rather than left to a screenshot.
    it('ships the filled treatment on touch, where there is no hover', () => {
        renderCard();
        const addButton = screen.getByRole('button', { name: /add glass sphere/i });

        expect(addButton.className).toContain('[@media(hover:none)]:opacity-100');
        expect(addButton.className).toContain('[@media(hover:none)]:bg-accent');
        expect(addButton.className).toContain('[@media(hover:none)]:text-on-accent');
    });

    it('gives the image meaningful alt text', () => {
        renderCard();
        expect(screen.getByAltText('Glass Sphere')).toBeInTheDocument();
    });

    // An <a> may not contain interactive descendants. The card stays clickable
    // via a stretched pseudo-element on the title link instead.
    it('keeps the add button outside the link', () => {
        renderCard();
        const link = screen.getByRole('link', { name: /glass sphere/i });
        const addButton = screen.getByRole('button', { name: /add glass sphere/i });
        expect(link.contains(addButton)).toBe(false);
    });
});
