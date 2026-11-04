import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';

export default function TabLayout() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown: false, tabBarActiveTintColor: c.ink, tabBarInactiveTintColor: c.muted,
    tabBarStyle: { backgroundColor: c.background, borderTopColor: c.line, height: 64 + insets.bottom, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8), elevation: 0 },
    tabBarLabelStyle: { fontFamily: fonts.regular, fontSize: 11, marginTop: 4 },
  }}>
    <Tabs.Screen name="index" options={{ title: '학습', tabBarIcon: ({ focused }) => <Icon name={focused ? 'albums' : 'albums-outline'} color={focused ? c.ink : c.muted} size={19} /> }} />
    <Tabs.Screen name="mock-tests" options={{ title: '시험 연습', tabBarIcon: ({ focused }) => <Icon name="layers-outline" color={focused ? c.ink : c.muted} size={20} /> }} />
    <Tabs.Screen name="history" options={{ title: '기록', tabBarIcon: ({ focused }) => <Icon name="stats-chart-outline" color={focused ? c.ink : c.muted} size={18} /> }} />
  </Tabs>;
}
