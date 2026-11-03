import { requireOptionalNativeModule } from 'expo-modules-core';
import type { AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';
import { checkSignal, playVoiceAsset } from './audio-tasks';
import { findCachedVoice, pinVoice, saveCachedVoice, trimVoiceCache, unpinVoice } from './voice-cache';

type ModelProgress = { completed: number; total: number };
export type ModelState = { status: 'idle' | 'preparing' | 'ready' | 'failed'; progress: ModelProgress | null; error: string | null };
type NativeSupertonic = {
  prepare(): Promise<void>;
  synthesize(text: string, voice: string): Promise<string>;
  addListener(event: 'onModelProgress', listener: (progress: ModelProgress) => void): { remove(): void };
};
export type VoiceStage = 'model' | 'generating' | 'playing';
const native = Platform.OS === 'ios' ? requireOptionalNativeModule<NativeSupertonic>('SpeakingSupertonic') : null;
let modelState: ModelState = { status: 'idle', progress: null, error: null };
const listeners = new Set<() => void>();
let preparing: Promise<void> | undefined;

function setModelState(state: ModelState) {
  modelState = state;
  listeners.forEach(listener => listener());
}
function subscribeModel(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function getModelState() { return modelState; }
export function useSupertonicModel() {
  return useSyncExternalStore(subscribeModel, getModelState, getModelState);
}
export function modelPreparationLabel(state: ModelState) {
  if (state.progress && state.progress.completed < state.progress.total) {
    return `음성 모델 준비 중 · 파일 ${state.progress.completed}/${state.progress.total}개 완료`;
  }
  return '음성 모델을 확인하고 있어요.';
}

export function prepareSupertonic(): Promise<void> {
  if (!native) {
    const error = new Error('iPhone에서 새 개발 빌드를 설치한 뒤 다시 시도해주세요.');
    setModelState({ status: 'failed', progress: null, error: error.message });
    return Promise.reject(error);
  }
  if (modelState.status === 'ready') return Promise.resolve();
  if (preparing) return preparing;
  setModelState({ status: 'preparing', progress: null, error: null });
  preparing = Promise.resolve().then(async () => {
    const subscription = native.addListener('onModelProgress', progress => {
      if (modelState.status === 'preparing' && Number.isFinite(progress.completed) && Number.isFinite(progress.total) && progress.total > 0) {
        setModelState({ status: 'preparing', progress, error: null });
      }
    });
    try { await native.prepare(); } finally { subscription.remove(); }
  })
    .then(() => { setModelState({ status: 'ready', progress: null, error: null }); })
    .catch((error: unknown) => {
      setModelState({ status: 'failed', progress: null, error: error instanceof Error ? error.message : '음성 모델을 준비하지 못했어요.' });
      throw error;
    })
    .finally(() => { preparing = undefined; });
  return preparing;
}

const pendingAudio = new Map<string, Promise<string>>();

function waitFor<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  checkSignal(signal);
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason instanceof Error ? signal.reason : new Error('연습을 중단했어요.'));
    signal.addEventListener('abort', abort, { once: true });
    task.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

async function prepareVoiceAudio(text: string, voiceId: string, signal: AbortSignal, onStage?: (stage: VoiceStage) => void) {
  checkSignal(signal);
  const voice = voiceId === 'supertonic-m1' ? 'M1' : 'F1';
  onStage?.('model');
  const cached = await waitFor(findCachedVoice(text, voice), signal);
  checkSignal(signal);
  if (cached) return cached;
  await waitFor(prepareSupertonic(), signal);
  checkSignal(signal);
  if (!native) throw new Error('이 기기에서는 Supertonic을 사용할 수 없어요.');
  onStage?.('generating');
  const key = JSON.stringify([voice, text]);
  let task = pendingAudio.get(key);
  if (!task) {
    task = native.synthesize(text, voice)
      .then(uri => saveCachedVoice(text, voice, uri))
      .finally(() => { pendingAudio.delete(key); });
    pendingAudio.set(key, task);
  }
  return waitFor(task, signal);
}

export async function warmSupertonic(texts: string[], voiceId: string, signal: AbortSignal, onProgress: (completed: number, total: number) => void, onStage?: (stage: VoiceStage) => void) {
  for (const [index, text] of texts.entries()) {
    onProgress(index, texts.length);
    await prepareVoiceAudio(text, voiceId, signal, onStage);
    checkSignal(signal);
  }
  onProgress(texts.length, texts.length);
  void trimVoiceCache().catch(() => {});
}

export async function speakSupertonic(player: AudioPlayer, text: string, voiceId: string, signal: AbortSignal, onStage?: (stage: VoiceStage) => void) {
  const path = await prepareVoiceAudio(text, voiceId, signal, onStage);
  checkSignal(signal);
  pinVoice(path);
  try {
    await playVoiceAsset(player, { uri: path }, signal, () => onStage?.('playing'));
  } finally {
    unpinVoice(path);
    void trimVoiceCache().catch(() => {});
  }
}
