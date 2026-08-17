import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Link } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
    it('renders its children', () => {
        render(<Button>Shop now</Button>);
        expect(screen.getByRole('button', { name: 'Shop now' })).toBeInTheDocument();
    });

    it('calls onClick when pressed', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={onClick}>Add</Button>);
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('applies full width when asked', () => {
        render(<Button fullWidth>Sign up</Button>);
        expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('is not full width by default', () => {
        render(<Button>Sign up</Button>);
        expect(screen.getByRole('button')).not.toHaveClass('w-full');
    });

    // The outline variant is identified by nothing but its border, so it has to
    // use the interactive token rather than the decorative one. See
    // src/tokens.test.js for the contrast contract that token is held to.
    it('renders the outline variant', () => {
        render(<Button variant="outline">Add</Button>);
        expect(screen.getByRole('button')).toHaveClass('border-border-interactive');
    });

    it('is disabled when asked', () => {
        render(<Button disabled>Add</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('defaults to type="button" so it never submits a form by accident', () => {
        render(<Button>Add</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    // Navigation actions render as a link rather than nesting a button inside
    // an anchor, which is invalid HTML and breaks screen-reader navigation.
    it('renders as a link when given the as prop', () => {
        render(
            <MemoryRouter>
                <Button as={Link} to="/products">Shop the collection</Button>
            </MemoryRouter>
        );
        const link = screen.getByRole('link', { name: 'Shop the collection' });
        expect(link).toHaveAttribute('href', '/products');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not put a type attribute on a non-button element', () => {
        render(
            <MemoryRouter>
                <Button as={Link} to="/cart">Basket</Button>
            </MemoryRouter>
        );
        expect(screen.getByRole('link')).not.toHaveAttribute('type');
    });
});
