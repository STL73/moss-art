import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PhotoBackdrop from './PhotoBackdrop';

describe('PhotoBackdrop', () => {
    it('renders its children over the photograph', () => {
        render(<PhotoBackdrop image="moss.webp"><h2>Grown slowly</h2></PhotoBackdrop>);
        expect(screen.getByRole('heading', { name: 'Grown slowly' })).toBeInTheDocument();
    });

    // The section's own heading carries the meaning; announcing the scenery on
    // top of it is noise.
    it('keeps a decorative photograph out of the accessibility tree', () => {
        const { container } = render(<PhotoBackdrop image="moss.webp"><p>copy</p></PhotoBackdrop>);
        const img = container.querySelector('img');

        expect(img).toHaveAttribute('alt', '');
        expect(img).toHaveAttribute('aria-hidden', 'true');
    });

    it('exposes the photograph when it is genuinely informative', () => {
        render(<PhotoBackdrop image="moss.webp" alt="Moss on a woodland floor"><p>copy</p></PhotoBackdrop>);

        const img = screen.getByAltText('Moss on a woodland floor');
        expect(img).not.toHaveAttribute('aria-hidden');
    });

    // Contrast cannot depend on which part of the photo sits behind a word.
    it('always lays a scrim over the photograph', () => {
        const { container } = render(<PhotoBackdrop image="moss.webp"><p>copy</p></PhotoBackdrop>);
        expect(container.querySelector('.photo-scrim')).toBeInTheDocument();
    });

    it('defers loading unless the image is above the fold', () => {
        const { container, rerender } = render(<PhotoBackdrop image="a.webp"><p>c</p></PhotoBackdrop>);
        expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');

        rerender(<PhotoBackdrop image="a.webp" priority><p>c</p></PhotoBackdrop>);
        expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
    });
});
