const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = path.join(__dirname, '../src/features/feedback/demo.ts');
const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleObject = { exports: {} };
vm.runInNewContext(js, { module: moduleObject, exports: moduleObject.exports, setTimeout, Promise });
const { demoParts, demoProvider } = moduleObject.exports;

(async () => {
  for (const part of ['reading', 'photo', 'short', 'table', 'opinion']) {
    const cases = demoParts[part].cases;
    for (const id of ['good', 'error', 'uncertain']) assert.ok(cases.some(item => item.id === id), `${part}: ${id}`);
    for (const item of cases) {
      if (item.evidence) assert.ok(item.transcript.includes(item.evidence), `${part}: evidence ${item.id}`);
      if (item.table && item.id === 'good') {
        assert.ok(item.transcript.includes(item.table.time));
        assert.ok(item.transcript.includes(item.table.place));
      }
    }
    const good = cases.find(item => item.id === 'good');
    const result = await demoProvider.evaluate({ part, caseId: good.id, transcript: good.transcript });
    assert.equal(result.uncertain, false);
  }
  const changed = await demoProvider.evaluate({ part: 'short', caseId: 'error', transcript: 'A different answer.' });
  assert.equal(changed.uncertain, true);
  assert.equal(changed.correction, undefined);
  for (const id of ['missing', 'offtopic', 'uncertain']) assert.ok(demoParts.short.cases.some(item => item.id === id));
  console.log('Feedback examples verified for five parts, evidence, table values and edited transcripts.');
})().catch(error => { console.error(error); process.exitCode = 1; });
