// ============================================================
// labd.js — client for the labd chat API.
//
// This module is server-side only. LABD_API_KEY never leaves the
// backend: the browser talks to /api/analyze, and this file is the
// only thing that holds the key.
// ============================================================

import { extractJson, clampScore, cleanNames, truncate } from '../../utils.js';

const LABD_URL = 'https://agent.thedevlabs.io/v1/api/chat';
const TIMEOUT_MS = 60_000;
const MAX_CHARS = 12_000;

// The API takes a plain messages array with no system role, so the
// instructions ride along in the single user message.
function buildPrompt(resumeText, jdText) {
  const jd = truncate(jdText, MAX_CHARS).trim();
  const resume = truncate(resumeText, MAX_CHARS).trim();

  const jdSection = jd
    ? `JOB DESCRIPTION:\n"""\n${jd}\n"""`
    : 'JOB DESCRIPTION: (none supplied — judge the resume against what a ' +
      'typical software role expects.)';

  return `You are screening a resume against a job description.

Reply with ONLY a JSON object — no prose before or after, no code fence — in exactly this shape:

{
  "score": <integer 0-100, how well the resume matches the job description>,
  "present": [<skills the job description asks for that the resume shows>],
  "missing": [<skills the job description asks for that the resume does not show>],
  "summary": "<two sentences of direct feedback for the candidate>"
}

Rules: "present" and "missing" are flat arrays of short skill names. Every
skill the job description asks for belongs in exactly one of them. Base the
score on how many of those are present, weighted by how important they look.

${jdSection}

RESUME:
"""
${resume}
"""`;
}

// A human-readable reason for the status codes labd documents.
function describeStatus(status) {
  switch (status) {
    case 401: return 'the API key is wrong or revoked';
    case 402: return 'the monthly allowance is used up';
    case 403: return 'the API is switched off';
    case 429: return 'rate limited — too many requests this minute';
    default:  return `unexpected status ${status}`;
  }
}

export function labdConfigured() {
  return Boolean(process.env.LABD_API_KEY);
}

// Returns { score, present, missing, total, summary, percentLeft }.
// Throws on anything the caller should fall back from — the route
// catches that and uses the keyword matcher instead.
export async function analyzeResumeWithLabd(resumeText, jdText = '') {
  const apiKey = process.env.LABD_API_KEY;
  if (!apiKey) throw new Error('LABD_API_KEY is not set');

  let res;
  try {
    res = await fetch(LABD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildPrompt(resumeText, jdText) }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err.name === 'TimeoutError' ? 'timed out' : err.message;
    throw new Error(`labd: request failed — ${reason}`);
  }

  if (!res.ok) {
    throw new Error(`labd: ${describeStatus(res.status)}`);
  }

  const { message, credits } = await res.json();
  const parsed = extractJson(message?.content);
  if (!parsed) throw new Error('labd: reply did not contain JSON');

  const present = cleanNames(parsed.present);
  const missing = cleanNames(parsed.missing);
  const total = present.length + missing.length;

  // Trust the model's score, but recompute if it gave something unusable —
  // and never divide by zero when the model returned no skills at all.
  const score =
    clampScore(parsed.score) ??
    (total === 0 ? 0 : Math.round((present.length / total) * 100));

  return {
    score,
    present,
    missing,
    total,
    summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    percentLeft: credits?.percentLeft ?? null,
  };
}
