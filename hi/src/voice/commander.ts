/**
 * Voice Commander 2.0 — grammar + fuzzy matcher.
 *
 * `matchCommand(text)` is a pure function: no React, no DOM, no globals.
 * Pipeline: exact → phrase-contains → prefix → fuzzy (token overlap with
 * Levenshtein ≤ 2 on keywords). Returns null below the confidence threshold
 * so ambiguous mumbles never trigger actions.
 *
 * i18n seam: pass a locale-specific table (`matchCommand(text, table)`); see
 * `buildIntentTable` in intents.ts.
 */

import {
  INTENT_TABLE,
  type IntentDef,
  type VoiceIntent,
} from './intents';

/** Minimum confidence to accept a fuzzy match. Below this → null (disambiguation). */
export const FUZZY_THRESHOLD = 0.6;

// ── Normalization ────────────────────────────────────────────────────────────

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): string[] {
  const n = normalize(text);
  return n ? n.split(' ') : [];
}

// ── Levenshtein (bounded — early exit past maxDist) ──────────────────────────

export function levenshtein(a: string, b: string, maxDist = 2): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > maxDist) return maxDist + 1;
  if (la === 0) return lb;
  if (lb === 0) return la;

  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDist) return maxDist + 1; // bounded early exit
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/** Fuzzy token equality: exact, or Levenshtein ≤ 2 for longer words (≤ 1 for short). */
function tokenEq(a: string, b: string): boolean {
  if (a === b) return true;
  const limit = Math.min(a.length, b.length) >= 4 ? 2 : 1;
  return levenshtein(a, b, limit) <= limit;
}

// ── Match stages ─────────────────────────────────────────────────────────────

interface Candidate {
  def: IntentDef;
  matched: string;
  confidence: number;
}

function bestOf(candidates: Candidate[]): Candidate | null {
  if (candidates.length === 0) return null;
  candidates.sort((x, y) =>
    y.confidence - x.confidence ||
    y.def.priority - x.def.priority ||
    y.matched.length - x.matched.length,
  );
  const top = candidates[0];
  // Disambiguation: if two *different* intent types tie at the top and neither
  // is a confident exact/phrase hit, refuse to guess.
  const tied = candidates.filter(
    (c) => c.confidence === top.confidence && c.def.priority === top.def.priority,
  );
  const distinctTypes = new Set(tied.map((c) => c.def.type));
  if (distinctTypes.size > 1 && top.confidence < 0.9) return null;
  return top;
}

/**
 * Match a raw transcript against the intent table.
 *
 * @param text  Raw ASR transcript.
 * @param table Intent table — defaults to English INTENT_TABLE (i18n seam).
 * @returns The winning VoiceIntent, or null when nothing clears the threshold.
 */
export function matchCommand(
  text: string,
  table: IntentDef[] = INTENT_TABLE,
): VoiceIntent | null {
  const input = normalize(text);
  if (!input) return null;
  const inputTokens = input.split(' ');

  // Stage 1 — exact phrase equality (confidence 1.0)
  const exact: Candidate[] = [];
  for (const def of table) {
    for (const p of def.patterns) {
      if (input === normalize(p)) exact.push({ def, matched: p, confidence: 1 });
    }
  }
  const exactHit = bestOf(exact);
  if (exactHit) return toIntent(exactHit);

  // Stage 2 — phrase contained in transcript (confidence 0.85–0.9, longer = better)
  const contained: Candidate[] = [];
  for (const def of table) {
    for (const p of def.patterns) {
      const np = normalize(p);
      if (np.length >= 3 && containsPhrase(input, np)) {
        // Slightly higher confidence for longer (more specific) phrases.
        const confidence = Math.min(0.9, 0.85 + np.length / 200);
        contained.push({ def, matched: p, confidence });
      }
    }
  }
  const containedHit = bestOf(contained);
  if (containedHit) return toIntent(containedHit);

  // Stage 3 — prefix match, either direction (confidence 0.8)
  const prefix: Candidate[] = [];
  for (const def of table) {
    for (const p of def.patterns) {
      const np = normalize(p);
      if (np.length < 3) continue;
      if (input.startsWith(np) || (input.length >= 3 && np.startsWith(input))) {
        prefix.push({ def, matched: p, confidence: 0.8 });
      }
    }
  }
  const prefixHit = bestOf(prefix);
  if (prefixHit) return toIntent(prefixHit);

  // Stage 4 — fuzzy: keyword token-overlap with bounded Levenshtein (≤ 0.79)
  // Score blends both directions: how many of the intent's keywords were hit
  // AND how many of the spoken words matched a keyword. Blending keeps a
  // two-word command like "strat workout" (both tokens match) above threshold
  // even when the intent has many keywords, while single generic words stay out.
  const fuzzy: Candidate[] = [];
  for (const def of table) {
    if (def.keywords.length === 0) continue;
    let hits = 0;
    for (const kw of def.keywords) {
      if (inputTokens.some((t) => tokenEq(t, kw))) hits++;
    }
    if (hits === 0) continue;
    const kwCoverage = hits / def.keywords.length;
    // A lone word must be a *specific* keyword (small keyword set) — otherwise
    // "workout" would fire session.start instead of falling back to navigation.
    if (inputTokens.length === 1 && kwCoverage < 0.3) continue;
    const inputHits = inputTokens.filter((t) =>
      def.keywords.some((kw) => tokenEq(t, kw)),
    ).length;
    const inputCoverage = inputHits / inputTokens.length;
    const score = 0.55 * inputCoverage + 0.45 * kwCoverage;
    if (score >= FUZZY_THRESHOLD) {
      fuzzy.push({ def, matched: def.keywords[0], confidence: Math.min(0.79, score) });
    }
  }
  const fuzzyHit = bestOf(fuzzy);
  return fuzzyHit ? toIntent(fuzzyHit) : null;
}

function toIntent(c: Candidate): VoiceIntent {
  return {
    type: c.def.type,
    section: c.def.section,
    label: c.def.label,
    matched: c.matched,
    confidence: Math.round(c.confidence * 100) / 100,
  };
}

/** Word-boundary-aware substring check ("pain" must not match inside "paint"). */
function containsPhrase(input: string, phrase: string): boolean {
  let idx = input.indexOf(phrase);
  while (idx !== -1) {
    const before = idx === 0 ? ' ' : input[idx - 1];
    const afterIdx = idx + phrase.length;
    const after = afterIdx >= input.length ? ' ' : input[afterIdx];
    if (before === ' ' && after === ' ') return true;
    idx = input.indexOf(phrase, idx + 1);
  }
  return false;
}

/**
 * Convenience for the help overlay / spoken help: group the table into
 * labelled categories. Pure — safe to call anywhere.
 */
export function describeCommands(table: IntentDef[] = INTENT_TABLE): {
  category: string;
  commands: { description: string; examples: string[] }[];
}[] {
  const pick = (types: string[]) =>
    table
      .filter((d) => types.includes(d.type))
      .map((d) => ({ description: d.description, examples: d.examples }));
  return [
    { category: 'Workout session', commands: pick(['session.start', 'session.pause', 'session.stop', 'session.next', 'session.repeat']) },
    { category: 'Logging', commands: pick(['log.water', 'log.pain']) },
    { category: 'General', commands: pick(['system.help', 'system.back', 'system.stopListening']) },
    {
      category: 'Navigation',
      commands: table
        .filter((d) => d.type === 'navigate')
        .map((d) => ({ description: d.description, examples: d.examples })),
    },
  ];
}
