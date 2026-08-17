import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartProvider } from '../context/CartContext';

// Hold the pending resolver so the test can sit in the loading state for as
// long as it needs. The real api module has zero latency under test, which
// would otherwise make that state impossible to observe.
const pending = vi.hoisted(() => ({ resolve: null }));

vi.mock('../lib/api', () => ({
    getProducts: () => new Promise((resolve) => { pending.resolve = resolve; }),
}));

// AnimatePresence writes nothing to the DOM of its own, so stand it up as a
// marker to assert it stays mounted across the loading boundary.
vi.mock('motion/react', async (importOriginal) => ({
    ...(await importOriginal()),
    AnimatePresence: ({ children }) => <div data-testid="animate-presence">{children}</div>,
}));

const Products = (await import('./Products')).default;

const sample = [{
    id: '1', slug: 'glass-sphere', name: 'Glass Sphere', species: 'Cladonia stellaris',
    price: 8500, images: ['a.jpg'], category: 'spheres',
}];

const setup = () =>
    render(
        <MemoryRouter>
            <CartProvider><Products /></CartProvider>
        </MemoryRouter>
    );

describe('Products', () => {
    beforeEach(() => {
        pending.resolve = null;
        window.localStorage.clear();
    });

    // ProductCard declares an exit animation. If AnimatePresence sits inside
    // the loading ternary it unmounts whenever a filter changes, so that exit
    // can never run and every filter click is a hard skeleton flash instead.
    it('keeps AnimatePresence mounted while results are loading', () => {
        setup();

        expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });

    it('keeps the same AnimatePresence once results arrive', async () => {
        setup();
        expect(screen.getByTestId('animate-presence')).toBeInTheDocument();

        pending.resolve(sample);

        await waitFor(() => expect(screen.getByText('Glass Sphere')).toBeInTheDocument());
        expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });
});
