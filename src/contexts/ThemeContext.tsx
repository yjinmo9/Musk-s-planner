'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from settings
  useEffect(() => {
    const loadTheme = async () => {
      if (!user) {
        // Guest mode: load from localStorage
        const saved = localStorage.getItem('musk-settings-guest');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.theme) {
              setThemeState(parsed.theme);
            }
          } catch (e) {
            console.error('Failed to load guest theme', e);
          }
        }
        setIsLoaded(true);
        return;
      }

      // Logged in: load from Supabase
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .single();
      
      if (!error && data?.theme) {
        setThemeState(data.theme);
      }
      setIsLoaded(true);
    };

    loadTheme();
  }, [user, supabase]);

  // Update theme
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    if (!user) {
      // Guest mode: save to localStorage
      const saved = localStorage.getItem('musk-settings-guest');
      const settings = saved ? JSON.parse(saved) : {};
      settings.theme = newTheme;
      localStorage.setItem('musk-settings-guest', JSON.stringify(settings));
    } else {
      // Logged in: save to Supabase
      await supabase
        .from('user_settings')
        .update({ theme: newTheme })
        .eq('user_id', user.id);
    }
  };

  // Apply theme to document
  useEffect(() => {
    if (isLoaded) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, isLoaded]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
