import { Directory, File, Paths } from 'expo-file-system';
import Storage from '@/services/storage';

const prefix = 'speaking.voice-cache.v1:';
const limit = 80;
const pinned = new Map<string, number>();
type Entry = { filename: string; usedAt: number };

function folder() {
  const dir = new Directory(Paths.cache, 'speaking-voice-cache-v1');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}
function cacheKey(text: string, voice: string) {
  // The model revision, language, synthesis steps and speed are part of the key.
  return prefix + JSON.stringify(['supertonic3-aafc6e32416a594460b32413efc49d7fe4ce6d46', 'en', voice, 8, 1.0, text]);
}
function parseEntry(value: string | null): Entry | null {
  if (!value) return null;
  try {
    const entry: unknown = JSON.parse(value);
    if (!entry || typeof entry !== 'object') return null;
    const item = entry as Partial<Entry>;
    if (typeof item.filename !== 'string' || !/^[a-z0-9-]+\.wav$/.test(item.filename) || typeof item.usedAt !== 'number') return null;
    return { filename: item.filename, usedAt: item.usedAt };
  } catch { return null; }
}
function cacheFile(filename: string) { return new File(folder(), filename); }

export async function findCachedVoice(text: string, voice: string): Promise<string | null> {
  const key = cacheKey(text, voice);
  const item = parseEntry(await Storage.getItem(key));
  if (!item) return null;
  const file = cacheFile(item.filename);
  if (!file.exists || file.size <= 44) {
    await Storage.removeItem(key);
    return null;
  }
  // A failed recency update should not prevent playback.
  void Storage.setItem(key, JSON.stringify({ ...item, usedAt: Date.now() })).catch(() => {});
  return file.uri;
}

export function pinVoice(uri: string) { pinned.set(uri, (pinned.get(uri) ?? 0) + 1); }
export function unpinVoice(uri: string) {
  const count = pinned.get(uri) ?? 0;
  if (count <= 1) pinned.delete(uri); else pinned.set(uri, count - 1);
}

export async function saveCachedVoice(text: string, voice: string, sourceUri: string): Promise<string> {
  const source = new File(sourceUri);
  if (!source.exists || source.size <= 44) throw new Error('생성된 음성 파일을 확인하지 못했어요. 다시 시도해주세요.');
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}.wav`;
  const target = cacheFile(name);
  try {
    await source.copy(target);
    await Storage.setItem(cacheKey(text, voice), JSON.stringify({ filename: name, usedAt: Date.now() } satisfies Entry));
    return target.uri;
  } catch {
    try { if (target.exists) await target.delete(); } catch {}
    throw new Error('음성을 저장하지 못했어요. 기기의 저장 공간을 확인한 뒤 다시 시도해주세요.');
  } finally {
    try { if (source.exists) await source.delete(); } catch {}
  }
}

export async function trimVoiceCache() {
  const keys = (await Storage.getAllKeys()).filter(key => key.startsWith(prefix));
  if (keys.length <= limit) return;
  const entries = (await Promise.all(keys.map(async key => ({ key, entry: parseEntry(await Storage.getItem(key)) }))))
    .sort((a, b) => (a.entry?.usedAt ?? 0) - (b.entry?.usedAt ?? 0));
  let excess = keys.length - limit;
  for (const { key, entry } of entries) {
    if (excess <= 0) break;
    if (entry) {
      const file = cacheFile(entry.filename);
      if (pinned.has(file.uri)) continue;
      try { if (file.exists) await file.delete(); } catch { continue; }
    }
    await Storage.removeItem(key);
    excess--;
  }
}
