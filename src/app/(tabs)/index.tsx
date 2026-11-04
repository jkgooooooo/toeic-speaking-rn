import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton, Icon, Label, Screen, TopBar } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';

export default function HomeScreen() {
  const c = usePalette();
  return <Screen style={{ gap: 27 }}>
    <TopBar settings />
    <View style={{ gap: 14 }}>
      <Label style={{ color: c.muted, fontSize: 14 }}>오늘의 작은 연습</Label>
      <Label accessibilityRole="header" style={styles.title}>{'한 문장씩,\n자신감이 쌓이도록.'}</Label>
    </View>
    <View style={[styles.feature, { backgroundColor: c.accent }]}>
      <View style={styles.featureTop}><Label style={[styles.overline, { color: c.accentInk }]}>TODAY’S PRACTICE</Label><View style={[styles.pill, { backgroundColor: c.soft }]}><Label style={{ fontSize: 11, lineHeight: 18, fontFamily: fonts.medium, color: c.accentInk }}>Q5 · 한 문제</Label></View></View>
      <View style={styles.featureMain}>
        <View style={{ flex: 1, gap: 10 }}><Label style={[styles.featureTitle, { color: c.accentInk }]}>{'일상에 대해\n말해볼까요?'}</Label><Label style={{ fontSize: 13, color: c.accentInk }}>짧은 질문 하나로 시작해요.</Label></View>
        <View style={[styles.orb, { backgroundColor: c.accentInk }]}><Icon name="pulse-outline" size={27} color={c.accent} /></View>
      </View>
    </View>
    <View style={{ gap: 16, paddingTop: 3 }}>
      {[
        ['질문 듣고 생각하기', '짧은 준비 시간에 답변을 떠올려요.'],
        ['내 목소리로 답하기', '제한 시간에 맞춰 말해봐요.'],
        ['들어보고 한 번 더', '내 답변을 듣고 다시 연습해요.'],
      ].map(([title, note], index) => <View key={title} style={styles.step}>
        <View style={[styles.stepNumber, { backgroundColor: index === 0 ? c.primary : c.panel }]}><Label style={{ color: index === 0 ? c.onPrimary : c.muted, fontSize: 12, fontFamily: fonts.bold }}>{index + 1}</Label></View>
        <View style={{ flex: 1, gap: 2 }}><Label style={{ fontFamily: fonts.bold, fontSize: 14 }}>{title}</Label><Label style={{ fontSize: 12, lineHeight: 19, color: c.muted }}>{note}</Label></View>
      </View>)}
    </View>
    <ActionButton title="한 문제 시작하기" onPress={() => router.push('/practice?mode=single')} />
    <ActionButton title="다른 질문 고르기 · 10문제" icon="list-outline" secondary onPress={() => router.push('/quick-practice')} />
    <View style={{ gap: 12 }}>
      <Label style={{ fontFamily: fonts.bold, fontSize: 16 }}>다른 연습도 해볼까요?</Label>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {([['book-outline', '짧은 지문 읽기', 'mock1-q1'], ['chatbubble-outline', '의견 말하기', 'mock1-q11']] as const).map(([icon, title, questionId]) => <Pressable key={questionId} accessibilityRole="button" onPress={() => router.push({ pathname: '/mock', params: { set: 'mock1', questionId } })} style={({ pressed }) => ({ flex: 1, backgroundColor: c.panel, borderRadius: 18, padding: 16, gap: 10, minHeight: 96, opacity: pressed ? 0.6 : 1 })}><Icon name={icon} color={c.primary} /><Label style={{ fontFamily: fonts.medium, fontSize: 13 }}>{title}</Label></Pressable>)}
      </View>
    </View>
    {([['albums-outline', '파트별로 연습하기', '원하는 유형부터 차근차근', '/parts'], ['layers-outline', '실전 모의고사 풀기', '11문항을 시험처럼', '/mock-list']] as const).map(([icon, title, description, path]) => <Pressable key={path} accessibilityRole="button" onPress={() => router.push(path)} style={({ pressed }) => [styles.fullTest, { borderTopColor: c.line, opacity: pressed ? 0.6 : 1 }]}>
      <View style={[styles.smallIcon, { backgroundColor: c.soft }]}><Icon name={icon} color={c.primary} size={19} /></View><View style={{ flex: 1, gap: 3 }}><Label style={{ fontSize: 14, fontFamily: fonts.bold }}>{title}</Label><Label style={{ color: c.muted, fontSize: 12 }}>{description}</Label></View><Icon name="arrow-forward-outline" size={16} />
    </Pressable>)}
  </Screen>;
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -1.3 },
  feature: { borderRadius: 26, padding: 24, gap: 22 },
  featureTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  overline: { fontSize: 11, lineHeight: 18, letterSpacing: 1.2, fontFamily: fonts.bold },
  pill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  featureMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  featureTitle: { fontFamily: fonts.bold, fontSize: 27, lineHeight: 34, letterSpacing: -0.9 },
  orb: { width: 66, height: 66, borderRadius: 24, borderBottomLeftRadius: 7, alignItems: 'center', justifyContent: 'center' },
  step: { flexDirection: 'row', gap: 15, alignItems: 'flex-start' },
  stepNumber: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 15, marginTop: 2 },
  fullTest: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth },
  smallIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
});
