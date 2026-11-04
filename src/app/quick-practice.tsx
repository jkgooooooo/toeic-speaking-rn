import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon, Label, Screen, Title, TopBar } from '@/components/ui';
import { dailyPractice } from '@/content/daily';
import { fonts, usePalette } from '@/design/theme';

export default function QuickPracticeScreen() {
  const c = usePalette();
  return <Screen><TopBar title="짧은 질문 연습" back />
    <Title subtitle="마음에 드는 질문을 골라 한 문제씩 말해봐요.">{'오늘은 어떤 이야기를\n해볼까요?'}</Title>
    {dailyPractice.questions.map((question, index) => <Pressable key={question.id} accessibilityRole="button" accessibilityLabel={`${index + 1}번, ${question.topic}, ${question.prompt}, 답변 ${question.responseSeconds}초`} onPress={() => router.push({ pathname: '/practice', params: { questionId: question.id } })} style={({ pressed }) => ({ backgroundColor: c.panel, borderRadius: 20, padding: 18, gap: 10, opacity: pressed ? 0.65 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Label style={{ fontFamily: fonts.bold, color: c.primary, fontSize: 12 }}>{String(index + 1).padStart(2, '0')} · {question.topic}</Label><Label style={{ flex: 1, textAlign: 'right', color: c.muted, fontSize: 12 }}>답변 {question.responseSeconds}초</Label><Icon name="arrow-forward-outline" color={c.primary} size={17} /></View>
      <Label style={{ fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 }}>{question.prompt}</Label>
    </Pressable>)}
  </Screen>;
}
