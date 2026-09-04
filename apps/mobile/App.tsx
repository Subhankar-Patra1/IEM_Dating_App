import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular_Italic,
    Inter_500Medium,
    Inter_700Bold,
    Syne_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return null; // Let the splash screen stay visible while fonts load
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <RootNavigator />
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
