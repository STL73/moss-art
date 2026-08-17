import { LuMail, LuPhone, LuClock } from 'react-icons/lu';
import PageHeader from '../components/PageHeader';
import PhotoBackdrop from '../components/PhotoBackdrop';
import { hillside } from '../assets/images';
import { contactEmail, contactPhone, contactTel } from '../constants';

// Deliberately no contact form. The API has no endpoint to receive one
// (server/routes only wires auth and users), and a form that silently drops
// messages is worse than no form at all. Add one when there is something
// listening for it.
const methods = [
    {
        Icon: LuMail,
        label: 'Email',
        value: contactEmail,
        href: `mailto:${contactEmail}`,
        note: 'Best for custom orders — send a photo of the space if you have one.',
    },
    {
        Icon: LuPhone,
        label: 'Phone',
        value: contactPhone,
        href: contactTel,
        note: 'Weekdays, 9am to 5pm.',
    },
];

// Anchor ids here are linked directly from the footer. Renaming one breaks
// those links, so Contact.test.jsx asserts all three still exist.
const sections = [
    {
        id: 'faq',
        title: 'Common',
        accent: 'questions',
        items: [
            {
                q: 'Does preserved moss need watering?',
                a: 'No. It is preserved with a plant-based glycerin solution, which halts ageing permanently. Watering it will damage it.',
            },
            {
                q: 'Does it need light?',
                a: 'None at all. It keeps its colour in a windowless room, which is why it works in hallways and bathrooms where a live plant would not.',
            },
            {
                q: 'How long does it last?',
                a: 'Years indoors. Keep it out of direct sunlight and away from radiators, and dust it occasionally with a dry brush.',
            },
            {
                q: 'Can you make something to size?',
                a: 'Yes — most wall panels are commissioned. Email us with the dimensions and we will come back with a quote.',
            },
        ],
    },
    {
        id: 'delivery',
        title: 'Delivery',
        accent: 'and packing',
        items: [
            {
                q: 'How much is delivery?',
                a: 'Free on orders over £50. Below that it is a flat £4.95 anywhere in the UK.',
            },
            {
                q: 'How long does it take?',
                a: 'Pieces in stock are dispatched within two working days. Commissions are made to order and take two to three weeks.',
            },
            {
                q: 'How is it packed?',
                a: 'In moulded recycled-pulp trays inside a plain card outer. No plastic anywhere in the box.',
            },
        ],
    },
    {
        id: 'returns',
        title: 'Returns',
        accent: 'and damage',
        items: [
            {
                q: 'Can I return a piece?',
                a: 'Yes, within 30 days, provided it is unused and in its original packaging. Email us first and we will send return instructions.',
            },
            {
                q: 'What if it arrives damaged?',
                a: 'Send a photo within 48 hours of delivery and we will replace it or refund you in full. You will not need to return the damaged piece.',
            },
            {
                q: 'Are commissions returnable?',
                a: 'Made-to-measure pieces are not returnable unless they arrive damaged or differ from what was agreed.',
            },
        ],
    },
];

const Contact = () => (
    <>
        <PageHeader
            title="Get in"
            accent="touch"
            lead="Questions about a piece, a commission, or an order already on its way — this is the fastest way to reach the studio."
        />

        <div className="max-container padding-x">
            <div className="grid sm:grid-cols-2 gap-5">
                {methods.map(({ Icon, label, value, href, note }) => (
                    <div key={label} className="card-surface p-6">
                        <div className="flex items-center gap-3 text-accent">
                            <Icon size={18} />
                            <p className="eyebrow">{label}</p>
                        </div>
                        {/* overflow-wrap: anywhere, not break-words.
                            An email address has no break opportunity in it, so
                            it sets this grid item's min-content width — and a
                            grid item cannot shrink below that, so the card grew
                            wider than the screen instead of the text wrapping.
                            Invisible at the default text size and obvious with
                            the system size turned up: at a 20px root on a 390px
                            phone the card's right edge landed at 397px, off the
                            side of the viewport. That is content lost to a text
                            resize, which WCAG 1.4.4 is about.

                            break-words would not fix it. It permits a break
                            when a word overflows but does not change the
                            intrinsic min-content size, so the grid column would
                            still refuse to shrink. `anywhere` does change it,
                            which is the whole reason it exists. */}
                        <a
                            href={href}
                            className="block mt-3 font-display text-(length:--text-title)
                                       [overflow-wrap:anywhere]
                                       hover:text-accent transition-colors duration-200"
                        >
                            {value}
                        </a>
                        <p className="mt-3 text-sm text-text-muted leading-relaxed">{note}</p>
                    </div>
                ))}
            </div>

            <p className="flex items-center gap-3 mt-6 text-sm text-text-muted">
                <LuClock size={16} className="text-accent shrink-0" />
                We reply to everything within one working day. Made and packed in Manchester.
            </p>

        </div>

        {/* One backdrop behind all three question sections rather than one
            each: three photographs down a single page would read as wallpaper,
            and the scrim only has to be established once. */}
        <PhotoBackdrop image={hillside} className="mt-20">
            <div className="max-container padding-x pb-24">
                {sections.map((section) => (
                    <section key={section.id} id={section.id} className="pt-20 scroll-mt-28">
                        <h2 className="font-display text-(length:--text-display) leading-tight text-balance">
                            {section.title} <em className="text-accent italic">{section.accent}</em>
                        </h2>
                        <dl className="mt-8 flex flex-col gap-6 max-w-2xl">
                            {section.items.map((item) => (
                                <div key={item.q} className="border-t border-border pt-6">
                                    <dt className="font-medium">{item.q}</dt>
                                    <dd className="mt-2 text-text-muted leading-relaxed text-pretty">{item.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
            </div>
        </PhotoBackdrop>
    </>
);

export default Contact;
