import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { LuArrowRight } from 'react-icons/lu';
import { getProducts } from '../lib/api';
import { useCart } from '../hooks/useCart';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

const FeaturedProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addItem } = useCart();

    useEffect(() => {
        let active = true;
        getProducts().then((result) => {
            if (!active) return;
            setProducts(result.slice(0, 4));
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    return (
        <section id="featured" className="max-container padding-x py-24">
            <div className="flex justify-between items-end gap-6">
                <h2 className="font-display text-(length:--text-display) leading-tight">
                    Selected <em className="text-accent italic">pieces</em>
                </h2>
                <Link
                    to="/products"
                    className="flex items-center gap-2 text-sm text-text-muted hover:text-text
                               underline underline-offset-4 transition-colors duration-200 shrink-0"
                >
                    View all <LuArrowRight size={15} />
                </Link>
            </div>

            <div className="mt-12 grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-5">
                {loading
                    ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)
                    : products.map((product) => (
                        <ProductCard key={product.id} product={product} onAdd={addItem} />
                    ))}
            </div>
        </section>
    );
};

export default FeaturedProducts;
