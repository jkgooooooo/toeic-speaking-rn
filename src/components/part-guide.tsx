import { View } from 'react-native';

import { Label } from '@/components/ui';
import type { MockPart } from '@/content/mock';
import { fonts, usePalette } from '@/design/theme';

const guides: Record<MockPart, { title: string; tip: string; phrases: string[] }> = {
  reading: { title: '지문 읽기', tip: '준비 시간에 문장의 흐름과 끊어 읽을 곳을 살펴보세요.', phrases: [] },
  photo: { title: '사진 묘사', tip: '장소를 말한 뒤 사람들의 행동과 주변을 차례로 설명해보세요.', phrases: ['This picture was taken in ...', 'On the left, a person is ...', 'In the background, ...'] },
  short: { title: '질문에 답하기', tip: '질문에 먼저 답하고 짧은 이유나 예시를 덧붙여보세요.', phrases: ['I usually ...', 'I prefer ... because ...'] },
  table: { title: '자료로 답하기', tip: '질문에서 묻는 시간, 장소, 이름을 표에서 찾아 답해보세요.', phrases: ['It starts at ...', 'The session is led by ...', 'Actually, ...'] },
  opinion: { title: '의견 말하기', tip: '의견을 먼저 밝히고 이유와 구체적인 예시를 이어보세요.', phrases: ['I prefer ... because ...', 'For example, ...', 'For these reasons, ...'] },
};

export function PartGuide({ part }: { part: MockPart }) {
  const c = usePalette();
  const guide = guides[part];
  return <View style={{ borderRadius: 20, backgroundColor: c.soft, padding: 18, gap: 10 }}>
    <Label style={{ color: c.primary, fontFamily: fonts.bold }}>{guide.title} · 시작 전 팁</Label>
    <Label>{guide.tip}</Label>
    {guide.phrases.length > 0 && <><Label style={{ color: c.muted, fontSize: 12 }}>필요할 때 활용하는 시작 표현</Label>{guide.phrases.map(phrase => <Label key={phrase} style={{ color: c.primary, fontSize: 13 }}>{phrase}</Label>)}</>}
  </View>;
}
