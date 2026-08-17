import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import Contact from './Contact';
import { contactEmail, contactPhone } from '../constants';

const renderContact = () => render(<MemoryRouter><Contact /></MemoryRouter>);

describe('Contact', () => {
    it('renders the page heading', () => {
        renderContact();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Get in touch');
    });

    it('offers a mailto link', () => {
        renderContact();
        expect(screen.getByRole('link', { name: contactEmail }))
            .toHaveAttribute('href', `mailto:${contactEmail}`);
    });

    it('offers a tel link', () => {
        renderContact();
        expect(screen.getByRole('link', { name: contactPhone }))
            .toHaveAttribute('href', `tel:${contactPhone.replace(/\s/g, '')}`);
    });

    // The footer links to these three anchors. If the ids ever move, those
    // links silently go nowhere — which is exactly the bug this page fixes.
    it.each(['faq', 'delivery', 'returns'])('has a #%s anchor for the footer to target', (id) => {
        const { container } = renderContact();
        expect(container.querySelector(`#${id}`)).toBeInTheDocument();
    });

    it('does not present a form it cannot submit', () => {
        const { container } = renderContact();
        expect(container.querySelector('form')).toBeNull();
    });
});
