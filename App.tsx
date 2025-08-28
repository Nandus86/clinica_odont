import React, { useState, useCallback, createContext, useContext, useEffect, useMemo } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { User } from './types';

// --- Theme Context Definition ---
type Theme = 'light' | 'dark';
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}
// Exported so other components can import this context object.
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
// Custom hook for easy consumption of the context.
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

const App: React.FC = () => {
  // LOGIN TEMPORARIAMENTE DESABILITADO: Para reativar a tela de login,
  // mude o estado inicial de `currentUser` para `null`.
  const [currentUser, setCurrentUser] = useState<User | null>({
    email: 'dev@clinica.com',
    role: 'superadmin',
  });
  
  // --- Theme State and Logic ---
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') as Theme;
    }
    // Then check user's OS preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    // Default to light
    return 'light';
  });
  
  useEffect(() => {
      const root = window.document.documentElement;
      if (theme === 'dark') {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme]);
  // --- End Theme Logic ---

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-dark-text-primary min-h-screen transition-colors duration-300">
        {currentUser ? (
          <Dashboard user={currentUser} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )}
      </div>
    </ThemeContext.Provider>
  );
};

export default App;