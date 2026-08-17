import { describe, it, expect } from 'vitest';
import { getProducts, getProduct } from './api';
import { products } from '../data/products';

// Counted from the data rather than written in. These assertions are about the
// api layer passing everything through and filtering correctly, not about the
// catalogue being a particular size — hardcoding 8 meant that trimming the
// catalogue on 2026-08-16 failed a test that had nothing to do with the change.
const inCategory = (slug) => products.filter((p) => p.category === slug).length;

describe('api', () => {
    it('returns every product', async () => {
        const result = await getProducts();
        expect(result).toHaveLength(products.length);
        expect(result[0]).toHaveProperty('slug');
    });

    it('filters by category', async () => {
        const result = await getProducts({ category: 'wall-art' });
        expect(result).toHaveLength(inCategory('wall-art'));
        expect(result.length).toBeGreaterThan(0);
        expect(result.every((p) => p.category === 'wall-art')).toBe(true);
    });

    it('treats the "all" category as no filter', async () => {
        const result = await getProducts({ category: 'all' });
        expect(result).toHaveLength(products.length);
    });

    // A category listed in the filter bar with nothing behind it is a dead end
    // the customer can click into. The wreaths category was exactly that for a
    // few minutes on 2026-08-16.
    it('has at least one product behind every category it offers', async () => {
        const { categories } = await import('../data/products');
        for (const category of categories.filter((c) => c.slug !== 'all')) {
            const result = await getProducts({ category: category.slug });
            expect(result.length, `category "${category.slug}" is empty`).toBeGreaterThan(0);
        }
    });

    it('sorts by price ascending', async () => {
        const result = await getProducts({ sort: 'price-asc' });
        expect(result[0].price).toBeLessThanOrEqual(result[1].price);
    });

    it('returns one product by slug', async () => {
        const result = await getProduct('apothecary-jar');
        expect(result.name).toBe('Apothecary Jar');
    });

    it('rejects for an unknown slug', async () => {
        await expect(getProduct('does-not-exist')).rejects.toThrow('Product not found');
    });
});
