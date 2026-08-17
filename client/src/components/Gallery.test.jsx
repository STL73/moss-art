import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Gallery from './Gallery';

// The shape vite-imagetools hands back for `./photo.jpg?w=...&as=img`. Photos
// stopped being bare URL strings when the storefront moved to srcset.
const photo = (name) => ({
    src: `${name}-960.webp`,
    srcset: `${name}-480.webp 480w, ${name}-960.webp 960w`,
    w: 960,
    h: 960,
});

const images = [photo('one'), photo('two')];

describe('Gallery', () => {
    it('shows the first image by default', () => {
        render(<Gallery images={images} alt="Apothecary Jar" />);
        expect(screen.getByAltText('Apothecary Jar')).toHaveAttribute('src', 'one-960.webp');
    });

    it('switches image when a thumbnail is chosen', async () => {
        const user = userEvent.setup();
        render(<Gallery images={images} alt="Apothecary Jar" />);
        await user.click(screen.getByRole('button', { name: /view image 2/i }));
        expect(screen.getByAltText('Apothecary Jar')).toHaveAttribute('src', 'two-960.webp');
    });

    it('marks the active thumbnail', async () => {
        const user = userEvent.setup();
        render(<Gallery images={images} alt="Apothecary Jar" />);
        await user.click(screen.getByRole('button', { name: /view image 2/i }));
        expect(screen.getByRole('button', { name: /view image 2/i })).toHaveAttribute('aria-pressed', 'true');
    });

    // Inspecting the product is the point of this component, so the zoom
    // cannot be mouse-only. An onClick on a bare <img> is unreachable by
    // keyboard and invisible to assistive tech.
    it('exposes the zoom as a keyboard-reachable control', async () => {
        const user = userEvent.setup();
        render(<Gallery images={images} alt="Apothecary Jar" />);

        const zoom = screen.getByRole('button', { name: /zoom apothecary jar/i });
        expect(zoom).toHaveAttribute('aria-pressed', 'false');

        await user.tab();
        expect(zoom).toHaveFocus();
    });

    it('toggles zoom from the keyboard', async () => {
        const user = userEvent.setup();
        render(<Gallery images={images} alt="Apothecary Jar" />);

        const zoom = screen.getByRole('button', { name: /zoom apothecary jar/i });
        zoom.focus();

        await user.keyboard('{Enter}');
        expect(zoom).toHaveAttribute('aria-pressed', 'true');

        await user.keyboard(' ');
        expect(zoom).toHaveAttribute('aria-pressed', 'false');
    });
});
