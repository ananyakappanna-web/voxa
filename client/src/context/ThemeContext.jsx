import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Theme options: 'dark' (Lights out), 'dim' (Midnight navy), 'light' (Default light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('voxa_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'dim', 'light');

    if (theme === 'dim') {
      root.classList.add('dim');
    } else if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }

    localStorage.setItem('voxa_theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
