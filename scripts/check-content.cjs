const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function loadTs(relative, dependencies = {}) {
  const file = path.join(root, relative);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: name => {
    if (name in dependencies) return dependencies[name];
    if (name.endsWith('.png') || name.endsWith('.jpg')) { assert.ok(fs.existsSync(path.resolve(path.dirname(file), name)), `Missing image ${name}`); return name; }
    throw new Error(`Unexpected import ${name} in ${relative}`);
  }, console, JSON, Error, Set, Map }, { filename: file });
  return module.exports;
}

const daily = loadTs('src/content/daily.ts');
const partPractice = loadTs('src/content/part-practice.ts');
const mock = loadTs('src/content/mock.ts', { './part-practice': partPractice });
const samples = loadTs('src/content/sample-answers.ts', { './daily': daily, './mock': mock, './part-practice': partPractice });
const times = [[45,45],[45,45],[45,30],[45,30],[3,15],[3,15],[3,30],[3,15],[3,15],[3,30],[45,60]];
assert.equal(mock.mockSets.length, 3);
const ids = new Set();
const photos = new Set();
for (const set of mock.mockSets) {
  assert.equal(set.questions.length, 11, set.id);
  assert.ok(set.shortContext && set.tableContext && set.schedule.rows.length, set.id);
  set.questions.forEach((q, index) => {
    assert.equal(q.number, index + 1, q.id);
    assert.equal(q.preparationSeconds, times[index][0], q.id);
    assert.equal(q.responseSeconds, times[index][1], q.id);
    assert.ok(q.prompt && samples.sampleAnswer(q.id), q.id);
    assert.ok(!ids.has(q.id), `duplicate ${q.id}`);
    ids.add(q.id);
    if (q.part === 'photo') { assert.ok(q.image && q.imageLabel, q.id); photos.add(q.image); }
    if (q.part === 'table') assert.equal(q.showQuestion, false, q.id);
  });
}
assert.equal(photos.size, 6, 'each set should have distinct photos');
for (const question of daily.dailyPractice.questions) assert.ok(samples.sampleAnswer(question.id), question.id);
assert.equal(partPractice.partPracticeSets.length, 20);
for (const part of ['reading', 'photo', 'short', 'table', 'opinion']) {
  const questions = partPractice.partPracticeSets.flatMap(set => set.questions.filter(q => q.part === part));
  assert.equal(questions.length, 20, `${part} count`);
  assert.equal(new Set(questions.map(q => q.id)).size, 20, `${part} IDs`);
  for (const question of questions) assert.ok(samples.sampleAnswer(question.id), question.id);
  if (part === 'photo') assert.equal(new Set(questions.map(q => q.image)).size, 20, 'distinct practice photos');
}
for (const set of partPractice.partPracticeSets) {
  const q = set.questions.find(question => question.part === 'table');
  const answer = samples.sampleAnswer(q.id);
  assert.ok(answer.includes(set.schedule.rows[0][0]), `${q.id} time`);
  assert.ok(answer.includes(q.number === 9 ? set.schedule.rows[0][2] : set.schedule.rows[1][1]), `${q.id} detail`);
  assert.equal(mock.getMockSet(set.id).id, set.id);
}


(async () => {
  const values = new Map();
  const storage = { getItem: async key => values.get(key) ?? null, setItem: async (key, val) => { values.set(key, val); }, removeItem: async key => { values.delete(key); } };
  let records = [];
  const resume = loadTs('src/features/mock/mock-resume.ts', {
    '@/content/mock': mock, '@/services/storage': { __esModule: true, default: storage },
    '@/services/recordings': { listAnswers: async () => ({ records, unreadable: 0 }) },
  });
  await resume.saveMockSession('mock-123', 'mock2');
  records = [1, 3].map(n => ({ id: `mock-123-mock2-q${n}`, sessionId: 'mock-123', question: { number: n } }));
  let loaded = await resume.loadMockSession();
  assert.equal(loaded.setId, 'mock2');
  assert.equal(loaded.nextIndex, 1);
  assert.equal(loaded.answers.length, 2);
  records = Array.from({ length: 11 }, (_, index) => ({ id: `mock-123-mock2-q${index + 1}`, sessionId: 'mock-123', question: { number: index + 1 } }));
  loaded = await resume.loadMockSession();
  assert.equal(loaded.nextIndex, 11);
  values.set('speaking.mock.resume.v1', JSON.stringify({ version: 1, sessionId: 'mock-123' }));
  records = [];
  loaded = await resume.loadMockSession();
  assert.equal(loaded.setId, 'mock1');
  await resume.clearMockSession();
  assert.equal(await resume.loadMockSession(), null);
  const bookmarks = loadTs('src/services/bookmarks.ts', { '@/services/storage': { __esModule: true, default: { ...storage, getAllKeys: async () => [...values.keys()] } } });
  await bookmarks.setBookmarked('mock2-q5', true);
  assert.equal(await bookmarks.isBookmarked('mock2-q5'), true);
  assert.equal((await bookmarks.listBookmarkedIds()).join(','), 'mock2-q5');
  await bookmarks.setBookmarked('mock2-q5', false);
  assert.equal(await bookmarks.isBookmarked('mock2-q5'), false);
  console.log('Content and resume checks passed: 3 mock sets, 100 part questions, sample answers, resume, legacy checkpoint and bookmarks.');
})().catch(error => { console.error(error); process.exitCode = 1; });
