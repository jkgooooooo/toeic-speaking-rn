import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { QuestionReview } from '@/components/question-review';
import { AnswerPlayer, stopActiveAnswerPlayer } from '@/components/answer-player';
import { ActionButton, Icon, Label, Notice, Screen, TopBar } from '@/components/ui';
import { dailyPractice } from '@/content/daily';
import { mockSets } from '@/content/mock';
import { partPracticeSets } from '@/content/part-practice';
import { fonts, usePalette } from '@/design/theme';
import { type AnswerRecord, deleteAnswer, listAnswers } from '@/services/recordings';

type HistoryGroup = { id: string; title: string; kind: string; createdAt: string; records: AnswerRecord[] };

function historyDate(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const day = sameDay(date, today) ? '오늘' : sameDay(date, yesterday) ? '어제' : date.toLocaleDateString('ko-KR', { year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric', month: 'long', day: 'numeric' });
  return `${day} ${date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}`;
}

function groupRecords(records: AnswerRecord[]): HistoryGroup[] {
  const groups = new Map<string, HistoryGroup>();
  for (const answer of records) {
    const group = groups.get(answer.sessionId);
    if (group) {
      group.records.push(answer);
      if (answer.createdAt < group.createdAt) group.createdAt = answer.createdAt;
    } else {
      const set = [...mockSets, ...partPracticeSets].find(item => item.questions.some(question => question.id === answer.question.id));
      groups.set(answer.sessionId, {
        id: answer.sessionId,
        title: answer.sessionId.startsWith('mock-') ? (set?.title ?? '실전 모의고사') : answer.sessionId.startsWith('part-') ? (set ? `${set.title} · 파트 연습` : '파트별 연습') : answer.sessionId.startsWith('daily-') && dailyPractice.questions.some(question => question.id === answer.question.id) ? dailyPractice.title : '말하기 연습',
        kind: answer.sessionId.startsWith('mock-') ? '모의고사' : answer.sessionId.startsWith('part-') ? '파트 연습' : '짧은 연습',
        createdAt: answer.createdAt,
        records: [answer],
      });
    }
  }
  return [...groups.values()].map(group => ({ ...group, records: group.records.sort((a, b) => a.question.number - b.question.number || a.createdAt.localeCompare(b.createdAt)) }));
}

export default function HistoryScreen() {
  const c = usePalette();
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const groups = useMemo(() => groupRecords(records), [records]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadable, setUnreadable] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const inFlight = useRef(false);
  const opened = useRef<SwipeableMethods | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    listAnswers().then(result => {
      if (!active) return;
      setRecords(result.records);
      setUnreadable(result.unreadable);
      setError(result.unreadable ? `읽지 못한 기록 ${result.unreadable}개가 있어요. 해당 원본 파일은 보관돼요.` : null);
    }).catch(() => { if (active) setError('기록을 불러오지 못했어요. 화면을 다시 열어주세요.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; stopActiveAnswerPlayer(); setExpandedGroup(null); setExpandedAnswer(null); setSelecting(false); setSelected(new Set()); opened.current = null; };
  }, []));

  function toggleSelection(id: string) {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function confirmDelete(targets: AnswerRecord[], scope: 'answer' | 'group' | 'selected' | 'all') {
    if (!targets.length || inFlight.current) return;
    const title = scope === 'all' ? '모든 기록을 삭제할까요?' : scope === 'selected' ? `선택한 ${selected.size}회 기록을 삭제할까요?` : scope === 'group' ? '이 회차의 기록을 삭제할까요?' : '이 답변을 삭제할까요?';
    const remaining = scope === 'all' && unreadable ? ` 읽지 못한 기록 ${unreadable}개는 삭제되지 않아요.` : '';
    const resumeNote = targets.some(answer => answer.sessionId.startsWith('mock-')) ? ' 중단된 시험의 답변을 지우면 이어할 때 그 문항부터 다시 풀어요.' : '';
    Alert.alert(title, `답변 ${targets.length}개와 녹음 파일이 삭제되며 되돌릴 수 없어요.${remaining}${resumeNote}`, [
      { text: '취소', style: 'cancel', onPress: () => opened.current?.close() },
      { text: '삭제', style: 'destructive', onPress: () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setDeleting(true); setError(null); setExpandedAnswer(null);
        stopActiveAnswerPlayer();
        opened.current?.close();
        void (async () => {
          const deleted = new Set<string>();
          for (const answer of targets) {
            try { await deleteAnswer(answer); deleted.add(answer.id); } catch {}
          }
          setRecords(current => current.filter(answer => !deleted.has(answer.id)));
          const failed = targets.length - deleted.size;
          const failedGroups = new Set(targets.filter(answer => !deleted.has(answer.id)).map(answer => answer.sessionId));
          setSelected(current => new Set([...current].filter(id => failedGroups.has(id))));
          if (failed) setError(`${failed}개 답변을 삭제하지 못했어요. 남은 항목을 다시 삭제해주세요.`);
          else {
            if (unreadable) setError(`읽지 못한 기록 ${unreadable}개가 있어요. 해당 원본 파일은 보관돼요.`);
            setSelecting(false); setSelected(new Set());
          }
          setDeleting(false);
          inFlight.current = false;
        })();
      } },
    ]);
  }

  return <Screen><TopBar settings /><View style={{ gap: 10 }}><Label style={{ color: c.muted, fontSize: 14 }}>나의 연습</Label><Label accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -1.3 }}>{'말한 만큼,\n차곡차곡.'}</Label></View>
    <ActionButton title="저장한 문제 보기" icon="bookmark-outline" secondary onPress={() => router.push('/bookmarks')} />
    {loading && <ActivityIndicator color={c.primary} />}
    {error && <Notice error>{error}</Notice>}
    {!loading && records.length === 0 && unreadable === 0 && <View style={{ gap: 13, paddingVertical: 30 }}><Icon name="headset-outline" color={c.muted} size={36} /><Label style={{ fontFamily: fonts.bold, fontSize: 18 }}>아직 녹음된 답변이 없어요.</Label><Label style={{ color: c.muted, fontSize: 14 }}>오늘의 연습을 마치면 이곳에 남아요.</Label></View>}
    {groups.length > 0 && <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}><Label style={{ fontFamily: fonts.bold, fontSize: 16 }}>최근 기록</Label><Label style={{ color: c.muted, fontSize: 12 }}>{selecting ? `${selected.size}회 선택됨` : `전체 ${groups.length}회 · 왼쪽으로 밀어 삭제`}</Label></View>
        <Pressable accessibilityRole="button" disabled={deleting} onPress={() => { opened.current?.close(); setExpandedGroup(null); setExpandedAnswer(null); stopActiveAnswerPlayer(); setSelected(new Set()); setSelecting(value => !value); }} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}><Label style={{ color: c.primary, fontFamily: fonts.bold }}>{selecting ? '취소' : '선택'}</Label></Pressable>
      </View>
      {selecting && <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected.size === groups.length, disabled: deleting }} disabled={deleting} onPress={() => setSelected(selected.size === groups.length ? new Set() : new Set(groups.map(group => group.id)))} style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}><Label style={{ color: c.primary, fontFamily: fonts.medium }}>{selected.size === groups.length ? '전체 선택 해제' : '전체 선택'}</Label></Pressable>
        <Pressable accessibilityRole="button" disabled={deleting || selected.size === 0} accessibilityState={{ disabled: deleting || selected.size === 0 }} onPress={() => confirmDelete(records.filter(record => selected.has(record.sessionId)), 'selected')} style={{ padding: 12, opacity: deleting || selected.size === 0 ? 0.4 : 1 }}><Label style={{ color: c.danger, fontFamily: fonts.bold }}>선택 삭제</Label></Pressable>
      </View>}
      <View style={{ gap: 10 }}>{groups.map((group, groupIndex) => <View key={group.id} style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: groupIndex === 0 ? c.soft : c.panel }}>
        <Swipeable enabled={!selecting && !deleting} overshootRight={false} renderRightActions={(_progress, _translation, methods) => <Pressable accessibilityRole="button" accessibilityLabel={`${group.title} 회차 삭제`} onPress={() => { opened.current = methods; confirmDelete(group.records, 'group'); }} style={{ width: 78, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name="trash-outline" color="#FFFFFF" size={20} /><Label style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.bold }}>삭제</Label></Pressable>}>
          <Pressable accessibilityRole={selecting ? 'checkbox' : 'button'} accessibilityState={selecting ? { checked: selected.has(group.id), disabled: deleting } : { expanded: expandedGroup === group.id, disabled: deleting }} disabled={deleting} onPress={() => {
            if (selecting) toggleSelection(group.id);
            else { stopActiveAnswerPlayer(); setExpandedAnswer(null); setExpandedGroup(current => current === group.id ? null : group.id); }
          }} style={{ backgroundColor: groupIndex === 0 ? c.soft : c.panel, paddingVertical: 18, paddingHorizontal: 16, minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name={selecting ? (selected.has(group.id) ? 'checkmark-circle' : 'ellipse-outline') : group.id.startsWith('mock-') ? 'layers-outline' : 'mic-outline'} color={c.accentInk} size={21} /></View>
            <View style={{ flex: 1, gap: 2 }}><Label style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{group.kind}</Label><Label style={{ fontFamily: fonts.bold, fontSize: 16 }} numberOfLines={2}>{group.title}</Label><Label style={{ color: c.muted, fontSize: 12, lineHeight: 19 }}>{historyDate(group.createdAt)} · 답변 {group.records.length}개</Label></View>
            {!selecting && <Icon name={expandedGroup === group.id ? 'chevron-up-outline' : 'chevron-down-outline'} size={19} color={c.muted} />}
          </Pressable>
        </Swipeable>
        {!selecting && expandedGroup === group.id && <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 2 }}>
          {group.records.map(answer => <View key={answer.id}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: expandedAnswer === answer.id, disabled: deleting }} disabled={deleting} onPress={() => setExpandedAnswer(current => current === answer.id ? null : answer.id)} style={{ minHeight: 54, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Label style={{ width: 30, color: c.primary, fontFamily: fonts.bold, fontSize: 13 }}>Q{answer.question.number}</Label><View style={{ flex: 1, gap: 2 }}><Label numberOfLines={1} style={{ fontFamily: fonts.medium, fontSize: 13 }}>{answer.question.prompt}</Label><Label style={{ fontSize: 12, lineHeight: 18, color: c.muted }}>{(answer.durationMs / 1000).toFixed(1)}초 · 답변 열기</Label></View><Icon name={expandedAnswer === answer.id ? 'chevron-up-outline' : 'chevron-down-outline'} size={24} color={c.primary} />
            </Pressable>
            {expandedAnswer === answer.id && <View style={{ marginVertical: 12, gap: 12 }}><AnswerPlayer answer={answer} /><QuestionReview question={answer.question} answerId={answer.id} /><ActionButton title="이 답변 삭제" icon="trash-outline" secondary disabled={deleting} onPress={() => confirmDelete([answer], 'answer')} /></View>}
          </View>)}
          <Pressable accessibilityRole="button" disabled={deleting} onPress={() => confirmDelete(group.records, 'group')} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end', paddingHorizontal: 8 }}><Label style={{ color: c.danger, fontSize: 13 }}>이 회차 삭제</Label></Pressable>
        </View>}
      </View>)}</View>
      {!selecting && <ActionButton title="전체 기록 삭제" icon="trash-outline" secondary busy={deleting} disabled={deleting} onPress={() => confirmDelete(records, 'all')} />}
    </>}
  </Screen>;
}
