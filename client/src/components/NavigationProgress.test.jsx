import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NavigationProgress from './NavigationProgress';

// The component's whole job is to reflect the router's navigation state, so the
// state is what gets driven here rather than a whole data router being stood up
// around it. vi.hoisted is what makes the object exist before vi.mock's factory
// runs — mock calls are lifted to the top of the file, above plain consts.
const { navigation } = vi.hoisted(() => ({ navigation: { state: 'idle' } }));

vi.mock('react-router', async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigation: () => navigation,
}));

// jsdom has no matchMedia, and useReducedMotion reads it on first render.
const matchMedia = (matches) => vi.fn().mockReturnValue({
    matches, addEventListener: vi.fn(), removeEventListener: vi.fn(),
});

const bar = () => document.querySelector('[aria-hidden="true"] > div');

// Drive a whole navigation: start it, then land, then let the reset timer run.
const navigate = async (rerender) => {
    navigation.state = 'loading';
    await act(async () => rerender(<NavigationProgress />));
};

const arrive = async (rerender) => {
    navigation.state = 'idle';
    await act(async () => rerender(<NavigationProgress />));
};

describe('NavigationProgress', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        navigation.state = 'idle';
        window.matchMedia = matchMedia(false);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // Without the phase check the bar would flash on the very first paint of
    // every cold load, before anyone has clicked anything.
    it('shows nothing before any navigation has happened', () => {
        render(<NavigationProgress />);
        expect(bar()).toHaveStyle({ width: '0%', opacity: '0' });
    });

    it('shows while a route chunk is being fetched', async () => {
        const { rerender } = render(<NavigationProgress />);
        await navigate(rerender);
        expect(bar()).toHaveStyle({ opacity: '1' });
    });

    // Nothing reports real progress, so it must never claim to have finished
    // while it is still waiting — full width and then a pause is worse than no
    // bar at all.
    it('stops short of the end while still waiting', async () => {
        const { rerender } = render(<NavigationProgress />);
        await navigate(rerender);
        expect(bar()).toHaveStyle({ width: '90%' });
    });

    // The reason the component has three phases rather than two: going straight
    // back to 0% slides the bar backwards on arrival, which reads as cancelled.
    it('completes forwards on arrival rather than retracting', async () => {
        const { rerender } = render(<NavigationProgress />);
        await navigate(rerender);
        await arrive(rerender);

        expect(bar()).toHaveStyle({ width: '100%', opacity: '0' });
    });

    it('resets to zero only once it is out of sight', async () => {
        const { rerender } = render(<NavigationProgress />);
        await navigate(rerender);
        await arrive(rerender);

        await act(async () => { vi.advanceTimersByTime(300); });

        expect(bar()).toHaveStyle({ width: '0%' });
        // Snapping back must not be animated, or it is the retraction again.
        expect(bar()).toHaveStyle({ transition: 'none' });
    });

    // It is decoration: the arriving page announces the route change, and a
    // second announcement here would say the same thing twice.
    it('is hidden from assistive technology', () => {
        render(<NavigationProgress />);
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(bar().closest('[aria-hidden="true"]')).toBeInTheDocument();
    });
});
