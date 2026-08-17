/**
 * An <img> for a photograph imported through the asset barrel.
 *
 * Every photo arrives from vite-imagetools as `{ src, srcset, w, h }` — several
 * widths of the same picture. This spreads that across the attributes the
 * browser needs to choose between them, and forces the one thing it cannot work
 * out on its own.
 *
 * `sizes` is required, not optional. It tells the browser how wide the image
 * will be drawn, and the browser has to decide that before it has read any CSS.
 * Without it the default is `100vw` — so a product card 424px wide would pull
 * the 1400px file and the srcset would have bought nothing.
 *
 * `width`/`height` are the intrinsic dimensions of the widest variant. They set
 * the aspect ratio so the layout reserves the right box before the bytes land,
 * which is what keeps the page from jumping. Any `className` that fixes the box
 * — `aspect-square`, `size-16`, `absolute inset-0` — overrides them, as CSS
 * always beats a presentational attribute.
 */
const Photo = ({ photo, sizes, alt = '', className = '', ...rest }) => {
    // A missing `sizes` is silent — the image still renders, just at the widest
    // variant on every device — so it gets shouted about in development rather
    // than discovered later in a network panel.
    if (import.meta.env.DEV && !sizes) {
        throw new Error(`Photo is missing a sizes prop (src: ${photo?.src})`);
    }

    return (
    <img
        src={photo.src}
        srcSet={photo.srcset}
        sizes={sizes}
        width={photo.w}
        height={photo.h}
        alt={alt}
        className={className}
        {...rest}
    />
    );
};

export default Photo;
