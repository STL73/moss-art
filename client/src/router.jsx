import { createBrowserRouter } from 'react-router';
import RootLayout from './layouts/RootLayout';
import Home from './routes/Home';

// Home is imported eagerly and every other route is not.
//
// The whole storefront used to compile into one file, so landing on the home
// page meant downloading the cart, the product detail page, the contact form
// and the 404 before anything could render. `lazy` splits each route into its
// own chunk and fetches it when the route is matched.
//
// This is react-router's own `lazy`, not React.lazy — the difference matters.
// React.lazy suspends during render, so the page it is replacing disappears and
// a fallback takes its place while the chunk downloads. The router's `lazy`
// resolves before it commits the navigation, so the page you are leaving stays
// on screen until the page you are going to is ready. No flash of nothing.
//
// Home stays eager on purpose: it is what most visitors land on, and splitting
// it would only buy a second round trip before the first paint.
const route = (path, load) => ({ path, lazy: async () => ({ Component: (await load()).default }) });

// A dev-only /lab route lived here from 2026-08-16, holding every open visual
// decision side by side so the choices got made by looking rather than by
// describing. Every panel was answered — hero, stats, eyebrow, touch targets,
// the Add button — and it was deleted the same day, as it was always meant to
// be. The decisions and the options they beat are in
// docs/plans/2026-08-16-remaining-work.md.

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        children: [
            { index: true, element: <Home /> },
            route('products', () => import('./routes/Products')),
            route('products/:slug', () => import('./routes/ProductDetail')),
            route('cart', () => import('./routes/Cart')),
            route('contact', () => import('./routes/Contact')),
            route('*', () => import('./routes/NotFound')),
        ],
    },
]);
