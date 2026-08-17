/**
 * The first thing in the tab order, and invisible until it is focused.
 *
 * Without it, reaching the actual content by keyboard means tabbing past the
 * logo, three nav links, both halves of the theme toggle and the basket — on
 * every route, every time. WCAG 2.4.1 asks for a way around a block that
 * repeats across pages, and this is it.
 *
 * It is `sr-only` rather than hidden: `display: none` and `visibility: hidden`
 * both take an element out of the tab order entirely, so a skip link built that
 * way can never be reached by the one input method it exists for. `focus:` puts
 * it back on screen the moment it is tabbed to.
 */
const SkipLink = () => (
    <a
        // A same-page href, not a router <Link>: the target is in the document
        // already, and routing to it would remount the page it is skipping into.
        href="#main"
        // Below the header rather than in the top-left corner, which is where
        // the wordmark sits — pinned there it covered the brand and read as a
        // mistake. The header measures 93px, so top-24 lands it 3px clear, and
        // the left offsets are padding-x's own values so it sits on the page
        // gutter rather than floating at an arbitrary inset. (The gutter, not
        // the heading: PageHeader indents its title further than the gutter.)
        className="sr-only focus:not-sr-only focus:fixed focus:top-24 focus:left-6 sm:focus:left-16
                   focus:z-[80] focus:inline-flex focus:items-center focus:min-h-11 focus:px-5
                   focus:rounded-full focus:bg-surface focus:text-text
                   focus:border focus:border-border-interactive focus:shadow-lg"
    >
        Skip to content
    </a>
);

export default SkipLink;
