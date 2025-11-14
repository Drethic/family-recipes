import { useEffect, useState, ReactNode } from 'react';
import { ThemePreference } from '@/types';
import { useAppSelector } from '@/app/hooks';
import { ThemeContext } from './ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    user?.theme_preference || ThemePreference.SYSTEM
  );
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Update theme preference when user changes
  useEffect(() => {
    if (user?.theme_preference) {
      setThemePreference(user.theme_preference);
    }
  }, [user?.theme_preference]);

  // Apply theme based on preference
  useEffect(() => {
    const applyTheme = () => {
      let effectiveTheme: 'light' | 'dark' = 'light';

      if (themePreference === ThemePreference.SYSTEM) {
        // Use system preference
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        effectiveTheme = themePreference as 'light' | 'dark';
      }

      setTheme(effectiveTheme);

      // Apply/remove dark class from document
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themePreference === ThemePreference.SYSTEM) {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};
