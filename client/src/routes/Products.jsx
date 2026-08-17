import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { getProducts } from '../lib/api';
import { useCart } from '../hooks/useCart';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'newest';

    // Results are stored with the query they belong to, so "loading" is derived
    // rather than set — a separate setLoading(true) inside the effect would
    // trigger a second render pass on every filter change.
    const [result, setResult] = useState({ query: null, products: [] });
    const query = `${category}|${sort}`;
    const loading = result.query !== query;
    const products = result.products;
    const { addItem } = useCart();

    // The URL is the source of truth for filter state, so a filtered view is
    // shareable and the back button works.
    useEffect(() => {
        let active = true;
        getProducts({ category, sort }).then((products) => {
            if (active) setResult({ query: `${category}|${sort}`, products });
        });
        return () => { active = false; };
    }, [category, sort]);

    const updateParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value === 'all' || value === 'newest') next.delete(key);
        else next.set(key, value);
        setSearchParams(next);
    };

    return (
        <>
            <PageHeader
                title="The"
                accent="collection"
                lead="Preserved Nordic moss, brought indoors to live for years without water or light."
            />

            <div className="max-container padding-x">
                <FilterBar
                    active={category}
                    onCategoryChange={(value) => updateParam('category', value)}
                    sort={sort}
                    onSortChange={(value) => updateParam('sort', value)}
                    count={products.length}
                />

                {/* AnimatePresence has to outlive the loading swap. Inside the
                    ternary it unmounts on every filter change, taking the cards'
                    exit animation with it — the one case it exists to cover.
                    Skeleton keys are namespaced so React never reconciles a
                    skeleton against a card. */}
                <div className="mt-12 pb-24 grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {loading
                            ? Array.from({ length: 6 }, (_, index) => (
                                <ProductCardSkeleton key={`skeleton-${index}`} />
                            ))
                            : products.map((product) => (
                                <ProductCard key={product.id} product={product} onAdd={addItem} />
                            ))}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default Products;
