// Temporary smoke test — deleted after running.
import { extractJson, clampScore, cleanNames } from './utils.js';
import { analyzeResumeWithLabd, labdConfigured } from './src/services/labd.js';

let pass = 0;
let fail = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('ok   ', label); }
  else { fail++; console.log('FAIL ', label, '\n  got ', a, '\n  want', e); }
}

// --- utils ---
check('extractJson from a json fence',
  extractJson('```json\n{"score":80}\n```'), { score: 80 });
check('extractJson with preamble',
  extractJson('Sure! {"a":1} hope that helps'), { a: 1 });
check('extractJson on garbage', extractJson('no object here'), null);
check('clampScore above range', clampScore(140), 100);
check('clampScore below range', clampScore(-5), 0);
check('clampScore non-number', clampScore('great'), null);
check('cleanNames trims/dedupes/drops non-strings',
  cleanNames([' React ', 'React', 7, '', 'Go']), ['React', 'Go']);

// --- labd client, with fetch stubbed so no allowance is spent ---
process.env.LABD_API_KEY = 'test-key';
check('labdConfigured sees the key', labdConfigured(), true);

let captured = null;
globalThis.fetch = async (url, opts) => {
  captured = { url, opts };
  return {
    ok: true,
    json: async () => ({
      message: {
        content: 'Here you go:\n```json\n' + JSON.stringify({
          score: 82,
          present: ['React', 'Node.js'],
          missing: ['Go', 'Docker'],
          summary: 'Solid frontend fit, but container experience is thin.',
        }) + '\n```',
      },
      credits: { percentLeft: 41 },
    }),
  };
};

const ai = await analyzeResumeWithLabd('resume text', 'jd text');
check('labd score', ai.score, 82);
check('labd present', ai.present, ['React', 'Node.js']);
check('labd missing', ai.missing, ['Go', 'Docker']);
check('labd total', ai.total, 4);
check('labd percentLeft passed through', ai.percentLeft, 41);
check('labd summary', ai.summary, 'Solid frontend fit, but container experience is thin.');
check('labd hits the right URL', captured.url, 'https://agent.thedevlabs.io/v1/api/chat');
check('labd sends bearer auth',
  captured.opts.headers.Authorization, 'Bearer test-key');
check('labd sends one user message',
  JSON.parse(captured.opts.body).messages.length, 1);

// --- fallbacks: each of these must throw so the route can go keyword-only ---
const expectThrow = async (label, makeResponse) => {
  globalThis.fetch = async () => makeResponse();
  try {
    await analyzeResumeWithLabd('r', 'j');
    fail++; console.log('FAIL ', label, '— expected a throw, got a result');
  } catch (err) {
    pass++; console.log('ok   ', label, '->', err.message);
  }
};

await expectThrow('402 allowance spent', () => ({ ok: false, status: 402 }));
await expectThrow('403 api off', () => ({ ok: false, status: 403 }));
await expectThrow('401 bad key', () => ({ ok: false, status: 401 }));
await expectThrow('prose reply with no JSON', () => ({
  ok: true, json: async () => ({ message: { content: 'I cannot help with that.' } }),
}));
await expectThrow('network failure', () => { throw new Error('ENOTFOUND'); });

// --- score recompute when the model omits a usable score ---
globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({
    message: { content: JSON.stringify({ score: 'n/a', present: ['A'], missing: ['B', 'C'] }) },
    credits: {},
  }),
});
const recomputed = await analyzeResumeWithLabd('r', 'j');
check('score recomputed from present/total', recomputed.score, 33);
check('percentLeft null when absent', recomputed.percentLeft, null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
