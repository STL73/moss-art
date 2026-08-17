import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router';
import { LuTruck, LuDroplets, LuHandHeart } from 'react-icons/lu';
import { getProduct, getRelated } from '../lib/api';
import { useCart } from '../hooks/useCart';
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

const ProductDetailView = ({ slug }) => {
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState('loading');
    const { addItem } = useCart();
    const { search } = useLocation();

    useEffect(() => {
        let active = true;
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
                    {/* Carries the query the customer arrived with, so going
                        back lands on the filtered, sorted list they left rather
                        than the full catalogue. */}
                    <li>
                        <Link
                            to={{ pathname: '/products', search }}
                            className="hover:text-text transition-colors"
                        >
                            Shop
                        </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li className="text-text">{product.name}</li>
                </ol>
            </nav>

            <div className="max-container padding-x py-12 grid lg:grid-cols-[55%_1fr] gap-14">
                <Gallery images={product.images} alt={product.name} />

                <div>
                    <p className="eyebrow">{product.species}</p>
                    <h1 className="font-display text-(length:--text-display) leading-tight mt-3">
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
                <h2 className="font-display text-(length:--text-title)">
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

// Keying the view on the slug remounts it when navigating between products,
// which resets status and quantity for free. Resetting them inside the effect
// instead would mean a second render pass on every navigation.
const ProductDetail = () => {
    const { slug } = useParams();
    return <ProductDetailView key={slug} slug={slug} />;
};

export default ProductDetail;
