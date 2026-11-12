import type { MockPart } from '@/content/mock';

export type DemoCase = {
  id: string;
  label: string;
  question: string;
  transcript: string;
  summary: string;
  evidence?: string;
  correction?: string;
  reason?: string;
  suggestion?: string;
  table?: { time: string; place: string };
};

type DemoPart = { title: string; criteria: string[]; cases: DemoCase[] };
export const demoParts: Record<MockPart, DemoPart> = {
  reading: {
    title: 'Part 1 · 지문 읽기', criteria: ['지문 전달', '발음', '억양과 강세'], cases: [
      { id: 'good', label: '정상 답변', question: 'The library opens at nine.', transcript: 'The library opens at nine.', summary: '예시 지문의 단어가 모두 포함되어 있어요.', evidence: 'The library opens at nine.' },
      { id: 'error', label: '단어 누락', question: 'The library opens at nine.', transcript: 'The library opens at.', summary: '예시 지문에서 시간을 나타내는 단어가 빠졌어요.', evidence: 'The library opens at.', suggestion: 'The library opens at nine.' },
      { id: 'uncertain', label: '인식 확인 필요', question: 'The library opens at nine.', transcript: 'The library opens at [unclear].', summary: '시간을 나타내는 부분을 확인하기 어려워요.' },
    ],
  },
  photo: {
    title: 'Part 2 · 사진 묘사', criteria: ['주요 장면과 행동', '내용 연결', '문법과 어휘', '발음과 전달력'], cases: [
      { id: 'good', label: '다른 표현도 정답', question: '예시 사진: 접수대 직원과 방문객', transcript: 'A visitor is talking to a receptionist.', summary: '예시 사진의 주요 행동을 설명했어요.', evidence: 'A visitor is talking to a receptionist.' },
      { id: 'error', label: '문법 교정', question: '예시 사진: 접수대 직원과 방문객', transcript: 'A visitor talk to the receptionist.', summary: '현재 진행 중인 행동을 표현해보세요.', evidence: 'A visitor talk', correction: 'A visitor is talking', reason: '지금 진행 중인 행동에는 be동사와 동사-ing를 사용할 수 있어요.' },
      { id: 'uncertain', label: '사진 확인 어려움', question: '예시 사진을 불러올 수 없는 경우', transcript: 'A person is standing.', summary: '사진이 없어 장면과 일치하는지 확인하기 어려워요.' },
    ],
  },
  short: {
    title: 'Part 3 · 질문 답변', criteria: ['질문에 맞는 답변', '이유와 설명', '문법과 어휘', '발음과 전달력'], cases: [
      { id: 'good', label: '다른 표현도 정답', question: 'What do you usually do on weekends?', transcript: 'I visit my family on weekends.', summary: '주말에 하는 활동을 직접 답했어요.', evidence: 'I visit my family on weekends.' },
      { id: 'error', label: '문법 교정', question: 'What do you usually do on weekends?', transcript: 'I usually go park with my friends.', summary: '주말 활동을 답했어요. 장소를 말하는 표현을 다듬어보세요.', evidence: 'go park', correction: 'go to the park', reason: '공원에 간다고 말할 때 go to the park를 사용할 수 있어요.' },
      { id: 'missing', label: '이유가 빠진 답변', question: 'Do you prefer studying at home or at a cafe? Why?', transcript: 'I prefer studying at home.', summary: '선택을 말했어요. 선택한 이유도 덧붙여보세요.', evidence: 'I prefer studying at home.' },
      { id: 'offtopic', label: '질문과 무관', question: 'What do you usually do on weekends?', transcript: 'My office is near the station.', summary: '예시 답변에서 주말에 하는 활동을 확인하기 어려워요.', evidence: 'My office is near the station.' },
      { id: 'uncertain', label: '인식 오류 의심', question: 'What do you usually do on weekends?', transcript: 'I usually go [unclear].', summary: '인식이 불확실해 답변 내용을 확인하기 어려워요.' },
    ],
  },
  table: {
    title: 'Part 4 · 자료 활용', criteria: ['시간·장소·이름', '질문 충족', '명확한 전달'], cases: [
      { id: 'good', label: '자료와 일치', question: 'When and where is the workshop?', transcript: 'It starts at 10:00 AM in Room A.', summary: '예시 표의 시간과 장소를 답했어요.', evidence: '10:00 AM in Room A', table: { time: '10:00 AM', place: 'Room A' } },
      { id: 'error', label: '시간 확인', question: 'When and where is the workshop?', transcript: 'It starts at 11:00 AM in Room A.', summary: '예시 표의 시간을 다시 확인해보세요.', evidence: '11:00 AM in Room A', correction: '10:00 AM in Room A', reason: '예시 표에는 10:00 AM, Room A로 표시돼 있어요.', table: { time: '10:00 AM', place: 'Room A' } },
      { id: 'uncertain', label: '자료 확인 어려움', question: 'When and where is the workshop?', transcript: 'It starts at ten.', summary: '표를 확인할 수 없어 시간과 장소의 정확성을 판단하기 어려워요.' },
    ],
  },
  opinion: {
    title: 'Part 5 · 의견 제시', criteria: ['의견', '이유와 예시', '내용 연결과 표현', '발음과 전달력'], cases: [
      { id: 'good', label: '의견과 이유', question: 'Do you prefer learning in a class or on your own?', transcript: 'I prefer a class because I can ask questions.', summary: '선택과 이유를 함께 말했어요.', evidence: 'I prefer a class because I can ask questions.' },
      { id: 'error', label: '이유 보완', question: 'Do you prefer learning in a class or on your own?', transcript: 'I prefer a class.', summary: '선택을 말했어요. 그 이유를 덧붙여보세요.', evidence: 'I prefer a class.' },
      { id: 'uncertain', label: '답변 확인 어려움', question: 'Do you prefer learning in a class or on your own?', transcript: '[unclear]', summary: '인식된 답변이 부족해 의견을 확인하기 어려워요.' },
    ],
  },
};

export type DemoResult = { summary: string; evidence?: string; correction?: string; reason?: string; suggestion?: string; uncertain: boolean; table?: DemoCase['table'] };
export interface FeedbackProvider {
  evaluate(input: { part: MockPart; caseId: string; transcript: string }): Promise<DemoResult>;
}

export const demoProvider: FeedbackProvider = {
  async evaluate({ part, caseId, transcript }) {
    await new Promise(resolve => setTimeout(resolve, 650));
    const example = demoParts[part].cases.find(item => item.id === caseId);
    if (!example) throw new Error('예시를 찾을 수 없어요.');
    if (transcript.trim() !== example.transcript || !transcript.trim() || (example.evidence && !transcript.includes(example.evidence))) {
      return { summary: '수정한 문장에 대한 실제 분석은 아직 연결되지 않았어요.', uncertain: true };
    }
    if (example.table && example.id === 'good' && (!transcript.includes(example.table.time) || !transcript.includes(example.table.place))) {
      return { summary: '자료의 시간과 장소를 확인하기 어려워요.', uncertain: true };
    }
    return { summary: example.summary, evidence: example.evidence, correction: example.correction, reason: example.reason, suggestion: example.suggestion, uncertain: example.id === 'uncertain', table: example.table };
  },
};
