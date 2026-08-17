// Mirrors ProductCard's geometry so the grid does not shift when data lands.
const ProductCardSkeleton = () => (
    <div className="card-surface p-3 animate-pulse">
        <div className="w-full aspect-square rounded-xl bg-raised" />
        <div className="px-1 pt-4 pb-1">
            <div className="flex justify-between gap-3">
                <div className="h-3.5 bg-raised rounded w-1/2" />
                <div className="h-3.5 bg-raised rounded w-1/5" />
            </div>
            <div className="h-2.5 bg-raised rounded w-1/3 mt-3" />
            <div className="h-8 bg-raised rounded-full w-16 mt-4 ml-auto" />
        </div>
    </div>
);

export default ProductCardSkeleton;
