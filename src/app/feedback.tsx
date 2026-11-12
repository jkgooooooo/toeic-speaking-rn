import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { AnswerPlayer } from '@/components/answer-player';
import { ActionButton, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { dailyPractice } from '@/content/daily';
import { mockSets, type MockPart } from '@/content/mock';
import { partPracticeSets } from '@/content/part-practice';
import { fonts, usePalette } from '@/design/theme';
import { demoParts, demoProvider, type DemoResult } from '@/features/feedback/demo';
import { listAnswers, type AnswerRecord } from '@/services/recordings';
import Storage from '@/services/storage';

const keyFor = (id: string) => `speaking.feedback.demo.v1.${id}`;
type SavedDemo = { version: 1; part: MockPart; caseId: string; transcript: string };
type Phase = 'before' | 'working' | 'result' | 'failed';

export default function FeedbackScreen() {
  const c = usePalette();
  const { answerId } = useLocalSearchParams<{ answerId: string }>();
  const [answer, setAnswer] = useState<AnswerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [part, setPart] = useState<MockPart>('short');
  const [caseId, setCaseId] = useState('good');
  const [transcript, setTranscript] = useState('');
  const [phase, setPhase] = useState<Phase>('before');
  const [result, setResult] = useState<DemoResult | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const active = useRef(true);
  const running = useRef(false);
  const example = demoParts[part].cases.find(item => item.id === caseId) ?? demoParts[part].cases[0];

  useEffect(() => {
    active.current = true;
    async function load() {
      try {
        const { records } = await listAnswers();
        const found = records.find(item => item.id === answerId);
        if (!found) throw new Error('이 녹음 기록을 찾지 못했어요.');
        const set = [...mockSets, ...partPracticeSets].find(item => item.questions.some(question => question.id === found.question.id));
        const selectedPart = set?.questions.find(question => question.id === found.question.id)?.part ?? 'short';
        let selectedCase = demoParts[selectedPart].cases[0];
        let saved: SavedDemo | null = null;
        try {
          const raw = await Storage.getItem(keyFor(found.id));
          if (raw) {
            const candidate = JSON.parse(raw) as SavedDemo;
            if (candidate.version === 1 && candidate.part === selectedPart && typeof candidate.transcript === 'string') {
              selectedCase = demoParts[selectedPart].cases.find(item => item.id === candidate.caseId) ?? selectedCase;
              if (selectedCase.id === candidate.caseId) saved = candidate;
            }
          }
        } catch { if (active.current) setStorageError('저장된 예시를 불러오지 못했어요.'); }
        if (!active.current) return;
        setAnswer(found); setPart(selectedPart); setCaseId(selectedCase.id);
        setTranscript(saved?.transcript ?? selectedCase.transcript);
        if (saved) {
          const restored = await demoProvider.evaluate({ part: selectedPart, caseId: selectedCase.id, transcript: saved.transcript });
          if (active.current) { setResult(restored); setPhase('result'); }
        }
      } catch (error) {
        if (active.current) setLoadError(error instanceof Error ? error.message : '기록을 불러오지 못했어요.');
      } finally { if (active.current) setLoading(false); }
    }
    void load();
    return () => { active.current = false; };
  }, [answerId]);

  function chooseCase(id: string) {
    const chosen = demoParts[part].cases.find(item => item.id === id);
    if (!chosen) return;
    setCaseId(id); setTranscript(chosen.transcript); setResult(null); setPhase('before');
  }

  async function evaluate(fail = false) {
    if (!answer || running.current) return;
    running.current = true;
    setPhase('working'); setResult(null); setStorageError(null);
    try {
      if (fail) throw new Error('예시 분석 실패');
      const next = await demoProvider.evaluate({ part, caseId, transcript });
      if (!active.current) return;
      const saved: SavedDemo = { version: 1, part, caseId, transcript };
      try { await Storage.setItem(keyFor(answer.id), JSON.stringify(saved)); }
      catch { if (active.current) setStorageError('예시 결과를 저장하지 못했어요. 다시 열면 사라질 수 있어요.'); }
      if (active.current) { setResult(next); setPhase('result'); }
    } catch { if (active.current) setPhase('failed'); }
    finally { running.current = false; }
  }

  function retryQuestion() {
    if (!answer) return;
    const set = [...mockSets, ...partPracticeSets].find(item => item.questions.some(question => question.id === answer.question.id));
    if (set) router.replace({ pathname: '/mock', params: { set: set.id, questionId: answer.question.id, retryOf: answer.id } });
    else if (dailyPractice.questions.some(question => question.id === answer.question.id)) router.replace({ pathname: '/practice', params: { questionId: answer.question.id, retryOf: answer.id } });
  }

  return <Screen><TopBar title="AI 피드백 미리보기" back />
    {loading && <ActivityIndicator color={c.primary} />}
    {loadError && <Notice error>{loadError}</Notice>}
    {answer && <>
      <Notice>화면 확인용 예시예요. 아래 피드백은 내 녹음이나 문제를 분석한 결과가 아니에요.</Notice>
      <Label style={{ fontFamily: fonts.bold, fontSize: 17 }}>내 질문과 녹음</Label>
      <AnswerPlayer answer={answer} />
      <Title subtitle="상황을 선택하고 피드백 화면을 확인해보세요.">{demoParts[part].title}</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {demoParts[part].cases.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: caseId === item.id }} disabled={phase === 'working'} onPress={() => chooseCase(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 11, minHeight: 44, borderRadius: 14, backgroundColor: caseId === item.id ? c.primary : c.panel }}><Label style={{ fontSize: 12, color: caseId === item.id ? c.onPrimary : c.ink }}>{item.label}</Label></Pressable>)}
      </View>
      <View style={{ backgroundColor: c.soft, borderRadius: 20, padding: 18, gap: 10 }}>
        <Label style={{ color: c.primary, fontFamily: fonts.bold }}>화면 확인용 예시 질문</Label>
        <Label>{example.question}</Label>
        {example.table && <Label style={{ color: c.muted }}>예시 자료 · {example.table.time} · {example.table.place}</Label>}
        <Label style={{ fontFamily: fonts.bold }}>예시로 인식된 문장</Label>
        <TextInput accessibilityLabel="예시로 인식된 문장 수정" multiline value={transcript} editable={phase !== 'working'} onChangeText={value => { setTranscript(value); setResult(null); setPhase('before'); }} style={{ fontFamily: fonts.regular, color: c.ink, backgroundColor: c.background, borderRadius: 14, padding: 14, minHeight: 80, textAlignVertical: 'top' }} />
        <Label style={{ color: c.muted, fontSize: 12 }}>문장을 수정해 확인할 수 있어요. 실제 음성 인식은 아직 연결되지 않았어요.</Label>
      </View>
      {phase === 'before' && <><ActionButton title="예시 피드백 확인" onPress={() => { void evaluate(); }} /><ActionButton title="분석 실패 화면 보기" secondary onPress={() => { void evaluate(true); }} /></>}
      {phase === 'working' && <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 12 }}><ActivityIndicator color={c.primary} /><Label>예시 피드백을 준비하고 있어요.</Label></View>}
      {phase === 'failed' && <><Notice error>분석에 실패한 상황의 예시예요. 다시 시도할 수 있어요.</Notice><ActionButton title="다시 시도" onPress={() => { void evaluate(); }} /></>}
      {storageError && <Notice error>{storageError}</Notice>}
      {phase === 'result' && result && <View style={{ gap: 14 }}>
        <View style={{ backgroundColor: c.accent, borderRadius: 20, padding: 20, gap: 8 }}><Label style={{ color: c.primary, fontFamily: fonts.bold }}>{result.uncertain ? '확인 어려움' : part === 'short' || part === 'opinion' ? '예시 내용 확인' : '예시 피드백'}</Label><Label style={{ color: c.accentInk, fontFamily: fonts.bold, fontSize: 17 }}>{result.summary}</Label></View>
        {result.evidence && <View style={{ gap: 5 }}><Label style={{ fontFamily: fonts.bold }}>판단에 사용한 예시 표현</Label><Label>{result.evidence}</Label></View>}
        {result.correction && <View style={{ backgroundColor: c.panel, borderRadius: 18, padding: 18, gap: 8 }}><Label style={{ fontFamily: fonts.bold }}>교정 예시</Label><Label style={{ color: c.primary, fontFamily: fonts.bold }}>{result.correction}</Label>{result.reason && <Label style={{ color: c.muted, fontSize: 13 }}>{result.reason}</Label>}</View>}
        {(part === 'short' || part === 'opinion') && !result.correction && <Label style={{ color: c.muted, fontSize: 13 }}>표현은 이 예시에서 별도로 평가하지 않았어요.</Label>}
        {result.suggestion && <View style={{ gap: 5 }}><Label style={{ fontFamily: fonts.bold }}>참고 문장</Label><Label>{result.suggestion}</Label></View>}
        <Label style={{ fontFamily: fonts.bold }}>이 파트에서 살펴볼 항목</Label>
        {demoParts[part].criteria.map(item => <Label key={item} style={{ color: c.muted, fontSize: 13 }}>· {item}</Label>)}
        {part !== 'table' && <Notice>발음·억양·강세는 실제 음성 분석을 연결한 뒤 확인할 수 있어요.</Notice>}
        <ActionButton title="같은 문제 다시 풀기" icon="refresh-outline" onPress={retryQuestion} />
      </View>}
    </>}
  </Screen>;
}
