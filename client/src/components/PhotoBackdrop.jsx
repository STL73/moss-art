import Photo from './Photo';

/**
 * A section whose background is a photograph, with a scrim that guarantees the
 * text on top stays readable.
 *
 * The scrim is the whole point: it holds near-solid page colour across the text
 * column and releases the image beyond it, so contrast never depends on which
 * part of the photograph happens to sit behind a given word. Both curves are
 * tuned per theme in index.css.
 *
 * Use this only where text sits on a photograph. Where nothing has to stay
 * readable, render the image on its own — a scrim with no text to protect is
 * the effect copied without the reason for it.
 */
const PhotoBackdrop = ({ image, alt = '', children, className = '', priority = false }) => (
    <section className={`relative overflow-hidden ${className}`}>
        <Photo
            photo={image}
            // Full-bleed: the section runs edge to edge at every breakpoint, so
            // the drawn width is the viewport width.
            sizes="100vw"
            // Decorative by default: the section's own heading and copy carry
            // the meaning, so an empty alt keeps it out of the accessibility
            // tree rather than making screen readers announce scenery. Pass alt
            // only when the photograph is genuinely informative.
            alt={alt}
            aria-hidden={alt === '' ? 'true' : undefined}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 size-full object-cover photo-filter"
        />
        <div className="absolute inset-0 photo-scrim" />
        <div className="relative">{children}</div>
    </section>
);

export default PhotoBackdrop;
