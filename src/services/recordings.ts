import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { PracticeQuestion } from '@/content/daily';
import Storage from '@/services/storage';

export type AnswerRecord = {
  schemaVersion: 1;
  id: string;
  sessionId: string;
  createdAt: string;
  question: PracticeQuestion;
  filename: string;
  durationMs: number;
  cueToRecordCommandMs: number;
  status: 'completed';
};

function folder() {
  const dir = new Directory(Paths.document, 'answers');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function recordingUri(record: AnswerRecord) {
  return new File(Paths.document, 'answers', record.filename).uri;
}

export async function saveAnswer(sourceUri: string, data: Omit<AnswerRecord, 'schemaVersion' | 'filename' | 'status'>): Promise<AnswerRecord> {
  const dir = folder();
  const filename = `${data.id}.m4a`;
  const source = new File(sourceUri);
  if (!source.exists || source.size <= 0) throw new Error('녹음 파일이 비어 있어 저장하지 못했어요.');
  const destination = new File(dir, filename);
  const result: AnswerRecord = { ...data, filename, schemaVersion: 1, status: 'completed' };
  const draft = new File(dir, `${data.id}.json.tmp`);
  const metadata = new File(dir, `${data.id}.json`);
  if (!/^[\w-]+$/.test(data.id) || destination.exists || draft.exists || metadata.exists) {
    throw new Error('기록을 안전하게 저장하지 못했어요. 다시 시도해주세요.');
  }
  try {
    await source.copy(destination);
    await draft.write(JSON.stringify(result));
    await draft.move(metadata);
  } catch (error) {
    try { if (draft.exists) await draft.delete(); } catch {}
    try { if (destination.exists) await destination.delete(); } catch {}
    throw error;
  }
  // Keep the original recording until both files are committed.
  try { await source.delete(); } catch {}
  return result;
}

function isRecord(value: unknown): value is AnswerRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<AnswerRecord>;
  return v.schemaVersion === 1 && typeof v.id === 'string' && /^[\w-]+$/.test(v.id)
    && typeof v.sessionId === 'string' && typeof v.createdAt === 'string' && Number.isFinite(Date.parse(v.createdAt))
    && v.filename === `${v.id}.m4a` && typeof v.durationMs === 'number' && Number.isFinite(v.durationMs) && v.durationMs > 0
    && !!v.question && typeof v.question.number === 'number' && typeof v.question.prompt === 'string';
}

export async function listAnswers(): Promise<{ records: AnswerRecord[]; unreadable: number }> {
  if (Platform.OS === 'web') return { records: [], unreadable: 0 };
  const files = folder().list().filter(file => file instanceof File && file.name.endsWith('.json')) as File[];
  const records: AnswerRecord[] = [];
  let unreadable = 0;
  for (const file of files) {
    try {
      const record: unknown = JSON.parse(await file.text());
      if (!isRecord(record)) throw new Error('Invalid recording metadata');
      records.push(record);
    } catch { unreadable++; }
  }
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { records, unreadable };
}

export async function deleteAnswer(record: AnswerRecord) {
  if (!/^[\w-]+$/.test(record.id) || record.filename !== `${record.id}.m4a`) {
    throw new Error('이 기록은 삭제할 수 없어요.');
  }
  await Storage.removeItem(`speaking.feedback.demo.v1.${record.id}`);
  const dir = folder();
  const audio = new File(dir, record.filename);
  const metadata = new File(dir, `${record.id}.json`);
  // Keep metadata available for retry if removing the audio fails.
  if (audio.exists) await audio.delete();
  if (metadata.exists) await metadata.delete();
}
