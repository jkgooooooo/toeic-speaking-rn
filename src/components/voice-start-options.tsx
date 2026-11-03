import { router } from 'expo-router';
import { View } from 'react-native';

import { ActionButton, Label } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';
import { useSupertonicModel } from '@/services/supertonic';
import { useVoiceSettings } from '@/state/settings';

export function VoiceStartOptions() {
  const c = usePalette();
  const { voiceId, voices, selectVoice, storageError } = useVoiceSettings();
  const model = useSupertonicModel();
  if (!voiceId) return null;
  if (!voiceId.startsWith('supertonic-') || model.status === 'ready') return <View style={{ gap: 8 }}>
    <Label style={{ color: c.muted, fontSize: 13 }}>선택한 음성: {voiceId.startsWith('supertonic-') ? 'AI 음성' : '기기 음성'}</Label>
    {storageError && <Label accessibilityRole="alert" style={{ color: c.danger, fontSize: 12 }}>{storageError}</Label>}
    <ActionButton title="음성 바꾸기" icon="options-outline" secondary onPress={() => router.push('/settings')} />
  </View>;
  const systemVoice = voices.find(voice => /^en[-_]us$/i.test(voice.language)) ?? voices[0];
  return <View style={{ borderRadius: 20, backgroundColor: c.soft, padding: 18, gap: 10 }}>
    <Label style={{ fontFamily: fonts.bold, color: c.primary }}>연습 음성 준비</Label>
    <Label style={{ fontSize: 13, lineHeight: 21 }}>선택한 AI 음성은 처음 사용할 때 약 400MB를 내려받고 문장별 음성을 만들어요. 설정에서 미리 준비하거나 기기 음성을 선택할 수 있어요.</Label>
    <ActionButton title="AI 음성 미리 준비" icon="download-outline" secondary onPress={() => router.push('/settings')} />
    <ActionButton title="기기 음성으로 선택" icon="phone-portrait-outline" secondary disabled={!systemVoice} onPress={() => { if (systemVoice) selectVoice(systemVoice.identifier); }} />
    {!systemVoice && <Label style={{ color: c.muted, fontSize: 12 }}>사용 가능한 영어 기기 음성이 없으면 음성 설정을 확인해주세요.</Label>}
    {storageError && <Label accessibilityRole="alert" style={{ color: c.danger, fontSize: 12 }}>{storageError}</Label>}
  </View>;
}
