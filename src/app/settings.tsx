import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { ActionButton, Icon, IconButton, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';
import { speak } from '@/services/audio-tasks';
import { useVoiceSettings } from '@/state/settings';

export default function SettingsScreen() {
  const c = usePalette();
  const settings = useVoiceSettings();
  const [tab, setTab] = useState<'system' | 'download'>('system');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { controller.current?.abort(); void Speech.stop().catch(() => {}); }, []);
  async function previewVoice(id: string) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setPreview(id); setError(null);
    try {
      await Speech.stop();
      if (abort.signal.aborted) return;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false, interruptionMode: 'mixWithOthers' });
      await speak('Take a breath. You are ready to practice speaking.', id, abort.signal);
    } catch { if (!abort.signal.aborted) setError('이 음성을 재생하지 못했어요. 무음 모드와 영어 음성 설치 상태를 확인해주세요.'); }
    finally { if (controller.current === abort) setPreview(null); }
  }
  return <Screen><TopBar title="안내 음성" back /><Title subtitle="선택한 시스템 음성으로 질문을 들려줘요.">{'집중이 잘 되는\n목소리로.'}</Title>
    <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: c.panel }}>{([['system', '시스템 음성'], ['download', '다운로드 음성']] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: tab === key ? c.background : 'transparent' }}><Label style={{ fontFamily: fonts.medium, fontSize: 14, color: tab === key ? c.ink : c.muted }}>{label}</Label></Pressable>)}</View>
    {tab === 'system' ? <>
      <Notice>기기에 설치된 영어 음성을 사용해요. iPhone에서는 무음 모드를 해제해주세요. 음성에 따라 기기에서 추가 다운로드가 필요할 수 있어요.</Notice>
      {settings.loading && <ActivityIndicator color={c.primary} />}
      {(error || settings.error) && <Notice error>{error ?? settings.error}</Notice>}
      <View>{settings.voices.map(voice => <View key={voice.identifier} style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: settings.voiceId === voice.identifier }} onPress={() => settings.selectVoice(voice.identifier)} style={{ flex: 1, gap: 3, minHeight: 48, justifyContent: 'center' }}><View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>{settings.voiceId === voice.identifier && <Icon name="checkmark-circle" color={c.primary} size={17} />}<Label style={{ fontFamily: fonts.medium, flexShrink: 1 }}>{voice.name}</Label></View><Label style={{ fontSize: 12, color: c.muted }}>{voice.language} · {voice.quality === Speech.VoiceQuality.Enhanced ? '고품질' : '기본'}</Label></Pressable>
        <IconButton name={preview === voice.identifier ? 'volume-high-outline' : 'play-outline'} label={`${voice.name} 미리듣기`} onPress={() => { void previewVoice(voice.identifier); }} />
      </View>)}</View>
      <ActionButton title="음성 목록 새로고침" icon="refresh-outline" secondary onPress={() => { void settings.refresh(); }} />
      <ActionButton title="한 문항 오디오 확인" icon="mic-outline" secondary onPress={() => { controller.current?.abort(); router.push('/practice?mode=single'); }} />
    </> : <View style={{ gap: 17 }}><Notice>추가 음성은 아직 제공되지 않아요. 지금은 시스템 영어 음성으로 연습할 수 있어요.</Notice><Label style={{ fontSize: 13, color: c.muted }}>오프라인 연습을 위한 Supertonic 음성을 준비하고 있어요.</Label></View>}
  </Screen>;
}
