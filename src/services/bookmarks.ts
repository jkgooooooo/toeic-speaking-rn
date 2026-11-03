import Storage from '@/services/storage';

const prefix = 'speaking.bookmark.v1:';

export async function isBookmarked(questionId: string) {
  return (await Storage.getItem(prefix + questionId)) === '1';
}

export async function setBookmarked(questionId: string, selected: boolean) {
  if (selected) await Storage.setItem(prefix + questionId, '1');
  else await Storage.removeItem(prefix + questionId);
}

export async function listBookmarkedIds() {
  return (await Storage.getAllKeys()).filter(key => key.startsWith(prefix)).map(key => key.slice(prefix.length));
}
