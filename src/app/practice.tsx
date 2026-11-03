import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Linking, Platform, View } from 'react-native';

import { QuestionReview } from '@/components/question-review';
import { AnswerComparison } from '@/components/answer-comparison';
import { PartGuide } from '@/components/part-guide';
import { VoiceStartOptions } from '@/components/voice-start-options';
import { AnswerPlayer } from '@/components/answer-player';
import { ActionButton, Icon, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { dailyPractice } from '@/content/daily';
import { fonts, usePalette } from '@/design/theme';
import { type Phase, usePracticeSession } from '@/features/practice/use-practice-session';
import { listAnswers, type AnswerRecord } from '@/services/recordings';
import { useVoiceSettings } from '@/state/settings';
import { modelPreparationLabel, useSupertonicModel } from '@/services/supertonic';

const phaseLabel: Record<Phase, string> = {
  idle: '준비되면 시작해요', permission: '마이크 권한 확인', voice_setup: '연습 음성 준비', directions: '연습 안내', question: '질문을 듣고 있어요',
  preparing: '답변 준비', cue: '시작 신호', recording: '답변 녹음 중', saving: '답변을 저장하고 있어요',
  completed: '연습 완료', interrupted: '연습 중단', failed: '다시 확인해주세요',
};

export default function PracticeScreen() {
  const { mode, questionId, retryOf } = useLocalSearchParams<{ mode?: string; questionId?: string; retryOf?: string }>();
  const [previousAnswer, setPreviousAnswer] = useState<AnswerRecord | null>(null);
  useEffect(() => { let active = true; if (retryOf) void listAnswers().then(result => { if (active) setPreviousAnswer(result.records.find(answer => answer.id === retryOf) ?? null); }).catch(() => {}); return () => { active = false; }; }, [retryOf]);
  const specific = dailyPractice.questions.filter(question => question.id === questionId);
  const questions = specific.length ? specific : mode === 'single' ? dailyPractice.questions.slice(0, 1) : dailyPractice.questions;
  const singleQuestion = questions.length === 1;
  const { voiceId, loading, error } = useVoiceSettings();
  const session = usePracticeSession(questions, voiceId);
  const model = useSupertonicModel();
  const voicePreparing = session.voiceStage === 'model' || session.voiceStage === 'generating';
  const voiceLabel = session.voiceStage === 'model' && model.status === 'preparing' ? modelPreparationLabel(model)
    : session.phase === 'voice_setup' && session.voicePreparation ? '첫 연습 음성을 준비하고 있어요.'
    : session.voiceStage === 'model' ? '저장된 음성을 확인하고 있어요.'
    : session.voiceStage === 'generating' ? '음성을 만들고 있어요.' : null;
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
    {previousAnswer && session.answers.length === 1 && <AnswerComparison previous={previousAnswer} current={session.answers[0]} />}
    {session.answers.map(answer => <View key={answer.id} style={{ gap: 12 }}>{!(previousAnswer && session.answers.length === 1) && <AnswerPlayer answer={answer} />}<QuestionReview question={answer.question} answerId={answer.id} /></View>)}
    <ActionButton title="한 번 더 연습" icon="refresh-outline" onPress={() => { void session.start(); }} />
    <ActionButton title="오늘은 여기까지" icon="checkmark-outline" secondary onPress={() => router.back()} />
  </Screen>;

  return <Screen>
    <TopBar title={singleQuestion ? '한 문항 연습' : '오늘의 작은 연습'} back onBack={leave} />
    {session.phase === 'idle' ? <>
      <Title subtitle={singleQuestion ? '질문을 듣고 다시 답변해봐요.' : '질문 3개에 차례대로 답해봐요. 준비되면 시작하세요.'}>{'일상에 대해\n말해볼까요?'}</Title>
      <View style={{ padding: 23, borderRadius: 26, backgroundColor: c.accent, gap: 13 }}><Label style={{ fontSize: 11, letterSpacing: 1.2, color: c.accentInk, fontFamily: fonts.bold }}>TODAY’S PRACTICE</Label><Label style={{ color: c.accentInk, fontSize: 23, lineHeight: 34, fontFamily: fonts.medium }}>{questions[0].prompt}</Label><Label style={{ fontSize: 12, color: c.accentInk }}>준비 3초 · 답변 {questions.map(q => q.responseSeconds).join(' / ')}초</Label></View>
      <PartGuide part="short" />
      <VoiceStartOptions />
      <Notice>처음 시작할 때 마이크 권한을 요청해요. 이어폰을 사용해주세요.</Notice>
      {Platform.OS === 'web' && <Notice>홈과 화면 구성은 웹에서도 볼 수 있어요. 녹음 연습은 iOS·Android 앱에서 시작해주세요.</Notice>}
      {error && !voiceId?.startsWith('supertonic-') && <Notice error>{error}</Notice>}
      <ActionButton title="준비됐어요, 시작할게요" icon="mic-outline" busy={loading} disabled={loading || !voiceId || Platform.OS === 'web'} onPress={() => { void session.start(); }} />
    </> : <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label style={{ fontFamily: fonts.bold, color: c.muted }}>QUESTION {session.question.number.toString().padStart(2, '0')}</Label><Label style={{ fontSize: 13, color: c.muted }}>{session.index + 1} / {questions.length}</Label></View>
      <Label style={{ fontSize: 25, lineHeight: 38, fontFamily: fonts.medium, letterSpacing: -0.5 }}>{session.question.prompt}</Label>
      <View style={{ alignItems: 'center', gap: 15, paddingVertical: 26 }}>
        <Label accessibilityLiveRegion="polite" style={{ fontFamily: fonts.medium, color: c.primary }}>{voiceLabel ?? phaseLabel[session.phase]}</Label>
        {voicePreparing ? <ActivityIndicator size="large" color={c.primary} /> : ['preparing', 'recording'].includes(session.phase) ? <Label accessibilityLabel={`${session.remaining}초 남음`} style={{ fontSize: 100, lineHeight: 120, fontVariant: ['tabular-nums'], letterSpacing: -5 }}>{String(session.remaining).padStart(2, '0')}<Label style={{ fontSize: 23, color: c.muted }}> 초</Label></Label> : <Icon name={session.phase === 'question' || session.phase === 'directions' ? 'headset-outline' : 'ellipse-outline'} size={55} color={c.primary} />}
        <Label style={{ color: c.muted, fontSize: 13 }}>{session.voiceStage === 'model' && model.status === 'preparing' ? '처음에는 모델을 내려받느라 시간이 걸릴 수 있어요.' : session.phase === 'voice_setup' ? '첫 음성 이후에는 연습하면서 다음 음성을 준비해요.' : session.voiceStage === 'generating' ? '잠시만 기다려주세요.' : session.phase === 'recording' ? '편하게, 내 말로 답해보세요.' : session.phase === 'preparing' ? '비프음이 울리면 말하기 시작해요.' : '완료된 답변은 기기에 저장돼요.'}</Label>
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
