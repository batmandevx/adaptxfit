/**
 * Node-runnable tests for the Voice Commander matcher.
 *
 *   node src/voice/commander.test.mjs
 *
 * commander.ts / intents.ts are TypeScript; this harness transpiles them in
 * memory with the project's own `typescript` package and loads them through a
 * tiny CommonJS shim — no build step, no extra dev dependencies.
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const here = dirname(fileURLToPath(import.meta.url));

const moduleCache = new Map();

function loadTs(absPath) {
  const key = resolve(absPath);
  if (moduleCache.has(key)) return moduleCache.get(key).exports;

  const source = readFileSync(key, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: key,
  });

  const mod = { exports: {} };
  moduleCache.set(key, mod); // set early for circular imports

  const localRequire = (spec) => {
    if (spec.startsWith('.')) {
      return loadTs(resolve(dirname(key), `${spec}.ts`));
    }
    return require(spec);
  };

  const fn = new Function('require', 'module', 'exports', '__filename', '__dirname', outputText);
  fn(localRequire, mod, mod.exports, key, dirname(key));
  return mod.exports;
}

const { matchCommand, levenshtein, describeCommands } = loadTs(resolve(here, 'commander.ts'));

// ── tiny assertion harness ───────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok =
    expected === null
      ? actual === null
      : actual !== null &&
        actual.type === expected.type &&
        (expected.section === undefined || actual.section === expected.section);
  if (ok) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failed++;
    console.error(
      `  FAIL  ${name}\n        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

const nav = (section) => ({ type: 'navigate', section });
const act = (type) => ({ type });

console.log('\nmatchCommand — exact & phrased');
check('"start workout"', matchCommand('start workout'), act('session.start'));
check('"please start my workout"', matchCommand('please start my workout'), act('session.start'));
check('"next exercise"', matchCommand('next exercise'), act('session.next'));
check('"repeat that"', matchCommand('repeat that'), act('session.repeat'));
check('"pause"', matchCommand('pause'), act('session.pause'));
check('"stop workout"', matchCommand('stop workout'), act('session.stop'));
check('"I\'m done"', matchCommand("I'm done"), act('session.stop'));
check('"log water"', matchCommand('log water'), act('log.water'));
check('"I drank water"', matchCommand('i drank water'), act('log.water'));
check('"I feel pain"', matchCommand('I feel pain'), act('log.pain'));
check('"it hurts"', matchCommand('it hurts'), act('log.pain'));
check('"help"', matchCommand('help'), act('system.help'));
check('"what can I say"', matchCommand('what can i say'), act('system.help'));
check('"go back"', matchCommand('go back'), act('system.back'));
check('"stop listening"', matchCommand('stop listening'), act('system.stopListening'));

console.log('\nmatchCommand — navigation (existing behavior preserved)');
check('"dashboard"', matchCommand('dashboard'), nav('dashboard'));
check('"go to dashboard"', matchCommand('go to dashboard'), nav('dashboard'));
check('"open live coach"', matchCommand('open live coach'), nav('live-coach'));
check('"breathing"', matchCommand('breathing'), nav('breathing'));
check('"show me the community page"', matchCommand('show me the community page'), nav('community'));
check('"crisis"', matchCommand('crisis'), nav('crisis'));
check('"mind gym"', matchCommand('mind gym'), nav('mind-gym'));

console.log('\nmatchCommand — priority & safety');
check('"pain" routes to log.pain, not navigation', matchCommand('pain'), act('log.pain'));
check('"start exercise" is a session command', matchCommand('start exercise'), act('session.start'));
check('"next" alone', matchCommand('next'), act('session.next'));

console.log('\nmatchCommand — fuzzy (ASR typos, Levenshtein ≤ 2)');
check('"strat workout" (typo)', matchCommand('strat workout'), act('session.start'));
check('"nxt exercise" (typo)', matchCommand('nxt exercise'), act('session.next'));
check('"opn dashboard" (typo)', matchCommand('opn dashboard'), nav('dashboard'));
check('"watr log" → hydration keywords', matchCommand('watr log'), act('log.water'));

console.log('\nmatchCommand — disambiguation returns null');
check('gibberish', matchCommand('flibberty gibbet quantum'), null);
check('empty string', matchCommand(''), null);
check('whitespace only', matchCommand('   '), null);
check('single vague word "thing"', matchCommand('thing'), null);
check('"the and of" (stopwords only)', matchCommand('the and of'), null);

console.log('\nlevenshtein sanity');
const lev = (a, b) => levenshtein(a, b, 2);
check('lev(start, strat) ≤ 2', lev('start', 'strat') <= 2 ? {} : null, {});
check('lev(kitten, sitting) > 2 (bounded)', lev('kitten', 'sitting') > 2 ? {} : null, {});

console.log('\ndescribeCommands');
const groups = describeCommands();
check(
  'four help categories with commands',
  groups.length === 4 && groups.every((g) => g.commands.length > 0) ? {} : null,
  {},
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
