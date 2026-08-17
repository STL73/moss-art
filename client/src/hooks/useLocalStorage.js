import { useState, useEffect } from 'react';

// Reads once on mount and writes on every change. Corrupt or unavailable
// storage falls back silently rather than crashing the app — a broken cart
// should never take the page down.
export const useLocalStorage = (key, fallback) => {
    const [value, setValue] = useState(() => {
        try {
            const stored = window.localStorage.getItem(key);
            return stored === null ? fallback : JSON.parse(stored);
        } catch {
            return fallback;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Private browsing or quota exceeded — state still works in memory.
        }
    }, [key, value]);

    return [value, setValue];
};
