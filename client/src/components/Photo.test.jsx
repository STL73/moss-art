import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Photo from './Photo';

// The shape vite-imagetools returns for `./photo.jpg?w=480;960&as=img`.
const photo = {
    src: 'moss-960.webp',
    srcset: 'moss-480.webp 480w, moss-960.webp 960w',
    w: 960,
    h: 640,
};

describe('Photo', () => {
    it('offers every width to the browser and says how wide it will be drawn', () => {
        render(<Photo photo={photo} sizes="50vw" alt="Moss" />);

        const image = screen.getByAltText('Moss');
        expect(image).toHaveAttribute('srcset', photo.srcset);
        expect(image).toHaveAttribute('sizes', '50vw');
        // The fallback for anything that cannot read a srcset.
        expect(image).toHaveAttribute('src', 'moss-960.webp');
    });

    // Without these the layout has no idea how tall the box is until the bytes
    // arrive, and everything below the image jumps when they do.
    it('carries the intrinsic dimensions so the layout reserves the box', () => {
        render(<Photo photo={photo} sizes="50vw" alt="Moss" />);

        const image = screen.getByAltText('Moss');
        expect(image).toHaveAttribute('width', '960');
        expect(image).toHaveAttribute('height', '640');
    });

    // Omitting `sizes` is the one mistake that undoes the whole point of a
    // srcset — the browser falls back to assuming 100vw and fetches the widest
    // file every time — and it does it without any visible symptom.
    it('refuses to render without a sizes prop', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => render(<Photo photo={photo} alt="Moss" />)).toThrow(/sizes/);

        consoleError.mockRestore();
    });

    it('passes through the attributes each call site needs', () => {
        render(<Photo photo={photo} sizes="100vw" alt="Moss" loading="lazy" aria-hidden="true" />);

        const image = screen.getByAltText('Moss');
        expect(image).toHaveAttribute('loading', 'lazy');
        expect(image).toHaveAttribute('aria-hidden', 'true');
    });
});
