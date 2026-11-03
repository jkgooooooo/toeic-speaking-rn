import * as Speech from 'expo-speech';
import Storage from '@/services/storage';
import { Platform } from 'react-native';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';

const voiceSettingKey = 'speaking.voice.v1';
type VoiceSettings = { voices: Speech.Voice[]; voiceId?: string; loading: boolean; error: string | null; storageError: string | null; selectVoice: (id: string) => void; refresh: () => Promise<void> };
const SettingsContext = createContext<VoiceSettings | null>(null);

function defaultVoice(available: Speech.Voice[]) {
  if (Platform.OS === 'ios') return 'supertonic-f1';
  return available.find(voice => voice.language.toLowerCase() === 'en-us')?.identifier ?? available[0]?.identifier;
}
function isAvailable(id: string | undefined, available: Speech.Voice[]) {
  return !!id && ((Platform.OS === 'ios' && ['supertonic-f1', 'supertonic-m1'].includes(id)) || available.some(voice => voice.identifier === id));
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [voiceId, setVoiceId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);

  const applyVoices = useCallback((list: Speech.Voice[], preferred?: string | null) => {
    const available = list.filter(voice => /^en([-_]|$)/i.test(voice.language));
    setVoices(available);
    setError(available.length ? null : '기기에서 영어 음성을 찾지 못했어요. 기기의 음성 설정에서 영어 음성을 추가해주세요.');
    setVoiceId(current => {
      const selected = preferred ?? current;
      return isAvailable(selected, available) ? selected : defaultVoice(available);
    });
  }, []);

  function selectVoice(id: string) {
    setVoiceId(id);
    if (Platform.OS === 'web') return;
    // Serialize writes so rapid taps keep the final selection.
    writes.current = writes.current.catch(() => {}).then(() => Storage.setItem(voiceSettingKey, id));
    void writes.current.then(() => { if (mounted.current) setStorageError(null); })
      .catch(() => { if (mounted.current) setStorageError('음성 선택을 저장하지 못했어요. 앱을 다시 열면 기본 음성으로 바뀔 수 있어요.'); });
  }

  async function refresh() {
    setLoading(true);
    try { applyVoices(await Speech.getAvailableVoicesAsync()); }
    catch { setError('음성 목록을 불러오지 못했어요. 다시 시도해주세요.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    mounted.current = true;
    let active = true;
    async function load() {
      const [voiceResult, savedResult] = await Promise.allSettled([
        Speech.getAvailableVoicesAsync(),
        Platform.OS === 'web' ? Promise.resolve(null) : Storage.getItem(voiceSettingKey),
      ]);
      if (!active) return;
      const available = voiceResult.status === 'fulfilled' ? voiceResult.value : [];
      applyVoices(available, savedResult.status === 'fulfilled' ? savedResult.value : null);
      if (voiceResult.status === 'rejected') setError('음성 목록을 불러오지 못했어요. 다시 시도해주세요.');
      if (savedResult.status === 'rejected') setStorageError('저장된 음성 선택을 불러오지 못했어요.');
      setLoading(false);
    }
    void load();
    return () => { active = false; mounted.current = false; };
  }, [applyVoices]);

  return <SettingsContext.Provider value={{ voices, voiceId, loading, error, storageError, selectVoice, refresh }}>{children}</SettingsContext.Provider>;
}

export function useVoiceSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('SettingsProvider is missing');
  return value;
}
