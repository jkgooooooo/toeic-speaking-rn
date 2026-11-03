import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { clearExamplePlayback, registerExamplePlayback, stopActiveAnswerPlayer } from '@/components/answer-player';
import { ActionButton, Label, Notice } from '@/components/ui';
import { dailyPractice, type PracticeQuestion } from '@/content/daily';
import { mockSets } from '@/content/mock';
import { sampleAnswer } from '@/content/sample-answers';
import { fonts, usePalette } from '@/design/theme';
import { speak } from '@/services/audio-tasks';
import { isBookmarked, setBookmarked } from '@/services/bookmarks';
import { speakSupertonic } from '@/services/supertonic';
import { useVoiceSettings } from '@/state/settings';

export function QuestionReview({ question, answerId, onBookmarkChange }: { question: PracticeQuestion; answerId?: string; onBookmarkChange?: () => void }) {
  const c = usePalette();
  const { voiceId } = useVoiceSettings();
  const [marked, setMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const player = useAudioPlayer(null);
  const sample = sampleAnswer(question.id);
  const set = mockSets.find(item => item.questions.some(q => q.id === question.id));
  const canRetry = !!set || dailyPractice.questions.some(item => item.id === question.id);

  useEffect(() => {
    let active = true;
    void isBookmarked(question.id).then(value => { if (active) setMarked(value); }).catch(() => { if (active) setError('북마크를 불러오지 못했어요.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.current?.abort(); controller.current = null; void Speech.stop().catch(() => {}); };
  }, [question.id]);

  async function toggleBookmark() {
    if (busy) return;
    setBusy(true); setError(null);
    try { await setBookmarked(question.id, !marked); setMarked(!marked); onBookmarkChange?.(); }
    catch { setError('북마크를 저장하지 못했어요. 다시 시도해주세요.'); }
    finally { setBusy(false); }
  }
  async function preview() {
    if (!sample || !voiceId) return;
    if (controller.current) { controller.current.abort(); controller.current = null; setReading(false); return; }
    const abort = new AbortController(); controller.current = abort; registerExamplePlayback(abort); setReading(true); setError(null);
    try {
      stopActiveAnswerPlayer();
      await Speech.stop();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false, interruptionMode: 'mixWithOthers' });
      if (voiceId.startsWith('supertonic-')) await speakSupertonic(player, sample, voiceId, abort.signal);
      else await speak(sample, voiceId, abort.signal);
    } catch (cause) { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : '예시 답변을 재생하지 못했어요.'); }
    finally { clearExamplePlayback(abort); if (controller.current === abort) { controller.current = null; setReading(false); } }
  }
  function retry() {
    controller.current?.abort();
    if (set) router.push({ pathname: '/mock', params: { set: set.id, questionId: question.id, ...(answerId ? { retryOf: answerId } : {}) } });
    else router.push({ pathname: '/practice', params: { questionId: question.id, ...(answerId ? { retryOf: answerId } : {}) } });
  }
  return <View style={{ gap: 10 }}>
    {error && <Notice error>{error}</Notice>}
    {canRetry && <ActionButton title={marked ? '북마크 해제' : '다시 풀 문제로 저장'} icon={marked ? 'bookmark' : 'bookmark-outline'} secondary busy={busy || loading} onPress={() => { void toggleBookmark(); }} />}
    {canRetry && <ActionButton title="이 문제 다시 풀기" icon="refresh-outline" secondary onPress={retry} />}
    {sample && <ActionButton title={showSample ? '예시 답변 접기' : '예시 답변 보기'} icon={showSample ? 'chevron-up-outline' : 'book-outline'} secondary onPress={() => { if (showSample) { controller.current?.abort(); controller.current = null; setReading(false); } setShowSample(current => !current); }} />}
    {sample && showSample && <View style={{ gap: 10, borderRadius: 18, padding: 16, backgroundColor: c.soft }}><Label style={{ fontFamily: fonts.bold, color: c.primary }}>예시 답변</Label><Label>{sample}</Label><Label style={{ color: c.muted, fontSize: 12 }}>학습용 예시이며 정답이나 공식 채점 결과가 아니에요.</Label><ActionButton title={reading ? '예시 듣기 중지' : '예시 답변 듣기'} icon={reading ? 'stop-outline' : 'volume-high-outline'} secondary disabled={!voiceId} onPress={() => { void preview(); }} /></View>}
  </View>;
}
