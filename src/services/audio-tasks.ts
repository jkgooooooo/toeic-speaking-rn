import type { AudioPlayer, AudioSource } from 'expo-audio';
import * as Speech from 'expo-speech';

export class SessionInterrupted extends Error {}

export function checkSignal(signal: AbortSignal) {
  if (signal.aborted) throw signal.reason instanceof Error ? signal.reason : new SessionInterrupted('연습을 중단했어요.');
}

export function waitForDeadline(ms: number, signal: AbortSignal, onRemaining: (seconds: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const deadline = performance.now() + ms;
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); reject(signal.reason); };
    const tick = () => {
      const left = Math.max(0, deadline - performance.now());
      onRemaining(Math.ceil(left / 1000));
      if (left <= 0) { cleanup(); resolve(); } else timer = setTimeout(tick, Math.min(80, left));
    };
    if (signal.aborted) { reject(signal.reason); return; }
    signal.addEventListener('abort', abort, { once: true });
    tick();
  });
}

export function speak(text: string, voice: string, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => { clearTimeout(timeout); signal.removeEventListener('abort', abort); };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true; cleanup();
      if (error) reject(error); else resolve();
    };
    const abort = () => { finish(signal.reason); void Speech.stop().catch(() => {}); };
    const timeout = setTimeout(() => { finish(new Error('안내 음성 재생이 끝나지 않았어요. 음성 설정과 무음 모드를 확인해주세요.')); void Speech.stop().catch(() => {}); }, 60000);
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    try {
      Speech.speak(text, {
        voice, language: 'en-US', rate: 0.93, useApplicationAudioSession: true,
        onDone: () => finish(),
        onError: error => finish(error),
        onStopped: () => finish(new SessionInterrupted('안내 음성 재생이 중단됐어요.')),
      });
    } catch (error) { finish(error instanceof Error ? error : new Error('안내 음성을 재생하지 못했어요.')); }
  });
}

export async function playCue(player: AudioPlayer, signal: AbortSignal) {
  checkSignal(signal);
  await player.seekTo(0);
  checkSignal(signal);
  return new Promise<number>((resolve, reject) => {
    let settled = false;
    const cleanup = () => { clearTimeout(timeout); subscription.remove(); signal.removeEventListener('abort', abort); };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true; cleanup();
      if (error) { player.pause(); reject(error); } else resolve(performance.now());
    };
    const abort = () => finish(signal.reason);
    const subscription = player.addListener('playbackStatusUpdate', status => {
      if (status.error) finish(new Error('시작 신호를 재생하지 못했어요.'));
      else if (status.didJustFinish) finish();
    });
    const timeout = setTimeout(() => finish(new Error('시작 신호 재생이 중단됐어요. 이어폰 연결을 확인해주세요.')), 6000);
    signal.addEventListener('abort', abort, { once: true });
    try { player.play(); } catch (error) { finish(error instanceof Error ? error : new Error('시작 신호를 재생하지 못했어요.')); }
  });
}

export function playVoiceAsset(player: AudioPlayer, source: AudioSource, signal: AbortSignal, onPlaying?: () => void) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let started = false;
    const cleanup = () => { clearTimeout(timeout); subscription.remove(); signal.removeEventListener('abort', abort); };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true; cleanup();
      if (error) { player.pause(); reject(error); } else resolve();
    };
    const abort = () => finish(signal.reason instanceof Error ? signal.reason : new SessionInterrupted('연습을 중단했어요.'));
    const subscription = player.addListener('playbackStatusUpdate', status => {
      if (status.error) finish(new Error('안내 음성을 재생하지 못했어요.'));
      else if (started && status.didJustFinish) finish();
      else if (!started && status.isLoaded) {
        started = true;
        try { player.play(); onPlaying?.(); }
        catch (error) { finish(error instanceof Error ? error : new Error('안내 음성을 재생하지 못했어요.')); }
      }
    });
    const timeout = setTimeout(() => finish(new Error('안내 음성 재생이 중단됐어요.')), 60000);
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    try { player.replace(source); } catch (error) { finish(error instanceof Error ? error : new Error('안내 음성을 불러오지 못했어요.')); }
  });
}
