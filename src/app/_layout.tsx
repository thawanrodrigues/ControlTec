import { Stack } from 'expo-router';
import { Theme } from '../ui/themes';
import { View } from 'react-native';
import '../../global.css';

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api } from '../services/api';

export default function RootLayout() {
  useEffect(() => {
    api.init();
  }, []);

  return (
    <SafeAreaProvider>
    <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Theme.colors.background }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
      </Stack>
    </View>
    </SafeAreaProvider>
  );
}
