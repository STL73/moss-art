import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import Button from '../components/Button';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { HERO_CLAIMS } from '../constants';
import { creek as creekPlate, dropletPlate as dollyPlate } from '../assets/images';

/**
 * A camera move in two shots, done without video.
 *
 * Wide on the creek — moss over rock and running water — then a cut in to the
 * droplet. Both shots are wild moss, so the cut reads as one camera moving
 * closer rather than as a change of subject.
 *
 * Why not video or a scrubbed image sequence: a 60-frame sequence at this width
 * is 6–10 MB against a 2.2 MB bundle. This is two stills totalling 470 kB and
 * animates one transform, so the work stays on the compositor.
 *
 * dropletPlate.webp is a wide re-cut of dropletMaster, which had been cropped so
 * tight it threw away the blurred background above the moss. The droplet sits
 * at 62% across and 45% down it; anchoring the transform there is what makes
 * the push read as a camera travelling towards the droplet rather than the
 * frame simply inflating. 62% also clears the text column — at 49% the camera
 * arrived at a subject half-hidden behind its own scrim.
 */
const DROPLET = '62% 45%';
const CUT_AT = 0.45;

// The move needs somewhere to happen. A hero that scrolls away takes its
// animation with it, so the section is tall and the stage inside it sticks:
// the camera pushes in while the picture holds still on screen.
const TALL = 'relative h-[220vh]';
const STAGE = 'sticky top-0 h-screen overflow-hidden';

// The scrim now lives in index.css as .hero-scrim rather than as an inline
// style here. It needs a media query — a phone gets a flat scrim because the
// copy runs the full width and a horizontal reveal has nothing to reveal into —
// and an inline style cannot carry one.

// The fade is on the wrapper and the zoom on the image inside it. Both were on
// the <img> to begin with and the cut never ran: Motion wrote the opening
// opacity once and never touched it again, while driving `scale` on that same
// element correctly throughout. Splitting them across two elements fixes it.
//
// A plate is full-bleed and then scaled past the viewport, so `sizes` cannot
// simply be 100vw. It is set to the midpoint of each move rather than its end:
// asking for the full 1.75x at 3x device pixels means a phone downloading the
// entire 2160px plate, which is the thing responsive images exist to stop. The
// cost is some softness at the very end of the push, on a photograph that is
// already behind a scrim and a colour filter and is moving while it is seen.
const Plate = ({ photo, sizes, origin, scale, opacity, priority = false }) => (
    <motion.div style={{ opacity }} className="absolute inset-0">
        <motion.img
            src={photo.src}
            srcSet={photo.srcset}
            sizes={sizes}
            width={photo.w}
            height={photo.h}
            alt=""
            aria-hidden="true"
            // Only the opening shot is the LCP candidate. Marking both high
            // makes them race, and the one that wins is the one nobody sees yet.
            fetchPriority={priority ? 'high' : undefined}
            style={{ transformOrigin: origin, scale }}
            className="absolute inset-0 size-full object-cover photo-filter"
        />
    </motion.div>
);

const Hero = () => {
    const ref = useRef(null);
    const reduced = useReducedMotion();
    const [onSecondShot, setOnSecondShot] = useState(false);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

    // A cut, not a dissolve. Two shots of different scenes is a film edit, and
    // film cuts — it does not crossfade one place into another.
    useMotionValueEvent(scrollYProgress, 'change', (value) => {
        setOnSecondShot(value >= CUT_AT);
    });

    const wideScale = useTransform(scrollYProgress, [0, CUT_AT], [1, 1.3]);
    // 1.75, not more: dropletPlate.webp is 2160px wide, and past this the droplet
    // stops being sharper than the screen it is drawn on. The second shot opens
    // at 1.15 so it is already moving when the cut lands, rather than starting
    // from rest and reading as a jump.
    const closeScale = useTransform(scrollYProgress, [CUT_AT, 1], [1.15, 1.75]);

    return (
        <>
            <section ref={ref} id="home" className={TALL}>
                <div className={STAGE}>
                    {/* Both plates stay mounted and the cut is a change of static
                        opacity. Rendering only the active shot meant the second
                        image did not start downloading until the cut landed, so
                        on a cold cache the edit flashed empty. */}
                    <Plate
                        photo={creekPlate}
                        sizes="115vw"
                        priority
                        origin="50% 60%"
                        scale={reduced ? 1 : wideScale}
                        opacity={onSecondShot ? 0 : 1}
                    />
                    <Plate
                        photo={dollyPlate}
                        sizes="150vw"
                        origin={DROPLET}
                        scale={reduced ? 1 : closeScale}
                        opacity={onSecondShot ? 1 : 0}
                    />

                    <div className="absolute inset-0 hero-scrim" />

                    <div className="relative max-container padding-x flex h-screen items-center">
                        <div className="w-full max-w-lg">
                            <p className="eyebrow">Handmade in small batches</p>
                            <h1 className="font-display text-(length:--text-hero) leading-[0.98] mt-6">
                                Living <em className="text-accent italic">texture</em>
                            </h1>
                            {/* The care list lives in the band below. Saying it
                                here as well was the same sentence twice. */}
                            <p className="mt-7 max-w-sm text-text-muted leading-relaxed">
                                Preserved Nordic moss, arranged by hand. Deep green and soft to the
                                touch — a piece of woodland floor for a wall, a shelf, or a desk.
                            </p>
                            <div className="mt-10">
                                <Button as={Link} to="/products">Shop the collection</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-container padding-x py-14 border-y border-border">
                <div className="flex justify-between flex-wrap gap-10">
                    {HERO_CLAIMS.map((claim) => (
                        <div key={claim.label}>
                            <p className="font-display text-(length:--text-title)">
                                {claim.value} <em className="text-accent italic">{claim.label}</em>
                            </p>
                            <p className="eyebrow mt-2">{claim.suffix}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
};

export default Hero;
