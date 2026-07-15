// ===========================================================================
// Adaptive Motion Gym — optional local AI Coach server
// ---------------------------------------------------------------------------
// A tiny, dependency-free Node server that lets the browser app use the
// GitHub Copilot CLI for OPTIONAL, supplementary coaching text. The core app
// works fully without this server (the deterministic engine is primary).
//
// Why a server? A browser cannot invoke a CLI directly. This bridges the two.
//
// SAFETY:
//  - Binds to 127.0.0.1 only (never exposed to the network).
//  - The user prompt is passed to the CLI via an ENV VAR, never interpolated
//    into a shell string, so command injection is not possible.
//  - The model is used ONLY for encouraging, non-medical narrative text. It is
//    never used to make safety decisions — those stay in the deterministic
//    engine and are validated there.
//  - Each call consumes Copilot AI Credits, so it is an explicit user action.
//
// Run with:  npm run ai-server
// ===========================================================================

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.AMG_AI_PORT ?? 8787);
const HOST = '127.0.0.1';
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
]);
// On Windows we drive the CLI through PowerShell so we can pass the prompt as a
// single, un-parsed argument via $env:. Override with AMG_AI_SHELL if needed.
const SHELL = process.env.AMG_AI_SHELL ?? (process.platform === 'win32' ? 'pwsh' : 'bash');
const CALL_TIMEOUT_MS = 90_000;

function sanitizeCliOutput(raw) {
  return raw
    // strip ANSI escape codes just in case
    .replace(/\u001b\[[0-9;]*m/g, '')
    .split('\n')
    // drop the CLI usage footer lines
    .filter((line) => !/^(Changes|AI Credits|Tokens|Total duration)\b/.test(line.trim()))
    .join('\n')
    .trim();
}

function runCopilot(prompt) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, AMG_PROMPT: prompt };
    const flags = '--no-color --log-level none --no-custom-instructions';
    const args =
      process.platform === 'win32'
        ? ['-NoProfile', '-Command', `copilot -p $env:AMG_PROMPT ${flags}`]
        : ['-c', `copilot -p "$AMG_PROMPT" ${flags}`];

    let child;
    try {
      child = spawn(SHELL, args, { env });
    } catch (err) {
      reject(err);
      return;
    }

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Copilot CLI timed out.'));
    }, CALL_TIMEOUT_MS);

    child.stdout.on('data', (d) => {
      stdout += d.toString();
      if (stdout.length > 200_000) child.kill();
    });
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const text = sanitizeCliOutput(stdout);
      if (text) resolve(text);
      else reject(new Error(stderr.trim() || `Copilot CLI exited with code ${code}.`));
    });
  });
}

function buildPrompt(payload) {
  const p = payload && typeof payload === 'object' ? payload : {};
  const safe = (v) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, 400);
  const list = (v) => (Array.isArray(v) ? v.map(safe).join(', ') : safe(v));

  return [
    'You are an inclusive, body-neutral movement coach for an accessibility-first',
    'fitness app called Adaptive Motion Gym. Write a short, warm, encouraging note',
    '(2 short paragraphs, max ~90 words total) for this user about the adapted',
    'routine below. Then add 2 brief, practical tips as a plain bulleted list.',
    '',
    'STRICT RULES: Do NOT give medical advice, diagnoses, or rehabilitation claims.',
    'Do NOT guarantee safety. Do NOT mention weight loss, calories, body appearance,',
    'or shame-based language. Use respectful, disability-inclusive, trauma-aware tone.',
    'Output plain text only (no markdown headings, no code blocks).',
    '',
    `Routine style: ${safe(p.style)}`,
    `Adaptations: ${list(p.adaptations)}`,
    `Support/equipment: ${list(p.equipment)}`,
    `Goals: ${list(p.goals)}`,
    `Target muscles: ${list(p.targetMuscles)}`,
    `Areas to protect: ${list(p.protect) || 'none specified'}`,
    `Exercises: ${list(p.exercises)}`,
    `Coaching tone preference: ${safe(p.tone)}`,
  ].join('\n');
}

function send(res, status, body, origin) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') return send(res, 204, {}, origin);
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true }, origin);

  if (req.method !== 'POST' || req.url !== '/api/ai-coach') {
    return send(res, 404, { error: 'Not found' }, origin);
  }

  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 50_000) req.destroy();
  });
  req.on('end', async () => {
    let payload;
    try {
      payload = JSON.parse(raw || '{}');
    } catch {
      return send(res, 400, { error: 'Invalid JSON body.' }, origin);
    }
    try {
      const text = await runCopilot(buildPrompt(payload));
      send(res, 200, { text }, origin);
    } catch (err) {
      send(res, 503, { error: `AI coach unavailable: ${err.message}` }, origin);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\nAdaptive Motion Gym — AI Coach server`);
  console.log(`  Listening on http://${HOST}:${PORT}`);
  console.log(`  Shell: ${SHELL}  |  Health: http://${HOST}:${PORT}/health`);
  console.log(`  Note: each request uses the GitHub Copilot CLI and consumes AI Credits.\n`);
});
