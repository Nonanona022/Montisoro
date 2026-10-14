'use strict';

const engine = require('../website/services/verzuim-engine.js');
const createTests = require('../website/services/verzuim-engine.spec.js');

function format(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`verwacht ${format(actual)} === ${format(expected)}`);
      }
    },
    close(expected, tolerance) {
      const allowedDifference = tolerance == null ? 0.01 : tolerance;
      if (Math.abs(actual - expected) > allowedDifference) {
        throw new Error(
          `verwacht ${format(actual)} ≈ ${format(expected)} (±${allowedDifference})`
        );
      }
    },
    truthy() {
      if (!actual) {
        throw new Error(`verwacht waarheidswaarde, kreeg ${format(actual)}`);
      }
    },
    match(pattern) {
      if (!pattern.test(String(actual))) {
        throw new Error(`verwacht dat ${format(actual)} voldoet aan ${pattern}`);
      }
    },
    less(expected) {
      if (!(actual < expected)) {
        throw new Error(`verwacht ${format(actual)} < ${format(expected)}`);
      }
    },
    greater(expected) {
      if (!(actual > expected)) {
        throw new Error(`verwacht ${format(actual)} > ${format(expected)}`);
      }
    },
    notNaN() {
      if (typeof actual === 'number' && Number.isNaN(actual)) {
        throw new Error('waarde is NaN');
      }
    }
  };
}

let passed = 0;
let failed = 0;

try {
  const tests = createTests(engine, expect);

  for (const [name, test] of tests) {
    try {
      test();
      passed += 1;
      console.log(`✓ ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`✕ ${name}`);
      console.error(`  ${error.message || String(error)}`);
    }
  }
} catch (error) {
  failed += 1;
  console.error('✕ De verzuim-engine-tests konden niet worden geladen.');
  console.error(`  ${error.stack || error.message || String(error)}`);
}

console.log(`\n${passed} geslaagd, ${failed} gefaald`);

if (failed > 0) process.exitCode = 1;
