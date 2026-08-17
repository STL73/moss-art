import { Link } from 'react-router';
import { LuTrash2 } from 'react-icons/lu';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/formatPrice';
import QuantityStepper from '../components/QuantityStepper';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Photo from '../components/Photo';

// Delivery is free above this threshold, charged flat below it.
const FREE_DELIVERY_FROM = 5000;
const DELIVERY_FEE = 495;

const Cart = () => {
    const { items, total, setQuantity, removeItem } = useCart();

    if (items.length === 0) {
        return (
            <>
                <PageHeader title="Nothing here" accent="yet" />
                <div className="max-container padding-x pb-24">
                    <p className="text-text-muted">Your basket is empty.</p>
                    <div className="mt-6">
                        <Button as={Link} to="/products">Browse the collection</Button>
                    </div>
                </div>
            </>
        );
    }

    const delivery = total >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;

    return (
        <>
            <PageHeader title="Your" accent="basket" />

            <div className="max-container padding-x pb-24 grid lg:grid-cols-[1fr_320px] gap-12">
                <ul className="flex flex-col gap-5">
                    {items.map((item) => (
                        <li key={item.id} className="card-surface p-4 flex gap-5 items-center max-sm:flex-col max-sm:items-start">
                            <Photo
                                photo={item.images[0]}
                                // Fixed 96px box at every breakpoint.
                                sizes="96px"
                                alt={item.name}
                                className="size-24 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <Link to={`/products/${item.slug}`} className="font-medium hover:text-accent transition-colors">
                                    {item.name}
                                </Link>
                                <p className="text-xs text-text-muted italic mt-1">{item.species}</p>
                                <p className="text-accent mt-2">{formatPrice(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <QuantityStepper
                                    value={item.quantity}
                                    onChange={(value) => setQuantity(item.id, value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    aria-label={`Remove ${item.name} from basket`}
                                    className="p-2.5 rounded-full text-text-muted hover:text-text
                                               hover:bg-surface cursor-pointer transition-colors duration-200"
                                >
                                    <LuTrash2 size={16} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <aside className="card-surface p-6 h-fit lg:sticky lg:top-28">
                    <h2 className="font-display text-(length:--text-title)">Summary</h2>
                    <dl className="mt-6 flex flex-col gap-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-text-muted">Subtotal</dt>
                            <dd>{formatPrice(total)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-text-muted">Delivery</dt>
                            <dd>{delivery === 0 ? 'Free' : formatPrice(delivery)}</dd>
                        </div>
                    </dl>
                    <div className="flex justify-between mt-5 pt-5 border-t border-border">
                        <span className="font-medium">Total</span>
                        <span className="text-accent text-lg font-medium">
                            {formatPrice(total + delivery)}
                        </span>
                    </div>
                    <Button fullWidth className="mt-6" disabled>
                        Checkout
                    </Button>
                    <p className="mt-3 text-xs text-text-muted text-center">
                        Checkout is not available yet.
                    </p>
                </aside>
            </div>
        </>
    );
};

export default Cart;
