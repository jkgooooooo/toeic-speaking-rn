import { AudioModule, type RecordingStatus, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import { useEffect, useId, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { mockCues, mockDirections, mockIntroduction, type MockPart, type MockSet } from '@/content/mock';
import { clearMockSession, loadMockSession, saveMockSession, type MockResume } from '@/features/mock/mock-resume';
import { checkSignal, playCue, SessionInterrupted, speak } from '@/services/audio-tasks';
import { type AnswerRecord, saveAnswer } from '@/services/recordings';
import { speakSupertonic, warmSupertonic, type VoiceStage } from '@/services/supertonic';

export type MockPhase = 'idle' | 'permission' | 'voice_setup' | 'introduction' | 'directions' | 'scenario' | 'question' | 'table_review' | 'preparing' | 'cue' | 'recording' | 'saving' | 'completed' | 'interrupted' | 'failed';
type Snapshot = { phase: MockPhase; index: number; remaining: number; answers: AnswerRecord[]; error: string | null };
const initial: Snapshot = { phase: 'idle', index: 0, remaining: 0, answers: [], error: null };

export function useMockSession(set: MockSet, voiceId?: string, partial = false) {
  const mockQuestions = set.questions;
  const [snapshot, setSnapshot] = useState<Snapshot>(initial);
  const [paused, setPaused] = useState(false);
  const [canPause, setCanPause] = useState(false);
  const pauseControls = useRef<{ pause: () => void; resume: () => void } | null>(null);
  const [resume, setResume] = useState<MockResume | null>(null);
  const [checkingResume, setCheckingResume] = useState(!partial);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [voiceStage, setVoiceStage] = useState<VoiceStage | null>(null);
  const [voicePreparation, setVoicePreparation] = useState<{ completed: number; total: number } | null>(null);
  const statusHandler = useRef<((status: RecordingStatus) => void) | null>(null);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document', isMeteringEnabled: true }, status => statusHandler.current?.(status));
  const cue = useAudioPlayer(require('../../../assets/audio/start-tone.wav'), { updateInterval: 20, keepAudioSessionActive: true });
  const narration = useAudioPlayer(null, { updateInterval: 50, keepAudioSessionActive: true });
  const controller = useRef<AbortController | null>(null);
  const introductionController = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const running = useRef(false);
  const phaseRef = useRef<MockPhase>('idle');
  const audioTag = useId();
  const active = !['idle', 'completed', 'interrupted', 'failed'].includes(snapshot.phase);
  const question = mockQuestions[snapshot.index] ?? mockQuestions[0];

  function update(change: Partial<Snapshot>) {
    if (change.phase) phaseRef.current = change.phase;
    if (mounted.current) setSnapshot(previous => ({ ...previous, ...change }));
  }
  function skipIntroduction() { introductionController.current?.abort(new SessionInterrupted('안내를 건너뛰었어요.')); }
  function interrupt(message = '시험을 중단했어요. 완료된 답변은 기록에 남아 있어요.') {
    controller.current?.abort(new SessionInterrupted(message));
  }
  function togglePause() {
    const controls = pauseControls.current;
    if (!controls) return;
    if (paused) controls.resume(); else controls.pause();
  }
  async function stopRecorder() { try { await recorder.stop(); } catch {} }

  useEffect(() => {
    mounted.current = true;
    let activeLoad = true;
    if (!partial) void loadMockSession().then(value => { if (activeLoad) setResume(value); })
      .catch(() => { if (activeLoad) setResumeError('이전 시험 정보를 불러오지 못했어요. 앱을 다시 열어주세요.'); })
      .finally(() => { if (activeLoad) setCheckingResume(false); });
    const subscription = AppState.addEventListener('change', state => {
      if ((state === 'background' || (state === 'inactive' && phaseRef.current !== 'permission')) && running.current) {
        interrupt('앱이 다른 화면으로 이동해 시험을 중단했어요. 완료된 답변은 기록에 남아 있어요.');
      }
    });
    return () => { activeLoad = false; mounted.current = false; subscription.remove(); interrupt(); };
  }, [partial]);

  function record(seconds: number, signal: AbortSignal): Promise<number> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let lastDuration = 0;
      let elapsed = 0;
      let resumedAt = performance.now();
      let isPaused = false;
      const activeElapsed = () => elapsed + (isPaused ? 0 : performance.now() - resumedAt);
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearInterval(ticker); signal.removeEventListener('abort', abort); statusHandler.current = null;
        pauseControls.current = null;
        if (mounted.current) { setCanPause(false); setPaused(false); }
        if (error) { reject(error); return; }
        try { lastDuration = Math.max(lastDuration, recorder.getStatus().durationMillis); } catch {}
        if (lastDuration <= 0) reject(new Error('녹음 길이를 확인하지 못했어요.'));
        else resolve(lastDuration);
      };
      const abort = () => { finish(signal.reason); void stopRecorder(); };
      const ticker = setInterval(() => {
        try {
          const status = recorder.getStatus();
          lastDuration = Math.max(lastDuration, status.durationMillis);
          update({ remaining: Math.max(0, Math.ceil(seconds - activeElapsed() / 1000)) });
          if (status.mediaServicesDidReset) finish(new SessionInterrupted('기기의 오디오 연결이 초기화됐어요.'));
          else if (activeElapsed() > (seconds + 4) * 1000) { finish(new Error('녹음 종료를 확인하지 못했어요.')); void stopRecorder(); }
        } catch { finish(new Error('녹음 상태를 읽지 못했어요.')); }
      }, 80);
      statusHandler.current = status => {
        if (status.hasError || status.mediaServicesDidReset) finish(new SessionInterrupted('녹음이 중단됐어요.'));
        else if (status.isFinished) {
          if (activeElapsed() < seconds * 1000 - 300) finish(new SessionInterrupted('녹음이 일찍 중단되어 답변을 저장하지 않았어요.'));
          else finish();
        }
      };
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort', abort, { once: true });
      try {
        recorder.record({ forDuration: seconds });
        resumedAt = performance.now();
        pauseControls.current = {
          pause: () => {
            if (settled || isPaused) return;
            try { recorder.pause(); elapsed += performance.now() - resumedAt; isPaused = true; if (mounted.current) setPaused(true); }
            catch { finish(new SessionInterrupted('녹음을 일시정지하지 못했어요.')); }
          },
          resume: () => {
            if (settled || !isPaused) return;
            try { recorder.record(); resumedAt = performance.now(); isPaused = false; if (mounted.current) setPaused(false); }
            catch { finish(new SessionInterrupted('녹음을 다시 시작하지 못했어요.')); }
          },
        };
        if (mounted.current) setCanPause(true);
      } catch (error) { finish(error instanceof Error ? error : new Error('녹음을 시작하지 못했어요.')); }
    });
  }

  function countdown(phase: 'preparing' | 'table_review', seconds: number, signal: AbortSignal) {
    update({ phase, remaining: seconds });
    return new Promise<void>((resolve, reject) => {
      let remainingMs = seconds * 1000;
      let lastTick = performance.now();
      let isPaused = false;
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true; clearInterval(timer); signal.removeEventListener('abort', abort);
        pauseControls.current = null;
        if (mounted.current) { setCanPause(false); setPaused(false); }
        if (error) reject(error); else resolve();
      };
      const abort = () => finish(signal.reason instanceof Error ? signal.reason : new SessionInterrupted('시험을 중단했어요.'));
      const advance = () => {
        const now = performance.now();
        if (!isPaused) remainingMs = Math.max(0, remainingMs - (now - lastTick));
        lastTick = now;
        update({ remaining: Math.ceil(remainingMs / 1000) });
        if (remainingMs <= 0) finish();
      };
      const timer = setInterval(advance, 80);
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort', abort, { once: true });
      pauseControls.current = {
        pause: () => { if (settled || isPaused) return; advance(); if (!settled) { isPaused = true; if (mounted.current) setPaused(true); } },
        resume: () => { if (settled || !isPaused) return; lastTick = performance.now(); isPaused = false; if (mounted.current) setPaused(false); },
      };
      if (mounted.current) setCanPause(true);
    });
  }

  async function start(mode: 'new' | 'resume' = 'new') {
    if (running.current) return;
    if (Platform.OS === 'web' || !voiceId) { update({ phase: 'failed', error: '기기에서 사용할 안내 음성을 선택해주세요.' }); return; }
    running.current = true;
    setVoiceStage(null); setVoicePreparation(null);
    const abort = new AbortController();
    controller.current = abort;
    const { signal } = abort;
    const prefetch = new AbortController();
    const stopPrefetch = () => prefetch.abort(signal.reason);
    signal.addEventListener('abort', stopPrefetch, { once: true });
    let answers: AnswerRecord[] = [];
    let sessionId = `${partial ? 'part' : 'mock'}-${Date.now()}`;
    let startIndex = 0;
    let ending: Partial<Snapshot> | null = null;
    update({ ...initial, phase: 'permission' });
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      checkSignal(signal);
      if (!permission.granted) throw new Error('마이크 권한이 필요해요. 기기 설정에서 speaking의 마이크를 허용해주세요.');
      if (mode === 'resume') {
        const saved = await loadMockSession();
        checkSignal(signal);
        if (!saved) throw new Error('이어갈 시험을 찾지 못했어요.');
        if (saved.setId !== set.id) throw new Error('이어갈 시험 회차를 선택해주세요.');
        sessionId = saved.sessionId; answers = [...saved.answers]; startIndex = saved.nextIndex;
      } else if (!partial) {
        await saveMockSession(sessionId, set.id);
        checkSignal(signal);
      }
      if (!partial && mounted.current) setResume({ sessionId, setId: set.id, answers: [...answers], nextIndex: startIndex });
      update({ index: Math.min(startIndex, mockQuestions.length - 1), answers: [...answers] });
      if (startIndex === mockQuestions.length) {
        await clearMockSession();
        if (mounted.current) setResume(null);
        update({ phase: 'completed', answers: [...answers] });
        return;
      }
      await Speech.stop();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true, interruptionMode: 'doNotMix', shouldPlayInBackground: false, allowsBackgroundRecording: false, shouldRouteThroughEarpiece: false });
      checkSignal(signal);
      await activateKeepAwakeAsync(audioTag);
      checkSignal(signal);
      const stages = (stage: VoiceStage) => { if (mounted.current && !signal.aborted) setVoiceStage(stage); };
      if (voiceId.startsWith('supertonic-')) {
        update({ phase: 'voice_setup' });
        const firstText = partial ? mockDirections[mockQuestions[0].part] : mockIntroduction;
        await warmSupertonic([firstText], voiceId, signal, (completed, total) => {
          if (mounted.current && !signal.aborted) setVoicePreparation({ completed, total });
        }, stages);
        checkSignal(signal);
        setVoiceStage(null);
        // Prepare in the order the exam will need each clip, without blocking playback.
        const upcoming: string[] = [];
        let part: MockPart | undefined;
        for (const current of mockQuestions) {
          if (current.part !== part) {
            upcoming.push(mockDirections[current.part]);
            part = current.part;
            if (part === 'short') upcoming.push(set.shortContext);
            if (part === 'table') upcoming.push(mockCues.prepare, set.tableContext);
          }
          if (['short', 'table', 'opinion'].includes(current.part)) {
            upcoming.push(current.prompt);
            if (current.number === 10) upcoming.push(mockCues.repeat);
          }
          if (current.preparationSeconds > 3) {
            upcoming.push(mockCues.prepare, current.part === 'reading' ? mockCues.reading : mockCues.speaking);
          }
        }
        void warmSupertonic([...new Set(upcoming)].filter(text => text !== firstText), voiceId, prefetch.signal, () => {}).catch(() => {});
      }
      async function narrate(text: string, narrationSignal = signal) {
        checkSignal(narrationSignal);
        if (voiceId!.startsWith('supertonic-')) {
          try { await speakSupertonic(narration, text, voiceId!, narrationSignal, stages); }
          finally { if (mounted.current) setVoiceStage(null); }
        } else await speak(text, voiceId!, narrationSignal);
        checkSignal(narrationSignal);
      }
      if (!partial && (mode === 'new' || startIndex === 0)) {
        const introduction = new AbortController();
        introductionController.current = introduction;
        const abortIntroduction = () => introduction.abort(signal.reason);
        signal.addEventListener('abort', abortIntroduction, { once: true });
        update({ phase: 'introduction' });
        try { await narrate(mockIntroduction, introduction.signal); }
        catch (error) {
          if (signal.aborted || !introduction.signal.aborted) throw error;
          if (!voiceId!.startsWith('supertonic-')) await Speech.stop().catch(() => {});
        }
        finally { signal.removeEventListener('abort', abortIntroduction); introductionController.current = null; }
        checkSignal(signal);
      }
      let previousPart: MockPart | undefined;
      for (let index = startIndex; index < mockQuestions.length; index++) {
        const current = mockQuestions[index];
        checkSignal(signal);
        if (answers.some(answer => answer.id === `${sessionId}-${current.id}`)) continue;
        update({ index, remaining: 0 });
        if (current.part !== previousPart) {
          update({ phase: 'directions' });
          await narrate(mockDirections[current.part]);
          previousPart = current.part;
          if (current.part === 'short') {
            update({ phase: 'scenario' });
            await narrate(set.shortContext);
          }
          if (current.part === 'table') {
            await narrate(mockCues.prepare);
            await playCue(cue, signal);
            await countdown('table_review', 45, signal);
            update({ phase: 'scenario' });
            await narrate(set.tableContext);
          }
        }
        update({ phase: 'question' });
        await recorder.prepareToRecordAsync();
        checkSignal(signal);
        if (['short', 'table', 'opinion'].includes(current.part)) {
          await narrate(current.prompt);
          if (current.number === 10) { await narrate(mockCues.repeat); await narrate(current.prompt); }
        }
        if (current.preparationSeconds > 3) {
          await narrate(mockCues.prepare);
          await playCue(cue, signal);
        }
        await countdown('preparing', current.preparationSeconds, signal);
        if (current.preparationSeconds > 3) await narrate(current.part === 'reading' ? mockCues.reading : mockCues.speaking);
        update({ phase: 'cue', remaining: 0 });
        const cueEndedAt = await playCue(cue, signal);
        checkSignal(signal);
        const commandAt = performance.now();
        update({ phase: 'recording', remaining: current.responseSeconds });
        const durationMs = await record(current.responseSeconds, signal);
        checkSignal(signal);
        if (!recorder.uri) throw new Error('녹음 파일 경로를 찾지 못했어요.');
        update({ phase: 'saving', remaining: 0 });
        const saved = await saveAnswer(recorder.uri, {
          id: `${sessionId}-${current.id}`, sessionId, createdAt: new Date().toISOString(), question: current,
          durationMs, cueToRecordCommandMs: Math.round(commandAt - cueEndedAt),
        });
        answers.push(saved);
        answers.sort((a, b) => a.question.number - b.question.number);
        if (!partial && mounted.current) setResume({ sessionId, setId: set.id, answers: [...answers], nextIndex: index + 1 });
        update({ answers: [...answers] });
      }
      if (!partial) { await clearMockSession(); if (mounted.current) setResume(null); }
      update({ phase: 'completed' });
    } catch (error) {
      ending = { phase: error instanceof SessionInterrupted ? 'interrupted' : 'failed', error: error instanceof Error ? error.message : '시험을 계속할 수 없어요.', answers: [...answers] };
      if (!partial) { try { const saved = await loadMockSession(); if (mounted.current) setResume(saved); } catch {} }
    } finally {
      signal.removeEventListener('abort', stopPrefetch);
      prefetch.abort();
      pauseControls.current = null;
      if (mounted.current) { setVoiceStage(null); setPaused(false); setCanPause(false); }
      statusHandler.current = null;
      try { cue.pause(); narration.pause(); } catch {}
      await Speech.stop().catch(() => {});
      await stopRecorder();
      await setAudioModeAsync({ allowsRecording: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
      await deactivateKeepAwake(audioTag).catch(() => {});
      controller.current = null;
      running.current = false;
      if (ending) update(ending);
    }
  }
  return { ...snapshot, question, active, voiceStage, voicePreparation, start, interrupt, resume, checkingResume, resumeError, paused, canPause, togglePause, skipIntroduction };
}
