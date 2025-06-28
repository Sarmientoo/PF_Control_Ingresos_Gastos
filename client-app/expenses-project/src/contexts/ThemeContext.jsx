import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('theme') || 'light'
  );

  // cada vez que cambie `mode`, actualizo <html> y localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggle = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// hook para consumir más cómodo
export const useTheme = () => useContext(ThemeContext);
