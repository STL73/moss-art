import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider } from './CartContext';
import { useCart } from '../hooks/useCart';

const sample = { id: '1', slug: 'glass-sphere', name: 'Glass Sphere', price: 8500, images: ['a.jpg'] };

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

const setup = () => renderHook(() => useCart(), { wrapper });

describe('CartContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('starts empty', () => {
        const { result } = setup();
        expect(result.current.itemCount).toBe(0);
        expect(result.current.total).toBe(0);
    });

    it('adds an item', () => {
        const { result } = setup();
        act(() => result.current.addItem(sample));
        expect(result.current.itemCount).toBe(1);
        expect(result.current.total).toBe(8500);
    });

    it('increments quantity when the same item is added twice', () => {
        const { result } = setup();
        act(() => result.current.addItem(sample));
        act(() => result.current.addItem(sample));
        expect(result.current.items).toHaveLength(1);
        expect(result.current.itemCount).toBe(2);
        expect(result.current.total).toBe(17000);
    });

    it('sets an explicit quantity', () => {
        const { result } = setup();
        act(() => result.current.addItem(sample));
        act(() => result.current.setQuantity('1', 3));
        expect(result.current.itemCount).toBe(3);
    });

    it('removes an item when quantity drops to zero', () => {
        const { result } = setup();
        act(() => result.current.addItem(sample));
        act(() => result.current.setQuantity('1', 0));
        expect(result.current.items).toHaveLength(0);
    });

    it('removes an item explicitly', () => {
        const { result } = setup();
        act(() => result.current.addItem(sample));
        act(() => result.current.removeItem('1'));
        expect(result.current.items).toHaveLength(0);
    });

    it('clears the cart', () => {
        const { result } = setup();
        act(() => result.current.addItem(sample));
        act(() => result.current.clear());
        expect(result.current.items).toHaveLength(0);
    });

    it('persists to localStorage', () => {
        const { result } = setup();
        act(() => result.current.addItem(sample));
        const stored = JSON.parse(window.localStorage.getItem('cart'));
        expect(stored).toHaveLength(1);
        expect(stored[0].quantity).toBe(1);
    });

    it('rehydrates from localStorage', () => {
        window.localStorage.setItem('cart', JSON.stringify([{ ...sample, quantity: 2 }]));
        const { result } = setup();
        expect(result.current.itemCount).toBe(2);
    });
});
