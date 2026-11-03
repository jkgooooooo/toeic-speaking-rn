import { getMockSet } from '@/content/mock';
import { listAnswers, type AnswerRecord } from '@/services/recordings';
import Storage from '@/services/storage';

const checkpointKey = 'speaking.mock.resume.v1';
export type MockResume = { sessionId: string; setId: string; answers: AnswerRecord[]; nextIndex: number };

export async function saveMockSession(sessionId: string, setId: string) {
  await Storage.setItem(checkpointKey, JSON.stringify({ version: 1, sessionId, setId }));
}

export async function clearMockSession() {
  await Storage.removeItem(checkpointKey);
}

export async function loadMockSession(): Promise<MockResume | null> {
  const saved = await Storage.getItem(checkpointKey);
  if (!saved) return null;
  const value: unknown = JSON.parse(saved);
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('sessionId' in value) || typeof value.sessionId !== 'string' || !/^mock-\d+$/.test(value.sessionId)) {
    throw new Error('저장된 시험 정보를 읽지 못했어요.');
  }
  const sessionId = value.sessionId;
  const setId = 'setId' in value && typeof value.setId === 'string' ? value.setId : 'mock1';
  const set = getMockSet(setId);
  if (!set) throw new Error('이전 시험의 문제를 찾을 수 없어요.');
  const mockQuestions = set.questions;
  const result = await listAnswers();
  if (result.unreadable) throw new Error('일부 학습 기록을 읽지 못해 이어갈 위치를 확인할 수 없어요.');
  const answers = result.records.filter(record => record.sessionId === sessionId && mockQuestions.some(question => record.id === `${sessionId}-${question.id}`))
    .sort((a, b) => a.question.number - b.question.number);
  const nextIndex = mockQuestions.findIndex(question => !answers.some(answer => answer.id === `${sessionId}-${question.id}`));
  return { sessionId, setId, answers, nextIndex: nextIndex < 0 ? mockQuestions.length : nextIndex };
}
