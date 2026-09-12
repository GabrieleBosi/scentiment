import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configureNotifications } from './src/lib/notifications';
import { AppNavigator } from './src/navigation';
import { DiaryProvider } from './src/state/DiaryProvider';

export default function App() {
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <DiaryProvider>
        <AppNavigator />
      </DiaryProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
