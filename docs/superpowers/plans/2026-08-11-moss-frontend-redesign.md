# Moss Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `client/` as a four-route storefront with a Scandinavian Moss design system, a working cart, and no reliance on the backend.

**Architecture:** React Router with a layout route wrapping every page. Cart and theme state live in Context with `useReducer`. All product reads go through `lib/api.js`, which returns mock data today and becomes `fetch` calls later without touching a single component.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4 (CSS-first `@theme`), React Router 7, Motion 13, Vitest + Testing Library.

Spec: `docs/superpowers/specs/2026-08-11-moss-frontend-redesign-design.md`

---

## File structure

```text
client/
├── public/                  favicon.svg, apple-touch-icon.png, robots.txt
├── scripts/optimise-images.mjs
└── src/
    ├── main.jsx             router mount + providers
    ├── router.jsx           route table
    ├── index.css            tokens, base, utilities
    ├── layouts/RootLayout.jsx
    ├── routes/              Home, Products, ProductDetail, Cart, NotFound
    ├── sections/            Hero, FeaturedProducts, Story  (home only)
    ├── components/          Logo, Nav, MobileNav, Footer, ThemeToggle, Button,
    │                        ProductCard, ProductCardSkeleton, PageHeader,
    │                        FilterBar, Gallery, QuantityStepper, CartDrawer, Toast
    ├── context/             ThemeContext.jsx, CartContext.jsx
    ├── hooks/               useLocalStorage.js, useReducedMotion.js
    ├── lib/                 api.js
    ├── utils/               formatPrice.js
    ├── data/                products.js
    ├── constants/           index.js  (nav/footer/social only)
    └── assets/
        ├── brand/           hero.webp
        └── images/          product photography
```

Each file has one responsibility. `lib/api.js` is the only module that knows where product data comes from.

---

## Phase 1 — Foundations

### Task 1: Optimise the hero image and restructure assets

`Design-10.png` is 7MB and is currently used as both the Nav/Footer logo and nothing else. It becomes the hero image only.

**Files:**

- Create: `client/scripts/optimise-images.mjs`
- Create: `client/src/assets/brand/` (directory)
- Modify: `client/package.json`

- [ ] **Step 1: Install sharp**

```bash
cd client && npm install -D sharp
```

- [ ] **Step 2: Write the conversion script**

Create `client/scripts/optimise-images.mjs`:

```js
// One-off image optimiser. Run with: npm run images
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'src/assets/icons/Design-10.png';
const OUT_DIR = 'src/assets/brand';

await mkdir(OUT_DIR, { recursive: true });

// Hero: 2000px wide is ample for a 15% Ken Burns zoom on a 4K display.
const info = await sharp(SRC)
    .resize(2000, null, { withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(`${OUT_DIR}/hero.webp`);

console.log(`hero.webp  ${(info.size / 1024).toFixed(0)} KB  ${info.width}x${info.height}`);

// iOS home-screen icon. Safari still ignores SVG favicons, so the logo is
// rasterised once at 180px on the dark background colour.
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#121815"/>
  <path d="M26.2 16.5 A10.2 10.2 0 1 1 16 6.3" stroke="#a3bfa8" stroke-width="1.8"
        stroke-linecap="round" fill="none"/>
  <path d="M9 18 Q9.9 13.8 11.9 15.9 Q13.2 12 15.2 15 Q16.8 11.4 18.8 14.8
           Q20.6 13 21.9 16.4 Q22.7 15.4 23 18 Q23.9 19.4 24.14 21
           A9.3 9.3 0 0 1 7.86 21 Q8.1 19.4 9 18 Z" fill="#a3bfa8"/>
  <circle cx="21.6" cy="9.6" r="2" fill="#a3bfa8" opacity="0.85"/>
</svg>`;

await sharp(Buffer.from(LOGO)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('apple-touch-icon.png  180x180');
```

- [ ] **Step 3: Add the script to package.json**

In `client/package.json`, add to `scripts`:

```json
"images": "node scripts/optimise-images.mjs"
```

- [ ] **Step 4: Run it and check the size**

```bash
cd client && npm run images
```

Expected: prints something like `hero.webp  310 KB  2000x1526` then `apple-touch-icon.png  180x180`. Anything under 500KB for the hero is acceptable; if it exceeds that, drop quality to 70 and rerun.

- [ ] **Step 5: Reference the touch icon**

In `client/index.html`, add inside `<head>`:

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- [ ] **Step 6: Commit**

```bash
git add client/scripts/optimise-images.mjs client/package.json client/package-lock.json \
        client/src/assets/brand/hero.webp client/public/apple-touch-icon.png client/index.html
git commit -m "perf: convert hero image to webp, 7MB to under 500KB"
```

---

### Task 2: Rebuild the stylesheet with design tokens

The current `index.css` imports four font families while using two, imports Palanquin twice, and defines `--font-size-*` tokens using Tailwind v3 array syntax that does nothing in a v4 `@theme` block.

**Files:**

- Modify: `client/src/index.css` (full replacement)

- [ ] **Step 1: Replace the whole file**

Replace the entire contents of `client/src/index.css` with:

```css
@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@300;400;500;600;700&display=swap");
@import "tailwindcss";

/* Runtime-swappable palette. @theme inline below points Tailwind's colour
   utilities at these variables, so changing data-theme restyles everything
   without any component knowing a theme exists. */
@layer base {
  :root {
    --bg: #121815;
    --surface: #1a221e;
    --raised: #232c27;
    --border: #2e3833;
    --accent: #a3bfa8;
    --accent-strong: #c2d6c4;
    --stone: #5c6b61;
    --text: #e8ebe6;
    --text-muted: #9aa89e;
    --on-accent: #121815;
  }

  [data-theme="light"] {
    --bg: #f4f2ed;
    --surface: #fbfaf7;
    --raised: #ffffff;
    --border: #dfe0d9;
    --accent: #4a5f50;
    --accent-strong: #35473b;
    --stone: #8a9689;
    --text: #1c221e;
    --text-muted: #5f6b63;
    --on-accent: #ffffff;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }

  /* Every interactive element gets a visible focus ring. */
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-raised: var(--raised);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-strong: var(--accent-strong);
  --color-stone: var(--stone);
  --color-text: var(--text);
  --color-text-muted: var(--text-muted);
  --color-on-accent: var(--on-accent);

  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Inter", system-ui, sans-serif;

  --text-eyebrow: 0.72rem;
  --text-hero: clamp(2.75rem, 1.6rem + 5.2vw, 6rem);
  --text-display: clamp(2rem, 1.5rem + 2.4vw, 3.25rem);
  --text-title: clamp(1.35rem, 1.2rem + 0.8vw, 1.85rem);

  --ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);
}

@layer components {
  .max-container {
    max-width: 1440px;
    margin: 0 auto;
  }

  .eyebrow {
    @apply text-[length:var(--text-eyebrow)] uppercase tracking-[0.18em] text-text-muted;
  }

  .card-surface {
    @apply bg-surface border border-border rounded-2xl;
  }
}

@layer utilities {
  .padding-x { @apply sm:px-16 px-6; }
  .padding-y { @apply sm:py-24 py-14; }
  .padding   { @apply sm:px-16 px-6 sm:py-24 py-14; }
}
```

- [ ] **Step 2: Verify the build still compiles**

```bash
cd client && npm run build
```

Expected: `✓ built in ...`. Tailwind v4 fails loudly on invalid `@theme` syntax, so a clean build confirms the tokens parse.

- [ ] **Step 3: Commit**

```bash
git add client/src/index.css
git commit -m "feat: rebuild stylesheet with Scandinavian Moss tokens"
```

---

### Task 3: formatPrice utility

Prices are stored as integers in pence to avoid floating-point errors on totals.

**Files:**

- Create: `client/src/utils/formatPrice.js`
- Test: `client/src/utils/formatPrice.test.js`

- [ ] **Step 1: Write the failing test**

Create `client/src/utils/formatPrice.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { formatPrice } from './formatPrice';

describe('formatPrice', () => {
    it('formats whole pounds', () => {
        expect(formatPrice(2500)).toBe('£25.00');
    });

    it('formats pounds and pence', () => {
        expect(formatPrice(2599)).toBe('£25.99');
    });

    it('pads single-digit pence', () => {
        expect(formatPrice(2505)).toBe('£25.05');
    });

    it('formats zero', () => {
        expect(formatPrice(0)).toBe('£0.00');
    });

    it('adds thousand separators', () => {
        expect(formatPrice(123456)).toBe('£1,234.56');
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/utils/formatPrice.test.js
```

Expected: FAIL — `Failed to resolve import "./formatPrice"`.

- [ ] **Step 3: Write the implementation**

Create `client/src/utils/formatPrice.js`:

```js
// Prices are stored as integers in pence. Intl handles separators and
// always renders two decimal places, so no manual padding is needed.
const gbp = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
});

export const formatPrice = (pence) => gbp.format(pence / 100);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/utils/formatPrice.test.js
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/utils/
git commit -m "feat: add formatPrice utility"
```

---

### Task 4: useLocalStorage hook

Used by both the cart and the theme.

**Files:**

- Create: `client/src/hooks/useLocalStorage.js`
- Test: `client/src/hooks/useLocalStorage.test.js`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/useLocalStorage.test.js`:

```js
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('returns the fallback when nothing is stored', () => {
        const { result } = renderHook(() => useLocalStorage('cart', []));
        expect(result.current[0]).toEqual([]);
    });

    it('reads an existing stored value', () => {
        window.localStorage.setItem('cart', JSON.stringify([{ id: 'a' }]));
        const { result } = renderHook(() => useLocalStorage('cart', []));
        expect(result.current[0]).toEqual([{ id: 'a' }]);
    });

    it('writes updates back to localStorage', () => {
        const { result } = renderHook(() => useLocalStorage('cart', []));
        act(() => result.current[1]([{ id: 'b' }]));
        expect(JSON.parse(window.localStorage.getItem('cart'))).toEqual([{ id: 'b' }]);
    });

    it('falls back when stored JSON is corrupt', () => {
        window.localStorage.setItem('cart', 'not json');
        const { result } = renderHook(() => useLocalStorage('cart', []));
        expect(result.current[0]).toEqual([]);
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/hooks/useLocalStorage.test.js
```

Expected: FAIL — `Failed to resolve import "./useLocalStorage"`.

- [ ] **Step 3: Write the implementation**

Create `client/src/hooks/useLocalStorage.js`:

```js
import { useState, useEffect } from 'react';

// Reads once on mount and writes on every change. Corrupt or unavailable
// storage falls back silently rather than crashing the app — a broken cart
// should never take the page down.
export const useLocalStorage = (key, fallback) => {
    const [value, setValue] = useState(() => {
        try {
            const stored = window.localStorage.getItem(key);
            return stored === null ? fallback : JSON.parse(stored);
        } catch {
            return fallback;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Private browsing or quota exceeded — state still works in memory.
        }
    }, [key, value]);

    return [value, setValue];
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/hooks/useLocalStorage.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/
git commit -m "feat: add useLocalStorage hook"
```

---

### Task 5: useReducedMotion hook

Motion ships its own `useReducedMotion`, but the Ken Burns hero uses plain CSS and needs the value in JS to decide whether to attach a scroll listener at all.

**Files:**

- Create: `client/src/hooks/useReducedMotion.js`
- Test: `client/src/hooks/useReducedMotion.test.js`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/useReducedMotion.test.js`:

```js
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useReducedMotion } from './useReducedMotion';

const mockMatchMedia = (matches) => {
    window.matchMedia = vi.fn().mockReturnValue({
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    });
};

describe('useReducedMotion', () => {
    it('returns true when the user prefers reduced motion', () => {
        mockMatchMedia(true);
        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(true);
    });

    it('returns false when the user has no preference', () => {
        mockMatchMedia(false);
        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/hooks/useReducedMotion.test.js
```

Expected: FAIL — cannot resolve the import.

- [ ] **Step 3: Write the implementation**

Create `client/src/hooks/useReducedMotion.js`:

```js
import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export const useReducedMotion = () => {
    const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches);

    useEffect(() => {
        const mql = window.matchMedia(QUERY);
        const onChange = (event) => setReduced(event.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    return reduced;
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/hooks/useReducedMotion.test.js
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useReducedMotion.js client/src/hooks/useReducedMotion.test.js
git commit -m "feat: add useReducedMotion hook"
```

---

## Phase 2 — Application shell

### Task 6: Logo component

**Files:**

- Create: `client/src/components/Logo.jsx`
- Test: `client/src/components/Logo.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/Logo.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/Logo.test.jsx
```

Expected: FAIL — cannot resolve `./Logo`.

- [ ] **Step 3: Write the implementation**

Create `client/src/components/Logo.jsx`:

```jsx
// Cut glass bowl with a moss cushion on the base and a droplet in the opening.
// Drawn entirely in currentColor so one component serves both themes.
// The moss base uses the circle's inner radius (9.3 vs the outer 10.2) so it
// meets the stroke exactly at every size.
const Logo = ({ size = 32, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="MossArt"
        className={className}
    >
        <path
            d="M26.2 16.5 A10.2 10.2 0 1 1 16 6.3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
        <path
            d="M9 18 Q9.9 13.8 11.9 15.9 Q13.2 12 15.2 15 Q16.8 11.4 18.8 14.8
               Q20.6 13 21.9 16.4 Q22.7 15.4 23 18 Q23.9 19.4 24.14 21
               A9.3 9.3 0 0 1 7.86 21 Q8.1 19.4 9 18 Z"
            fill="currentColor"
        />
        <circle cx="21.6" cy="9.6" r="2" fill="currentColor" opacity="0.85" />
    </svg>
);

export default Logo;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/Logo.test.jsx
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Add the favicon**

Create `client/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <path d="M26.2 16.5 A10.2 10.2 0 1 1 16 6.3" stroke="#a3bfa8" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M9 18 Q11.4 12.6 14 15.4 Q16.8 11 19.6 14.8 Q22.2 13.4 23 18 Q23.9 19.4 24.14 21 A9.3 9.3 0 0 1 7.86 21 Q8.1 19.4 9 18 Z" fill="#a3bfa8"/>
</svg>
```

Create `client/public/robots.txt`:

```text
User-agent: *
Allow: /
```

Then in `client/index.html`, replace the existing `<link rel="icon" ...>` line with:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 6: Commit**

```bash
git add client/src/components/Logo.jsx client/src/components/Logo.test.jsx client/public/ client/index.html
git commit -m "feat: add SVG logo, favicon and robots.txt"
```

---

### Task 7: ThemeContext

**Files:**

- Create: `client/src/context/ThemeContext.jsx`
- Test: `client/src/context/ThemeContext.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/context/ThemeContext.test.jsx`:

```jsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

const Probe = () => {
    const { theme, toggleTheme } = useTheme();
    return <button onClick={toggleTheme}>{theme}</button>;
};

const renderWithProvider = () =>
    render(
        <ThemeProvider>
            <Probe />
        </ThemeProvider>
    );

describe('ThemeContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
        window.matchMedia = vi.fn().mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    it('defaults to dark when nothing is stored', () => {
        renderWithProvider();
        expect(screen.getByRole('button')).toHaveTextContent('dark');
    });

    it('uses the stored preference', () => {
        window.localStorage.setItem('theme', JSON.stringify('light'));
        renderWithProvider();
        expect(screen.getByRole('button')).toHaveTextContent('light');
    });

    it('toggles and writes the attribute to the document', () => {
        renderWithProvider();
        act(() => screen.getByRole('button').click());
        expect(screen.getByRole('button')).toHaveTextContent('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/context/ThemeContext.test.jsx
```

Expected: FAIL — cannot resolve `./ThemeContext`.

- [ ] **Step 3: Write the implementation**

Create `client/src/context/ThemeContext.jsx`:

```jsx
import { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext(null);

// Dark is the design default. A stored choice always wins; otherwise we follow
// the OS, falling back to dark when the OS expresses no preference.
const systemPreference = () =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useLocalStorage('theme', systemPreference());

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
    return context;
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/context/ThemeContext.test.jsx
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Prevent the theme flash**

In `client/index.html`, add this as the last element inside `<head>`:

```html
<script>
  // Runs before first paint so the correct theme is applied with no flash.
  (function () {
    try {
      var stored = JSON.parse(localStorage.getItem('theme'));
      var theme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

- [ ] **Step 6: Commit**

```bash
git add client/src/context/ThemeContext.jsx client/src/context/ThemeContext.test.jsx client/index.html
git commit -m "feat: add theme context with dark default and no-flash init"
```

---

### Task 8: ThemeToggle button

**Files:**

- Create: `client/src/components/ThemeToggle.jsx`
- Test: `client/src/components/ThemeToggle.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/ThemeToggle.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.matchMedia = vi.fn().mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    it('is a real button with an accessible name', () => {
        render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
        expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument();
    });

    it('updates its label after toggling', async () => {
        const user = userEvent.setup();
        render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
        await user.click(screen.getByRole('button'));
        expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/ThemeToggle.test.jsx
```

Expected: FAIL — cannot resolve `./ThemeToggle`.

- [ ] **Step 3: Write the implementation**

Create `client/src/components/ThemeToggle.jsx`:

```jsx
import { LuSun, LuMoon } from 'react-icons/lu';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const next = theme === 'dark' ? 'light' : 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${next} theme`}
            className="p-2 rounded-full text-text-muted hover:text-text
                       transition-colors duration-200 cursor-pointer"
        >
            {theme === 'dark' ? <LuSun size={18} /> : <LuMoon size={18} />}
        </button>
    );
};

export default ThemeToggle;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/ThemeToggle.test.jsx
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ThemeToggle.jsx client/src/components/ThemeToggle.test.jsx
git commit -m "feat: add accessible theme toggle"
```

---

### Task 9: Router, RootLayout and placeholder routes

This task makes the app a multi-page application. Routes render minimal content for now; later tasks fill them in.

**Files:**

- Install: `react-router`
- Create: `client/src/router.jsx`, `client/src/layouts/RootLayout.jsx`
- Create: `client/src/routes/Home.jsx`, `Products.jsx`, `ProductDetail.jsx`, `Cart.jsx`, `NotFound.jsx`
- Modify: `client/src/main.jsx`
- Delete: `client/src/App.jsx`

- [ ] **Step 1: Install React Router**

```bash
cd client && npm install react-router
```

- [ ] **Step 2: Create the five route files**

Create `client/src/routes/Home.jsx`:

```jsx
const Home = () => <div>Home</div>;
export default Home;
```

Create `client/src/routes/Products.jsx`:

```jsx
const Products = () => <div>Products</div>;
export default Products;
```

Create `client/src/routes/ProductDetail.jsx`:

```jsx
const ProductDetail = () => <div>Product detail</div>;
export default ProductDetail;
```

Create `client/src/routes/Cart.jsx`:

```jsx
const Cart = () => <div>Cart</div>;
export default Cart;
```

Create `client/src/routes/NotFound.jsx`:

```jsx
import { Link } from 'react-router';

const NotFound = () => (
    <div className="max-container padding text-center">
        <p className="eyebrow">404</p>
        <h1 className="font-display text-[length:var(--text-display)] mt-4">
            This page has not <em className="text-accent italic">grown</em> yet
        </h1>
        <Link to="/" className="inline-block mt-8 text-accent underline underline-offset-4">
            Back to home
        </Link>
    </div>
);

export default NotFound;
```

- [ ] **Step 3: Create RootLayout**

Create `client/src/layouts/RootLayout.jsx`:

```jsx
import { Outlet } from 'react-router';

// Chrome that never changes between routes. CartDrawer is mounted here in a
// later task so it survives navigation.
const RootLayout = () => (
    <div className="min-h-screen flex flex-col bg-bg text-text">
        <main className="flex-1">
            <Outlet />
        </main>
    </div>
);

export default RootLayout;
```

- [ ] **Step 4: Create the router**

Create `client/src/router.jsx`:

```jsx
import { createBrowserRouter } from 'react-router';
import RootLayout from './layouts/RootLayout';
import Home from './routes/Home';
import Products from './routes/Products';
import ProductDetail from './routes/ProductDetail';
import Cart from './routes/Cart';
import NotFound from './routes/NotFound';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'products', element: <Products /> },
            { path: 'products/:slug', element: <ProductDetail /> },
            { path: 'cart', element: <Cart /> },
            { path: '*', element: <NotFound /> },
        ],
    },
]);
```

- [ ] **Step 5: Rewrite main.jsx**

Replace the contents of `client/src/main.jsx` with:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { router } from './router';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>
    </StrictMode>
);
```

- [ ] **Step 6: Delete the old App component**

```bash
cd client && rm src/App.jsx
```

- [ ] **Step 7: Verify routing works in a real browser**

```bash
cd client && npm run dev > /tmp/moss-dev.log 2>&1 &
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 1; done'
agent-browser open http://localhost:5173
agent-browser get text body
agent-browser open http://localhost:5173/products
agent-browser get text body
agent-browser open http://localhost:5173/nonsense
agent-browser get text body
agent-browser close
```

Expected: `Home`, then `Products`, then the 404 copy. Stop the server:

```bash
port_pid=$(netstat -ano | grep ':5173' | grep LISTENING | awk '{print $5}' | head -1)
[ -n "$port_pid" ] && powershell -Command "Stop-Process -Id $port_pid -Force"
```

- [ ] **Step 8: Commit**

```bash
git add client/src client/package.json client/package-lock.json
git commit -m "feat: add React Router with layout route and five routes"
```

---

### Task 10: Nav with working mobile menu

The current hamburger icon has no handler — mobile users cannot navigate at all.

**Files:**

- Create: `client/src/components/Nav.jsx` (replaces the old one)
- Test: `client/src/components/Nav.test.jsx`
- Modify: `client/src/constants/index.js`
- Modify: `client/src/layouts/RootLayout.jsx`
- Delete: `client/src/components/Nav.jsx` old version is overwritten in step 3

- [ ] **Step 1: Write the failing test**

Create `client/src/components/Nav.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import Nav from './Nav';

const renderNav = () =>
    render(
        <MemoryRouter>
            <ThemeProvider><Nav /></ThemeProvider>
        </MemoryRouter>
    );

describe('Nav', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.matchMedia = vi.fn().mockReturnValue({
            matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
        });
    });

    it('renders the primary links', () => {
        renderNav();
        expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/products');
    });

    it('opens the mobile menu when the toggle is pressed', async () => {
        const user = userEvent.setup();
        renderNav();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /open menu/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes the mobile menu on Escape', async () => {
        const user = userEvent.setup();
        renderNav();
        await user.click(screen.getByRole('button', { name: /open menu/i }));
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/Nav.test.jsx
```

Expected: FAIL — the old Nav has no menu button with that label.

- [ ] **Step 3: Replace the constants file**

Replace the entire contents of `client/src/constants/index.js` with:

```js
import { FaFacebookF, FaXTwitter, FaInstagram, FaTiktok } from 'react-icons/fa6';

export const navLinks = [
    { to: '/products', label: 'Shop' },
    { to: '/#about', label: 'About' },
    { to: '/#story', label: 'Journal' },
];

export const footerLinks = [
    {
        title: 'Collections',
        links: [
            { name: 'Moss Pots', to: '/products?category=moss-pots' },
            { name: 'Wall Art', to: '/products?category=wall-art' },
            { name: 'Wreaths', to: '/products?category=wreaths' },
            { name: 'Planters', to: '/products?category=planters' },
        ],
    },
    {
        title: 'Help',
        links: [
            { name: 'About us', to: '/#about' },
            { name: 'FAQs', to: '/#faq' },
            { name: 'Delivery', to: '/#delivery' },
            { name: 'Returns', to: '/#returns' },
        ],
    },
    {
        title: 'Get in touch',
        links: [
            { name: 'customer@mossart.com', to: 'mailto:customer@mossart.com' },
            { name: '+44 7700 900142', to: 'tel:+447700900142' },
        ],
    },
];

export const socialMedia = [
    { Icon: FaFacebookF, label: 'Facebook', href: 'https://facebook.com' },
    { Icon: FaXTwitter, label: 'X', href: 'https://x.com' },
    { Icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com' },
    { Icon: FaTiktok, label: 'TikTok', href: 'https://tiktok.com' },
];
```

- [ ] **Step 4: Write the Nav implementation**

Replace the entire contents of `client/src/components/Nav.jsx` with:

```jsx
import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LuMenu, LuX } from 'react-icons/lu';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { navLinks } from '../constants';

const Nav = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    // Escape closes the menu, and the body must not scroll behind it.
    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    return (
        <header className="padding-x py-6 w-full sticky top-0 z-30 bg-bg/85 backdrop-blur-md border-b border-border">
            <nav className="max-container flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2.5 text-accent">
                    <Logo size={34} />
                    <span className="font-display text-xl font-medium text-text">MossArt</span>
                </Link>

                <ul className="flex-1 flex justify-center items-center gap-12 max-lg:hidden">
                    {navLinks.map((item) => (
                        <li key={item.label}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `text-[0.95rem] transition-colors duration-200 ${
                                        isActive ? 'text-text' : 'text-text-muted hover:text-text'
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                        className="p-2 rounded-full text-text-muted hover:text-text
                                   transition-colors duration-200 cursor-pointer lg:hidden"
                    >
                        <LuMenu size={20} />
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        />
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label="Site menu"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm z-50
                                       bg-surface border-l border-border p-6 lg:hidden"
                        >
                            <button
                                type="button"
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                                className="ml-auto block p-2 text-text-muted hover:text-text cursor-pointer"
                            >
                                <LuX size={22} />
                            </button>
                            <ul className="mt-8 flex flex-col gap-6">
                                {navLinks.map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            to={item.to}
                                            onClick={() => setMenuOpen(false)}
                                            className="font-display text-2xl text-text"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Nav;
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/Nav.test.jsx
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Mount Nav in the layout**

In `client/src/layouts/RootLayout.jsx`, replace the file contents with:

```jsx
import { Outlet } from 'react-router';
import Nav from '../components/Nav';

const RootLayout = () => (
    <div className="min-h-screen flex flex-col bg-bg text-text">
        <Nav />
        <main className="flex-1">
            <Outlet />
        </main>
    </div>
);

export default RootLayout;
```

- [ ] **Step 7: Commit**

```bash
git add client/src
git commit -m "feat: add nav with a working mobile menu"
```

---

### Task 11: Footer

**Files:**

- Create: `client/src/components/Footer.jsx`
- Modify: `client/src/layouts/RootLayout.jsx`
- Delete: `client/src/sections/Footer.jsx`

- [ ] **Step 1: Write the Footer**

Create `client/src/components/Footer.jsx`:

```jsx
import { Link } from 'react-router';
import Logo from './Logo';
import { footerLinks, socialMedia } from '../constants';

const Footer = () => (
    <footer className="border-t border-border mt-24">
        <div className="max-container padding-x py-16">
            <div className="flex justify-between flex-wrap gap-12 max-lg:flex-col">
                <div className="max-w-xs">
                    <Link to="/" className="flex items-center gap-2.5 text-accent">
                        <Logo size={30} />
                        <span className="font-display text-lg font-medium text-text">MossArt</span>
                    </Link>
                    <p className="mt-5 text-sm leading-relaxed text-text-muted">
                        Preserved Nordic moss, arranged by hand in small batches.
                        No watering, no light, no upkeep.
                    </p>
                    <div className="flex items-center gap-3 mt-6">
                        {socialMedia.map(({ Icon, label, href }) => (
                            <a
                                key={label}
                                href={href}
                                aria-label={label}
                                className="w-9 h-9 rounded-full border border-border grid place-items-center
                                           text-text-muted hover:text-accent hover:border-stone
                                           transition-colors duration-200"
                            >
                                <Icon size={15} />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex gap-16 flex-wrap">
                    {footerLinks.map((section) => (
                        <div key={section.title}>
                            <h2 className="eyebrow">{section.title}</h2>
                            <ul className="mt-5 flex flex-col gap-3">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-text-muted hover:text-text transition-colors duration-200"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-16 pt-6 border-t border-border text-xs text-text-muted">
                © {new Date().getFullYear()} MossArt. Handmade in Manchester.
            </p>
        </div>
    </footer>
);

export default Footer;
```

- [ ] **Step 2: Mount it and delete the old one**

In `client/src/layouts/RootLayout.jsx`, replace the file contents with:

```jsx
import { Outlet } from 'react-router';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const RootLayout = () => (
    <div className="min-h-screen flex flex-col bg-bg text-text">
        <Nav />
        <main className="flex-1">
            <Outlet />
        </main>
        <Footer />
    </div>
);

export default RootLayout;
```

```bash
cd client && rm src/sections/Footer.jsx
```

- [ ] **Step 3: Verify nothing broke**

```bash
cd client && npm test && npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/src
git commit -m "feat: add footer with real link groups"
```

---

## Phase 3 — Data and cart state

### Task 12: Mock product data and the API layer

**Files:**

- Create: `client/src/data/products.js`
- Create: `client/src/lib/api.js`
- Test: `client/src/lib/api.test.js`

- [ ] **Step 1: Create the mock data**

Create `client/src/data/products.js`:

```js
// Mirrors the server's Product schema so lib/api.js can swap to real fetch
// calls without any component changing. Prices are integers in pence.
// slug and species do not yet exist server-side — see the spec's backend
// dependencies section.
import { product1, product2, product3, product4, moss1, moss3, moss5, moss7 } from '../assets/images';

export const categories = [
    { slug: 'all', name: 'All' },
    { slug: 'moss-pots', name: 'Moss Pots' },
    { slug: 'wall-art', name: 'Wall Art' },
    { slug: 'wreaths', name: 'Wreaths' },
    { slug: 'planters', name: 'Planters' },
    { slug: 'tabletop', name: 'Tabletop' },
];

export const products = [
    {
        id: '1', slug: 'kivi-sphere', name: 'Kivi Sphere', species: 'Cladonia stellaris',
        description: 'Reindeer moss in a hand-blown glass sphere, cut open at an angle so the texture catches the light.',
        price: 8500, images: [product1, moss1], category: 'moss-pots', stock: 6, isAvailable: true,
    },
    {
        id: '2', slug: 'metsa-panel', name: 'Metsä Panel', species: 'Mixed forest moss',
        description: 'A framed wall panel of mixed forest mosses, layered for depth and mounted on reclaimed birch.',
        price: 24000, images: [product2, moss3], category: 'wall-art', stock: 2, isAvailable: true,
    },
    {
        id: '3', slug: 'rauha-concrete', name: 'Rauha Concrete', species: 'Leucobryum glaucum',
        description: 'Cushion moss set in a hand-poured concrete bowl. Weighty, quiet, and entirely maintenance-free.',
        price: 4500, images: [product3, moss5], category: 'planters', stock: 11, isAvailable: true,
    },
    {
        id: '4', slug: 'lampi-jar', name: 'Lampi Jar', species: 'Grimmia pulvinata',
        description: 'Preserved cushion moss in a wide apothecary jar, finished with river stones and a single piece of driftwood.',
        price: 6000, images: [product4, moss7], category: 'tabletop', stock: 8, isAvailable: true,
    },
    {
        id: '5', slug: 'aurora-bowl', name: 'Aurora Bowl', species: 'Cladonia rangiferina',
        description: 'Pale reindeer moss in a shallow ceramic bowl, glazed in a matte bone white.',
        price: 5500, images: [moss1, product1], category: 'moss-pots', stock: 4, isAvailable: true,
    },
    {
        id: '6', slug: 'talvi-frame', name: 'Talvi Frame', species: 'Thuidium tamariscinum',
        description: 'Fern moss pressed into a slim oak frame. Reads almost as a drawing from across a room.',
        price: 11000, images: [moss3, product2], category: 'wall-art', stock: 3, isAvailable: true,
    },
    {
        id: '7', slug: 'joki-stones', name: 'Joki Stones', species: 'Grimmia pulvinata',
        description: 'Moss cushions arranged between smooth river stones on a slate base.',
        price: 3500, images: [moss5, product3], category: 'tabletop', stock: 14, isAvailable: true,
    },
    {
        id: '8', slug: 'havu-wreath', name: 'Havu Wreath', species: 'Mixed lichen',
        description: 'A dense ring of preserved moss and lichen on a willow base. Lasts years indoors.',
        price: 7500, images: [moss7, product4], category: 'wreaths', stock: 5, isAvailable: true,
    },
];
```

- [ ] **Step 2: Write the failing test**

Create `client/src/lib/api.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { getProducts, getProduct } from './api';

describe('api', () => {
    it('returns every product', async () => {
        const result = await getProducts();
        expect(result).toHaveLength(8);
        expect(result[0]).toHaveProperty('slug');
    });

    it('filters by category', async () => {
        const result = await getProducts({ category: 'wall-art' });
        expect(result).toHaveLength(2);
        expect(result.every((p) => p.category === 'wall-art')).toBe(true);
    });

    it('treats the "all" category as no filter', async () => {
        const result = await getProducts({ category: 'all' });
        expect(result).toHaveLength(8);
    });

    it('sorts by price ascending', async () => {
        const result = await getProducts({ sort: 'price-asc' });
        expect(result[0].price).toBeLessThanOrEqual(result[1].price);
    });

    it('returns one product by slug', async () => {
        const result = await getProduct('lampi-jar');
        expect(result.name).toBe('Lampi Jar');
    });

    it('rejects for an unknown slug', async () => {
        await expect(getProduct('does-not-exist')).rejects.toThrow('Product not found');
    });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd client && npx vitest run src/lib/api.test.js
```

Expected: FAIL — cannot resolve `./api`.

- [ ] **Step 4: Write the implementation**

Create `client/src/lib/api.js`:

```js
// The single place that knows where product data comes from. Today it reads
// the mock array; when the backend exists these become fetch calls to
// /api/v1/products and no component needs to change.
import { products } from '../data/products';

// A short delay makes the skeleton states real rather than decorative.
// Tests set it to zero via the VITEST env flag so suites stay fast.
const LATENCY = import.meta.env.MODE === 'test' ? 0 : 450;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getProducts = async ({ category = 'all', sort = 'newest' } = {}) => {
    await delay(LATENCY);

    const filtered = category === 'all'
        ? products
        : products.filter((product) => product.category === category);

    // Copy before sorting — never mutate the source array.
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);

    return sorted;
};

export const getProduct = async (slug) => {
    await delay(LATENCY);
    const product = products.find((item) => item.slug === slug);
    if (!product) throw new Error('Product not found');
    return product;
};

export const getRelated = async (slug, limit = 4) => {
    await delay(LATENCY);
    return products.filter((product) => product.slug !== slug).slice(0, limit);
};
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd client && npx vitest run src/lib/api.test.js
```

Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add client/src/data client/src/lib
git commit -m "feat: add mock product data behind an api module"
```

---

### Task 13: CartContext

**Files:**

- Create: `client/src/context/CartContext.jsx`
- Test: `client/src/context/CartContext.test.jsx`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/context/CartContext.test.jsx`:

```jsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from './CartContext';

const sample = { id: '1', slug: 'kivi-sphere', name: 'Kivi Sphere', price: 8500, images: ['a.jpg'] };

let cart;

const Probe = () => {
    cart = useCart();
    return <span data-testid="count">{cart.itemCount}</span>;
};

const setup = () => render(<CartProvider><Probe /></CartProvider>);

describe('CartContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('starts empty', () => {
        setup();
        expect(screen.getByTestId('count')).toHaveTextContent('0');
        expect(cart.total).toBe(0);
    });

    it('adds an item', () => {
        setup();
        act(() => cart.addItem(sample));
        expect(cart.itemCount).toBe(1);
        expect(cart.total).toBe(8500);
    });

    it('increments quantity when the same item is added twice', () => {
        setup();
        act(() => cart.addItem(sample));
        act(() => cart.addItem(sample));
        expect(cart.items).toHaveLength(1);
        expect(cart.itemCount).toBe(2);
        expect(cart.total).toBe(17000);
    });

    it('sets an explicit quantity', () => {
        setup();
        act(() => cart.addItem(sample));
        act(() => cart.setQuantity('1', 3));
        expect(cart.itemCount).toBe(3);
    });

    it('removes an item when quantity drops to zero', () => {
        setup();
        act(() => cart.addItem(sample));
        act(() => cart.setQuantity('1', 0));
        expect(cart.items).toHaveLength(0);
    });

    it('removes an item explicitly', () => {
        setup();
        act(() => cart.addItem(sample));
        act(() => cart.removeItem('1'));
        expect(cart.items).toHaveLength(0);
    });

    it('clears the cart', () => {
        setup();
        act(() => cart.addItem(sample));
        act(() => cart.clear());
        expect(cart.items).toHaveLength(0);
    });

    it('persists to localStorage', () => {
        setup();
        act(() => cart.addItem(sample));
        const stored = JSON.parse(window.localStorage.getItem('cart'));
        expect(stored).toHaveLength(1);
        expect(stored[0].quantity).toBe(1);
    });

    it('rehydrates from localStorage', () => {
        window.localStorage.setItem('cart', JSON.stringify([{ ...sample, quantity: 2 }]));
        setup();
        expect(cart.itemCount).toBe(2);
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/context/CartContext.test.jsx
```

Expected: FAIL — cannot resolve `./CartContext`.

- [ ] **Step 3: Write the implementation**

Create `client/src/context/CartContext.jsx`:

```jsx
import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'cart';

// Every branch returns a new array — the cart is never mutated in place.
const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const existing = state.find((item) => item.id === action.product.id);
            if (existing) {
                return state.map((item) =>
                    item.id === action.product.id
                        ? { ...item, quantity: item.quantity + action.quantity }
                        : item
                );
            }
            return [...state, { ...action.product, quantity: action.quantity }];
        }
        case 'REMOVE_ITEM':
            return state.filter((item) => item.id !== action.id);
        case 'SET_QUANTITY':
            if (action.quantity <= 0) return state.filter((item) => item.id !== action.id);
            return state.map((item) =>
                item.id === action.id ? { ...item, quantity: action.quantity } : item
            );
        case 'CLEAR':
            return [];
        default:
            return state;
    }
};

const readStoredCart = () => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === null ? [] : JSON.parse(stored);
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }) => {
    const [items, dispatch] = useReducer(cartReducer, undefined, readStoredCart);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Private browsing — the cart still works for this session.
        }
    }, [items]);

    const value = useMemo(() => ({
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        addItem: (product, quantity = 1) => dispatch({ type: 'ADD_ITEM', product, quantity }),
        removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', id }),
        setQuantity: (id, quantity) => dispatch({ type: 'SET_QUANTITY', id, quantity }),
        clear: () => dispatch({ type: 'CLEAR' }),
    }), [items]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used inside a CartProvider');
    return context;
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/context/CartContext.test.jsx
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Wrap the app in CartProvider**

In `client/src/main.jsx`, add the import and wrap `RouterProvider`:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { router } from './router';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <CartProvider>
                <RouterProvider router={router} />
            </CartProvider>
        </ThemeProvider>
    </StrictMode>
);
```

- [ ] **Step 6: Commit**

```bash
git add client/src/context client/src/main.jsx
git commit -m "feat: add cart context with localStorage persistence"
```

---

## Phase 4 — Shared components

### Task 14: Button

**Files:**

- Create: `client/src/components/Button.jsx` (replaces the old one)
- Modify: `client/src/components/Button.test.jsx`

- [ ] **Step 1: Replace the test**

Replace the entire contents of `client/src/components/Button.test.jsx` with:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

    it('renders the outline variant', () => {
        render(<Button variant="outline">Add</Button>);
        expect(screen.getByRole('button')).toHaveClass('border-border');
    });

    it('is disabled when asked', () => {
        render(<Button disabled>Add</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/Button.test.jsx
```

Expected: FAIL — the old Button takes a `label` prop, not children, and has no variants.

- [ ] **Step 3: Write the implementation**

Replace the entire contents of `client/src/components/Button.jsx` with:

```jsx
// Two variants. Solid is the single primary action on a page; outline is for
// repeated actions such as Add buttons in a product grid, where twelve solid
// buttons would shout.
const VARIANTS = {
    solid: 'bg-accent text-on-accent hover:bg-accent-strong',
    outline: 'border border-border text-text hover:border-stone hover:bg-surface',
};

const Button = ({
    children,
    variant = 'solid',
    fullWidth = false,
    className = '',
    ...props
}) => (
    <button
        className={`inline-flex justify-center items-center gap-2 px-7 py-3.5 rounded-full
                    font-medium text-[0.95rem] cursor-pointer
                    transition-[background-color,border-color,transform] duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
    >
        {children}
    </button>
);

export default Button;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/Button.test.jsx
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Button.jsx client/src/components/Button.test.jsx
git commit -m "feat: rewrite Button with solid and outline variants"
```

---

### Task 15: ProductCard and its skeleton

**Files:**

- Create: `client/src/components/ProductCard.jsx`
- Create: `client/src/components/ProductCardSkeleton.jsx`
- Test: `client/src/components/ProductCard.test.jsx`
- Delete: `client/src/components/PopularProductCard.jsx`, `ProductCard.jsx` old version overwritten

- [ ] **Step 1: Write the failing test**

Create `client/src/components/ProductCard.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductCard from './ProductCard';

const product = {
    id: '1', slug: 'kivi-sphere', name: 'Kivi Sphere', species: 'Cladonia stellaris',
    price: 8500, images: ['a.jpg'], category: 'moss-pots', stock: 6, isAvailable: true,
};

const renderCard = (onAdd = vi.fn()) =>
    render(<MemoryRouter><ProductCard product={product} onAdd={onAdd} /></MemoryRouter>);

describe('ProductCard', () => {
    beforeEach(() => window.localStorage.clear());

    it('links to the product page', () => {
        renderCard();
        expect(screen.getByRole('link', { name: /kivi sphere/i })).toHaveAttribute('href', '/products/kivi-sphere');
    });

    it('shows the formatted price', () => {
        renderCard();
        expect(screen.getByText('£85.00')).toBeInTheDocument();
    });

    it('shows the species', () => {
        renderCard();
        expect(screen.getByText('Cladonia stellaris')).toBeInTheDocument();
    });

    it('calls onAdd without navigating', async () => {
        const onAdd = vi.fn();
        const user = userEvent.setup();
        renderCard(onAdd);
        await user.click(screen.getByRole('button', { name: /add kivi sphere/i }));
        expect(onAdd).toHaveBeenCalledWith(product);
    });

    it('gives the image meaningful alt text', () => {
        renderCard();
        expect(screen.getByAltText('Kivi Sphere')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/ProductCard.test.jsx
```

Expected: FAIL — the old ProductCard is a thumbnail picker with a different API.

- [ ] **Step 3: Write ProductCard**

Replace the entire contents of `client/src/components/ProductCard.jsx` with:

```jsx
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { formatPrice } from '../utils/formatPrice';

// The whole card is a link so it is keyboard reachable. The Add button sits
// inside it, so its click must be stopped from bubbling into navigation.
const ProductCard = ({ product, onAdd }) => {
    const handleAdd = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onAdd(product);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
        >
            <Link
                to={`/products/${product.slug}`}
                className="card-surface block p-3 h-full hover:border-stone
                           transition-colors duration-300"
            >
                <img
                    src={product.images[0]}
                    alt={product.name}
                    loading="lazy"
                    className="w-full aspect-square object-cover rounded-xl"
                />
                <div className="px-1 pt-4 pb-1">
                    <div className="flex justify-between items-baseline gap-3">
                        <h3 className="text-[0.95rem] font-medium">{product.name}</h3>
                        <span className="text-accent font-medium">{formatPrice(product.price)}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1.5 italic">{product.species}</p>
                    <button
                        type="button"
                        onClick={handleAdd}
                        aria-label={`Add ${product.name} to basket`}
                        className="mt-4 ml-auto block px-5 py-2 rounded-full text-xs font-medium
                                   border border-border text-text cursor-pointer
                                   hover:border-stone hover:bg-raised transition-colors duration-200"
                    >
                        Add
                    </button>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductCard;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/ProductCard.test.jsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Write the skeleton**

Create `client/src/components/ProductCardSkeleton.jsx`:

```jsx
// Mirrors ProductCard's geometry so the grid does not shift when data lands.
const ProductCardSkeleton = () => (
    <div className="card-surface p-3 animate-pulse">
        <div className="w-full aspect-square rounded-xl bg-raised" />
        <div className="px-1 pt-4 pb-1">
            <div className="flex justify-between gap-3">
                <div className="h-3.5 bg-raised rounded w-1/2" />
                <div className="h-3.5 bg-raised rounded w-1/5" />
            </div>
            <div className="h-2.5 bg-raised rounded w-1/3 mt-3" />
            <div className="h-8 bg-raised rounded-full w-16 mt-4 ml-auto" />
        </div>
    </div>
);

export default ProductCardSkeleton;
```

- [ ] **Step 6: Delete the superseded card**

```bash
cd client && rm src/components/PopularProductCard.jsx
```

- [ ] **Step 7: Commit**

```bash
git add client/src/components
git commit -m "feat: add ProductCard and loading skeleton"
```

---

### Task 16: PageHeader

The eyebrow → serif headline → italic accent word pattern, reused on every route.

**Files:**

- Create: `client/src/components/PageHeader.jsx`
- Test: `client/src/components/PageHeader.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/PageHeader.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
    it('renders eyebrow, title and accent word', () => {
        render(<PageHeader eyebrow="All pieces" title="The" accent="collection" />);
        expect(screen.getByText('All pieces')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The collection');
    });

    it('renders a lead paragraph when given', () => {
        render(<PageHeader title="The" accent="collection" lead="Preserved Nordic moss." />);
        expect(screen.getByText('Preserved Nordic moss.')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/PageHeader.test.jsx
```

Expected: FAIL — cannot resolve `./PageHeader`.

- [ ] **Step 3: Write the implementation**

Create `client/src/components/PageHeader.jsx`:

```jsx
const PageHeader = ({ eyebrow, title, accent, lead }) => (
    <header className="max-container padding-x pt-16 pb-10">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display text-[length:var(--text-display)] leading-[1.05] mt-4">
            {title} <em className="text-accent italic">{accent}</em>
        </h1>
        {lead && <p className="mt-5 max-w-md text-text-muted leading-relaxed">{lead}</p>}
        <hr className="mt-10 border-border" />
    </header>
);

export default PageHeader;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/PageHeader.test.jsx
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/PageHeader.jsx client/src/components/PageHeader.test.jsx
git commit -m "feat: add reusable page header"
```

---

## Phase 5 — Routes

### Task 17: Hero section with Ken Burns and parallax

**Files:**

- Create: `client/src/sections/Hero.jsx`
- Modify: `client/src/index.css` (append the keyframes)

- [ ] **Step 1: Add the Ken Burns keyframes**

Append to `client/src/index.css`:

```css
@layer utilities {
  @keyframes ken-burns {
    0%   { transform: scale(1) translate(0, 0); }
    50%  { transform: scale(1.14) translate(-2%, -1.5%); }
    100% { transform: scale(1) translate(0, 0); }
  }

  .animate-ken-burns {
    animation: ken-burns 24s ease-in-out infinite;
  }
}
```

- [ ] **Step 2: Write the Hero**

Create `client/src/sections/Hero.jsx`:

```jsx
import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'motion/react';
import Button from '../components/Button';
import heroImage from '../assets/brand/hero.webp';

const stats = [
    { value: '12', label: 'Species', suffix: 'Ethically foraged' },
    { value: '200+', label: 'Pieces', suffix: 'Made by hand' },
    { value: '3k', label: 'Customers', suffix: 'UK-wide delivery' },
];

const Hero = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
    // The image moves slower than the page, which reads as depth.
    const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);

    return (
        <>
            <section ref={ref} id="home" className="relative flex xl:flex-row flex-col min-h-[88vh] max-container">
                <div className="xl:w-[45%] w-full flex flex-col justify-center padding-x py-20 z-10">
                    <p className="eyebrow">Handmade in small batches</p>
                    <h1 className="font-display text-[length:var(--text-hero)] leading-[0.98] mt-6">
                        Living <em className="text-accent italic">texture</em>
                    </h1>
                    <p className="mt-7 max-w-sm text-text-muted leading-relaxed">
                        Preserved Nordic moss, arranged by hand. It keeps its colour and
                        softness for years without water, light or any attention at all.
                    </p>
                    <div className="mt-10">
                        <Link to="/products">
                            <Button>Shop the collection</Button>
                        </Link>
                    </div>
                </div>

                <div className="flex-1 relative overflow-hidden xl:min-h-[88vh] min-h-[52vh]">
                    <motion.img
                        src={heroImage}
                        alt="Close-up of preserved moss with a water droplet"
                        style={{ y: imageY }}
                        className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
                    />
                </div>
            </section>

            <section className="max-container padding-x py-14 border-y border-border">
                <div className="flex justify-between flex-wrap gap-10">
                    {stats.map((stat) => (
                        <div key={stat.label}>
                            <p className="font-display text-[length:var(--text-title)]">
                                {stat.value} <em className="text-accent italic">{stat.label}</em>
                            </p>
                            <p className="eyebrow mt-2">{stat.suffix}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
};

export default Hero;
```

- [ ] **Step 3: Verify it renders in a browser**

```bash
cd client && npm run dev > /tmp/moss-dev.log 2>&1 &
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 1; done'
```

Wire it in temporarily by replacing `client/src/routes/Home.jsx` with:

```jsx
import Hero from '../sections/Hero';

const Home = () => <Hero />;

export default Home;
```

Then:

```bash
agent-browser open http://localhost:5173
agent-browser screenshot hero.png
agent-browser console
agent-browser close
```

Expected: the hero renders with the headline left and the photograph right, no console errors. **Look at the screenshot** — a blank right-hand column means `hero.webp` is missing and Task 1 needs rerunning.

Stop the server:

```bash
port_pid=$(netstat -ano | grep ':5173' | grep LISTENING | awk '{print $5}' | head -1)
[ -n "$port_pid" ] && powershell -Command "Stop-Process -Id $port_pid -Force"
rm -f client/hero.png
```

- [ ] **Step 4: Commit**

```bash
git add client/src
git commit -m "feat: add hero with ken burns drift and scroll parallax"
```

---

### Task 18: Home page sections

**Files:**

- Create: `client/src/sections/FeaturedProducts.jsx`, `client/src/sections/Story.jsx`
- Modify: `client/src/routes/Home.jsx`
- Delete: old sections superseded by the rebuild

- [ ] **Step 1: Write FeaturedProducts**

Create `client/src/sections/FeaturedProducts.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { LuArrowRight } from 'react-icons/lu';
import { getProducts } from '../lib/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

const FeaturedProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addItem } = useCart();

    useEffect(() => {
        let active = true;
        getProducts().then((result) => {
            if (!active) return;
            setProducts(result.slice(0, 4));
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    return (
        <section id="featured" className="max-container padding-x py-24">
            <div className="flex justify-between items-end gap-6">
                <h2 className="font-display text-[length:var(--text-display)] leading-tight">
                    Selected <em className="text-accent italic">pieces</em>
                </h2>
                <Link
                    to="/products"
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
        </section>
    );
};

export default FeaturedProducts;
```

- [ ] **Step 2: Write Story**

Create `client/src/sections/Story.jsx`:

```jsx
import { Link } from 'react-router';
import { LuArrowRight } from 'react-icons/lu';
import { moss1 } from '../assets/images';

const Story = () => (
    <section id="about" className="max-container padding-x py-24">
        <div className="flex items-center gap-16 max-lg:flex-col">
            <div className="flex-1 w-full">
                <img
                    src={moss1}
                    alt="Moss growing across a woodland floor"
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover rounded-2xl"
                />
            </div>
            <div className="flex-1">
                <p className="eyebrow">Our process</p>
                <h2 className="font-display text-[length:var(--text-display)] leading-tight mt-4">
                    Grown slowly, <em className="text-accent italic">made by hand</em>
                </h2>
                <p className="mt-6 text-text-muted leading-relaxed">
                    Every piece begins with moss gathered under licence from managed Nordic
                    woodland, taken in small quantities so the ground recovers before we return.
                </p>
                <p className="mt-4 text-text-muted leading-relaxed">
                    In the studio it is cleaned and preserved with a plant-based glycerin
                    solution. That halts ageing permanently, so the moss keeps its colour and
                    softness for years with no water and no light.
                </p>
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 mt-8 text-accent
                               underline underline-offset-4 hover:gap-3 transition-all duration-200"
                >
                    See the collection <LuArrowRight size={16} />
                </Link>
            </div>
        </div>
    </section>
);

export default Story;
```

- [ ] **Step 3: Compose the home page**

Replace `client/src/routes/Home.jsx` with:

```jsx
import Hero from '../sections/Hero';
import FeaturedProducts from '../sections/FeaturedProducts';
import Story from '../sections/Story';

const Home = () => (
    <>
        <Hero />
        <FeaturedProducts />
        <Story />
    </>
);

export default Home;
```

- [ ] **Step 4: Delete the superseded sections**

```bash
cd client && rm src/sections/PopularProducts.jsx src/sections/HandMade.jsx \
  src/sections/MossWorld.jsx src/sections/CustomerReviews.jsx \
  src/sections/Subscribe.jsx src/sections/Services.jsx src/sections/index.js \
  src/components/ServiceCard.jsx src/components/ReviewCard.jsx
```

- [ ] **Step 5: Verify the build and tests**

```bash
cd client && npm run build && npm test
```

Expected: build succeeds with no unresolved imports, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add client/src
git commit -m "feat: build home page from hero, featured products and story"
```

---

### Task 19: Products listing with filter and sort

**Files:**

- Create: `client/src/components/FilterBar.jsx`
- Test: `client/src/components/FilterBar.test.jsx`
- Modify: `client/src/routes/Products.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/FilterBar.test.jsx`:

```jsx
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
        expect(screen.getByRole('button', { name: 'Wreaths' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('reports a category change', async () => {
        const onCategoryChange = vi.fn();
        const user = userEvent.setup();
        render(<FilterBar {...props} onCategoryChange={onCategoryChange} />);
        await user.click(screen.getByRole('button', { name: 'Wall Art' }));
        expect(onCategoryChange).toHaveBeenCalledWith('wall-art');
    });

    it('shows the item count', () => {
        render(<FilterBar {...props} />);
        expect(screen.getByText('8 pieces')).toBeInTheDocument();
    });

    it('reports a sort change', async () => {
        const onSortChange = vi.fn();
        const user = userEvent.setup();
        render(<FilterBar {...props} onSortChange={onSortChange} />);
        await user.selectOptions(screen.getByLabelText('Sort by'), 'price-asc');
        expect(onSortChange).toHaveBeenCalledWith('price-asc');
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/FilterBar.test.jsx
```

Expected: FAIL — cannot resolve `./FilterBar`.

- [ ] **Step 3: Write FilterBar**

Create `client/src/components/FilterBar.jsx`:

```jsx
import { categories } from '../data/products';

const FilterBar = ({ active, onCategoryChange, sort, onSortChange, count }) => (
    <div className="flex justify-between items-center gap-6 flex-wrap">
        <div className="flex gap-2.5 flex-wrap">
            {categories.map((category) => {
                const isActive = category.slug === active;
                return (
                    <button
                        key={category.slug}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onCategoryChange(category.slug)}
                        className={`px-4 py-2 rounded-full text-sm cursor-pointer border
                                    transition-colors duration-200 ${
                            isActive
                                ? 'bg-accent text-on-accent border-accent font-medium'
                                : 'border-border text-text-muted hover:text-text hover:border-stone'
                        }`}
                    >
                        {category.name}
                    </button>
                );
            })}
        </div>

        <div className="flex items-center gap-5">
            <span className="text-sm text-text-muted">{count} pieces</span>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select
                id="sort"
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
                className="bg-transparent border border-border rounded-full px-4 py-2
                           text-sm text-text cursor-pointer hover:border-stone
                           transition-colors duration-200"
            >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
            </select>
        </div>
    </div>
);

export default FilterBar;
```

- [ ] **Step 4: Add the sr-only utility**

Append to the `@layer utilities` block in `client/src/index.css`:

```css
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/FilterBar.test.jsx
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Build the Products route**

Replace `client/src/routes/Products.jsx` with:

```jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { getProducts } from '../lib/api';
import { useCart } from '../context/CartContext';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'newest';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addItem } = useCart();

    // The URL is the source of truth for filter state, so a filtered view is
    // shareable and the back button works.
    useEffect(() => {
        let active = true;
        setLoading(true);
        getProducts({ category, sort }).then((result) => {
            if (!active) return;
            setProducts(result);
            setLoading(false);
        });
        return () => { active = false; };
    }, [category, sort]);

    const updateParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value === 'all' || value === 'newest') next.delete(key);
        else next.set(key, value);
        setSearchParams(next);
    };

    return (
        <>
            <PageHeader
                eyebrow="All pieces"
                title="The"
                accent="collection"
                lead="Preserved Nordic moss, brought indoors to live for years without water or light."
            />

            <div className="max-container padding-x">
                <FilterBar
                    active={category}
                    onCategoryChange={(value) => updateParam('category', value)}
                    sort={sort}
                    onSortChange={(value) => updateParam('sort', value)}
                    count={products.length}
                />

                <div className="mt-12 pb-24 grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
                    {loading ? (
                        Array.from({ length: 6 }, (_, index) => <ProductCardSkeleton key={index} />)
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} onAdd={addItem} />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </>
    );
};

export default Products;
```

- [ ] **Step 7: Commit**

```bash
git add client/src
git commit -m "feat: add products listing with url-driven filter and sort"
```

---

### Task 20: Product detail with gallery

**Files:**

- Create: `client/src/components/Gallery.jsx`, `client/src/components/QuantityStepper.jsx`
- Test: `client/src/components/Gallery.test.jsx`
- Modify: `client/src/routes/ProductDetail.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/Gallery.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Gallery from './Gallery';

const images = ['one.jpg', 'two.jpg'];

describe('Gallery', () => {
    it('shows the first image by default', () => {
        render(<Gallery images={images} alt="Lampi Jar" />);
        expect(screen.getByAltText('Lampi Jar')).toHaveAttribute('src', 'one.jpg');
    });

    it('switches image when a thumbnail is chosen', async () => {
        const user = userEvent.setup();
        render(<Gallery images={images} alt="Lampi Jar" />);
        await user.click(screen.getByRole('button', { name: /view image 2/i }));
        expect(screen.getByAltText('Lampi Jar')).toHaveAttribute('src', 'two.jpg');
    });

    it('marks the active thumbnail', async () => {
        const user = userEvent.setup();
        render(<Gallery images={images} alt="Lampi Jar" />);
        await user.click(screen.getByRole('button', { name: /view image 2/i }));
        expect(screen.getByRole('button', { name: /view image 2/i })).toHaveAttribute('aria-pressed', 'true');
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/Gallery.test.jsx
```

Expected: FAIL — cannot resolve `./Gallery`.

- [ ] **Step 3: Write Gallery**

Create `client/src/components/Gallery.jsx`:

```jsx
import { useState } from 'react';

const Gallery = ({ images, alt }) => {
    const [index, setIndex] = useState(0);
    const [zoomed, setZoomed] = useState(false);
    const [origin, setOrigin] = useState('center');

    const handleMove = (event) => {
        if (!zoomed) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setOrigin(`${x}% ${y}%`);
    };

    return (
        <div>
            <div
                className="overflow-hidden rounded-2xl border border-border bg-surface"
                onMouseMove={handleMove}
                onMouseLeave={() => setZoomed(false)}
            >
                <img
                    src={images[index]}
                    alt={alt}
                    onClick={() => setZoomed((value) => !value)}
                    style={{ transformOrigin: origin }}
                    className={`w-full aspect-square object-cover transition-transform duration-500
                                ${zoomed ? 'scale-[1.8] cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                />
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2.5 mt-3">
                    {images.map((image, imageIndex) => (
                        <button
                            key={image}
                            type="button"
                            aria-label={`View image ${imageIndex + 1}`}
                            aria-pressed={imageIndex === index}
                            onClick={() => { setIndex(imageIndex); setZoomed(false); }}
                            className={`rounded-lg overflow-hidden border-2 cursor-pointer
                                        transition-colors duration-200 ${
                                imageIndex === index ? 'border-accent' : 'border-transparent hover:border-border'
                            }`}
                        >
                            <img src={image} alt="" className="w-full aspect-square object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Gallery;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/Gallery.test.jsx
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Write QuantityStepper**

Create `client/src/components/QuantityStepper.jsx`:

```jsx
import { LuMinus, LuPlus } from 'react-icons/lu';

const QuantityStepper = ({ value, onChange, min = 1, max = 99 }) => (
    <div className="inline-flex items-center gap-1 border border-border rounded-full p-1">
        <button
            type="button"
            aria-label="Decrease quantity"
            disabled={value <= min}
            onClick={() => onChange(value - 1)}
            className="w-9 h-9 grid place-items-center rounded-full cursor-pointer
                       text-text-muted hover:text-text hover:bg-surface
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
            <LuMinus size={15} />
        </button>
        <span aria-live="polite" className="w-8 text-center text-sm tabular-nums">{value}</span>
        <button
            type="button"
            aria-label="Increase quantity"
            disabled={value >= max}
            onClick={() => onChange(value + 1)}
            className="w-9 h-9 grid place-items-center rounded-full cursor-pointer
                       text-text-muted hover:text-text hover:bg-surface
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
            <LuPlus size={15} />
        </button>
    </div>
);

export default QuantityStepper;
```

- [ ] **Step 6: Build the ProductDetail route**

Replace `client/src/routes/ProductDetail.jsx` with:

```jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { LuTruck, LuDroplets, LuHandHeart } from 'react-icons/lu';
import { getProduct, getRelated } from '../lib/api';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import Gallery from '../components/Gallery';
import QuantityStepper from '../components/QuantityStepper';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import NotFound from './NotFound';

const trust = [
    { Icon: LuTruck, text: 'Free UK delivery over £50' },
    { Icon: LuDroplets, text: 'Lives for years, no watering' },
    { Icon: LuHandHeart, text: 'Handmade in small batches' },
];

const ProductDetail = () => {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState('loading');
    const { addItem } = useCart();

    useEffect(() => {
        let active = true;
        setStatus('loading');
        setQuantity(1);
        getProduct(slug)
            .then((result) => {
                if (!active) return;
                setProduct(result);
                setStatus('ready');
                return getRelated(slug);
            })
            .then((result) => { if (active && result) setRelated(result); })
            .catch(() => { if (active) setStatus('missing'); });
        return () => { active = false; };
    }, [slug]);

    if (status === 'missing') return <NotFound />;

    if (status === 'loading') {
        return (
            <div className="max-container padding-x py-20 grid lg:grid-cols-2 gap-14 animate-pulse">
                <div className="aspect-square rounded-2xl bg-surface" />
                <div className="space-y-5 pt-6">
                    <div className="h-3 bg-surface rounded w-1/4" />
                    <div className="h-10 bg-surface rounded w-2/3" />
                    <div className="h-6 bg-surface rounded w-1/5" />
                    <div className="h-24 bg-surface rounded" />
                </div>
            </div>
        );
    }

    return (
        <>
            <nav aria-label="Breadcrumb" className="max-container padding-x pt-10">
                <ol className="flex gap-2 text-sm text-text-muted">
                    <li><Link to="/products" className="hover:text-text transition-colors">Shop</Link></li>
                    <li aria-hidden="true">/</li>
                    <li className="text-text">{product.name}</li>
                </ol>
            </nav>

            <div className="max-container padding-x py-12 grid lg:grid-cols-[55%_1fr] gap-14">
                <Gallery images={product.images} alt={product.name} />

                <div>
                    <p className="eyebrow">{product.species}</p>
                    <h1 className="font-display text-[length:var(--text-display)] leading-tight mt-3">
                        {product.name}
                    </h1>
                    <p className="text-accent text-2xl font-medium mt-4">{formatPrice(product.price)}</p>
                    <p className="mt-6 text-text-muted leading-relaxed">{product.description}</p>

                    <hr className="my-8 border-border" />

                    <div className="flex items-center gap-4 flex-wrap">
                        <QuantityStepper value={quantity} onChange={setQuantity} max={product.stock} />
                        <Button onClick={() => addItem(product, quantity)} className="flex-1 min-w-48">
                            Add to basket
                        </Button>
                    </div>

                    <p className="mt-4 text-xs text-text-muted">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </p>

                    <ul className="mt-10 flex flex-col gap-4">
                        {trust.map(({ Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-sm text-text-muted">
                                <Icon size={17} className="text-accent shrink-0" />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <section className="max-container padding-x pb-24">
                <h2 className="font-display text-[length:var(--text-title)]">
                    You may also <em className="text-accent italic">like</em>
                </h2>
                <div className="mt-8 grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-5">
                    {related.map((item) => (
                        <ProductCard key={item.id} product={item} onAdd={addItem} />
                    ))}
                </div>
            </section>
        </>
    );
};

export default ProductDetail;
```

- [ ] **Step 7: Commit**

```bash
git add client/src
git commit -m "feat: add product detail with gallery zoom and related items"
```

---

### Task 21: Cart page

**Files:**

- Modify: `client/src/routes/Cart.jsx`

- [ ] **Step 1: Write the Cart route**

Replace `client/src/routes/Cart.jsx` with:

```jsx
import { Link } from 'react-router';
import { LuTrash2 } from 'react-icons/lu';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import QuantityStepper from '../components/QuantityStepper';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';

const Cart = () => {
    const { items, total, setQuantity, removeItem } = useCart();

    if (items.length === 0) {
        return (
            <>
                <PageHeader eyebrow="Basket" title="Nothing here" accent="yet" />
                <div className="max-container padding-x pb-24">
                    <p className="text-text-muted">Your basket is empty.</p>
                    <Link to="/products" className="inline-block mt-6">
                        <Button>Browse the collection</Button>
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader eyebrow="Basket" title="Your" accent="basket" />

            <div className="max-container padding-x pb-24 grid lg:grid-cols-[1fr_320px] gap-12">
                <ul className="flex flex-col gap-5">
                    {items.map((item) => (
                        <li key={item.id} className="card-surface p-4 flex gap-5 items-center max-sm:flex-col max-sm:items-start">
                            <img
                                src={item.images[0]}
                                alt={item.name}
                                className="w-24 h-24 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <Link to={`/products/${item.slug}`} className="font-medium hover:text-accent transition-colors">
                                    {item.name}
                                </Link>
                                <p className="text-xs text-text-muted italic mt-1">{item.species}</p>
                                <p className="text-accent mt-2">{formatPrice(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <QuantityStepper
                                    value={item.quantity}
                                    onChange={(value) => setQuantity(item.id, value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    aria-label={`Remove ${item.name} from basket`}
                                    className="p-2.5 rounded-full text-text-muted hover:text-text
                                               hover:bg-surface cursor-pointer transition-colors duration-200"
                                >
                                    <LuTrash2 size={16} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <aside className="card-surface p-6 h-fit lg:sticky lg:top-28">
                    <h2 className="font-display text-[length:var(--text-title)]">Summary</h2>
                    <dl className="mt-6 flex flex-col gap-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-text-muted">Subtotal</dt>
                            <dd>{formatPrice(total)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-text-muted">Delivery</dt>
                            <dd>{total >= 5000 ? 'Free' : formatPrice(495)}</dd>
                        </div>
                    </dl>
                    <div className="flex justify-between mt-5 pt-5 border-t border-border">
                        <span className="font-medium">Total</span>
                        <span className="text-accent text-lg font-medium">
                            {formatPrice(total >= 5000 ? total : total + 495)}
                        </span>
                    </div>
                    <Button fullWidth className="mt-6" disabled>
                        Checkout
                    </Button>
                    <p className="mt-3 text-xs text-text-muted text-center">
                        Checkout is not available yet.
                    </p>
                </aside>
            </div>
        </>
    );
};

export default Cart;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/routes/Cart.jsx
git commit -m "feat: add cart page with quantity editing and summary"
```

---

## Phase 6 — Cart drawer and cleanup

### Task 22: Cart drawer with toast

**Files:**

- Create: `client/src/components/CartDrawer.jsx`
- Test: `client/src/components/CartDrawer.test.jsx`
- Modify: `client/src/context/CartContext.jsx`, `client/src/layouts/RootLayout.jsx`, `client/src/components/Nav.jsx`

- [ ] **Step 1: Add drawer state to CartContext**

In `client/src/context/CartContext.jsx`, add `useState` to the React import, then add drawer state inside `CartProvider` before the `value` memo:

```jsx
const [drawerOpen, setDrawerOpen] = useState(false);
```

Change the `value` memo to open the drawer on add and expose the new state:

```jsx
    const value = useMemo(() => ({
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addItem: (product, quantity = 1) => {
            dispatch({ type: 'ADD_ITEM', product, quantity });
            setDrawerOpen(true);
        },
        removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', id }),
        setQuantity: (id, quantity) => dispatch({ type: 'SET_QUANTITY', id, quantity }),
        clear: () => dispatch({ type: 'CLEAR' }),
    }), [items, drawerOpen]);
```

- [ ] **Step 2: Write the failing test**

Create `client/src/components/CartDrawer.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';

const sample = {
    id: '1', slug: 'kivi-sphere', name: 'Kivi Sphere', species: 'Cladonia stellaris',
    price: 8500, images: ['a.jpg'],
};

const Trigger = () => {
    const { addItem } = useCart();
    return <button onClick={() => addItem(sample)}>trigger add</button>;
};

const setup = () =>
    render(
        <MemoryRouter>
            <CartProvider>
                <Trigger />
                <CartDrawer />
            </CartProvider>
        </MemoryRouter>
    );

describe('CartDrawer', () => {
    beforeEach(() => window.localStorage.clear());

    it('is closed initially', () => {
        setup();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens when an item is added', async () => {
        const user = userEvent.setup();
        setup();
        await user.click(screen.getByText('trigger add'));
        expect(screen.getByRole('dialog', { name: /basket/i })).toBeInTheDocument();
        expect(screen.getByText('Kivi Sphere')).toBeInTheDocument();
    });

    it('closes on the close button', async () => {
        const user = userEvent.setup();
        setup();
        await user.click(screen.getByText('trigger add'));
        await user.click(screen.getByRole('button', { name: /close basket/i }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes on Escape', async () => {
        const user = userEvent.setup();
        setup();
        await user.click(screen.getByText('trigger add'));
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows the running total', async () => {
        const user = userEvent.setup();
        setup();
        await user.click(screen.getByText('trigger add'));
        expect(screen.getByText('£85.00')).toBeInTheDocument();
    });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/CartDrawer.test.jsx
```

Expected: FAIL — cannot resolve `./CartDrawer`.

- [ ] **Step 4: Write CartDrawer**

Create `client/src/components/CartDrawer.jsx`:

```jsx
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LuX } from 'react-icons/lu';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import Button from './Button';

const CartDrawer = () => {
    const { items, total, itemCount, drawerOpen, closeDrawer, removeItem } = useCart();
    const panelRef = useRef(null);

    // Escape closes, the body must not scroll, and focus moves into the panel
    // so keyboard users are not left behind on the page.
    useEffect(() => {
        if (!drawerOpen) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') closeDrawer();
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        panelRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [drawerOpen, closeDrawer]);

    return (
        <AnimatePresence>
            {drawerOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                        className="fixed inset-0 bg-black/55 z-40"
                    />
                    <motion.aside
                        ref={panelRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Basket"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50
                                   bg-surface border-l border-border flex flex-col outline-none"
                    >
                        <header className="flex justify-between items-center p-6 border-b border-border">
                            <h2 className="font-display text-xl">
                                Basket <span className="text-text-muted text-sm">({itemCount})</span>
                            </h2>
                            <button
                                type="button"
                                onClick={closeDrawer}
                                aria-label="Close basket"
                                className="p-2 rounded-full text-text-muted hover:text-text cursor-pointer
                                           transition-colors duration-200"
                            >
                                <LuX size={20} />
                            </button>
                        </header>

                        <div aria-live="polite" className="sr-only">
                            {itemCount} items in basket, total {formatPrice(total)}
                        </div>

                        <ul className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                            {items.map((item) => (
                                <li key={item.id} className="flex gap-4 items-center">
                                    <img
                                        src={item.images[0]}
                                        alt={item.name}
                                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{item.name}</p>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {item.quantity} × {formatPrice(item.price)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        aria-label={`Remove ${item.name}`}
                                        className="text-xs text-text-muted hover:text-text cursor-pointer
                                                   transition-colors duration-200"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <footer className="p-6 border-t border-border">
                            <div className="flex justify-between mb-5">
                                <span className="text-text-muted">Subtotal</span>
                                <span className="text-accent font-medium">{formatPrice(total)}</span>
                            </div>
                            <Link to="/cart" onClick={closeDrawer}>
                                <Button fullWidth>View basket</Button>
                            </Link>
                        </footer>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/CartDrawer.test.jsx
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Mount the drawer and add the basket button to Nav**

In `client/src/layouts/RootLayout.jsx`, replace the file contents with:

```jsx
import { Outlet } from 'react-router';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';

const RootLayout = () => (
    <div className="min-h-screen flex flex-col bg-bg text-text">
        <Nav />
        <main className="flex-1">
            <Outlet />
        </main>
        <Footer />
        <CartDrawer />
    </div>
);

export default RootLayout;
```

In `client/src/components/Nav.jsx`, add these imports:

```jsx
import { LuShoppingBasket } from 'react-icons/lu';
import { useCart } from '../context/CartContext';
```

Add this line at the top of the `Nav` component body, next to the existing `useState`:

```jsx
    const { itemCount, openDrawer } = useCart();
```

Then insert this button inside the `<div className="flex items-center gap-1">` block, between `<ThemeToggle />` and the menu button:

```jsx
                    <button
                        type="button"
                        onClick={openDrawer}
                        aria-label={`Open basket, ${itemCount} items`}
                        className="p-2 rounded-full text-text-muted hover:text-text relative
                                   transition-colors duration-200 cursor-pointer"
                    >
                        <LuShoppingBasket size={19} />
                        {itemCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full
                                             bg-accent text-on-accent text-[10px] font-semibold
                                             grid place-items-center">
                                {itemCount}
                            </span>
                        )}
                    </button>
```

- [ ] **Step 7: Update the Nav test for the new provider requirement**

`Nav` now calls `useCart`, so its test needs a `CartProvider`. In `client/src/components/Nav.test.jsx`, add the import:

```jsx
import { CartProvider } from '../context/CartContext';
```

and replace `renderNav` with:

```jsx
const renderNav = () =>
    render(
        <MemoryRouter>
            <ThemeProvider>
                <CartProvider><Nav /></CartProvider>
            </ThemeProvider>
        </MemoryRouter>
    );
```

- [ ] **Step 8: Run the whole suite**

```bash
cd client && npm test
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add client/src
git commit -m "feat: add cart drawer with basket button and live region"
```

---

### Task 23: Confirmation toast

The drawer already confirms the add, so the toast is deliberately small and
short-lived — it exists for the case where the drawer is dismissed quickly, and
to give screen readers a second, non-modal announcement.

**Files:**

- Create: `client/src/components/Toast.jsx`
- Test: `client/src/components/Toast.test.jsx`
- Modify: `client/src/context/CartContext.jsx`, `client/src/layouts/RootLayout.jsx`

- [ ] **Step 1: Add toast state to CartContext**

In `client/src/context/CartContext.jsx`, add a ref import and toast state.
Change the React import to:

```jsx
import { createContext, useContext, useReducer, useEffect, useMemo, useState, useRef } from 'react';
```

Add inside `CartProvider`, next to the drawer state:

```jsx
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const showToast = (message) => {
        clearTimeout(toastTimer.current);
        setToast(message);
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    };

    useEffect(() => () => clearTimeout(toastTimer.current), []);
```

Then change `addItem` inside the `value` memo to raise the toast, and expose it:

```jsx
        toast,
        addItem: (product, quantity = 1) => {
            dispatch({ type: 'ADD_ITEM', product, quantity });
            setDrawerOpen(true);
            showToast(`${product.name} added to basket`);
        },
```

Add `toast` to the memo dependency array so it reads `[items, drawerOpen, toast]`.

- [ ] **Step 2: Write the failing test**

Create `client/src/components/Toast.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext';
import Toast from './Toast';

const sample = { id: '1', slug: 'kivi-sphere', name: 'Kivi Sphere', price: 8500, images: ['a.jpg'] };

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
        expect(screen.getByRole('status')).toHaveTextContent('Kivi Sphere added to basket');
    });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd client && npx vitest run src/components/Toast.test.jsx
```

Expected: FAIL — cannot resolve `./Toast`.

- [ ] **Step 4: Write Toast**

Create `client/src/components/Toast.jsx`:

```jsx
import { motion, AnimatePresence } from 'motion/react';
import { LuCheck } from 'react-icons/lu';
import { useCart } from '../context/CartContext';

// role="status" announces politely without stealing focus, which matters
// because the drawer opening already moves focus.
const Toast = () => {
    const { toast } = useCart();

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    role="status"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed bottom-6 left-6 z-[60] flex items-center gap-2.5
                               px-4 py-3 rounded-xl bg-accent text-on-accent
                               text-sm font-medium shadow-lg"
                >
                    <LuCheck size={16} />
                    {toast}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd client && npx vitest run src/components/Toast.test.jsx
```

Expected: PASS, 2 tests.

- [ ] **Step 6: Mount it**

In `client/src/layouts/RootLayout.jsx`, add the import and render it after `CartDrawer`:

```jsx
import Toast from '../components/Toast';
```

```jsx
        <CartDrawer />
        <Toast />
```

- [ ] **Step 7: Commit**

```bash
git add client/src
git commit -m "feat: add confirmation toast on add to basket"
```

---

### Task 24: Retire dead assets and verify the whole app

**Files:**

- Delete: `client/src/components/MotionSmoke.test.jsx`, `client/src/assets/icons/`
- Create: `client/src/assets/brand/index.js`
- Modify: `client/src/assets/images/index.js`

- [ ] **Step 1: Remove the smoke test and dead icon assets**

Real components now cover Motion, so the smoke test has served its purpose.

```bash
cd client
rm src/components/MotionSmoke.test.jsx
rm src/assets/icons/header-logo.png src/assets/icons/icons8-moss-color-16.png src/assets/icons/icons8-moss-color-32.png
```

- [ ] **Step 2: Move the hero source out of icons**

`Design-10.png` is the source for `hero.webp` and should live with the brand assets rather than in a folder named icons.

```bash
cd client
mv src/assets/icons/Design-10.png src/assets/brand/Design-10.png
rm src/assets/icons/index.js
rmdir src/assets/icons
```

Update the path in `client/scripts/optimise-images.mjs`:

```js
const SRC = 'src/assets/brand/Design-10.png';
```

- [ ] **Step 3: Confirm nothing still imports the old barrel**

```bash
cd client && grep -rn "assets/icons" src/ || echo "CLEAN"
```

Expected: `CLEAN`. If anything is listed, fix that import before continuing.

- [ ] **Step 4: Run the full suite and build**

```bash
cd client && npm test && npm run lint && npm run build
```

Expected: all tests pass, no lint errors, build succeeds.

- [ ] **Step 5: Drive the whole app in a browser**

```bash
cd client && npm run dev > /tmp/moss-dev.log 2>&1 &
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 1; done'
agent-browser open http://localhost:5173
agent-browser snapshot -i -c
```

Walk the critical path and confirm each step:

```bash
agent-browser find text "Shop the collection" click
agent-browser get url                      # expect /products
agent-browser find role button --name "Wall Art" click
agent-browser get count "[href^='/products/']"   # expect 2
agent-browser find text "Metsä Panel" click
agent-browser get url                      # expect /products/metsa-panel
agent-browser find role button --name "Add to basket" click
agent-browser get text "[role=dialog]"     # expect basket contents
agent-browser screenshot final.png
agent-browser console
agent-browser close
```

Expected: navigation works at every step, the drawer opens with the item in it, and `console` reports no errors. **Look at the screenshot.**

Stop the server and clean up:

```bash
port_pid=$(netstat -ano | grep ':5173' | grep LISTENING | awk '{print $5}' | head -1)
[ -n "$port_pid" ] && powershell -Command "Stop-Process -Id $port_pid -Force"
rm -f client/final.png
```

- [ ] **Step 6: Commit**

```bash
git add -A client
git commit -m "chore: retire dead assets and the motion smoke test"
```

---

## Done criteria

- [ ] All four routes render and navigate correctly
- [ ] Theme toggle switches both palettes with no flash on reload
- [ ] Cart persists across a page refresh
- [ ] Mobile menu opens, closes on Escape, and its links navigate
- [ ] Filtering updates the URL and the grid reflows without snapping
- [ ] `npm test`, `npm run lint` and `npm run build` all pass
- [ ] No console errors on any route
