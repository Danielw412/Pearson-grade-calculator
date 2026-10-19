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
  for (const changes of [{ overall: NaN }, { overall: '' }, { overall: -1 }, { overall: 101 }, { homework: NaN }, { homework: 31 }, { homework: -1 }, { latestPossible: NaN }, { latestPossible: 0 }, { latestPossible: -1 }, { latestPossible: Infinity }]) {
    assert.throws(() => calculateGrade({ ...example, ...changes }), GradeInputError);
  }
});

test('a partially entered past test is an error, not a silently omitted score', () => {
  for (const past of [{ earned: 30, possible: NaN }, { earned: NaN, possible: 40 }, { earned: -1, possible: 40 }, { earned: 41, possible: 40 }, { earned: 0, possible: 0 }]) {
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
