import { Outlet } from 'react-router';
import { MotionConfig } from 'motion/react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';
import ScrollToHash from '../components/ScrollToHash';
import BackToTop from '../components/BackToTop';
import NavigationProgress from '../components/NavigationProgress';
import SkipLink from '../components/SkipLink';
import StatusBanner from '../components/StatusBanner';

// Motion drives its animations through the Web Animations API, which the
// prefers-reduced-motion block in index.css cannot reach — that block only
// neutralises CSS animations and transitions. "user" makes every Motion
// animation below defer to the OS setting instead.
const RootLayout = () => (
    <MotionConfig reducedMotion="user">
        <div className="min-h-screen flex flex-col bg-bg text-text">
            <ScrollToHash />
            {/* First in the DOM so it is first in the tab order — the whole
                point is to come before the navigation it skips. */}
            <SkipLink />
            {/* Every route below Home is its own chunk, so a link click waits
                on the network before the page changes. This says so. */}
            <NavigationProgress />
            {/* Above the header and after the skip link: first thing read on
                arrival, and still skippable in one tab for anyone who does not
                want it. Not sticky, so it scrolls away and the header takes
                over the top of the viewport. */}
            <StatusBanner />
            <Nav />
            {/* tabIndex -1 makes <main> focusable by script but not by tabbing,
                which is what lets the skip link move focus here rather than
                only scrolling the page and leaving focus back in the nav. */}
            <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
                <Outlet />
            </main>
            <Footer />
            <CartDrawer />
            <Toast />
            {/* Renders nothing until the page is scrolled, so short routes
                never show it. */}
            <BackToTop />
        </div>
    </MotionConfig>
);

export default RootLayout;
