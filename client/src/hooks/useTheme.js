import { createContext, useContext } from 'react';

// Kept out of ThemeContext.jsx so that file exports a component and nothing
// else — see the note in useCart.js.
export const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
    return context;
};
