import { describe, it, expect } from 'vitest';
import { formatPrice } from './formatPrice';

describe('formatPrice', () => {
    it('formats whole pounds', () => {
        expect(formatPrice(2500)).toBe('£25.00');
    });

    it('formats pounds and pence', () => {
        expect(formatPrice(2599)).toBe('£25.99');
    });

    it('pads single-digit pence', () => {
        expect(formatPrice(2505)).toBe('£25.05');
    });

    it('formats zero', () => {
        expect(formatPrice(0)).toBe('£0.00');
    });

    it('adds thousand separators', () => {
        expect(formatPrice(123456)).toBe('£1,234.56');
    });
});
