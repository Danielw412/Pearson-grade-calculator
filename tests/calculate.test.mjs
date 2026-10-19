import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGrade, GradeInputError } from '../docs/calculate.mjs';

const example = { overall: 93.25, homework: 30, tests: [{ earned: 84.2, possible: 96 }], latestPossible: 71 };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} should equal ${expected}`);

test('the supplied Pearson example is 64.764/71 or 91.2169%', () => {
  const score = calculateGrade(example);
  close(score.earned, 64.764);
  close(score.percent, 91.2169014084507);
  close(score.weightedTotal, 74.6);
  close(score.testAverage, .892);
});

test('multiple tests use summed points even when tests have different totals', () => {
  // Homework 27, past tests 30/40 + 45/50, latest 60/70.
  const overall = (27 + 50 * 135 / 160) / 80 * 100;
  close(calculateGrade({ overall, homework: 27, tests: [{ earned: 30, possible: 40 }, { earned: 45, possible: 50 }], latestPossible: 70 }).earned, 60);
});

test('a first test needs no previous scores', () => {
  const score = calculateGrade({ overall: 87.5, homework: 30, latestPossible: 75 });
  close(score.earned, 60);
  close(score.percent, 80);
});

test('zero points, fractional points, and full marks remain valid', () => {
  close(calculateGrade({ overall: 0, homework: 0, latestPossible: 100 }).earned, 0);
  close(calculateGrade({ overall: 100, homework: 30, latestPossible: 71 }).earned, 71);
  close(calculateGrade({ overall: 100, homework: 30, latestPossible: .5 }).earned, .5);
  close(calculateGrade({ overall: 37.5, homework: 30, latestPossible: 71 }).earned, 0);
});

test('missing, nonnumeric, infinite, and out-of-range inputs are rejected', () => {
  for (const changes of [{ overall: NaN }, { overall: '' }, { overall: -1 }, { overall: 101 }, { homework: NaN }, { homework: 31 }, { homework: -1 }, { latestPossible: NaN }, { latestPossible: 0 }, { latestPossible: -1 }, { latestPossible: Infinity }, { latestPossible: 7100 }]) {
    assert.throws(() => calculateGrade({ ...example, ...changes }), GradeInputError);
  }
});

test('a partially entered past test is an error, not a silently omitted score', () => {
  for (const past of [{ earned: 30, possible: NaN }, { earned: NaN, possible: 40 }, { earned: -1, possible: 40 }, { earned: 41, possible: 40 }, { earned: 0, possible: 0 }, { earned: 84.2, possible: 9600 }]) {
    assert.throws(() => calculateGrade({ ...example, tests: [past] }), GradeInputError);
  }
});

test('contradictory values never display a negative or over-100 score', () => {
  assert.throws(() => calculateGrade({ ...example, overall: 40 }), (error) => error.field === 'form');
  assert.throws(() => calculateGrade({ ...example, overall: 100 }), (error) => error.field === 'form');
});

test('forward-computed grades recover known scores across a range of inputs', () => {
  for (let i = 0; i <= 100; i++) {
    const homework = i % 31;
    const latestPossible = i + 1;
    const earned = latestPossible * i / 100;
    const tests = [{ earned: i * .7, possible: i + 5 }, { earned: i * .2, possible: i + 7 }];
    const overall = (homework + 50 * (tests[0].earned + tests[1].earned + earned) / (tests[0].possible + tests[1].possible + latestPossible)) / 80 * 100;
    close(calculateGrade({ overall, homework, tests, latestPossible }).earned, earned);
  }
});

test('homework that contradicts the overall grade points at the likely field', () => {
  // 30 homework points alone are 37.5% overall.
  assert.throws(() => calculateGrade({ ...example, overall: 9.3 }), (error) => error.field === 'overall' && /37\.5%/.test(error.message));
  // A 93.25% overall needs at least 24.6 homework points.
  assert.throws(() => calculateGrade({ ...example, homework: 3 }), (error) => error.field === 'homework' && /at least 24\.6 homework points/.test(error.message));
});

test('an overall grade outside what past tests allow reports the possible range', () => {
  assert.throws(() => calculateGrade({ ...example, overall: 60 }), (error) => error.field === 'form' && /from 69\.01% \(zero.*to 95\.58% \(full marks\).*you entered 60%/.test(error.message));
  assert.throws(() => calculateGrade({ ...example, overall: 97 }), (error) => error.field === 'form' && /you entered 97%/.test(error.message));
});

test('Pearson’s two-decimal rounding does not reject a perfect or zero latest score', () => {
  const tests = [{ earned: 84.2, possible: 96 }];
  for (const earned of [0, 71]) {
    const exact = (30 + 50 * (84.2 + earned) / 167) / 80 * 100;
    for (const overall of [Math.floor(exact * 100) / 100, Math.ceil(exact * 100) / 100]) {
      assert.ok(Math.abs(calculateGrade({ overall, homework: 30, tests, latestPossible: 71 }).earned - earned) < .05);
    }
  }
});
