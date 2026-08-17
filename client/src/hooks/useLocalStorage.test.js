import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('returns the fallback when nothing is stored', () => {
        const { result } = renderHook(() => useLocalStorage('cart', []));
        expect(result.current[0]).toEqual([]);
    });

    it('reads an existing stored value', () => {
        window.localStorage.setItem('cart', JSON.stringify([{ id: 'a' }]));
        const { result } = renderHook(() => useLocalStorage('cart', []));
        expect(result.current[0]).toEqual([{ id: 'a' }]);
    });

    it('writes updates back to localStorage', () => {
        const { result } = renderHook(() => useLocalStorage('cart', []));
        act(() => result.current[1]([{ id: 'b' }]));
        expect(JSON.parse(window.localStorage.getItem('cart'))).toEqual([{ id: 'b' }]);
    });

    it('falls back when stored JSON is corrupt', () => {
        window.localStorage.setItem('cart', 'not json');
        const { result } = renderHook(() => useLocalStorage('cart', []));
        expect(result.current[0]).toEqual([]);
    });
});
