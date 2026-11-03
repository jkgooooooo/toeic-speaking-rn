import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, View } from 'react-native';

import { ActionButton, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';

export default function AudioCheckScreen() {
  const c = usePalette();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const player = useAudioPlayer(null);
  const playerState = useAudioPlayerStatus(player);
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'recording' | 'stopping' | 'ready'>('idle');
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const runId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        runId.current += 1;
        try { player.pause(); } catch {}
        try { if (recorder.getStatus().isRecording) void recorder.stop().catch(() => {}); } catch {}
        if (mounted.current) { setPhase('idle'); setError('앱이 백그라운드로 이동해 확인을 중단했어요. 다시 녹음해주세요.'); }
      }
    });
    return () => {
      mounted.current = false; runId.current += 1; subscription.remove();
      try { player.pause(); } catch {}
      void recorder.stop().catch(() => {});
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [player, recorder]);

  async function start() {
    if (busy.current) return;
    busy.current = true; const run = ++runId.current; setError(null); setPhase('preparing');
    try {
      player.pause();
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('마이크 권한을 허용해주세요. 기기 설정에서도 변경할 수 있어요.');
      if (!mounted.current || runId.current !== run) return;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true, interruptionMode: 'doNotMix', shouldPlayInBackground: false, allowsBackgroundRecording: false });
      if (!mounted.current || runId.current !== run) return;
      await recorder.prepareToRecordAsync();
      if (!mounted.current || runId.current !== run) { await recorder.stop().catch(() => {}); return; }
      recorder.record();
      setPhase('recording');
    } catch (cause) { if (mounted.current) { setPhase('idle'); setError(cause instanceof Error ? cause.message : '녹음을 시작하지 못했어요.'); } }
    finally { busy.current = false; }
  }
  async function stop() {
    if (busy.current || phase !== 'recording') return;
    busy.current = true; const run = runId.current; setPhase('stopping');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('녹음 파일을 찾지 못했어요.');
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      if (!mounted.current || runId.current !== run) return;
      player.replace({ uri });
      setPhase('ready');
    } catch (cause) { if (mounted.current) { setPhase('idle'); setError(cause instanceof Error ? cause.message : '녹음을 마치지 못했어요.'); } }
    finally { busy.current = false; }
  }
  async function play() {
    try {
      setError(null);
      if (playerState.playing) player.pause();
      else { if (playerState.didJustFinish) await player.seekTo(0); player.play(); }
    } catch { setError('녹음된 소리를 재생하지 못했어요. 다시 녹음해주세요.'); }
  }
  return <Screen><TopBar title="마이크 확인" back /><Title subtitle="짧게 말한 뒤 재생해서 내 목소리가 들리는지 확인해요.">{'시험 전에\n목소리 확인.'}</Title>
    <View style={{ backgroundColor: c.soft, borderRadius: 24, padding: 22, gap: 10 }}><Label style={{ fontFamily: fonts.bold, fontSize: 18 }}>“Hello, can you hear me?”</Label><Label style={{ color: c.muted, fontSize: 13 }}>녹음 시작을 누르고 한 문장 말해보세요.</Label>{phase === 'recording' && <Label accessibilityLiveRegion="polite" style={{ color: c.primary, fontFamily: fonts.bold }}>녹음 중 · {Math.floor(recorderState.durationMillis / 1000)}초</Label>}</View>
    {error && <Notice error>{error}</Notice>}
    {playerState.error && <Notice error>녹음 파일을 재생하지 못했어요. 다시 녹음해주세요.</Notice>}
    {phase === 'recording' ? <ActionButton title="녹음 마치기" icon="stop-outline" onPress={() => { void stop(); }} /> : <ActionButton title={phase === 'ready' ? '다시 녹음하기' : '녹음 시작'} icon="mic-outline" busy={phase === 'preparing' || phase === 'stopping'} onPress={() => { void start(); }} />}
    {phase === 'ready' && <ActionButton title={playerState.playing ? '재생 일시정지' : '녹음 들어보기'} icon={playerState.playing ? 'pause-outline' : 'play-outline'} secondary disabled={!playerState.isLoaded || !!playerState.error} onPress={() => { void play(); }} />}
    {error && <ActionButton title="기기 설정 열기" icon="settings-outline" secondary onPress={() => { void Linking.openSettings(); }} />}
    <Notice>이 녹음은 마이크를 확인하기 위한 임시 파일이며 학습 기록에 추가되지 않아요.</Notice>
  </Screen>;
}
