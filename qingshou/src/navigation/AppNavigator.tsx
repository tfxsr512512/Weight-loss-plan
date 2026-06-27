import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { colors, spacing, fontSize } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import FoodScreen from '../screens/FoodScreen';
import FastingScreen from '../screens/FastingScreen';
import WeightScreen from '../screens/WeightScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FoodDetailScreen from '../screens/FoodDetailScreen';
import FoodCategoryScreen from '../screens/FoodCategoryScreen';
import CheckInCalendarScreen from '../screens/CheckInCalendarScreen';
import RecipeScreen from '../screens/RecipeScreen';

export type RootTabParamList = {
  Home: undefined;
  Food: undefined;
  Fasting: undefined;
  Weight: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  FoodDetail: { foodId: string };
  FoodCategory: { category: string; categoryName: string };
  CheckInCalendar: undefined;
  Recipe: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const { isDark } = useTheme();
  const color = focused ? colors[isDark ? 'dark' : 'light'].primary : isDark ? '#707070' : '#ADB5BD';
  
  const icons: Record<string, string> = {
    Home: '🏠',
    Food: '🍎',
    Fasting: '⏱️',
    Weight: '⚖️',
    Profile: '👤',
  };

  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || '●'}
    </Text>
  );
};

const TabNavigator = () => {
  const { colors: themeColors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textTertiary,
        tabBarStyle: {
          backgroundColor: themeColors.backgroundCard,
          borderTopColor: themeColors.border,
          height: 60,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
        },
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTintColor: themeColors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="Food" component={FoodScreen} options={{ title: '饮食' }} />
      <Tab.Screen name="Fasting" component={FastingScreen} options={{ title: '断食' }} />
      <Tab.Screen name="Weight" component={WeightScreen} options={{ title: '体重' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { navigationTheme } = useTheme();

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="FoodDetail" 
          component={FoodDetailScreen} 
          options={{ headerShown: true, title: '食物详情' }}
        />
        <Stack.Screen 
          name="FoodCategory" 
          component={FoodCategoryScreen} 
          options={{ headerShown: true, title: '食物分类' }}
        />
        <Stack.Screen 
          name="CheckInCalendar" 
          component={CheckInCalendarScreen} 
          options={{ headerShown: true, title: '打卡日历' }}
        />
        <Stack.Screen 
          name="Recipe" 
          component={RecipeScreen} 
          options={{ headerShown: true, title: '轻断食食谱' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
};
