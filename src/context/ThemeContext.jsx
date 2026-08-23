import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        // Light is the fully-realized "Memphis × Football" direction: flat
        // saturated fills need a light cream field to read as cut paper.
        // Dark is a coherent adapted variant (deep ink base, same hues
        // lifted for contrast), not the default.
        return savedTheme || 'light';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        // Also toggle a class on html for Tailwind dark mode if needed, 
        // though daisyUI uses data-theme
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Co-locating this hook with its provider is the standard React context
// pattern; disabling below only affects dev-mode Fast Refresh granularity,
// not correctness.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    return useContext(ThemeContext);
}
