import * as Speech from 'expo-speech';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';

type VoiceSettings = { voices: Speech.Voice[]; voiceId?: string; loading: boolean; error: string | null; selectVoice: (id: string) => void; refresh: () => Promise<void> };
const SettingsContext = createContext<VoiceSettings | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [voiceId, selectVoice] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const applyVoices = useCallback((list: Speech.Voice[]) => {
    const available = list.filter(v => /^en([-_]|$)/i.test(v.language));
    setVoices(available);
    setError(available.length ? null : '기기에서 영어 음성을 찾지 못했어요. 기기의 음성 설정에서 영어 음성을 추가해주세요.');
    selectVoice(current => available.some(v => v.identifier === current) ? current : available.find(v => v.language.toLowerCase() === 'en-us')?.identifier ?? available[0]?.identifier);
  }, []);
  async function refresh() {
    setLoading(true);
    try {
      applyVoices(await Speech.getAvailableVoicesAsync());
    } catch {
      setError('음성 목록을 불러오지 못했어요. 다시 시도해주세요.');
    } finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    Speech.getAvailableVoicesAsync().then(list => { if (active) applyVoices(list); })
      .catch(() => { if (active) setError('음성 목록을 불러오지 못했어요. 다시 시도해주세요.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applyVoices]);
  return <SettingsContext.Provider value={{ voices, voiceId, loading, error, selectVoice, refresh }}>{children}</SettingsContext.Provider>;
}

export function useVoiceSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('SettingsProvider is missing');
  return value;
}
