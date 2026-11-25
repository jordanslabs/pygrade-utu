import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSusScore, SUS_QUESTIONS } from './susCalculator';

test('SUS has exactly 10 standard questions', () => {
  assert.equal(SUS_QUESTIONS.length, 10);
});

test('Perfect positive SUS responses score 100, Grade A, Acceptable', () => {
  const responses: Record<number, number> = {
    1: 5, 2: 1, 3: 5, 4: 1, 5: 5, 6: 1, 7: 5, 8: 1, 9: 5, 10: 1,
  };
  const result = calculateSusScore(responses);
  assert.equal(result.score, 100);
  assert.equal(result.grade, 'A');
  assert.equal(result.isAcceptable, true);
  assert.equal(result.acceptabilityLabel, 'Acceptable');
});

test('Worst SUS responses score 0, Grade F, Not Acceptable', () => {
  const responses: Record<number, number> = {
    1: 1, 2: 5, 3: 1, 4: 5, 5: 1, 6: 5, 7: 1, 8: 5, 9: 1, 10: 5,
  };
  const result = calculateSusScore(responses);
  assert.equal(result.score, 0);
  assert.equal(result.grade, 'F');
  assert.equal(result.isAcceptable, false);
  assert.equal(result.acceptabilityLabel, 'Not Acceptable');
});

test('Threshold boundary around 68 calculates exact formula', () => {
  // Odd items (5 items): score 4 -> (4-1)=3 * 5 = 15
  // Even items (5 items): score 2 -> (5-2)=3 * 5 = 15
  // Total = 30 * 2.5 = 75 -> Grade B, Acceptable
  const responses75: Record<number, number> = {
    1: 4, 2: 2, 3: 4, 4: 2, 5: 4, 6: 2, 7: 4, 8: 2, 9: 4, 10: 2,
  };
  const res75 = calculateSusScore(responses75);
  assert.equal(res75.score, 75);
  assert.equal(res75.grade, 'B');
  assert.equal(res75.isAcceptable, true);

  // Neutral all 3 -> (3-1)*5 + (5-3)*5 = 10 + 10 = 20 * 2.5 = 50 -> Grade F, Not Acceptable
  const responses50: Record<number, number> = {
    1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
  };
  const res50 = calculateSusScore(responses50);
  assert.equal(res50.score, 50);
  assert.equal(res50.isAcceptable, false);
});

test('Throws error if any response is missing', () => {
  assert.throws(() => calculateSusScore({ 1: 5, 2: 1 }), /belum lengkap/);
});
