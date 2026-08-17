import { createContext, useContext } from 'react';

// The context object and its consumer hook live apart from the provider
// component. A module that exports both a component and a non-component
// breaks React Fast Refresh, which the lint config enforces.
export const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used inside a CartProvider');
    return context;
};
