/**
 * Variant B — the same two variants, with the states variant A declared and
 * never delivered.
 *
 * A's transition list read `transition-[background-color,border-color,transform]`
 * and nothing in it ever animated a transform: there was no press state at all,
 * so a click produced no feedback until the page changed. It also had no hover
 * treatment on the solid variant beyond a flat colour swap, and disabled was
 * 50% opacity, which dims the label as much as the fill and can drop a solid
 * button's text under 4.5:1.
 *
 * What is different here:
 *
 * - A real press. `active:scale-[0.97]` on a compositor-only property, so it
 *   costs nothing and cannot cause layout. This is the whole point of the
 *   variant: a button that does not answer the pointer feels broken however
 *   well it is coloured.
 * - Hover lifts the solid variant by 1px rather than only recolouring it, which
 *   reads as a physical object rather than a state change.
 * - Disabled keeps the label at full opacity and drops only the fill, using
 *   --stone, so the text stays legible while the control reads as unavailable.
 * - Focus is explicit rather than relying on the global :focus-visible ring,
 *   because that ring is drawn outside the pill and is easy to lose against a
 *   busy photograph.
 *
 * The API is unchanged — children, as, variant, fullWidth, className and any
 * spread props — so every caller and every existing test still holds.
 */
const VARIANTS = {
    solid: `bg-accent text-on-accent
            hover:bg-accent-strong hover:-translate-y-px
            disabled:bg-stone disabled:text-on-accent disabled:translate-y-0`,
    outline: `border border-border-interactive text-text
              hover:border-accent-strong hover:bg-surface
              disabled:border-border disabled:text-text-muted`,
};

const Button = ({
    children,
    as: Component = 'button',
    variant = 'solid',
    fullWidth = false,
    className = '',
    ...props
}) => {
    // type only means anything on a real <button>; putting it on an anchor is
    // invalid. Spread after so a caller can still pass type="submit".
    const typeProp = Component === 'button' ? { type: 'button' } : {};

    return (
        <Component
            {...typeProp}
            className={`inline-flex justify-center items-center gap-2 px-7 py-3.5 rounded-full
                        font-medium text-[0.95rem] cursor-pointer select-none
                        transition-[background-color,border-color,transform,box-shadow] duration-200
                        ease-[cubic-bezier(0.16,1,0.3,1)]
                        active:scale-[0.97]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                        focus-visible:ring-offset-2 focus-visible:ring-offset-bg
                        disabled:cursor-not-allowed disabled:active:scale-100
                        motion-reduce:transition-none motion-reduce:active:scale-100
                        motion-reduce:hover:translate-y-0
                        ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
};

export default Button;
