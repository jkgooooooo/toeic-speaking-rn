import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ActionButton, Icon, Label, Screen, Title, TopBar, type IconName } from '@/components/ui';
import type { MockPart } from '@/content/mock';
import { partPracticeSets } from '@/content/part-practice';
import { fonts, usePalette } from '@/design/theme';

const parts: { id: MockPart; number: number; title: string; note: string; icon: IconName }[] = [
  { id: 'reading', number: 1, title: '지문 읽기', note: '글을 보고 소리 내어 읽어요', icon: 'book-outline' },
  { id: 'photo', number: 2, title: '사진 묘사', note: '사진 속 장면을 설명해요', icon: 'image-outline' },
  { id: 'short', number: 3, title: '질문에 답하기', note: '일상적인 질문에 답해요', icon: 'chatbubble-outline' },
  { id: 'table', number: 4, title: '자료를 보고 답하기', note: '표에서 필요한 정보를 찾아요', icon: 'grid-outline' },
  { id: 'opinion', number: 5, title: '의견 말하기', note: '생각과 이유를 말해요', icon: 'bulb-outline' },
];

export default function PartsScreen() {
  const c = usePalette();
  const [selected, setSelected] = useState<MockPart | null>(null);
  const part = parts.find(item => item.id === selected);
  return <Screen><TopBar title="파트별 연습" back onBack={() => { if (selected) setSelected(null); else router.back(); }} />
    {!part ? <><Title subtitle="다섯 파트에서 원하는 문제를 골라보세요.">{'어떤 부분을\n연습해볼까요?'}</Title>
      {parts.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => setSelected(item.id)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: c.panel, borderRadius: 20, padding: 18, gap: 14, minHeight: 88, opacity: pressed ? 0.6 : 1 })}>
        <View style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft }}><Icon name={item.icon} color={c.primary} /></View>
        <View style={{ flex: 1, gap: 3 }}><Label style={{ fontSize: 11, color: c.primary, fontFamily: fonts.bold }}>PART {item.number}</Label><Label style={{ fontFamily: fonts.bold }}>{item.title}</Label><Label style={{ color: c.muted, fontSize: 12 }}>{item.note} · 20문항</Label></View><Icon name="chevron-forward-outline" size={17} color={c.muted} />
      </Pressable>)}
    </> : <><Title subtitle={part.note}>{`Part ${part.number}\n${part.title}`}</Title>
      <ActionButton title="다른 파트 고르기" icon="arrow-back-outline" secondary onPress={() => setSelected(null)} />
      {partPracticeSets.map(set => {
        const questions = set.questions.filter(question => question.part === part.id);
        return <View key={set.id} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Label style={{ fontFamily: fonts.bold, fontSize: 15 }}>{set.title}</Label></View>
          {questions.map(question => <Pressable key={question.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/mock', params: { set: set.id, questionId: question.id } })} style={({ pressed }) => ({ backgroundColor: c.panel, borderRadius: 16, padding: 15, flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 62, opacity: pressed ? 0.6 : 1 })}><Label style={{ color: c.primary, fontFamily: fonts.bold }}>Q{question.number}</Label><Label numberOfLines={2} style={{ flex: 1, fontSize: 13 }}>{question.imageLabel ?? (part.id === 'table' ? '자료를 보고 답하기' : question.prompt)}</Label><Icon name="chevron-forward-outline" color={c.muted} size={16} /></Pressable>)}

        </View>;
      })}
    </>}
  </Screen>;
}
