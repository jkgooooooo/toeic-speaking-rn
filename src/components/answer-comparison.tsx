import { View } from 'react-native';

import { AnswerPlayer } from '@/components/answer-player';
import { Label } from '@/components/ui';
import { fonts, usePalette } from '@/design/theme';
import type { AnswerRecord } from '@/services/recordings';

export function AnswerComparison({ previous, current }: { previous: AnswerRecord; current: AnswerRecord }) {
  const c = usePalette();
  return <View style={{ gap: 10 }}>
    <Label style={{ fontFamily: fonts.bold, fontSize: 17 }}>이전 답변과 비교해요</Label>
    <Label style={{ color: c.muted, fontSize: 13 }}>두 녹음을 번갈아 들으며 달라진 점을 확인해보세요.</Label>
    <Label style={{ fontFamily: fonts.bold, color: c.primary }}>이전 답변</Label>
    <AnswerPlayer answer={previous} />
    <Label style={{ fontFamily: fonts.bold, color: c.primary }}>다시 말한 답변</Label>
    <AnswerPlayer answer={current} />
  </View>;
}
