import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useReducedMotion } from './useReducedMotion';

const mockMatchMedia = (matches) => {
    window.matchMedia = vi.fn().mockReturnValue({
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    });
};

describe('useReducedMotion', () => {
    it('returns true when the user prefers reduced motion', () => {
        mockMatchMedia(true);
        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(true);
    });

    it('returns false when the user has no preference', () => {
        mockMatchMedia(false);
        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);
    });
});
