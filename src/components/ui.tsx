import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps, PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, type TextProps, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts, usePalette } from '@/design/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 21, color }: { name: IconName; size?: number; color?: ComponentProps<typeof Ionicons>['color'] }) {
  const c = usePalette();
  return <Ionicons name={name} size={size} color={color ?? c.ink} accessible={false} />;
}

export function Label({ style, ...props }: TextProps) {
  const c = usePalette();
  return <Text {...props} style={[{ fontFamily: fonts.regular, color: c.ink, fontSize: 15, lineHeight: 23 }, style]} />;
}

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const c = usePalette();
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: c.background }}>
    {scroll ? <ScrollView contentContainerStyle={[styles.content, style]}>{children}</ScrollView> : <View style={[styles.content, { flex: 1 }, style]}>{children}</View>}
  </SafeAreaView>;
}

export function TopBar({ title, back = false, settings = false, onBack }: { title?: string; back?: boolean; settings?: boolean; onBack?: () => void }) {
  const c = usePalette();
  return <View style={styles.topbar}>
    {back && <IconButton name="arrow-back-outline" label="뒤로" onPress={onBack ?? (() => router.back())} />}
    {title ? <Label style={{ fontFamily: fonts.bold, fontSize: 17, flex: 1 }}>{title}</Label> : <View style={{ flexDirection: 'row', alignItems: 'baseline', flex: 1 }}><Label style={{ fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, letterSpacing: -1.5 }}>speaking</Label><Label style={{ color: c.primary, fontFamily: fonts.bold, fontSize: 30 }}>.</Label></View>}
    {settings && <IconButton name="options-outline" label="음성 설정" onPress={() => router.push('/settings')} filled />}
  </View>;
}

export function IconButton({ name, label, onPress, filled = false, disabled = false }: { name: IconName; label: string; onPress: () => void; filled?: boolean; disabled?: boolean }) {
  const c = usePalette();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? c.panel : 'transparent', opacity: pressed || disabled ? 0.5 : 1 })}><Icon name={name} /></Pressable>;
}

export function ActionButton({ title, onPress, icon = 'arrow-forward-outline', secondary = false, disabled = false, busy = false }: { title: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean; busy?: boolean }) {
  const c = usePalette();
  const color = secondary ? c.ink : c.onPrimary;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? c.panel : c.primary, opacity: pressed || disabled || busy ? 0.6 : 1 }]}>
    {busy ? <ActivityIndicator color={color} /> : <><Label style={{ fontFamily: fonts.bold, color }}>{title}</Label><Icon name={icon} color={color} size={19} /></>}
  </Pressable>;
}

export function Title({ children, subtitle }: PropsWithChildren<{ subtitle?: string }>) {
  const c = usePalette();
  return <View style={{ gap: 12 }}><Label accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -1.3 }}>{children}</Label>{subtitle && <Label style={{ color: c.muted, fontSize: 14 }}>{subtitle}</Label>}</View>;
}

export function Notice({ children, error = false }: PropsWithChildren<{ error?: boolean }>) {
  const c = usePalette();
  return <View style={{ backgroundColor: c.panel, borderRadius: 16, padding: 16, flexDirection: 'row', gap: 10 }}><Icon name={error ? 'alert-circle-outline' : 'information-circle-outline'} color={error ? c.danger : c.muted} size={19} /><Label accessibilityRole={error ? 'alert' : undefined} style={{ flex: 1, color: error ? c.danger : c.muted, fontSize: 13, lineHeight: 21 }}>{children}</Label></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 32, gap: 27, width: '100%', maxWidth: 560, alignSelf: 'center' },
  topbar: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 10 },
  button: { minHeight: 56, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
});
