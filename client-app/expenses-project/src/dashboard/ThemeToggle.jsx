import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Button to toggle between light and dark mode.
 */
export default function ThemeToggle() {
  const { mode, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
      aria-label="Toggle theme"
    >
      {mode === 'light' ? (
        <Moon className="w-5 h-5 text-gray-800" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-300" />
      )}
    </button>
  );
}
