export const WEIGHTS = Object.freeze({ homework: 30, tests: 50, total: 80 });

export class GradeInputError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'GradeInputError';
    this.field = field;
  }
}

function requireNumber(value, field, label, { min = 0, max = Infinity, positive = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new GradeInputError(`Enter ${label}.`, field);
  }
  if (positive ? value <= 0 : value < min) {
    throw new GradeInputError(positive ? 'Enter a point total greater than zero.' : `Enter ${label} of ${min} or more.`, field);
  }
  if (value > max) {
    throw new GradeInputError(`Enter ${label} of ${max} or less.`, field);
  }
}

/** Invert the 30/50 category weighting. Inputs use percentages and raw test points. */
export function calculateGrade({ overall, homework, tests = [], latestPossible }) {
  requireNumber(overall, 'overall', 'an overall percentage', { max: 100 });
  requireNumber(homework, 'homework', 'homework points', { max: WEIGHTS.homework });
  requireNumber(latestPossible, 'latest', 'the latest test’s total points', { positive: true });
  let pastEarned = 0;
  let pastPossible = 0;
  for (const [index, test] of tests.entries()) {
    const key = test.id ?? index;
    requireNumber(test.possible, `test-${key}-possible`, 'the past test’s total points', { positive: true });
    requireNumber(test.earned, `test-${key}-earned`, 'points earned', { max: test.possible });
    pastEarned += test.earned;
    pastPossible += test.possible;
  }
  const weightedTotal = overall / 100 * WEIGHTS.total;
  const testAverage = (weightedTotal - homework) / WEIGHTS.tests;
  const allPossible = pastPossible + latestPossible;
  const rawEarned = testAverage * allPossible - pastEarned;
  if (![pastEarned, allPossible, rawEarned].every(Number.isFinite)) {
    throw new GradeInputError('These point totals are too large. Check for an extra digit.', 'latest');
  }
  const epsilon = 1e-8;
  if (rawEarned < -epsilon || rawEarned > latestPossible + epsilon) {
    throw new GradeInputError(`These numbers imply ${rawEarned.toFixed(2)} out of ${latestPossible} points, outside the test’s possible range. Check your overall grade, weighted homework points, and all past tests. Your overall grade must already include the latest test.`, 'form');
  }
  const earned = Math.min(latestPossible, Math.max(0, rawEarned));
  return { earned, percent: earned / latestPossible * 100, weightedTotal, testAverage, pastEarned, pastPossible, allPossible, homework, latestPossible };
}
