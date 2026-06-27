import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AppDataProvider } from './src/hooks/useAppData';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDB } from './src/db';
import { useTheme } from './src/theme/ThemeContext';

function AppContent() {
  const [dbReady, setDbReady] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
      } catch (e) {
        console.error('DB init error:', e);
      }
      setDbReady(true);
    };
    setup();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>加载中...</Text>
      </View>
    );
  }

  return (
    <AppDataProvider>
      <AppNavigator />
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
