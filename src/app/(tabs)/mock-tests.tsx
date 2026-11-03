import { router } from 'expo-router';
import { View } from 'react-native';

import { ActionButton, Icon, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';
import { mockSets } from '@/content/mock';

export default function MockTestsScreen() {
  const c = usePalette();
  return <Screen><TopBar title="모의고사" settings /><Title subtitle="준비가 되면 한 회씩, 시험 흐름에 익숙해져요.">{'차근차근,\n실전을 준비해요.'}</Title>
    <View style={{ padding: 25, borderRadius: 26, backgroundColor: c.panel, gap: 17 }}><Icon name="layers-outline" size={32} color={c.primary} /><Label style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 31 }}>11문항 실전 모의고사</Label><Label style={{ color: c.muted, fontSize: 14 }}>지문 읽기부터 의견 제시까지</Label><Label style={{ color: c.primary, fontFamily: fonts.medium }}>오리지널 3회분</Label></View>
    <Notice>11문항이 자동으로 진행돼요. 답변은 완료할 때마다 기기에 저장돼요.</Notice>
    {mockSets.map(set => <ActionButton key={set.id} title={`${set.title} 시작`} onPress={() => router.push({ pathname: '/mock', params: { set: set.id } })} />)}
    <Label style={{ fontFamily: fonts.bold, fontSize: 18 }}>모의고사 01 파트별 연습</Label>
    {([['reading', 'Part 1 · 지문 읽기'], ['photo', 'Part 2 · 사진 묘사'], ['short', 'Part 3 · 질문 답변'], ['table', 'Part 4 · 자료 활용'], ['opinion', 'Part 5 · 의견 말하기']] as const).map(([part, title]) => <ActionButton key={part} title={title} secondary onPress={() => router.push({ pathname: '/mock', params: { set: 'mock1', part } })} />)}
    <ActionButton title="짧은 연습 먼저 하기" secondary onPress={() => router.push('/practice')} />
  </Screen>;
}
