import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import FilterBar from './FilterBar';

const props = {
    active: 'all',
    onCategoryChange: vi.fn(),
    sort: 'newest',
    onSortChange: vi.fn(),
    count: 8,
};

describe('FilterBar', () => {
    it('marks the active category', () => {
        render(<FilterBar {...props} />);
        expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Tabletop' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('reports a category change', async () => {
        const onCategoryChange = vi.fn();
        const user = userEvent.setup();
        render(<FilterBar {...props} onCategoryChange={onCategoryChange} />);
        await user.click(screen.getByRole('button', { name: 'Wall Art' }));
        expect(onCategoryChange).toHaveBeenCalledWith('wall-art');
    });

    // The count is split across two elements so the number can carry --text
    // against the muted word beside it, which is why this cannot match on one
    // text node. The live region is the thing worth asserting anyway: changing
    // a filter re-renders the grid silently, and this is what announces it.
    it('shows the item count in a live region', () => {
        render(<FilterBar {...props} />);
        const status = screen.getByText(/pieces/).closest('[aria-live]');
        expect(status).toHaveTextContent('8 pieces');
    });

    it('names the active category alongside the count when one is filtered', () => {
        render(<FilterBar {...props} active="wall-art" count={3} />);
        expect(screen.getByText(/pieces/).closest('[aria-live]'))
            .toHaveTextContent('3 pieces in Wall Art');
    });

    it('reports a sort change', async () => {
        const onSortChange = vi.fn();
        const user = userEvent.setup();
        render(<FilterBar {...props} onSortChange={onSortChange} />);
        await user.selectOptions(screen.getByLabelText('Sort'), 'price-asc');
        expect(onSortChange).toHaveBeenCalledWith('price-asc');
    });
});
