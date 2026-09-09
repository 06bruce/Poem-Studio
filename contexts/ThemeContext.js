'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'theme';

export const ThemeProvider = ({ children }) => {
  // The inline script in app/layout.js already set data-theme on <html> before
  // hydration, so read that back rather than defaulting to 'dark' and causing
  // a flash/mismatch.
  const [theme, setThemeState] = useState(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f1e6' : '#0c0e17');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode, etc.) — theme just won't persist
    }
  }, [theme]);

  const toggleTheme = () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  const setTheme = (next) => setThemeState(next === 'light' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
