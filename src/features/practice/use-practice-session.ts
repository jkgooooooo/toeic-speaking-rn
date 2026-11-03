import { AudioModule, type RecordingStatus, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import { useEffect, useId, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { dailyPractice, type PracticeQuestion } from '@/content/daily';
import { speakSupertonic, warmSupertonic, type VoiceStage } from '@/services/supertonic';
import { checkSignal, playCue, SessionInterrupted, speak, waitForDeadline } from '@/services/audio-tasks';
import { type AnswerRecord, saveAnswer } from '@/services/recordings';

export type Phase = 'idle' | 'permission' | 'voice_setup' | 'directions' | 'question' | 'preparing' | 'cue' | 'recording' | 'saving' | 'completed' | 'interrupted' | 'failed';
type Snapshot = { phase: Phase; index: number; remaining: number; answers: AnswerRecord[]; error: string | null };
const initial: Snapshot = { phase: 'idle', index: 0, remaining: 0, answers: [], error: null };

export function usePracticeSession(questions: PracticeQuestion[], voiceId?: string) {
  const [snapshot, setSnapshot] = useState<Snapshot>(initial);
  const [voiceStage, setVoiceStage] = useState<VoiceStage | null>(null);
  const [voicePreparation, setVoicePreparation] = useState<{ completed: number; total: number } | null>(null);
  const statusHandler = useRef<((status: RecordingStatus) => void) | null>(null);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document', isMeteringEnabled: true }, status => statusHandler.current?.(status));
  const cue = useAudioPlayer(require('../../../assets/audio/start-tone.wav'), { updateInterval: 20, keepAudioSessionActive: true });
  const narration = useAudioPlayer(null, { updateInterval: 50, keepAudioSessionActive: true });
  const controller = useRef<AbortController | null>(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const audioTag = useId();
  const phaseRef = useRef<Phase>('idle');
  const question = questions[snapshot.index] ?? questions[0];
  const active = !['idle', 'completed', 'interrupted', 'failed'].includes(snapshot.phase);

  function update(change: Partial<Snapshot>) {
    if (change.phase) phaseRef.current = change.phase;
    if (mounted.current) setSnapshot(previous => ({ ...previous, ...change }));
  }

  function interrupt(message = '연습을 중단했어요. 완료된 답변은 기록에서 다시 들을 수 있어요.') {
    controller.current?.abort(new SessionInterrupted(message));
  }

  async function stopRecorder() {
    try { await recorder.stop(); } catch {}
  }

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => {
      const interrupted = state === 'background' || (state === 'inactive' && phaseRef.current !== 'permission');
      if (interrupted && running.current) interrupt('앱이 다른 화면으로 이동해 연습을 중단했어요. 완료된 답변은 저장되어 있어요.');
    });
    return () => { mounted.current = false; subscription.remove(); interrupt(); };
  }, []);

  function record(seconds: number, signal: AbortSignal): Promise<number> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let lastDuration = 0;
      const started = performance.now();
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearInterval(ticker); clearTimeout(watchdog); signal.removeEventListener('abort', abort); statusHandler.current = null;
        if (error) reject(error);
        else {
          let duration = lastDuration;
          try { duration = Math.max(duration, recorder.getStatus().durationMillis); } catch {}
          if (duration <= 0) reject(new Error('녹음 길이를 확인하지 못했어요.'));
          else resolve(duration);
        }
      };
      const abort = () => { finish(signal.reason); void stopRecorder(); };
      const ticker = setInterval(() => {
        try {
          const status = recorder.getStatus();
          lastDuration = Math.max(lastDuration, status.durationMillis);
          update({ remaining: Math.max(0, Math.ceil(seconds - (performance.now() - started) / 1000)) });
          if (status.mediaServicesDidReset) finish(new SessionInterrupted('기기의 오디오 연결이 초기화됐어요. 다시 시작해주세요.'));
        } catch { finish(new Error('녹음 상태를 읽지 못했어요.')); }
      }, 80);
      const watchdog = setTimeout(() => { finish(new Error('녹음 종료를 확인하지 못했어요. 다시 시도해주세요.')); void stopRecorder(); }, (seconds + 4) * 1000);
      statusHandler.current = status => {
        if (status.hasError || status.mediaServicesDidReset) finish(new SessionInterrupted('녹음이 중단됐어요. 마이크와 이어폰 연결을 확인해주세요.'));
        else if (status.isFinished) {
          if (performance.now() - started < seconds * 1000 - 300) finish(new SessionInterrupted('정해진 시간 전에 녹음이 중단됐어요. 완료 답변으로 저장하지 않았어요.'));
          else finish();
        }
      };
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort', abort, { once: true });
      try { recorder.record({ forDuration: seconds }); } catch (error) { finish(error instanceof Error ? error : new Error('녹음을 시작하지 못했어요.')); }
    });
  }

  async function start() {
    if (running.current) return;
    if (Platform.OS === 'web') { update({ phase: 'failed', error: '녹음 연습은 iOS·Android 앱에서 사용할 수 있어요.' }); return; }
    if (!voiceId) { update({ phase: 'failed', error: '기기에 영어 안내 음성을 설치하고 설정에서 선택해주세요.' }); return; }
    running.current = true;
    setVoiceStage(null);
    setVoicePreparation(null);
    const abort = new AbortController();
    controller.current = abort;
    const { signal } = abort;
    const prefetch = new AbortController();
    const stopPrefetch = () => prefetch.abort(signal.reason);
    signal.addEventListener('abort', stopPrefetch, { once: true });
    const sessionId = `daily-${Date.now()}`;
    const answers: AnswerRecord[] = [];
    update({ ...initial, phase: 'permission' });
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      checkSignal(signal);
      if (!permission.granted) throw new Error('마이크 권한이 필요해요. 기기 설정에서 speaking의 마이크를 허용해주세요.');
      await Speech.stop();
      checkSignal(signal);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true, interruptionMode: 'doNotMix', shouldPlayInBackground: false, allowsBackgroundRecording: false, shouldRouteThroughEarpiece: false });
      checkSignal(signal);
      await activateKeepAwakeAsync(audioTag);
      checkSignal(signal);
      if (voiceId.startsWith('supertonic-')) {
        update({ phase: 'voice_setup' });
        const firstText = questions.length > 1 ? dailyPractice.directions : questions[0].prompt;
        await warmSupertonic([firstText], voiceId, signal,
          (completed, total) => { if (mounted.current && !signal.aborted) setVoicePreparation({ completed, total }); },
          stage => { if (mounted.current && !signal.aborted) setVoiceStage(stage); });
        checkSignal(signal);
        setVoiceStage(null);
        // Prepare upcoming questions in order while the current audio and timers run.
        const upcoming = [...new Set(questions.map(item => item.prompt).filter(text => text !== firstText))];
        void warmSupertonic(upcoming, voiceId, prefetch.signal, () => {}).catch(() => {});
      }
      update({ phase: 'directions' });
      async function narrate(text: string) {
        if (voiceId!.startsWith('supertonic-')) {
          try {
            await speakSupertonic(narration, text, voiceId!, signal, stage => {
              if (mounted.current && !signal.aborted) setVoiceStage(stage);
            });
          } finally { if (mounted.current) setVoiceStage(null); }
        } else await speak(text, voiceId!, signal);
      }
      if (questions.length > 1) await narrate(dailyPractice.directions);
      for (let index = 0; index < questions.length; index++) {
        const current = questions[index];
        checkSignal(signal);
        update({ index, phase: 'question', remaining: 0 });
        // Prepare before the question; preparation must not consume the three-second pause.
        await recorder.prepareToRecordAsync();
        checkSignal(signal);
        await narrate(current.prompt);
        checkSignal(signal);
        update({ phase: 'preparing', remaining: current.preparationSeconds });
        await waitForDeadline(current.preparationSeconds * 1000, signal, remaining => update({ remaining }));
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
        update({ answers: [...answers] });
        checkSignal(signal);
      }
      update({ phase: 'completed' });
    } catch (error) {
      update({ phase: error instanceof SessionInterrupted ? 'interrupted' : 'failed', error: error instanceof Error ? error.message : '연습을 계속할 수 없어요. 다시 시도해주세요.', answers: [...answers] });
    } finally {
      signal.removeEventListener('abort', stopPrefetch);
      prefetch.abort();
      if (mounted.current) setVoiceStage(null);
      statusHandler.current = null;
      try { cue.pause(); narration.pause(); } catch {}
      await Speech.stop().catch(() => {});
      await stopRecorder();
      await setAudioModeAsync({ allowsRecording: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
      await deactivateKeepAwake(audioTag).catch(() => {});
      controller.current = null;
      running.current = false;
    }
  }

  return { ...snapshot, question, active, voiceStage, voicePreparation, start, interrupt, metering: () => recorder.getStatus().metering };
}
