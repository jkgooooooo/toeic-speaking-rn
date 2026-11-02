import { requireOptionalNativeModule } from 'expo-modules-core';
import { File } from 'expo-file-system';
import type { AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { checkSignal, playVoiceAsset } from './audio-tasks';

type NativeSupertonic = { prepare(): Promise<void>; synthesize(text: string, voice: string): Promise<string> };
const native = Platform.OS === 'ios' ? requireOptionalNativeModule<NativeSupertonic>('SpeakingSupertonic') : null;
let ready = false;
let preparing: Promise<void> | undefined;

export function prepareSupertonic() {
  if (!native) return Promise.reject(new Error('iPhone에서 새 개발 빌드를 설치한 뒤 다시 시도해주세요.'));
  if (ready) return Promise.resolve();
  if (!preparing) preparing = native.prepare().then(() => { ready = true; }).finally(() => { preparing = undefined; });
  return preparing;
}

export async function speakSupertonic(player: AudioPlayer, text: string, voiceId: string, signal: AbortSignal) {
  checkSignal(signal);
  let stopWaiting: (() => void) | undefined;
  const cancelledPreparation = new Promise<never>((_, reject) => {
    stopWaiting = () => reject(signal.reason instanceof Error ? signal.reason : new Error('연습을 중단했어요.'));
    signal.addEventListener('abort', stopWaiting, { once: true });
  });
  try { await Promise.race([prepareSupertonic(), cancelledPreparation]); }
  finally { if (stopWaiting) signal.removeEventListener('abort', stopWaiting); }
  checkSignal(signal);
  if (!native) throw new Error('이 기기에서는 Supertonic을 사용할 수 없어요.');
  const voice = voiceId === 'supertonic-m1' ? 'M1' : 'F1';
  const filePromise = native.synthesize(text, voice);
  let onAbort: (() => void) | undefined;
  const cancelled = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new Error('연습을 중단했어요.'));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  let path: string;
  try {
    path = await Promise.race([filePromise, cancelled]);
  } catch (error) {
    void filePromise.then(uri => { try { new File(uri).delete(); } catch {} }).catch(() => {});
    throw error;
  } finally {
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
  try {
    checkSignal(signal);
    await playVoiceAsset(player, { uri: path }, signal);
  } finally {
    try { new File(path).delete(); } catch {}
  }
}
