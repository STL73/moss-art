// The single place that knows where product data comes from. Today it reads
// the mock array; when the backend exists these become fetch calls to
// /api/v1/products and no component needs to change.
import { products } from '../data/products';

// A short delay makes the skeleton states real rather than decorative.
// Tests set it to zero via the VITEST env flag so suites stay fast.
const LATENCY = import.meta.env.MODE === 'test' ? 0 : 450;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getProducts = async ({ category = 'all', sort = 'newest' } = {}) => {
    await delay(LATENCY);

    const filtered = category === 'all'
        ? products
        : products.filter((product) => product.category === category);

    // Copy before sorting — never mutate the source array.
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);

    return sorted;
};

export const getProduct = async (slug) => {
    await delay(LATENCY);
    const product = products.find((item) => item.slug === slug);
    if (!product) throw new Error('Product not found');
    return product;
};

export const getRelated = async (slug, limit = 4) => {
    await delay(LATENCY);
    return products.filter((product) => product.slug !== slug).slice(0, limit);
};
