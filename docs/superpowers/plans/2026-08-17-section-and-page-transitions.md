# Section and Page Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the storefront a transition when the page changes, a reveal on the two home-page sections, and a photograph that morphs from a product card into the product detail page.

**Architecture:** Route changes and the shared-element morph use the browser's View Transitions API, triggered by react-router's own `viewTransition` prop — no JavaScript is added to the bundle and the animation lives in CSS. The two home sections use Motion's `whileInView`, which is already paid for. Intensity is three presets in one module, swapped by a dev-only switcher that is deleted once the choice is made.

**Tech Stack:** React 19, react-router 8.3 (`viewTransition`, `useViewTransitionState`), Motion 13.1, Tailwind CSS v4, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-17-section-and-page-transitions-design.md`

**Working directory:** every command in this plan runs from `client/`.

---

## Background an engineer new to this repo needs

**No TypeScript.** This is plain `.jsx` and `.js`. Do not add types, interfaces or Zod.

**Tailwind v4, no config file.** Design tokens are CSS custom properties in `src/index.css`, exposed to Tailwind through an `@theme inline` block. Add new custom properties to `:root` inside the existing `@layer base`.

**Comments are required.** Every file in this codebase explains *why*, not *what*, and often records the option that was rejected. Match that density — a comment-free file will look wrong here.

**Tests sit next to their source.** `Thing.jsx` → `Thing.test.jsx`. Run a single file with
`npx vitest run src/path/Thing.test.jsx`.

**The baseline before you start:** 178 tests across 30 files, `npm run lint` silent, `npm run build` green with `index-*.js` at 116.63 kB gzipped. If any of those move for a reason this plan does not predict, stop.

**Three facts read out of `node_modules`, not assumed:**

1. `viewTransition?: boolean` exists on `LinkProps` and `NavLinkProps` in react-router 8.3.
2. `useViewTransitionState(to)` (`lib/dom/lib.js:1261`) returns `false` unless a view transition is in flight, and otherwise returns true if `to` matches **either the next location or the current one**. That "or the current one" is what makes the morph work in reverse, and it is also what causes the collision Task 8 defends against.

3. **`useViewTransitionState` throws outside a data router.** Its second line calls `useDataRouterContext`, which is `invariant(ctx, ...)` on the `DataRouterContext` (`lib/hooks.js:816-819`). The app is fine — `createBrowserRouter` provides it — but **every test that renders `ProductCard` uses `MemoryRouter`, which does not.** Three test files are affected, and Task 8 mocks the hook in all three. Miss one and it fails with `useViewTransitionState must be used within a data router`, which reads like a bug in the component rather than in the test.

---

## File structure

### Created

| File | Responsibility |
| --- | --- |
| `src/lib/motion.js` | The three presets as data, the shared view-transition name, and a tiny store so a preset change re-renders `Reveal`. |
| `src/lib/motion.test.js` | Preset shape, the custom properties written, store notification. |
| `src/hooks/useMotionPreset.js` | Subscribes a component to the active preset. |
| `src/hooks/useMotionPreset.test.jsx` | Re-render on change. |
| `src/components/Reveal.jsx` | One scroll reveal, used twice. The only place `whileInView` appears. |
| `src/components/Reveal.test.jsx` | Renders children, animates once only. |
| `src/components/MotionPresetSwitcher.jsx` | Dev-only preset control. Deleted after the choice. |

### Modified

| File | Change |
| --- | --- |
| `src/index.css` | Motion tokens on `:root`; route view-transition rules and keyframes; the theme swap scoped so it keeps its own 340ms; reduced-motion guard extended. |
| `src/context/ThemeContext.jsx` | Marks the root element during a theme swap so CSS can tell the two kinds of transition apart. |
| `src/test/setup.js` | `IntersectionObserver` stub — jsdom has none and `whileInView` needs it. |
| `src/sections/FeaturedProducts.jsx` | Wrapped in `Reveal`; `viewTransition` on its link. |
| `src/sections/Story.jsx` | Wrapped in `Reveal`; `viewTransition` on its link. |
| `src/components/Nav.jsx`, `Footer.jsx`, `ProductCard.jsx`, `Gallery.jsx` | `viewTransition` on links; shared photo name. |
| `src/routes/Cart.jsx`, `NotFound.jsx`, `ProductDetail.jsx`, `src/sections/Hero.jsx`, `src/components/CartDrawer.jsx` | `viewTransition` on links; related cards opt out of the shared name. |
| `src/layouts/RootLayout.jsx` | Mounts the dev-only switcher. |

---

### Task 1: The preset module

**Files:**

- Create: `client/src/lib/motion.js`
- Test: `client/src/lib/motion.test.js`

- [ ] **Step 1: Write the failing test**

Create `client/src/lib/motion.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    MOTION_PRESETS,
    DEFAULT_PRESET,
    PRODUCT_PHOTO_VT,
    applyMotionPreset,
    getMotionPreset,
    setMotionPreset,
    subscribeMotionPreset,
} from './motion';

describe('motion presets', () => {
    beforeEach(() => {
        setMotionPreset(DEFAULT_PRESET);
    });

    it('gives every preset the same shape', () => {
        const names = Object.keys(MOTION_PRESETS);
        expect(names).toEqual(['quiet', 'deliberate', 'cinematic']);

        names.forEach((name) => {
            const preset = MOTION_PRESETS[name];
            expect(typeof preset.duration).toBe('number');
            expect(typeof preset.shift).toBe('number');
            expect(Array.isArray(preset.ease)).toBe(true);
            expect(preset.ease).toHaveLength(4);
        });
    });

    it('ships quiet as the default', () => {
        expect(DEFAULT_PRESET).toBe('quiet');
        expect(getMotionPreset()).toBe('quiet');
    });

    // The CSS rules and the JS reveal have to read the same numbers. This is
    // the seam where they could drift apart, so it is asserted.
    it('writes the active preset onto the document element as custom properties', () => {
        applyMotionPreset('cinematic');

        const style = document.documentElement.style;
        expect(style.getPropertyValue('--motion-duration')).toBe('520ms');
        expect(style.getPropertyValue('--motion-shift')).toBe('40px');
        expect(style.getPropertyValue('--motion-ease')).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
    });

    it('notifies subscribers when the preset changes', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeMotionPreset(listener);

        setMotionPreset('deliberate');

        expect(listener).toHaveBeenCalledOnce();
        expect(getMotionPreset()).toBe('deliberate');

        unsubscribe();
        setMotionPreset('quiet');
        expect(listener).toHaveBeenCalledOnce();
    });

    it('ignores a preset name it does not know', () => {
        setMotionPreset('nonsense');
        expect(getMotionPreset()).toBe('quiet');
    });

    it('exports one shared name for the product photograph', () => {
        expect(PRODUCT_PHOTO_VT).toBe('product-photo');
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/motion.test.js`
Expected: FAIL — `Failed to resolve import "./motion"`.

- [ ] **Step 3: Write the implementation**

Create `client/src/lib/motion.js`:

```js
/**
 * The site's motion vocabulary, as data.
 *
 * Two consumers read the same numbers and would otherwise drift apart: the
 * view-transition rules in index.css, which need CSS values, and Reveal, which
 * needs numbers Motion can interpolate. Storing the numbers once and deriving
 * the CSS from them is what keeps a 180ms page transition and a 180ms section
 * reveal actually the same 180ms.
 *
 * `duration` is milliseconds because CSS wants milliseconds; Reveal divides by
 * 1000, because Motion wants seconds. `ease` is the control points of a cubic
 * bezier, which both sides can express.
 */
export const MOTION_PRESETS = {
    // Noticeable as smoothness rather than as an effect, and short enough that
    // it cannot make a navigation feel slower than it already is.
    quiet: { duration: 180, shift: 10, ease: [0.16, 1, 0.3, 1] },
    // Visible direction. A reader registers a designed transition.
    deliberate: { duration: 320, shift: 24, ease: [0.16, 1, 0.3, 1] },
    // The hero's camera language applied to the whole page.
    cinematic: { duration: 520, shift: 40, ease: [0.16, 1, 0.3, 1] },
};

export const DEFAULT_PRESET = 'quiet';

/**
 * The shared name for the product photograph that morphs from a card into the
 * detail page.
 *
 * One generic name rather than one per slug, and deliberately so: two elements
 * holding the same view-transition-name at the same moment abort the entire
 * transition, so exactly one photograph is ever allowed to carry it. Which one
 * is decided by useViewTransitionState — see ProductCard.
 */
export const PRODUCT_PHOTO_VT = 'product-photo';

const toCssEase = ([a, b, c, d]) => `cubic-bezier(${a}, ${b}, ${c}, ${d})`;

/**
 * Writes a preset onto the document element.
 *
 * The defaults also live in index.css on :root, so production never has to call
 * this — the CSS is correct before any JavaScript runs. This exists for the
 * dev-only switcher, and goes when the switcher goes.
 */
export const applyMotionPreset = (name) => {
    const preset = MOTION_PRESETS[name];
    if (!preset) return;

    const { style } = document.documentElement;
    style.setProperty('--motion-duration', `${preset.duration}ms`);
    style.setProperty('--motion-shift', `${preset.shift}px`);
    style.setProperty('--motion-ease', toCssEase(preset.ease));
};

// A three-line store rather than a Context: Reveal is the only subscriber, and
// a provider around the whole tree would be more machinery to unpick when the
// switcher is deleted.
let current = DEFAULT_PRESET;
const listeners = new Set();

export const getMotionPreset = () => current;

export const subscribeMotionPreset = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const setMotionPreset = (name) => {
    if (!MOTION_PRESETS[name]) return;
    current = name;
    applyMotionPreset(name);
    listeners.forEach((listener) => listener());
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/motion.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/motion.js client/src/lib/motion.test.js
git commit -m "feat: hold the motion vocabulary in one module"
```

---

### Task 2: An IntersectionObserver for jsdom

**Files:**

- Modify: `client/src/test/setup.js`

jsdom does not implement `IntersectionObserver`. Motion's `whileInView` constructs one, so every test that renders `Reveal` — including the existing `Home` and section tests once Task 5 lands — would throw `IntersectionObserver is not defined`. This is the same class of gap as the `ResizeObserver` guard the nav droplet needed.

- [ ] **Step 1: Write the stub**

Replace the contents of `client/src/test/setup.js`:

```js
import '@testing-library/jest-dom';

// jsdom implements no IntersectionObserver, and Motion's whileInView constructs
// one on mount. Without this, every test that renders a Reveal throws before it
// asserts anything.
//
// It is deliberately inert: it never reports an intersection, so a reveal in a
// test stays in its initial state. That is the right default — a test asserting
// that content is present should not depend on a scroll position jsdom does not
// have. Motion still renders the children either way, which is what the tests
// check.
class IntersectionObserverStub {
    constructor(callback) {
        this.callback = callback;
    }

    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
}

globalThis.IntersectionObserver = IntersectionObserverStub;
```

- [ ] **Step 2: Run the whole suite to verify nothing regressed**

Run: `npm test`
Expected: PASS — 178 tests, 30 files. The stub adds a global; nothing should change yet.

- [ ] **Step 3: Commit**

```bash
git add client/src/test/setup.js
git commit -m "test: stub IntersectionObserver for jsdom"
```

---

### Task 3: The preset hook

**Files:**

- Create: `client/src/hooks/useMotionPreset.js`
- Test: `client/src/hooks/useMotionPreset.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/useMotionPreset.test.jsx`:

```jsx
import { describe, it, expect, afterEach, act } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { useMotionPreset } from './useMotionPreset';
import { setMotionPreset, DEFAULT_PRESET, MOTION_PRESETS } from '../lib/motion';

const Probe = () => {
    const preset = useMotionPreset();
    return <span data-testid="duration">{preset.duration}</span>;
};

describe('useMotionPreset', () => {
    afterEach(() => {
        cleanup();
        setMotionPreset(DEFAULT_PRESET);
    });

    it('returns the active preset object, not its name', () => {
        render(<Probe />);
        expect(screen.getByTestId('duration')).toHaveTextContent(String(MOTION_PRESETS.quiet.duration));
    });

    it('re-renders the consumer when the preset changes', () => {
        render(<Probe />);

        act(() => setMotionPreset('cinematic'));

        expect(screen.getByTestId('duration')).toHaveTextContent(String(MOTION_PRESETS.cinematic.duration));
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useMotionPreset.test.jsx`
Expected: FAIL — `Failed to resolve import "./useMotionPreset"`.

- [ ] **Step 3: Write the implementation**

Create `client/src/hooks/useMotionPreset.js`:

```js
import { useSyncExternalStore } from 'react';
import { MOTION_PRESETS, getMotionPreset, subscribeMotionPreset } from '../lib/motion';

/**
 * The preset currently in force, as the object rather than the name.
 *
 * useSyncExternalStore rather than useState + an effect because the store lives
 * outside React and can be written by the dev switcher at any time; this is the
 * hook React provides for exactly that, and it does not tear under concurrent
 * rendering.
 *
 * The snapshot is the preset *name* — a string, so it is referentially stable
 * and the store does not have to hand back the same object identity each time.
 */
export const useMotionPreset = () =>
    MOTION_PRESETS[useSyncExternalStore(subscribeMotionPreset, getMotionPreset, getMotionPreset)];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useMotionPreset.test.jsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useMotionPreset.js client/src/hooks/useMotionPreset.test.jsx
git commit -m "feat: subscribe components to the active motion preset"
```

---

### Task 4: The Reveal component

**Files:**

- Create: `client/src/components/Reveal.jsx`
- Test: `client/src/components/Reveal.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/Reveal.test.jsx`:

```jsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// The point of these assertions is the props handed to Motion, not the pixels —
// jsdom has no layout and no scrolling, so an intersection can never actually
// fire here. Standing motion.div up as a plain div lets the viewport config be
// inspected directly.
const captured = { viewport: null, initial: null };

vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, className, viewport, initial }) => {
            captured.viewport = viewport;
            captured.initial = initial;
            return <div className={className}>{children}</div>;
        },
    },
}));

// A plain import is enough — vi.mock is hoisted above it by the transform.
import Reveal from './Reveal';

describe('Reveal', () => {
    afterEach(cleanup);

    it('renders its children', () => {
        render(<Reveal><p>Selected pieces</p></Reveal>);
        expect(screen.getByText('Selected pieces')).toBeInTheDocument();
    });

    // A section that re-animates every time it scrolls back into view turns a
    // page into a slideshow. Once is the whole behaviour, so it is pinned.
    it('animates once and never again', () => {
        render(<Reveal><p>Our process</p></Reveal>);
        expect(captured.viewport.once).toBe(true);
    });

    it('starts below its resting position by the preset shift', () => {
        render(<Reveal><p>Our process</p></Reveal>);
        expect(captured.initial).toEqual({ opacity: 0, y: 10 });
    });

    it('passes className through so the section keeps its own layout', () => {
        const { container } = render(<Reveal className="max-container"><p>x</p></Reveal>);
        expect(container.firstChild).toHaveClass('max-container');
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Reveal.test.jsx`
Expected: FAIL — `Failed to resolve import "./Reveal"`.

- [ ] **Step 3: Write the implementation**

Create `client/src/components/Reveal.jsx`:

```jsx
import { motion } from 'motion/react';
import { useMotionPreset } from '../hooks/useMotionPreset';

/**
 * A section arriving as it is scrolled to.
 *
 * One component rather than the props repeated at each call site, so the two
 * home sections cannot drift apart and so there is one place to delete this
 * from if it turns out to be a mistake.
 *
 * `once: true` is the important prop. A section that re-animates every time it
 * passes the viewport turns a page into a slideshow and makes scrolling back up
 * feel broken.
 *
 * `amount: 0.2` fires when a fifth of the section is showing rather than
 * waiting for all of it — a full-bleed section taller than the viewport would
 * otherwise never reach its own threshold and would never appear at all.
 *
 * Reduced motion needs nothing here: MotionConfig in RootLayout is set to
 * reducedMotion="user", which makes Motion snap this to its animate state
 * instead of tweening it.
 */
const Reveal = ({ children, className = '' }) => {
    const { duration, shift, ease } = useMotionPreset();

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: shift }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: duration / 1000, ease }}
        >
            {children}
        </motion.div>
    );
};

export default Reveal;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/Reveal.test.jsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Reveal.jsx client/src/components/Reveal.test.jsx
git commit -m "feat: add a scroll reveal for the home sections"
```

---

### Task 5: Reveal the two home sections

**Files:**

- Modify: `client/src/sections/FeaturedProducts.jsx:24-46`
- Modify: `client/src/sections/Story.jsx:14-42`

Home only. The inner routes are short and task-focused, and a reveal in front of a cart delays something a person is trying to read.

- [ ] **Step 1: Wrap FeaturedProducts**

In `client/src/sections/FeaturedProducts.jsx`, add the import:

```jsx
import Reveal from '../components/Reveal';
```

Then change the returned JSX so `Reveal` wraps the section's contents. Replace the opening and closing of the `<section>` element:

```jsx
    return (
        <section id="featured" className="max-container padding-x py-24">
            {/* The Reveal is inside the section rather than around it, so the
                section keeps its id as a scroll target and its own padding.
                Wrapping the outside would move the anchor onto a div and put a
                transform on the element ScrollToHash scrolls to. */}
            <Reveal>
                <div className="flex justify-between items-end gap-6">
                    <h2 className="font-display text-(length:--text-display) leading-tight">
                        Selected <em className="text-accent italic">pieces</em>
                    </h2>
                    <Link
                        to="/products"
                        viewTransition
                        className="flex items-center gap-2 text-sm text-text-muted hover:text-text
                                   underline underline-offset-4 transition-colors duration-200 shrink-0"
                    >
                        View all <LuArrowRight size={15} />
                    </Link>
                </div>

                <div className="mt-12 grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-5">
                    {loading
                        ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)
                        : products.map((product) => (
                            <ProductCard key={product.id} product={product} onAdd={addItem} />
                        ))}
                </div>
            </Reveal>
        </section>
    );
```

- [ ] **Step 2: Wrap Story**

In `client/src/sections/Story.jsx`, add the import:

```jsx
import Reveal from '../components/Reveal';
```

Then wrap the inner column, leaving `PhotoBackdrop` and the padding wrapper outside it:

```jsx
const Story = () => (
    <PhotoBackdrop image={logArrangement}>
        <div id="about" className="max-container padding-x py-28 scroll-mt-24">
            {/* Only the copy column reveals. Revealing the photograph as well
                would fade the section's own background in behind its text,
                which reads as the page failing to load rather than as motion. */}
            <Reveal className="max-w-184">
                <p className="eyebrow">Our process</p>
                <h2 className="font-display text-(length:--text-display) leading-tight mt-4 text-balance">
                    Grown slowly, <em className="text-accent italic">made by hand</em>
                </h2>
                <p className="mt-6 text-text-muted leading-relaxed max-w-[65ch] text-pretty">
                    Every piece begins with moss gathered under licence from managed Nordic
                    woodland, taken in small quantities so the ground recovers before we return.
                </p>
                <p className="mt-4 text-text-muted leading-relaxed max-w-[65ch] text-pretty">
                    In the studio it is cleaned and preserved with a plant-based glycerin
                    solution. That halts ageing permanently, so the moss keeps its colour and
                    softness for years with no water and no light.
                </p>
                <Link
                    to="/products"
                    viewTransition
                    className="inline-flex items-center gap-2 mt-8 text-accent
                               underline underline-offset-4
                               hover:[&>svg]:translate-x-1 [&>svg]:transition-transform [&>svg]:duration-200"
                >
                    See the collection <LuArrowRight size={16} />
                </Link>
            </Reveal>
        </div>
    </PhotoBackdrop>
);
```

Note the `max-w-184` moved from the `div` it replaced onto `Reveal` — the `div` is gone, so its width constraint has to travel with it.

- [ ] **Step 3: Run the suite**

Run: `npm test`
Expected: PASS — still 178 tests. The `IntersectionObserver` stub from Task 2 never fires, so revealed content stays at its initial opacity but is still in the DOM, which is what the existing assertions check.

If a test fails here on missing content, the cause is the mock in that test file rather than this change — check it is not asserting on inline styles.

- [ ] **Step 4: Commit**

```bash
git add client/src/sections/FeaturedProducts.jsx client/src/sections/Story.jsx
git commit -m "feat: reveal the two home sections on scroll"
```

---

### Task 6: The CSS, and keeping the theme swap out of it

**Files:**

- Modify: `client/src/index.css` (the `@layer base` block, around lines 140–170)
- Modify: `client/src/context/ThemeContext.jsx:43-54`

The theme swap already animates `::view-transition-old(root)` and `::view-transition-new(root)` at 340ms. Route transitions use the same two pseudo-elements, so without a way to tell them apart, changing one changes the other — and the theme crossfade was tuned and approved at 340ms with no translation. The root element gets marked during a theme swap so the CSS can distinguish them.

- [ ] **Step 1: Add the motion tokens to `:root`**

In `client/src/index.css`, inside the existing `@layer base` `:root` block, add:

```css
    /* The motion vocabulary, mirroring src/lib/motion.js. These are the `quiet`
       preset's numbers, which is what ships. The dev-only switcher overwrites
       them at runtime; production never touches them, so the CSS is already
       correct before any JavaScript has run. */
    --motion-duration: 180ms;
    --motion-shift: 10px;
    --motion-ease: cubic-bezier(0.16, 1, 0.3, 1);
```

- [ ] **Step 2: Replace the view-transition rules**

Find this block in `client/src/index.css`:

```css
  /* The theme swap, crossfaded by the compositor. Finally puts --ease-out-soft
     to work: it was defined and referenced nowhere. */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 340ms;
    animation-timing-function: var(--ease-out-soft);
  }
```

Replace it with:

```css
  /* Two different things animate these same two pseudo-elements: a route
     change and a theme swap. They want different motion — a page should travel,
     a colour scheme should only crossfade — so the theme swap marks the root
     element while it runs and takes the scoped rules further down. */
  @keyframes vt-page-out {
    to { opacity: 0; transform: translateY(calc(var(--motion-shift) * -1)); }
  }

  @keyframes vt-page-in {
    from { opacity: 0; transform: translateY(var(--motion-shift)); }
  }

  ::view-transition-old(root) {
    animation: vt-page-out var(--motion-duration) var(--motion-ease) both;
  }

  ::view-transition-new(root) {
    animation: vt-page-in var(--motion-duration) var(--motion-ease) both;
  }

  /* The photograph that travels from a product card into the detail page. The
     browser morphs the group between its two measured boxes on its own; this
     only matches its timing to everything else. */
  ::view-transition-group(product-photo) {
    animation-duration: var(--motion-duration);
    animation-timing-function: var(--motion-ease);
  }

  /* The theme swap, crossfaded by the compositor, unchanged at 340ms. Finally
     puts --ease-out-soft to work: it was defined and referenced nowhere.

     No translation on purpose. A page that slides is a page changing; a page
     that slides because the colours changed is the interface lying about what
     just happened. */
  @keyframes vt-fade-out {
    to { opacity: 0; }
  }

  @keyframes vt-fade-in {
    from { opacity: 0; }
  }

  :root[data-view-transition='theme']::view-transition-old(root) {
    animation: vt-fade-out 340ms var(--ease-out-soft) both;
  }

  :root[data-view-transition='theme']::view-transition-new(root) {
    animation: vt-fade-in 340ms var(--ease-out-soft) both;
  }
```

- [ ] **Step 3: Extend the reduced-motion guard**

Find the reduced-motion block and replace its view-transition rule:

```css
  @media (prefers-reduced-motion: reduce) {
    /* Belt and braces. ThemeProvider already skips startViewTransition
       entirely under reduced motion, so this only catches a transition
       started before the preference changed. */
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
    }
```

with:

```css
  @media (prefers-reduced-motion: reduce) {
    /* Belt and braces, and now it has more to catch. ThemeProvider skips
       startViewTransition entirely under reduced motion, but react-router does
       not — it will still run one for a link with viewTransition set. Killing
       the animation makes that transition instant, which is the same thing an
       unsupported browser does.

       The universal selector further down does not reach these: the
       view-transition tree is generated, not part of the document. */
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation: none !important;
    }
```

- [ ] **Step 4: Mark the root during a theme swap**

In `client/src/context/ThemeContext.jsx`, replace the body of `withTransition`:

```jsx
    const withTransition = useCallback((swap) => {
        if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
            swap();
            return;
        }

        // A route change animates the same ::view-transition-old(root) and
        // ::view-transition-new(root) as this does, and wants different motion —
        // it travels, this only crossfades. The attribute is what lets index.css
        // tell the two apart, and it is removed again the moment the transition
        // settles so a later route change is not mistaken for a theme swap.
        const root = document.documentElement;
        root.dataset.viewTransition = 'theme';

        // startViewTransition captures the "before" frame, then expects the
        // callback to have applied the change by the time it returns. React
        // batches by default, so without flushSync the snapshot would be taken
        // and released before the theme attribute ever changed.
        const transition = document.startViewTransition(() => flushSync(swap));

        // Optional chaining because a test double may return nothing at all,
        // and a cleanup that throws would leave the attribute stuck on.
        transition?.finished?.finally(() => {
            delete root.dataset.viewTransition;
        });
    }, []);
```

- [ ] **Step 5: Run the theme tests**

Run: `npx vitest run src/context/ThemeContext.test.jsx`
Expected: PASS — unchanged count. The existing spy at `ThemeContext.test.jsx:82` already returns `{ finished, ready }`, so the `.finally` resolves.

- [ ] **Step 6: Run the full suite and the build**

Run: `npm test && npm run build`
Expected: 178 tests pass; build green.

- [ ] **Step 7: Commit**

```bash
git add client/src/index.css client/src/context/ThemeContext.jsx
git commit -m "feat: animate route view transitions, scope the theme swap"
```

---

### Task 7: Turn the transitions on

**Files:**

- Modify: `client/src/components/Nav.jsx:84`, `:101`, `:201`
- Modify: `client/src/components/Footer.jsx:11`, `:49`
- Modify: `client/src/components/ProductCard.jsx:106`
- Modify: `client/src/components/CartDrawer.jsx:110`, `:180`
- Modify: `client/src/routes/Cart.jsx:24`, `:49`
- Modify: `client/src/routes/NotFound.jsx:9`
- Modify: `client/src/routes/ProductDetail.jsx:65`
- Modify: `client/src/sections/Hero.jsx:135`

`FeaturedProducts.jsx` and `Story.jsx` were done in Task 5.

Nothing animates until this task: `viewTransition` is opt-in per link, so a route change without it stays instant.

- [ ] **Step 1: Add the prop to every navigation link**

Add `viewTransition` to each `<Link>` and `<NavLink>` at the lines above. For links written on one line, this is the shape:

```jsx
<Link to="/" viewTransition className="flex items-center gap-2.5 text-accent">
```

And for `Button as={Link}`, the prop passes straight through — `Button` spreads its remaining props onto whatever it renders, so no change to `Button.jsx` is needed:

```jsx
<Button as={Link} to="/products" viewTransition onClick={closeDrawer} variant="outline">
```

`SkipLink.jsx` is deliberately excluded: it is a plain same-page `href`, not a router link, and it moves focus rather than navigating.

- [ ] **Step 2: Verify every navigation link is covered**

A line-by-line grep cannot do this — most of these links are written across several lines, so `<Link` and `viewTransition` never share one. Count instead:

```bash
grep -rno "\bviewTransition\b" client/src --include=*.jsx | grep -v "\.test\." | wc -l
```

Expected: **15** — eleven direct `Link`/`NavLink` sites plus the four that go through `Button as={Link}`, with the two from Task 5 included in that total. The word boundary keeps `useViewTransitionState` out of the count, since it has a capital V and no boundary before it.

Fewer than 15 means a link will still change page instantly while its neighbours animate.

- [ ] **Step 3: Run the suite and lint**

Run: `npm test && npm run lint`
Expected: 178 tests pass; lint silent.

- [ ] **Step 4: Commit**

```bash
git add client/src
git commit -m "feat: run a view transition on every navigation link"
```

---

### Task 8: The photograph that travels

**Files:**

- Modify: `client/src/components/ProductCard.jsx:1-4`, `:46-47`, `:91-102`
- Modify: `client/src/components/Gallery.jsx:10`, `:39-46`
- Modify: `client/src/routes/ProductDetail.jsx:78`, and the related-products grid
- Test: `client/src/components/ProductCard.test.jsx`
- Test (mock only): `client/src/routes/Products.test.jsx`, `client/src/routes/ProductDetail.test.jsx`

**The rule that governs this whole task:** two elements holding the same `view-transition-name` at the same moment abort the transition entirely. Exactly one photograph may carry `product-photo` on each side of a navigation.

`useViewTransitionState(to)` returns true when `to` matches the next location **or the current one**. That is what makes the morph run in reverse when going back from the detail page to the grid — and it is also what creates the collision below.

**Two collisions this defends against:**

1. **The cart drawer.** It renders a `Photo` per line. Naming every card's photograph by slug would break the transition for anyone who added a product to the basket and then clicked that product's card. Solved by naming only the card the transition involves; drawer thumbnails are never named.
2. **Related products on the detail page.** `ProductDetail` renders `ProductCard`s underneath the gallery. Click one and the gallery matches the *current* location while the related card matches the *next* one — two named elements on the outgoing page. Solved by `sharePhoto={false}` on the related cards, which leaves the gallery as the only named element and produces a photo-to-photo morph between the two products.

- [ ] **Step 1: Mock the hook in all three test files that render a ProductCard**

`useViewTransitionState` throws outside a data router, and all three of these render through `MemoryRouter`. Add this block to the top of **each** of `client/src/components/ProductCard.test.jsx`, `client/src/routes/Products.test.jsx` and `client/src/routes/ProductDetail.test.jsx`, above the existing imports:

```jsx
// ProductCard calls useViewTransitionState, which asserts it is inside a data
// router — these tests render through MemoryRouter, which is not one. Only that
// hook is replaced; the rest of react-router stays real, so Link, useLocation
// and the routing these tests actually exercise behave normally.
vi.mock('react-router', async () => ({
    ...(await vi.importActual('react-router')),
    useViewTransitionState: vi.fn(() => false),
}));
```

`Products.test.jsx` and `ProductDetail.test.jsx` need nothing else — they never assert on the name, they just have to stop throwing.

- [ ] **Step 2: Make renderCard forward extra props**

In `client/src/components/ProductCard.test.jsx:12-13`, replace the helper. The existing signature takes `onAdd` first and is called that way at line 50, so the new parameter goes second:

```jsx
const renderCard = (onAdd = vi.fn(), props = {}) =>
    render(<MemoryRouter><ProductCard product={product} onAdd={onAdd} {...props} /></MemoryRouter>);
```

- [ ] **Step 3: Write the failing tests**

Add to `client/src/components/ProductCard.test.jsx`, and add `useViewTransitionState` to its `react-router` import. The product fixture at line 7 is named `Glass Sphere`, which is what these query by:

```jsx
// The whole shared-element morph rests on exactly one photograph carrying the
// name at a time. Two would abort the transition outright, and the failure is
// silent — the page just changes with no animation — so it is asserted here
// rather than left to a browser check.
describe('the shared product photograph', () => {
    it('names the photograph while a transition involves this card', () => {
        vi.mocked(useViewTransitionState).mockReturnValue(true);

        renderCard();

        expect(screen.getByAltText('Glass Sphere')).toHaveStyle({
            viewTransitionName: 'product-photo',
        });
    });

    it('leaves the photograph unnamed the rest of the time', () => {
        vi.mocked(useViewTransitionState).mockReturnValue(false);

        renderCard();

        expect(screen.getByAltText('Glass Sphere').style.viewTransitionName).toBe('');
    });

    // Related products on the detail page sit alongside the gallery, which is
    // itself named. Without this opt-out both would carry the name and the
    // transition would abort.
    it('never names the photograph when sharing is switched off', () => {
        vi.mocked(useViewTransitionState).mockReturnValue(true);

        renderCard(vi.fn(), { sharePhoto: false });

        expect(screen.getByAltText('Glass Sphere').style.viewTransitionName).toBe('');
    });
});
```

The `vi.mocked(...)` calls need the hook in scope, so extend the file's existing `react-router` import at line 3:

```jsx
import { MemoryRouter, useViewTransitionState } from 'react-router';
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run src/components/ProductCard.test.jsx`
Expected: FAIL — the three new tests fail on the missing style; the file's existing tests still pass.

- [ ] **Step 5: Name the photograph in ProductCard**

In `client/src/components/ProductCard.jsx`, change the imports:

```jsx
import { Link, useLocation, useViewTransitionState } from 'react-router';
import { motion } from 'motion/react';
import Photo from './Photo';
import { formatPrice } from '../utils/formatPrice';
import { PRODUCT_PHOTO_VT } from '../lib/motion';
```

Change the signature and add the hook:

```jsx
const ProductCard = ({ product, onAdd, sharePhoto = true }) => {
    const { search } = useLocation();
    const to = { pathname: `/products/${product.slug}`, search };

    // True only while a view transition is in flight that involves this card's
    // product — as the destination going in, or as the origin coming back. Every
    // other card returns false, which is what keeps exactly one photograph
    // carrying the name.
    //
    // sharePhoto is the escape hatch for related products on the detail page:
    // there, the gallery is already named, and a second named element would
    // abort the transition rather than degrade it.
    const isMorphing = useViewTransitionState(to) && sharePhoto;
```

Then on the `Photo`, add the style:

```jsx
                <Photo
                    photo={product.images[0]}
                    sizes={CARD_SIZES}
                    alt={product.name}
                    loading="lazy"
                    // Applied only while morphing. A view-transition-name left
                    // on permanently would collide with the cart drawer's
                    // thumbnail of the same product the moment the basket has
                    // it, and a collision aborts the transition silently.
                    style={isMorphing ? { viewTransitionName: PRODUCT_PHOTO_VT } : undefined}
                    className="w-full aspect-square object-cover
                               transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                               group-hover:scale-[1.04] motion-reduce:transition-none
                               motion-reduce:group-hover:scale-100"
                />
```

Finally, reuse `to` in the existing `<Link>` rather than rebuilding the object:

```jsx
                    <Link
                        to={to}
                        viewTransition
                        className="after:absolute after:inset-0 after:z-0"
                    >
```

Keep the existing comment above the `to` prop.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/components/ProductCard.test.jsx`
Expected: PASS — all tests including the three new ones.

- [ ] **Step 7: Let Gallery take a name**

In `client/src/components/Gallery.jsx`, change the signature and the main `Photo`:

```jsx
const Gallery = ({ images, alt, viewTransitionName }) => {
```

```jsx
                    <Photo
                        photo={images[index]}
                        sizes={MAIN_SIZES}
                        alt={alt}
                        // transformOrigin drives the zoom; the name is what the
                        // card's photograph morphs into. Both are inline styles
                        // so they share one object.
                        style={{ transformOrigin: origin, viewTransitionName }}
                        className={`w-full aspect-square object-cover transition-transform duration-500
                                    ${zoomed ? 'scale-[1.8]' : 'scale-100'}`}
                    />
```

An undefined `viewTransitionName` renders no style property at all, so the gallery is unnamed unless a caller asks for it.

- [ ] **Step 8: Wire ProductDetail**

In `client/src/routes/ProductDetail.jsx`, add the import:

```jsx
import { PRODUCT_PHOTO_VT } from '../lib/motion';
```

Name the gallery — unconditionally, because only one product detail page exists at a time:

```jsx
                <Gallery
                    images={product.images}
                    alt={product.name}
                    viewTransitionName={PRODUCT_PHOTO_VT}
                />
```

And switch the related products off. Find the grid that maps `related` through `ProductCard` and add the prop:

```jsx
{related.map((item) => (
    <ProductCard key={item.id} product={item} onAdd={addItem} sharePhoto={false} />
))}
```

- [ ] **Step 9: Run the full suite, lint and build**

Run: `npm test && npm run lint && npm run build`
Expected: 181 tests pass (178 + 3); lint silent; `index-*.js` still at roughly 116.63 kB gzipped — this task adds no library code.

- [ ] **Step 10: Commit**

```bash
git add client/src
git commit -m "feat: morph the product photograph from card to detail page"
```

---

### Task 9: The dev-only intensity switcher

**Files:**

- Create: `client/src/components/MotionPresetSwitcher.jsx`
- Modify: `client/src/layouts/RootLayout.jsx`

This exists to make a decision and is deleted once the decision exists — the same lifecycle as `/lab`, `PaletteSwitcher` and the variant switch. It needs no test: it is scaffolding, and Vite strips it from the production build.

- [ ] **Step 1: Write the switcher**

Create `client/src/components/MotionPresetSwitcher.jsx`:

```jsx
import { useEffect } from 'react';
import { MOTION_PRESETS, DEFAULT_PRESET, getMotionPreset, setMotionPreset } from '../lib/motion';
import { useMotionPreset } from '../hooks/useMotionPreset';

const STORAGE_KEY = 'moss:motion-preset';

/**
 * Dev-only. Flips the site between the three motion presets so the loudness of
 * the page transitions gets chosen by looking at the real site rather than by
 * describing it in a document.
 *
 * Delete this file, the hook, the store in lib/motion.js and the two losing
 * presets once the choice is made.
 *
 * It is rendered behind import.meta.env.DEV in RootLayout, so Vite removes the
 * whole branch from the production build — the same arrangement PaletteSwitcher
 * used, which is why the shipped bundle never carried it.
 */
const MotionPresetSwitcher = () => {
    const active = useMotionPreset();

    // Restored on mount rather than held in React state, because the preset
    // outlives the component: a reload during a comparison should not silently
    // put the site back to the default and make the last thing judged the wrong
    // one.
    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) setMotionPreset(stored);
    }, []);

    const choose = (name) => {
        setMotionPreset(name);
        window.localStorage.setItem(STORAGE_KEY, getMotionPreset());
    };

    return (
        <div className="fixed bottom-4 left-4 z-[100] flex items-center gap-1 rounded-full
                        border border-border bg-surface/90 p-1 text-xs backdrop-blur-md">
            {Object.entries(MOTION_PRESETS).map(([name, preset]) => (
                <button
                    key={name}
                    type="button"
                    onClick={() => choose(name)}
                    className={`rounded-full px-3 py-1.5 cursor-pointer transition-colors duration-150 ${
                        active === preset ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-text'
                    }`}
                >
                    {name} <span className="opacity-60">{preset.duration}ms</span>
                </button>
            ))}
            <button
                type="button"
                onClick={() => {
                    window.localStorage.removeItem(STORAGE_KEY);
                    setMotionPreset(DEFAULT_PRESET);
                }}
                className="rounded-full px-2 py-1.5 text-text-muted hover:text-text cursor-pointer"
                aria-label="Reset the motion preset"
            >
                ×
            </button>
        </div>
    );
};

export default MotionPresetSwitcher;
```

- [ ] **Step 2: Mount it**

In `client/src/layouts/RootLayout.jsx`, add the import and render it inside the outer `div`, after `<BackToTop />`:

```jsx
import MotionPresetSwitcher from '../components/MotionPresetSwitcher';
```

```jsx
            {/* Dev-only, and deleted along with the store in lib/motion.js once
                a preset has been chosen. import.meta.env.DEV is a literal at
                build time, so this whole branch — and the import above with it —
                is dropped from the production bundle. */}
            {import.meta.env.DEV && <MotionPresetSwitcher />}
```

- [ ] **Step 3: Confirm it does not ship**

Run: `npm run build && grep -rl "moss:motion-preset" dist/assets/ || echo "not bundled"`
Expected: `not bundled`. A filename printed instead means the guard is not working and the switcher shipped.

- [ ] **Step 4: Run the suite and lint**

Run: `npm test && npm run lint`
Expected: 181 tests pass; lint silent.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/MotionPresetSwitcher.jsx client/src/layouts/RootLayout.jsx
git commit -m "feat: add a dev-only motion intensity switcher"
```

---

### Task 10: Verify it in a real browser

**Files:** none — this task changes nothing and produces findings.

Three things cannot be settled by reading, and two of them are failure modes that leave no error message. Use the project's `run-client` skill to start the dev server.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` from `client/`, and open the printed URL.

- [ ] **Step 2: Check the forward morph**

Go to `/products`, click a card. The photograph should travel and resize from the card into the gallery rather than the whole page crossfading over it.

If the whole page crossfades and the photograph does not travel, the cause is almost certainly a duplicate `view-transition-name`. Chrome logs it. Open the console and look for a message naming `product-photo`.

- [ ] **Step 3: Check the reverse morph**

From the detail page, press the browser Back button, then repeat with the breadcrumb link. The photograph should travel back into its card in the grid.

`useViewTransitionState` matching the current location is what should make this work; if it does not, record what actually happens rather than patching around it.

- [ ] **Step 4: Check the related-products collision**

On a detail page, scroll to related products and click one. The gallery photograph should morph into the new gallery photograph. A hard cut with no animation means both elements claimed the name and `sharePhoto={false}` is not being applied.

- [ ] **Step 5: Check the drawer collision**

Add a product to the basket, leave the drawer open, then click that same product's card. The transition must still run — this is the case the naming rule exists for.

- [ ] **Step 6: Check the outgoing snapshot's scroll offset**

Scroll to the bottom of `/products`, click a card, and watch the outgoing page. If it snaps to the top before it fades, react-router's scroll restoration and the transition snapshot are disagreeing. Record it; do not fix it inside this task.

- [ ] **Step 7: Check the theme swap is untouched**

Toggle the theme on any page. It must still be a plain crossfade at 340ms with no vertical movement. Movement here means the `data-view-transition` attribute is not being set or not being read.

- [ ] **Step 8: Check reduced motion**

Turn on the OS reduced-motion setting, reload, and navigate. Pages should change instantly and the sections should be present at full opacity, not stuck invisible. A section that never appears is the serious failure — it means content is unreachable, not merely unanimated.

- [ ] **Step 9: Compare the presets**

Cycle the switcher through `quiet`, `deliberate` and `cinematic` while navigating, in both themes. This is the decision the whole task exists to serve, and it is Slav's call, not the implementer's.

- [ ] **Step 10: Record the findings**

Write what was observed for steps 2–8 into the session summary — particularly anything that failed. Do not mark this plan complete with an unexplained failure in it.

---

## After the choice

Not part of this plan, and not to be done without Slav picking a preset first:

- Delete `MotionPresetSwitcher.jsx`, `useMotionPreset.js`, and the store and `applyMotionPreset` from `lib/motion.js`.
- Reduce `MOTION_PRESETS` to the winner's numbers as plain constants, and update `index.css` to match.
- `Reveal` reads those constants directly instead of the hook.
- Update `docs/current-feature.md`.
