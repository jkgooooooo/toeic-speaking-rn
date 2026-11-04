import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon, Label, Screen, Title, TopBar, type IconName } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';

export default function ExamPracticeScreen() {
  const c = usePalette();
  const items: { icon: IconName; title: string; note: string; detail: string; path: '/parts' | '/mock-list' }[] = [
    { icon: 'albums-outline', title: '파트별 연습', note: '원하는 유형부터 차근차근', detail: '5개 파트 · 한 문제부터 선택', path: '/parts' },
    { icon: 'layers-outline', title: '실전 모의고사', note: '시험 흐름에 맞춰 끝까지', detail: '11문항 · 3회분', path: '/mock-list' },
  ];
  return <Screen><TopBar title="시험 연습" settings />
    <Title subtitle="오늘 나에게 맞는 연습을 골라보세요.">{'원하는 만큼,\n천천히 시작해요.'}</Title>
    {items.map((item, index) => <Pressable key={item.path} accessibilityRole="button" onPress={() => router.push(item.path)} style={({ pressed }) => ({ padding: 23, borderRadius: 24, backgroundColor: index === 0 ? c.accent : c.panel, gap: 18, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Icon name={item.icon} size={26} color={c.primary} /><Icon name="arrow-forward-outline" color={c.primary} size={20} /></View>
      <View style={{ gap: 4 }}><Label style={{ fontFamily: fonts.bold, fontSize: 21, lineHeight: 30 }}>{item.title}</Label><Label style={{ color: c.muted, fontSize: 13 }}>{item.note}</Label></View>
      <Label style={{ color: c.primary, fontSize: 12, fontFamily: fonts.medium }}>{item.detail}</Label>
    </Pressable>)}
  </Screen>;
}
