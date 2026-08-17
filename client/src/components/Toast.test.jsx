import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider } from '../context/CartContext';
import { useCart } from '../hooks/useCart';
import Toast from './Toast';

const sample = { id: '1', slug: 'glass-sphere', name: 'Glass Sphere', price: 8500, images: ['a.jpg'] };

const Trigger = () => {
    const { addItem } = useCart();
    return <button onClick={() => addItem(sample)}>add</button>;
};

const setup = () =>
    render(<CartProvider><Trigger /><Toast /></CartProvider>);

describe('Toast', () => {
    beforeEach(() => window.localStorage.clear());

    it('renders nothing initially', () => {
        setup();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('announces the added product', async () => {
        const user = userEvent.setup();
        setup();
        await user.click(screen.getByText('add'));
        expect(screen.getByRole('status')).toHaveTextContent('Glass Sphere added to basket');
    });
});
