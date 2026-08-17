// The Spireforge mark — three ascending chevrons, each 0.75 the size of the one
// below it. Traced from the studio's own icon-only SVG
// (Claude Cowork/OUTPUTS/MY-BRAND/01-LOGO-CORE/icon-*_2026-05-13_v1.svg), which
// keeps the coordinates identical to the brand asset.
//
// Drawn in currentColor rather than the brand's cyan and indigo. Those colours
// are correct for Spireforge and wrong for this footer: a bright cyan-to-indigo
// mark in a sage palette reads as something pasted in from another site, which
// is the opposite of what a build credit should do. Monochrome, it inherits the
// muted footer colour and travels to the accent on hover with the word beside
// it, so mark and text behave as one link.
//
// aria-hidden because the link it sits inside is already named "Site by
// Spireforge" — announcing the mark as well would say the name twice.
// 14px against the 12px text beside it: the mark is three stacked chevrons with
// air between them, so matching the type size exactly leaves it looking thinner
// than the word it belongs to.
const SpireforgeMark = ({ size = 14, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className={className}
    >
        <polygon points="32,26 50,10 68,26 60,26 50,18 40,26" fill="currentColor" />
        <polygon points="26,53 50,32 74,53 65,53 50,41 35,53" fill="currentColor" />
        <polygon points="18,87 50,59 82,87 70,87 50,71 30,87" fill="currentColor" />
    </svg>
);

export default SpireforgeMark;
