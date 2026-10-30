import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, BackHandler, Linking, Platform, View } from 'react-native';

import { AnswerPlayer } from '@/components/answer-player';
import { ActionButton, Icon, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { dailyPractice } from '@/content/daily';
import { fonts, usePalette } from '@/design/theme';
import { type Phase, usePracticeSession } from '@/features/practice/use-practice-session';
import { useVoiceSettings } from '@/state/settings';

const phaseLabel: Record<Phase, string> = {
  idle: '준비되면 시작해요', permission: '마이크 권한 확인', directions: '연습 안내', question: '질문을 듣고 있어요',
  preparing: '답변 준비', cue: '시작 신호', recording: '답변 녹음 중', saving: '답변을 저장하고 있어요',
  completed: '연습 완료', interrupted: '연습 중단', failed: '다시 확인해주세요',
};

export default function PracticeScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const questions = mode === 'single' ? dailyPractice.questions.slice(0, 1) : dailyPractice.questions;
  const { voiceId, voices, loading, error } = useVoiceSettings();
  const session = usePracticeSession(questions, voiceId);
  const c = usePalette();
  function leave() {
    if (!session.active) { router.back(); return; }
    Alert.alert('여기서 마칠까요?', '진행 중인 답변은 저장되지 않아요. 완료된 답변은 기록에 남아요.', [{ text: '계속 연습', style: 'cancel' }, { text: '연습 종료', style: 'destructive', onPress: () => { session.interrupt(); router.back(); } }]);
  }
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { if (!session.active) return false; leave(); return true; });
    return () => subscription.remove();
  });

  if (session.phase === 'completed') return <Screen>
    <TopBar title="답변 돌아보기" back />
    <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="checkmark-outline" color={c.accentInk} size={30} /></View>
    <Title subtitle="내 답변을 듣고, 원할 때 한 번 더 연습해요.">{'말한 만큼,\n한 걸음 자랐어요.'}</Title>
    {session.answers.map(answer => <AnswerPlayer key={answer.id} answer={answer} />)}
    <ActionButton title="한 번 더 연습" icon="refresh-outline" onPress={() => { void session.start(); }} />
    <ActionButton title="오늘은 여기까지" icon="checkmark-outline" secondary onPress={() => router.back()} />
  </Screen>;

  return <Screen>
    <TopBar title={mode === 'single' ? '한 문항 오디오 확인' : '오늘의 작은 연습'} back onBack={leave} />
    {session.phase === 'idle' ? <>
      <Title subtitle={mode === 'single' ? '질문 음성부터 녹음·재생까지 한 문항으로 확인해요.' : '질문 3개에 차례대로 답해봐요. 준비되면 시작하세요.'}>{'일상에 대해\n말해볼까요?'}</Title>
      <View style={{ padding: 23, borderRadius: 26, backgroundColor: c.accent, gap: 13 }}><Label style={{ fontSize: 11, letterSpacing: 1.2, color: c.accentInk, fontFamily: fonts.bold }}>TODAY’S PRACTICE</Label><Label style={{ color: c.accentInk, fontSize: 23, lineHeight: 34, fontFamily: fonts.medium }}>{questions[0].prompt}</Label><Label style={{ fontSize: 12, color: c.accentInk }}>준비 3초 · 답변 {questions.map(q => q.responseSeconds).join(' / ')}초</Label></View>
      <Notice>처음 시작할 때 마이크 권한을 요청해요. iPhone은 무음 모드를 해제하고, 이어폰을 사용해주세요.</Notice>
      {Platform.OS === 'web' && <Notice>홈과 화면 구성은 웹에서도 볼 수 있어요. 녹음 연습은 iOS·Android 앱에서 시작해주세요.</Notice>}
      {error && <Notice error>{error}</Notice>}
      <ActionButton title="준비됐어요, 시작할게요" icon="mic-outline" busy={loading} disabled={!voices.length || Platform.OS === 'web'} onPress={() => { void session.start(); }} />
    </> : <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label style={{ fontFamily: fonts.bold, color: c.muted }}>QUESTION {session.question.number.toString().padStart(2, '0')}</Label><Label style={{ fontSize: 13, color: c.muted }}>{session.index + 1} / {questions.length}</Label></View>
      <Label style={{ fontSize: 25, lineHeight: 38, fontFamily: fonts.medium, letterSpacing: -0.5 }}>{session.question.prompt}</Label>
      <View style={{ alignItems: 'center', gap: 15, paddingVertical: 26 }}>
        <Label accessibilityLiveRegion="polite" style={{ fontFamily: fonts.medium, color: c.primary }}>{phaseLabel[session.phase]}</Label>
        {['preparing', 'recording'].includes(session.phase) ? <Label accessibilityLabel={`${session.remaining}초 남음`} style={{ fontSize: 100, lineHeight: 120, fontVariant: ['tabular-nums'], letterSpacing: -5 }}>{String(session.remaining).padStart(2, '0')}<Label style={{ fontSize: 23, color: c.muted }}> 초</Label></Label> : <Icon name={session.phase === 'question' || session.phase === 'directions' ? 'headset-outline' : 'ellipse-outline'} size={55} color={c.primary} />}
        <Label style={{ color: c.muted, fontSize: 13 }}>{session.phase === 'recording' ? '편하게, 내 말로 답해보세요.' : session.phase === 'preparing' ? '비프음이 울리면 말하기 시작해요.' : '완료된 답변은 기기에 저장돼요.'}</Label>
      </View>
      {session.error && <>
        <Notice error>{session.error}</Notice>
        <ActionButton title="다시 시작" icon="refresh-outline" onPress={() => { void session.start(); }} />
        <ActionButton title="기기 설정 열기" icon="settings-outline" secondary onPress={() => { void Linking.openSettings(); }} />
      </>}
      {!session.active && session.answers.map(answer => <AnswerPlayer key={answer.id} answer={answer} />)}
      {session.active && <Notice>{session.phase === 'recording' ? '마이크로 답변을 녹음하고 있어요.' : '질문 음성 → 준비 3초 → 시작 신호 → 답변 녹음 순서로 진행돼요.'}</Notice>}
    </>}
  </Screen>;
}
