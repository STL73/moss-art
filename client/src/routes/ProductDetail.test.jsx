import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartProvider } from '../context/CartContext';

const product = {
    id: '1', slug: 'glass-sphere', name: 'Glass Sphere', species: 'Cladonia stellaris',
    price: 8500, images: ['a.jpg'], category: 'wreaths', stock: 6, isAvailable: true,
    description: 'A sphere of reindeer moss.',
};

vi.mock('../lib/api', () => ({
    getProduct: () => Promise.resolve(product),
    getRelated: () => Promise.resolve([]),
}));

const ProductDetail = (await import('./ProductDetail')).default;

const renderAt = (entry) =>
    render(
        <MemoryRouter initialEntries={[entry]}>
            <CartProvider>
                <Routes>
                    <Route path="/products/:slug" element={<ProductDetail />} />
                </Routes>
            </CartProvider>
        </MemoryRouter>
    );

const breadcrumb = () => screen.getByRole('link', { name: 'Shop' });

describe('ProductDetail breadcrumb', () => {
    beforeEach(() => window.localStorage.clear());

    // Without this the customer's category and sort are silently discarded and
    // they land on the unfiltered catalogue.
    it('sends the customer back to the list they were browsing', async () => {
        renderAt('/products/glass-sphere?category=wreaths&sort=price-asc');

        await waitFor(() => expect(breadcrumb()).toBeInTheDocument());
        expect(breadcrumb()).toHaveAttribute('href', '/products?category=wreaths&sort=price-asc');
    });

    it('links to the plain list when there was no filter', async () => {
        renderAt('/products/glass-sphere');

        await waitFor(() => expect(breadcrumb()).toBeInTheDocument());
        expect(breadcrumb()).toHaveAttribute('href', '/products');
    });
});
