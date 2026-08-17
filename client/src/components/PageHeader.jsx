// The eyebrow above the title was dropped on 2026-08-16. It fired on all five
// routes through this one component and usually just restated the heading
// underneath it — "Basket" over "Your basket", "Contact" over "Say hello" —
// which `impeccable` flagged as a template tell, and it was structural rather
// than incidental since every page inherited it from here.
//
// The rule keeps the vertical rhythm the eyebrow was providing without putting
// a second name on the page. It is decorative, so it is hidden from assistive
// technology rather than announced as a separator.
//
// The `eyebrow` prop is deliberately not accepted any more: leaving it would
// have let a call site pass one and quietly get nothing.
const PageHeader = ({ title, accent, lead }) => (
    <header className="max-container padding-x pt-16 pb-10">
        <div data-testid="header-rule" aria-hidden="true" className="h-0.5 w-10 bg-accent" />
        <h1 className="font-display text-(length:--text-display) leading-[1.05] mt-5">
            {title} <em className="text-accent italic">{accent}</em>
        </h1>
        {lead && <p className="mt-5 max-w-md text-text-muted leading-relaxed">{lead}</p>}
        <hr className="mt-10 border-border" />
    </header>
);

export default PageHeader;
