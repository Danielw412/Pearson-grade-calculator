export const WEIGHTS = Object.freeze({ homework: 30, tests: 50, total: 80 });
// A test worth more than this is almost certainly a typo, such as an extra digit.
export const MAX_TEST_POINTS = 1000;
// Pearson shows the overall percentage and homework points rounded to two decimals.
const ROUNDING_SLACK = 0.005 + 0.005 / WEIGHTS.total * 100;

export class GradeInputError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'GradeInputError';
    this.field = field;
  }
}

function requireNumber(value, field, label, { min = 0, max = Infinity, positive = false, tooHigh } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new GradeInputError(`Enter ${label}.`, field);
  }
  if (positive ? value <= 0 : value < min) {
    throw new GradeInputError(positive ? 'Enter a point total greater than zero.' : `Enter ${label} of ${min} or more.`, field);
  }
  if (value > max) {
    throw new GradeInputError(tooHigh ?? `Enter ${label} of ${max} or less.`, field);
  }
}

const tooManyPoints = `That’s over ${MAX_TEST_POINTS} points. Check for an extra digit.`;
const percent = (value) => `${+value.toFixed(2)}%`;

/** Invert the 30/50 category weighting. Inputs use percentages and raw test points. */
export function calculateGrade({ overall, homework, tests = [], latestPossible }) {
  requireNumber(overall, 'overall', 'an overall percentage', { max: 100 });
  requireNumber(homework, 'homework', 'homework points', { max: WEIGHTS.homework, tooHigh: 'Homework points are out of 30. Use Points Earned, not the Category Score.' });
  requireNumber(latestPossible, 'latest', 'the latest test’s total points', { positive: true, max: MAX_TEST_POINTS, tooHigh: tooManyPoints });
  let pastEarned = 0;
  let pastPossible = 0;
  for (const [index, test] of tests.entries()) {
    const key = test.id ?? index;
    requireNumber(test.possible, `test-${key}-possible`, 'the past test’s total points', { positive: true, max: MAX_TEST_POINTS, tooHigh: tooManyPoints });
    requireNumber(test.earned, `test-${key}-earned`, 'points earned', { max: test.possible, tooHigh: 'Points earned can’t be more than the test’s total.' });
    pastEarned += test.earned;
    pastPossible += test.possible;
  }
  const overallFor = (testAverage) => (homework + testAverage * WEIGHTS.tests) / WEIGHTS.total * 100;
  // Homework alone fixes the lowest and highest possible overall grade.
  if (overall < overallFor(0) - ROUNDING_SLACK) {
    throw new GradeInputError(`${homework} homework points alone make a ${percent(overallFor(0))} overall grade, so yours can’t be lower. Check your overall grade and homework points.`, 'overall');
  }
  if (overall > overallFor(1) + ROUNDING_SLACK) {
    throw new GradeInputError(`An overall grade of ${percent(overall)} needs at least ${+(overall / 100 * WEIGHTS.total - WEIGHTS.tests).toFixed(2)} homework points, even with perfect tests. Check your homework points and overall grade.`, 'homework');
  }
  // Past tests narrow the range further: the latest test scores between zero and full marks.
  const allPossible = pastPossible + latestPossible;
  const lowest = overallFor(pastEarned / allPossible);
  const highest = overallFor((pastEarned + latestPossible) / allPossible);
  if (overall < lowest - ROUNDING_SLACK || overall > highest + ROUNDING_SLACK) {
    throw new GradeInputError(`Your homework and past tests allow an overall grade from ${percent(lowest)} (zero on the latest test) to ${percent(highest)} (full marks), but you entered ${percent(overall)}. Check your past tests and the latest test’s total. Your overall grade must already include the latest test.`, 'form');
  }
  const weightedTotal = overall / 100 * WEIGHTS.total;
  const testAverage = (weightedTotal - homework) / WEIGHTS.tests;
  const rawEarned = testAverage * allPossible - pastEarned;
  const earned = Math.min(latestPossible, Math.max(0, rawEarned));
  return { earned, percent: earned / latestPossible * 100, weightedTotal, testAverage, pastEarned, pastPossible, allPossible, homework, latestPossible };
}
