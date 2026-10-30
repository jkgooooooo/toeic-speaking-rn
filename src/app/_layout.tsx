import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { usePalette } from '@/design/theme';
import { SettingsProvider } from '@/state/settings';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const c = usePalette();
  const [loaded, error] = useFonts({
    PretendardRegular: require('../../assets/fonts/Pretendard-Regular.otf'),
    PretendardMedium: require('../../assets/fonts/Pretendard-Medium.otf'),
    PretendardBold: require('../../assets/fonts/Pretendard-Bold.otf'),
  });
  useEffect(() => { if (loaded || error) void SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>{error ? <Text style={{ color: c.danger }}>글꼴을 불러오지 못했어요. 앱을 다시 실행해주세요.</Text> : <ActivityIndicator color={c.primary} />}</View>;
  return <SettingsProvider><StatusBar style="auto" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="practice" options={{ gestureEnabled: false }} />
    <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
  </Stack></SettingsProvider>;
}
