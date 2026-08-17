import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

// A minimal stand-in for the real overlays: a trigger outside the trapped
// region, and a panel with two focusable controls inside it.
const Harness = () => {
    const [open, setOpen] = useState(false);
    const panelRef = useFocusTrap(open);

    return (
        <div>
            <button onClick={() => setOpen(true)}>open</button>
            <button>outside</button>
            {open && (
                <div ref={panelRef} tabIndex={-1} role="dialog" aria-label="Panel">
                    <button>first</button>
                    <button onClick={() => setOpen(false)}>last</button>
                </div>
            )}
        </div>
    );
};

describe('useFocusTrap', () => {
    it('moves focus into the panel when it activates', async () => {
        const user = userEvent.setup();
        render(<Harness />);

        await user.click(screen.getByText('open'));

        expect(screen.getByRole('dialog')).toHaveFocus();
    });

    it('wraps Tab from the last control back to the first', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        await user.click(screen.getByText('open'));

        await user.tab();
        expect(screen.getByText('first')).toHaveFocus();
        await user.tab();
        expect(screen.getByText('last')).toHaveFocus();

        // Without a trap this would land on the page behind the overlay.
        await user.tab();
        expect(screen.getByText('first')).toHaveFocus();
    });

    it('wraps Shift+Tab from the first control back to the last', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        await user.click(screen.getByText('open'));

        await user.tab();
        expect(screen.getByText('first')).toHaveFocus();

        await user.tab({ shift: true });
        expect(screen.getByText('last')).toHaveFocus();
    });

    it('returns focus to whatever opened it', async () => {
        const user = userEvent.setup();
        render(<Harness />);

        const trigger = screen.getByText('open');
        await user.click(trigger);
        await user.click(screen.getByText('last'));

        expect(trigger).toHaveFocus();
    });
});
