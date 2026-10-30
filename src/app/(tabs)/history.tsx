import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AnswerPlayer } from '@/components/answer-player';
import { Icon, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';
import { type AnswerRecord, listAnswers } from '@/services/recordings';

export default function HistoryScreen() {
  const c = usePalette();
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    listAnswers().then(result => {
      if (!active) return;
      setRecords(result.records);
      setError(result.unreadable ? `읽지 못한 기록 ${result.unreadable}개가 있어요. 원본 파일은 그대로 보관돼요.` : null);
    }).catch(() => { if (active) setError('기록을 불러오지 못했어요. 화면을 다시 열어주세요.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; setSelected(null); };
  }, []));
  return <Screen><TopBar title="학습 기록" settings /><Title subtitle="내 답변을 다시 듣고, 다음 연습을 준비해요.">{'내 목소리로\n쌓아온 기록.'}</Title>
    {loading && <ActivityIndicator color={c.primary} />}
    {error && <Notice error>{error}</Notice>}
    {!loading && records.length === 0 && <View style={{ gap: 13, paddingVertical: 30 }}><Icon name="headset-outline" color={c.muted} size={36} /><Label style={{ fontFamily: fonts.bold, fontSize: 18 }}>아직 녹음된 답변이 없어요.</Label><Label style={{ color: c.muted, fontSize: 14 }}>오늘의 연습을 마치면 이곳에 남아요.</Label></View>}
    <View style={{ gap: 14 }}>{records.map(answer => <View key={answer.id}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: selected === answer.id }} onPress={() => setSelected(current => current === answer.id ? null : answer.id)} style={{ paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <Icon name="headset-outline" color={c.primary} /><View style={{ flex: 1, gap: 4 }}><Label style={{ fontFamily: fonts.bold }}>Q{answer.question.number}. 질문에 답하기</Label><Label style={{ color: c.muted, fontSize: 12 }}>{new Date(answer.createdAt).toLocaleString('ko-KR')} · {(answer.durationMs / 1000).toFixed(1)}초</Label></View><Icon name={selected === answer.id ? 'chevron-up-outline' : 'chevron-down-outline'} size={17} color={c.muted} />
      </Pressable>
      {selected === answer.id && <View style={{ marginTop: 12 }}><AnswerPlayer answer={answer} /></View>}
    </View>)}</View>
  </Screen>;
}
