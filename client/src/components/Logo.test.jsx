import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';

describe('Logo', () => {
    it('renders an accessible label', () => {
        render(<Logo />);
        expect(screen.getByLabelText('MossArt')).toBeInTheDocument();
    });

    it('applies the given size', () => {
        const { container } = render(<Logo size={48} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', '48');
    });
});
