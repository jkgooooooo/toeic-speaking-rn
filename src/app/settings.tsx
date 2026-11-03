import * as Speech from 'expo-speech';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';

import { ActionButton, Icon, IconButton, Label, Notice, Screen, Title, TopBar } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';
import { bundledVoices } from '@/content/voice-assets';
import { modelPreparationLabel, prepareSupertonic, speakSupertonic, type VoiceStage, useSupertonicModel } from '@/services/supertonic';
import { speak } from '@/services/audio-tasks';
import { useVoiceSettings } from '@/state/settings';

export default function SettingsScreen() {
  const c = usePalette();
  const settings = useVoiceSettings();
  const [tab, setTab] = useState<'system' | 'download'>('download');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewStage, setPreviewStage] = useState<VoiceStage | null>(null);
  const model = useSupertonicModel();
  const controller = useRef<AbortController | null>(null);
  const player = useAudioPlayer(null, { updateInterval: 50 });
  useEffect(() => () => { controller.current?.abort(); controller.current = null; void Speech.stop().catch(() => {}); }, []);
  async function previewVoice(id: string) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setPreview(id); setPreviewStage(null); setError(null);
    try {
      await Speech.stop();
      if (abort.signal.aborted) return;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false, interruptionMode: 'mixWithOthers' });
      if (id.startsWith('supertonic-')) await speakSupertonic(player, 'What do you usually do on weekends?', id, abort.signal, stage => { if (controller.current === abort && !abort.signal.aborted) setPreviewStage(stage); });
      else await speak('Take a breath. You are ready to practice speaking.', id, abort.signal);
    } catch (cause) { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : '이 음성을 재생하지 못했어요.'); }
    finally { if (controller.current === abort) { setPreview(null); setPreviewStage(null); } }
  }
  return <Screen><TopBar title="안내 음성" back /><Title subtitle="선택한 목소리로 질문을 들려줘요.">{'집중이 잘 되는\n목소리로.'}</Title>
    <Notice>녹음과 학습 기록은 이 기기에 저장돼요. 앱을 삭제하면 함께 삭제될 수 있어요. AI 음성 모델은 처음 사용할 때 Hugging Face에서 다운로드해요.</Notice>
    {settings.storageError && <Notice error>{settings.storageError}</Notice>}
    <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: c.panel }}>{([['download', '기본 음성'], ['system', '시스템 음성']] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: tab === key ? c.background : 'transparent' }}><Label style={{ fontFamily: fonts.medium, fontSize: 14, color: tab === key ? c.ink : c.muted }}>{label}</Label></Pressable>)}</View>
    {tab === 'system' ? <>
      <Notice>기기에 설치된 영어 음성을 사용해요. iPhone에서는 무음 모드를 해제해주세요. 음성에 따라 기기에서 추가 다운로드가 필요할 수 있어요.</Notice>
      {settings.loading && <ActivityIndicator color={c.primary} />}
      {(error || settings.error) && <Notice error>{error ?? settings.error}</Notice>}
      <View>{settings.voices.map(voice => <View key={voice.identifier} style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: settings.voiceId === voice.identifier, disabled: settings.loading }} disabled={settings.loading} onPress={() => settings.selectVoice(voice.identifier)} style={{ flex: 1, gap: 3, minHeight: 48, justifyContent: 'center' }}><View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>{settings.voiceId === voice.identifier && <Icon name="checkmark-circle" color={c.primary} size={17} />}<Label style={{ fontFamily: fonts.medium, flexShrink: 1 }}>{voice.name}</Label></View><Label style={{ fontSize: 12, color: c.muted }}>{voice.language} · {voice.quality === Speech.VoiceQuality.Enhanced ? '고품질' : '기본'}</Label></Pressable>
        <IconButton name={preview === voice.identifier ? 'volume-high-outline' : 'play-outline'} label={`${voice.name} 미리듣기`} onPress={() => { void previewVoice(voice.identifier); }} />
      </View>)}</View>
      <ActionButton title="음성 목록 새로고침" icon="refresh-outline" secondary onPress={() => { void settings.refresh(); }} />
      <ActionButton title="한 문항 오디오 확인" icon="mic-outline" secondary onPress={() => { controller.current?.abort(); router.push('/practice?mode=single'); }} />
    </> : <View style={{ gap: 17 }}>
      <Notice>iPhone에서 약 400MB의 AI 음성 모델을 한 번 내려받으면 새로운 영어 문장도 오프라인으로 읽어요.</Notice>
      {Platform.OS === 'ios' ? <>
        <ActionButton
          title={model.status === 'ready' ? '음성 모델 준비 완료' : model.status === 'failed' ? '음성 모델 다시 준비하기' : '음성 모델 다운로드 및 확인'}
          icon="download-outline"
          secondary
          busy={model.status === 'preparing'}
          disabled={model.status === 'preparing' || model.status === 'ready'}
          onPress={() => { setError(null); void prepareSupertonic().catch(() => {}); }}
        />
        {model.status === 'preparing' && <View accessibilityLiveRegion="polite">
          <Notice>{modelPreparationLabel(model)} 처음에는 시간이 걸릴 수 있어요.</Notice>
        </View>}
        {model.status === 'ready' && <Notice>음성 모델이 준비됐어요. 인터넷 없이 사용할 수 있어요.</Notice>}
      </> : <Notice>Supertonic 음성은 iPhone에서 먼저 제공해요. Android에서는 시스템 음성을 선택해주세요.</Notice>}
      {bundledVoices.map(voice => <View key={voice.id} style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: settings.voiceId === voice.id, disabled: settings.loading || Platform.OS !== 'ios' }} disabled={settings.loading || Platform.OS !== 'ios'} onPress={() => settings.selectVoice(voice.id)} style={{ flex: 1, gap: 3, minHeight: 48, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
            {settings.voiceId === voice.id && <Icon name="checkmark-circle" color={c.primary} size={17} />}
            <Label style={{ fontFamily: fonts.medium }}>{voice.name}</Label>
          </View>
          <Label style={{ fontSize: 12, color: c.muted }}>{voice.description}</Label>
        </Pressable>
        <IconButton name={preview === voice.id ? 'volume-high-outline' : 'play-outline'} label={`${voice.name} 미리듣기`} onPress={() => { if (Platform.OS === 'ios') void previewVoice(voice.id); }} />
      </View>)}
      {previewStage === 'generating' && <View accessibilityLiveRegion="polite"><Notice>미리듣기 음성을 만들고 있어요. 잠시만 기다려주세요.</Notice></View>}
      {previewStage === 'playing' && <Notice>미리듣기 재생 중이에요.</Notice>}
      {(error || model.error) && <Notice error>{error ?? model.error}</Notice>}
      <ActionButton title="한 문항 오디오 확인" icon="mic-outline" secondary onPress={() => { controller.current?.abort(); router.push('/practice?mode=single'); }} />
    </View>}
  </Screen>;
}
