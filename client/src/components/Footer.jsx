import { Link } from 'react-router';
import Logo from './Logo';
import SpireforgeMark from './SpireforgeMark';
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
                    {/* "No watering, no light, no upkeep" was dropped on
                        2026-08-16 — it is the hero band's line now, and the
                        footer was the third place on the page saying it. */}
                    <p className="mt-5 text-sm leading-relaxed text-text-muted">
                        Preserved Nordic moss, arranged by hand in small batches.
                    </p>
                    {/* The circles stay 36px because that is the design; the
                        ::after overlay extends each tap area to 44px without
                        changing anything you can see. */}
                    <div className="flex items-center gap-3 mt-6">
                        {socialMedia.map(({ Icon, label, href }) => (
                            <a
                                key={label}
                                href={href}
                                aria-label={label}
                                className="relative size-9 rounded-full border border-border-interactive
                                           grid place-items-center
                                           after:absolute after:-inset-1 after:content-['']
                                           text-text-muted hover:text-accent hover:border-accent-strong
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

            {/* Two statements, not one sentence. The left is the shop talking
                about itself; the right is who built the site. Running them
                together reads as one claim and buries the credit. */}
            <div className="mt-16 pt-6 border-t border-border flex justify-between items-center
                            gap-4 flex-wrap text-xs text-text-muted">
                <p>© {new Date().getFullYear()} MossArt. Handmade in Manchester.</p>
                {/* A build credit nobody can click is decoration. This is the
                    one link on the page that leaves the site, so it is a plain
                    <a> rather than a router Link, and it stays in the same tab —
                    forcing a new window on someone is a decision for them. */}
                <p className="flex items-center gap-1.5">
                    Site by
                    {/* Mark and word inside the one anchor, so they light up
                        together and there is a single tab stop rather than two
                        links to the same place. */}
                    <a
                        href="https://spireforge.co.uk"
                        className="inline-flex items-center gap-1.5 text-text hover:text-accent
                                   transition-colors duration-200"
                    >
                        <SpireforgeMark />
                        <span className="underline underline-offset-4">Spireforge</span>
                    </a>
                </p>
            </div>
        </div>
    </footer>
);

export default Footer;
