import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Linking, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestionReview } from '@/components/question-review';
import { AnswerComparison } from '@/components/answer-comparison';
import { PartGuide } from '@/components/part-guide';
import { VoiceStartOptions } from '@/components/voice-start-options';
import { AnswerPlayer } from '@/components/answer-player';
import { ActionButton, Icon, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { getMockSet, mockDirections, mockSets, type MockPart } from '@/content/mock';
import { fonts, usePalette } from '@/design/theme';
import { type MockPhase, useMockSession } from '@/features/mock/use-mock-session';
import { listAnswers, type AnswerRecord } from '@/services/recordings';
import { modelPreparationLabel, useSupertonicModel } from '@/services/supertonic';
import { useVoiceSettings } from '@/state/settings';

const partLabel: Record<MockPart, string> = { reading: '지문 읽기', photo: '사진 묘사', short: '질문에 답하기', table: '자료로 답하기', opinion: '의견 말하기' };
const phaseLabel: Record<MockPhase, string> = {
  idle: '시작 전', permission: '마이크 권한 확인', voice_setup: '연습 음성 준비', introduction: '시험 안내', directions: '파트 안내', scenario: '상황 안내', question: '문항 안내',
  table_review: '자료 읽기', preparing: '답변 준비', cue: '시작 신호', recording: '답변 녹음 중', saving: '답변 저장 중',
  completed: '시험 완료', interrupted: '시험 중단', failed: '다시 확인해주세요',
};

export default function MockScreen() {
  const c = usePalette();
  const { set: setId, part, questionId, retryOf } = useLocalSearchParams<{ set?: string; part?: string; questionId?: string; retryOf?: string }>();
  const [previousAnswer, setPreviousAnswer] = useState<AnswerRecord | null>(null);
  useEffect(() => { let active = true; if (retryOf) void listAnswers().then(result => { if (active) setPreviousAnswer(result.records.find(answer => answer.id === retryOf) ?? null); }).catch(() => {}); return () => { active = false; }; }, [retryOf]);
  const baseSet = getMockSet(setId) ?? mockSets[0];
  const filtered = questionId ? baseSet.questions.filter(question => question.id === questionId) : part ? baseSet.questions.filter(question => question.part === part) : [];
  const partial = filtered.length > 0;
  const set = partial ? { ...baseSet, questions: filtered } : baseSet;
  const mockSchedule = set.schedule;
  const { voiceId, loading } = useVoiceSettings();
  const session = useMockSession(set, voiceId, partial);
  const model = useSupertonicModel();
  const [selected, setSelected] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const showContent = !['permission', 'introduction', 'directions', 'voice_setup'].includes(session.phase);
  const showQuestion = showContent && session.phase !== 'scenario' && session.question.showQuestion;
  const busyVoice = session.voiceStage === 'model' || session.voiceStage === 'generating';
  const voiceLabel = session.voiceStage === 'model' && model.status === 'preparing' ? modelPreparationLabel(model)
    : session.phase === 'voice_setup' && session.voicePreparation ? `시험 음성 준비 중 · ${session.voicePreparation.completed}/${session.voicePreparation.total}개 완료`
    : session.voiceStage === 'model' ? '저장된 음성을 확인하고 있어요.'
    : session.voiceStage === 'generating' ? '음성을 만들고 있어요.' : null;
  function restart() {
    setShowTable(false);
    if (!session.resume) { void session.start('new'); return; }
    Alert.alert('처음부터 다시 시작할까요?', '이전 진행은 이어갈 수 없지만, 저장된 답변은 학습 기록에 남아요.', [
      { text: '취소', style: 'cancel' },
      { text: '처음부터', onPress: () => { void session.start('new'); } },
    ]);
  }
  function leave() {
    if (!session.active) { router.back(); return; }
    Alert.alert('시험을 일시정지할까요?', '완료한 답변은 저장돼요. 돌아오면 진행 중이던 문항부터 다시 시작해요.', [
      { text: '계속하기', style: 'cancel' },
      { text: '일시정지하고 나가기', onPress: () => { session.interrupt(); router.back(); } },
    ]);
  }
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { if (!session.active) return false; leave(); return true; });
    return () => subscription.remove();
  });
  if (session.phase === 'completed') return <Screen>
    <TopBar title="모의고사 완료" back />
    <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="checkmark-outline" color={c.accentInk} size={30} /></View>
    <Title subtitle={`답변 ${session.answers.length}개를 저장했어요. 듣고 싶은 답변을 골라보세요.`}>{'한 회를 끝까지,\n수고했어요.'}</Title>
    {previousAnswer && session.answers.length === 1 && <AnswerComparison previous={previousAnswer} current={session.answers[0]} />}
    {session.answers.map(answer => previousAnswer && session.answers.length === 1 ? <QuestionReview key={answer.id} question={answer.question} answerId={answer.id} /> : <View key={answer.id}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: selected === answer.id }} onPress={() => setSelected(current => current === answer.id ? null : answer.id)} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="headset-outline" color={c.primary} /><Label style={{ flex: 1, fontFamily: fonts.bold }}>Q{answer.question.number}. 답변 듣기</Label><Icon name={selected === answer.id ? 'chevron-up-outline' : 'chevron-down-outline'} size={17} />
      </Pressable>
      {selected === answer.id && <View style={{ marginTop: 12 }}><AnswerPlayer answer={answer} /><QuestionReview question={answer.question} answerId={answer.id} /></View>}
    </View>)}
    <ActionButton title="학습 기록 보기" icon="bar-chart-outline" onPress={() => router.replace('/history')} />
    <ActionButton title="홈으로" secondary onPress={() => router.replace('/')} />
  </Screen>;

  return <Screen>
    <TopBar title={partial ? "파트 연습" : "실전 모의고사"} back onBack={leave} />
    {['idle', 'interrupted', 'failed'].includes(session.phase) ? <>
      <Title subtitle={`${set.questions.length}문항이 자동으로 이어져요. 편한 장소에서 시작해요.`}>{partial ? '원하는 파트부터,\n차근차근.' : '차근차근,\n끝까지 한 회.'}</Title>
      <View style={{ borderRadius: 24, backgroundColor: c.accent, padding: 22, gap: 10 }}>
        <Label style={{ fontFamily: fonts.bold, fontSize: 18, color: c.accentInk }}>{set.title}</Label>
        <Label style={{ color: c.accentInk }}>{partial ? partLabel[filtered[0].part] : '지문 읽기 · 사진 묘사 · 질문 답변 · 자료 활용 · 의견 제시'}</Label>
        <Label style={{ color: c.accentInk, fontSize: 13 }}>{set.questions.length}문항 · 답변은 기기에 저장돼요</Label>
      </View>
      {partial && <PartGuide part={filtered[0].part} />}
      <VoiceStartOptions />
      <ActionButton title="시험 전 마이크 확인" icon="mic-outline" secondary disabled={Platform.OS === 'web'} onPress={() => router.push('/audio-check')} />
      <Notice>마이크 권한이 필요해요. 조용한 곳에서 이어폰을 사용해 주세요. AI 음성을 선택하면 첫 음성을 준비한 뒤 시작하고 나머지는 진행 중에 만들어요.</Notice>
      {Platform.OS === 'web' && <Notice>녹음 연습은 iOS·Android 앱에서 시작해주세요.</Notice>}
      {session.error && <Notice error>{session.error}</Notice>}
      {session.resumeError && <Notice error>{session.resumeError}</Notice>}
      {session.resume && session.resume.setId !== set.id && <Notice>진행 중인 다른 회차가 있어요. 목록에서 해당 회차를 선택하면 이어할 수 있어요. 이 회차를 새로 시작하면 기존 진행 정보는 바뀌어요.</Notice>}
      {session.resume && session.resume.setId === set.id && <Notice>{session.resume.nextIndex < 11 ? `${session.resume.nextIndex + 1}번 문항부터 다시 시작해요.` : '모든 답변이 저장되어 있어요. 이어하기를 눌러 결과를 확인해요.'} 진행 중이던 문항은 처음부터 다시 풀어요.</Notice>}
      {session.resume && session.resume.setId === set.id && <ActionButton title="이어하기" icon="play-outline" busy={session.checkingResume || loading} disabled={session.checkingResume || loading || !voiceId || Platform.OS === 'web'} onPress={() => { setShowTable(false); void session.start('resume'); }} />}
      <ActionButton title={session.resume ? '처음부터 다시 시작' : partial ? '파트 연습 시작' : '모의고사 시작'} icon={session.resume ? 'refresh-outline' : 'mic-outline'} secondary={!!session.resume} busy={session.checkingResume || loading} disabled={session.checkingResume || loading || !!session.resumeError || !voiceId || Platform.OS === 'web'} onPress={restart} />
      {!partial && <View style={{ gap: 10 }}><Label style={{ fontFamily: fonts.bold, fontSize: 16 }}>이 회차의 파트별 연습</Label><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['reading', 'photo', 'short', 'table', 'opinion'] as const).map((item, index) => <Pressable key={item} accessibilityRole="button" onPress={() => router.push({ pathname: '/mock', params: { set: set.id, part: item } })} style={{ borderRadius: 12, backgroundColor: c.panel, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' }}><Label style={{ fontSize: 13, color: c.primary }}>Part {index + 1}</Label></Pressable>)}</View></View>}
      {session.phase === 'failed' && <ActionButton title="기기 설정 열기" icon="settings-outline" secondary onPress={() => { void Linking.openSettings(); }} />}
    </> : <>
      {!['voice_setup', 'permission', 'introduction'].includes(session.phase) && <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <Label style={{ fontFamily: fonts.bold, color: c.muted }}>QUESTION {session.question.number.toString().padStart(2, '0')}</Label>
          <Label style={{ fontSize: 13, color: c.muted }}>{partLabel[session.question.part]} · {session.index + 1}/{set.questions.length}</Label>
        </View>
        {session.phase === 'directions' && <Label style={{ fontSize: 18, lineHeight: 28 }}>{mockDirections[session.question.part]}</Label>}
        {showContent && session.question.part === 'short' && <Label style={{ color: c.muted, fontSize: 14, lineHeight: 22 }}>{set.shortContext}</Label>}
        {showContent && session.question.image && <Image source={session.question.image} contentFit="contain" accessibilityLabel={session.question.imageLabel ?? '사진 묘사 문제'} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18, backgroundColor: c.panel }} />}
        {showContent && session.question.part === 'table' && <View style={{ backgroundColor: c.panel, borderRadius: 20, padding: 18, gap: 8 }}>
          <Label style={{ fontFamily: fonts.bold, fontSize: 16 }}>{mockSchedule.title}</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Label style={{ color: c.muted, fontSize: 13 }}>{mockSchedule.date}</Label><Pressable accessibilityRole="button" onPress={() => setShowTable(true)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}><Label style={{ color: c.primary, fontSize: 13 }}>표 크게 보기</Label></Pressable></View>
          {mockSchedule.rows.map(row => <View key={row[0]} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8, gap: 8 }}>
            <Label style={{ width: 70, fontSize: 12, fontFamily: fonts.medium }}>{row[0]}</Label>
            <Label style={{ flex: 1, fontSize: 12 }}>{row[1]}</Label><Label style={{ flex: 1, fontSize: 12, color: c.muted }}>{row[2]}</Label>
          </View>)}
        </View>}
        {showQuestion && <Label style={{ fontSize: 22, lineHeight: 34, fontFamily: fonts.medium }}>{session.question.prompt}</Label>}
      </>}
      <View style={{ alignItems: 'center', gap: 14, paddingVertical: 22 }}>
        <Label accessibilityLiveRegion="polite" style={{ fontFamily: fonts.medium, color: c.primary, textAlign: 'center' }}>{session.paused ? '일시정지 중' : voiceLabel ?? phaseLabel[session.phase]}</Label>
        {busyVoice ? <ActivityIndicator size="large" color={c.primary} /> : ['preparing', 'table_review', 'recording'].includes(session.phase)
          ? <Label accessibilityLabel={`${session.remaining}초 남음`} style={{ fontSize: 90, lineHeight: 110, fontVariant: ['tabular-nums'] }}>{String(session.remaining).padStart(2, '0')}<Label style={{ fontSize: 22, color: c.muted }}> 초</Label></Label>
          : <Icon name={session.phase === 'introduction' || session.phase === 'directions' || session.phase === 'scenario' || session.phase === 'question' ? 'headset-outline' : 'ellipse-outline'} size={52} color={c.primary} />}
        <Label style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>{session.phase === 'voice_setup' ? '첫 음성을 준비해요. 이후 음성은 시험 중에 준비해요.' : session.paused ? '멈춘 위치에서 이어서 진행해요.' : session.phase === 'recording' ? '답변을 녹음하고 있어요.' : '완료한 답변은 기기에 저장돼요.'}</Label>
      </View>
      {session.phase === 'introduction' && <ActionButton title="바로 시작하기" onPress={session.skipIntroduction} />}
      {session.active && session.phase !== 'introduction' && <ActionButton title={session.paused ? "계속하기" : "일시정지"} icon={session.paused ? "play-outline" : "pause-outline"} secondary disabled={!session.canPause} onPress={session.togglePause} />}
      <Modal visible={showTable && session.active && session.question.part === 'table'} animationType="slide" onRequestClose={() => setShowTable(false)}><SafeAreaView style={{ flex: 1, backgroundColor: c.background }}><View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Label style={{ fontFamily: fonts.bold, fontSize: 18 }}>자료 크게 보기</Label><Pressable accessibilityRole="button" onPress={() => setShowTable(false)} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Icon name="close-outline" /></Pressable></View><ScrollView contentContainerStyle={{ padding: 24, gap: 14 }}><Label style={{ fontFamily: fonts.bold, fontSize: 20 }}>{mockSchedule.title}</Label><Label style={{ color: c.muted }}>{mockSchedule.date}</Label>{mockSchedule.rows.map(row => <View key={row[0]} style={{ borderTopWidth: 1, borderTopColor: c.line, paddingVertical: 12, gap: 4 }}><Label style={{ color: c.primary, fontFamily: fonts.bold }}>{row[0]}</Label><Label>{row[1]}</Label><Label style={{ color: c.muted }}>{row[2]}</Label></View>)}</ScrollView><View style={{ padding: 20, gap: 8, borderTopWidth: 1, borderTopColor: c.line }}><Label style={{ color: c.primary, textAlign: 'center', fontFamily: fonts.bold }}>{session.paused ? '일시정지 중' : `${phaseLabel[session.phase]} · ${session.remaining}초`}</Label><Label style={{ color: c.muted, fontSize: 12, textAlign: 'center' }}>확대 중에도 시험은 진행돼요.</Label>{session.canPause && <ActionButton title={session.paused ? '계속하기' : '일시정지'} icon={session.paused ? 'play-outline' : 'pause-outline'} secondary onPress={session.togglePause} />}</View></SafeAreaView></Modal>
      {session.active && session.phase !== 'introduction' && !session.canPause && <Label style={{ color: c.muted, fontSize: 12, textAlign: 'center' }}>안내와 전환이 끝나면 일시정지할 수 있어요.</Label>}
    </>}
  </Screen>;
}
