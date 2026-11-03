import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { QuestionReview } from '@/components/question-review';
import { Icon, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { dailyPractice, type PracticeQuestion } from '@/content/daily';
import { mockSets } from '@/content/mock';
import { fonts, usePalette } from '@/design/theme';
import { listBookmarkedIds } from '@/services/bookmarks';

type Item = { question: PracticeQuestion; category: string; description?: string };
const catalog: Item[] = [
  ...dailyPractice.questions.map(question => ({ question, category: dailyPractice.title })),
  ...mockSets.flatMap(set => set.questions.map(question => ({ question, category: set.title, description: question.imageLabel }))),
];

export default function BookmarksScreen() {
  const c = usePalette();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setIds(await listBookmarkedIds()); setError(null); }
    catch { setError('저장한 문제를 불러오지 못했어요.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const items = catalog.filter(item => ids.includes(item.question.id));
  const missing = ids.length - items.length;
  return <Screen><TopBar title="저장한 문제" back /><Title subtitle="다시 풀고 싶은 문제를 여기에 모아뒀어요.">{'다시 한 번,\n내 말로.'}</Title>
    {loading && <ActivityIndicator color={c.primary} />}
    {error && <Notice error>{error}</Notice>}
    {!loading && !items.length && !missing && <Notice>아직 저장한 문제가 없어요. 학습 기록에서 문제를 저장해보세요.</Notice>}
    {missing > 0 && <Notice>현재 문제 목록에서 찾을 수 없는 저장 항목이 {missing}개 있어요.</Notice>}
    {items.map(({ question, category, description }) => <View key={question.id} style={{ backgroundColor: c.soft, borderRadius: 20, padding: 18, gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded === question.id }} onPress={() => setExpanded(current => current === question.id ? null : question.id)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 44 }}><View style={{ flex: 1, gap: 3 }}><Label style={{ color: c.muted, fontSize: 12 }}>{category} · Q{question.number}</Label><Label numberOfLines={2} style={{ fontFamily: fonts.medium }}>{description ?? question.prompt}</Label></View><Icon name={expanded === question.id ? 'chevron-up-outline' : 'chevron-down-outline'} color={c.muted} size={18} /></Pressable>
      {expanded === question.id && <QuestionReview question={question} onBookmarkChange={() => { void load(); }} />}
    </View>)}
  </Screen>;
}
