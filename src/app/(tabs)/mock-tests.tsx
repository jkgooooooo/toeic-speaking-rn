import { router } from 'expo-router';
import { View } from 'react-native';

import { ActionButton, Icon, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';

export default function MockTestsScreen() {
  const c = usePalette();
  return <Screen><TopBar title="모의고사" settings /><Title subtitle="준비가 되면 한 회씩, 시험 흐름에 익숙해져요.">{'차근차근,\n실전을 준비해요.'}</Title>
    <View style={{ padding: 25, borderRadius: 26, backgroundColor: c.panel, gap: 17 }}><Icon name="layers-outline" size={32} color={c.primary} /><Label style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 31 }}>11문항 실전 모의고사</Label><Label style={{ color: c.muted, fontSize: 14 }}>지문 읽기부터 의견 제시까지</Label><Label style={{ color: c.primary, fontFamily: fonts.medium }}>준비 중</Label></View>
    <Notice>전체 모의고사는 아직 제공되지 않아요. 지금은 질문 3개로 가볍게 연습할 수 있어요.</Notice>
    <ActionButton title="오늘의 연습 시작" onPress={() => router.push('/practice')} />
  </Screen>;
}
