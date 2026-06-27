import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { colors, ThemeColors, LightTheme, DarkThemeCustom } from '../theme';
import { AppSettings, ThemeType } from '../types';
import { getAppSettings, updateAppSettings as updateSettingsDB } from '../db';

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  isDark: boolean;
  navigationTheme: any;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('system');
  const systemDark = Appearance.getColorScheme() === 'dark';
  const isDark = theme === 'system' ? systemDark : theme === 'dark';
  const currentColors = isDark ? colors.dark : colors.light;
  const navigationTheme = isDark ? DarkThemeCustom : LightTheme;

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getAppSettings();
      if (settings) {
        setThemeState(settings.theme);
      }
    };
    loadSettings();
  }, []);

  const setTheme = useCallback(async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await updateSettingsDB({ theme: newTheme });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, colors: currentColors, isDark, navigationTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
