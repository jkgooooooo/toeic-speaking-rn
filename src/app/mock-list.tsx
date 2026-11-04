import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { mockSets } from '@/content/mock';
import { fonts, usePalette } from '@/design/theme';
import { loadMockSession, type MockResume } from '@/features/mock/mock-resume';

export default function MockListScreen() {
  const c = usePalette();
  const [resume, setResume] = useState<MockResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadMockSession().then(value => { if (active) { setResume(value); setError(null); } }).catch(() => { if (active) { setResume(null); setError('이전 진행 정보를 불러오지 못했어요. 회차를 선택해 확인해주세요.'); } });
    return () => { active = false; };
  }, []));
  const resumeSet = mockSets.find(set => set.id === resume?.setId);
  return <Screen><TopBar title="실전 모의고사" back />
    <Title subtitle="11문항을 시험 흐름에 맞춰 풀어봐요.">{'준비된 만큼,\n한 회씩.'}</Title>
    {error && <Notice error>{error}</Notice>}
    {resume && resumeSet && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/mock', params: { set: resumeSet.id } })} style={({ pressed }) => ({ backgroundColor: c.accent, padding: 20, borderRadius: 22, gap: 8, opacity: pressed ? 0.6 : 1 })}>
      <Label style={{ color: c.primary, fontFamily: fonts.bold, fontSize: 12 }}>이어서 풀기</Label><Label style={{ color: c.accentInk, fontFamily: fonts.bold, fontSize: 18 }}>{resumeSet.title}</Label><Label style={{ color: c.accentInk, fontSize: 13 }}>{resume.nextIndex < 11 ? `${resume.nextIndex + 1}번 문항부터 다시 시작해요.` : '답변이 저장되었어요. 결과를 확인해요.'}</Label>
    </Pressable>}
    <Label style={{ fontFamily: fonts.bold, fontSize: 17 }}>전체 회차</Label>
    {mockSets.map(set => <Pressable key={set.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/mock', params: { set: set.id } })} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 19, borderRadius: 20, backgroundColor: c.panel, opacity: pressed ? 0.6 : 1 })}>
      <View style={{ backgroundColor: c.soft, borderRadius: 15, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}><Icon name="layers-outline" color={c.primary} /></View><View style={{ flex: 1, gap: 4 }}><Label style={{ fontFamily: fonts.bold }}>{set.title}</Label><Label style={{ color: c.muted, fontSize: 12 }}>11문항{resume?.setId === set.id ? ' · 진행 중' : ''}</Label></View><Icon name="chevron-forward-outline" size={17} color={c.muted} />
    </Pressable>)}
  </Screen>;
}
