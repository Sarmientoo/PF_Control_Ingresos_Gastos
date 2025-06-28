// src/components/Header.jsx
import React from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header({ userName }) {
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
  };

  return (
    <header className="bg-emerald-500 dark:bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo + App Name */}
        <div className="flex items-center space-x-3 ml-o">
          <img
            src="public/wallet-money-svgrepo-com.svg"
            alt="GastAr App Logo"
            className="h-8 w-auto"
          />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight hidden sm:block">
            GastAr App
          </span>
        </div>

        {/* User + Toggle + Logout */}
        <div className="flex items-center space-x-4">
          <span className="text-gray-800 dark:text-gray-200 font-medium font-semibold">
            Hola, {userName}
          </span>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="ml-2 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all duration-200 shadow"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}
