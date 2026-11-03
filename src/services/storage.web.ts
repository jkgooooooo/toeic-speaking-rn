const fallback = new Map<string, string>();

function storage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

const webStorage = {
  async getItem(key: string): Promise<string | null> { return storage()?.getItem(key) ?? fallback.get(key) ?? null; },
  async setItem(key: string, value: string): Promise<void> {
    const current = storage();
    if (current) current.setItem(key, value); else fallback.set(key, value);
  },
  async removeItem(key: string): Promise<void> { storage()?.removeItem(key); fallback.delete(key); },
  async getAllKeys(): Promise<string[]> {
    const current = storage();
    return current ? Array.from({ length: current.length }, (_, index) => current.key(index)).filter((key): key is string => key !== null) : [...fallback.keys()];
  },
};

export default webStorage;
