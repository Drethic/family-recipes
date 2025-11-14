import { createContext } from 'react';
import { ThemePreference } from '@/types';

export interface ThemeContextType {
  theme: 'light' | 'dark';
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
