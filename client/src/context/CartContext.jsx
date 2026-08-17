import { useReducer, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { CartContext } from '../hooks/useCart';

const STORAGE_KEY = 'cart';

// Every branch returns a new array — the cart is never mutated in place.
const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const existing = state.find((item) => item.id === action.product.id);
            if (existing) {
                return state.map((item) =>
                    item.id === action.product.id
                        ? { ...item, quantity: item.quantity + action.quantity }
                        : item
                );
            }
            return [...state, { ...action.product, quantity: action.quantity }];
        }
        case 'REMOVE_ITEM':
            return state.filter((item) => item.id !== action.id);
        case 'SET_QUANTITY':
            if (action.quantity <= 0) return state.filter((item) => item.id !== action.id);
            return state.map((item) =>
                item.id === action.id ? { ...item, quantity: action.quantity } : item
            );
        case 'CLEAR':
            return [];
        default:
            return state;
    }
};

const readStoredCart = () => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === null ? [] : JSON.parse(stored);
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }) => {
    const [items, dispatch] = useReducer(cartReducer, undefined, readStoredCart);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Private browsing — the cart still works for this session.
        }
    }, [items]);

    const [drawerOpen, setDrawerOpen] = useState(false);

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    // Every action below keeps a stable identity for the life of the provider.
    // Consumers put these in effect dependency arrays — CartDrawer lists
    // closeDrawer and focuses its panel — so an identity that changed whenever
    // the cart or toast changed would re-run those effects and steal focus
    // mid-interaction. dispatch and the setState functions are already stable,
    // which is what lets the dependency lists stay empty.
    const showToast = useCallback((message) => {
        clearTimeout(toastTimer.current);
        setToast(message);
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    }, []);

    // A pending timer must not fire after the provider unmounts.
    useEffect(() => () => clearTimeout(toastTimer.current), []);

    const openDrawer = useCallback(() => setDrawerOpen(true), []);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    // Adding always reveals the basket, so the result of the action is
    // visible without the user going looking for it.
    const addItem = useCallback((product, quantity = 1) => {
        dispatch({ type: 'ADD_ITEM', product, quantity });
        setDrawerOpen(true);
        showToast(`${product.name} added to basket`);
    }, [showToast]);

    const removeItem = useCallback((id) => dispatch({ type: 'REMOVE_ITEM', id }), []);
    const setQuantity = useCallback(
        (id, quantity) => dispatch({ type: 'SET_QUANTITY', id, quantity }),
        []
    );
    const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

    const value = useMemo(() => ({
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        drawerOpen,
        openDrawer,
        closeDrawer,
        toast,
        addItem,
        removeItem,
        setQuantity,
        clear,
    }), [items, drawerOpen, toast, openDrawer, closeDrawer, addItem, removeItem, setQuantity, clear]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
