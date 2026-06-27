import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const colors = {
  light: {
    primary: '#FF6B6B',
    primaryLight: '#FF8E8E',
    primaryDark: '#E55555',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    success: '#6BCB77',
    warning: '#FFD93D',
    danger: '#FF6B6B',
    info: '#4D96FF',

    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundCard: '#FFFFFF',
    backgroundInput: '#F1F3F5',

    text: '#212529',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    textInverse: '#FFFFFF',

    border: '#E9ECEF',
    borderLight: '#F1F3F5',

    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',

    fasting: '#FF6B6B',
    eating: '#6BCB77',
  },
  dark: {
    primary: '#FF6B6B',
    primaryLight: '#FF8E8E',
    primaryDark: '#E55555',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    success: '#6BCB77',
    warning: '#FFD93D',
    danger: '#FF6B6B',
    info: '#4D96FF',

    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    backgroundCard: '#252525',
    backgroundInput: '#2D2D2D',

    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#707070',
    textInverse: '#121212',

    border: '#333333',
    borderLight: '#2A2A2A',

    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',

    fasting: '#FF6B6B',
    eating: '#6BCB77',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const LightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.light.primary,
    background: colors.light.background,
    card: colors.light.backgroundCard,
    text: colors.light.text,
    border: colors.light.border,
    notification: colors.light.primary,
  },
};

export const DarkThemeCustom = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.dark.primary,
    background: colors.dark.background,
    card: colors.dark.backgroundCard,
    text: colors.dark.text,
    border: colors.dark.border,
    notification: colors.dark.primary,
  },
};

export type ThemeColors = typeof colors.light;
