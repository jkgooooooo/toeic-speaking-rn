import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { PracticeQuestion } from '@/content/daily';

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
  await source.copy(destination);
  const result: AnswerRecord = { ...data, filename, schemaVersion: 1, status: 'completed' };
  const draft = new File(dir, `${data.id}.json.tmp`);
  await draft.write(JSON.stringify(result));
  await draft.move(new File(dir, `${data.id}.json`));
  // Metadata is committed only after the recording file is safely copied.
  try { await source.delete(); } catch { /* A leftover source can be reconciled later. */ }
  return result;
}

function isRecord(value: unknown): value is AnswerRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<AnswerRecord>;
  return v.schemaVersion === 1 && typeof v.id === 'string' && typeof v.createdAt === 'string'
    && typeof v.filename === 'string' && /^[\w-]+\.m4a$/.test(v.filename)
    && typeof v.durationMs === 'number' && !!v.question && typeof v.question.prompt === 'string';
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
