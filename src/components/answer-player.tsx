import { type AudioPlayer, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, Label } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';
import { type AnswerRecord, recordingUri } from '@/services/recordings';

function timestamp(value: number) { return `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.floor(value % 60).toString().padStart(2, '0')}`; }
let activePlayer: AudioPlayer | null = null;
let activeExample: AbortController | null = null;

export function registerExamplePlayback(controller: AbortController) {
  activeExample?.abort();
  activeExample = controller;
}
export function clearExamplePlayback(controller: AbortController) {
  if (activeExample === controller) activeExample = null;
}
function stopExamplePlayback() { activeExample?.abort(); activeExample = null; }

export function stopActiveAnswerPlayer() {
  if (activePlayer) { try { activePlayer.pause(); } catch {} }
  activePlayer = null;
}

export function AnswerPlayer({ answer }: { answer: AnswerRecord }) {
  const c = usePalette();
  const player = useAudioPlayer({ uri: recordingUri(answer) }, { updateInterval: 150 });
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => { try { player.pause(); } catch {} if (activePlayer === player) activePlayer = null; }, [player]);
  async function toggle() {
    try {
      setError(null);
      if (status.playing) player.pause();
      else {
        stopExamplePlayback();
        if (activePlayer && activePlayer !== player) { try { activePlayer.pause(); } catch {} }
        activePlayer = player;
        if (status.didJustFinish || status.currentTime >= status.duration) await player.seekTo(0);
        player.play();
      }
    } catch { setError('답변 재생을 시작하지 못했어요. 기록 화면에서 다시 열어주세요.'); }
  }
  const total = status.duration || answer.durationMs / 1000;
  return <View style={{ padding: 20, gap: 17, backgroundColor: c.panel, borderRadius: 23 }}>
    <View style={{ gap: 5 }}><Label style={{ fontFamily: fonts.bold }}>Q{answer.question.number}. 질문에 답하기</Label><Label style={{ fontSize: 13, color: c.muted }}>{answer.question.prompt}</Label></View>
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? '답변 일시 정지' : '답변 재생'} disabled={!status.isLoaded || !!status.error} onPress={() => { void toggle(); }} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary, opacity: status.isLoaded ? 1 : 0.4 }}><Icon name={status.playing ? 'pause' : 'play'} color={c.onPrimary} size={19} /></Pressable>
      <View accessible accessibilityLabel={`답변 ${timestamp(status.currentTime)} / ${timestamp(total)}`} style={{ flex: 1, gap: 9 }}><View style={{ backgroundColor: c.line, height: 5, borderRadius: 4, overflow: 'hidden' }}><View style={{ backgroundColor: c.primary, height: 5, width: `${total ? Math.min(100, status.currentTime / total * 100) : 0}%` }} /></View><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label style={{ fontSize: 11, color: c.muted, fontVariant: ['tabular-nums'] }}>{timestamp(status.currentTime)}</Label><Label style={{ fontSize: 11, color: c.muted, fontVariant: ['tabular-nums'] }}>{timestamp(total)}</Label></View></View>
    </View>
    {status.error && <Label accessibilityRole="alert" style={{ color: c.danger, fontSize: 13 }}>녹음 파일을 재생하지 못했어요. 파일이 남아 있는지 확인해주세요.</Label>}
    {error && <Label accessibilityRole="alert" style={{ color: c.danger, fontSize: 13 }}>{error}</Label>}
  </View>;
}
