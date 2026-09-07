const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateResult, calculateClassSummary, validateMark } = require('../src/resultService');

test('calculates subject-wise and overall result', () => {
  const result = calculateResult({ id: 1, name: 'Asha' }, [
    { subject: 'Maths', mark: 90 },
    { subject: 'Science', mark: 70 },
    { subject: 'English', mark: 80 }
  ]);
  assert.deepEqual(result.subjects[0], { subject: 'Maths', mark: 90 });
  assert.equal(result.total, 240);
  assert.equal(result.average, 80);
  assert.equal(result.percentage, 80);
  assert.equal(result.grade, 'A');
  assert.equal(result.status, 'PASS');
  assert.deepEqual(result.highest, { subject: 'Maths', mark: 90 });
  assert.deepEqual(result.lowest, { subject: 'Science', mark: 70 });
});

test('fails a student when any subject is below 40', () => {
  const result = calculateResult({ id: 2, name: 'Ben' }, [{ subject: 'Maths', mark: 95 }, { subject: 'Science', mark: 39 }]);
  assert.equal(result.status, 'FAIL');
  assert.equal(result.grade, 'C');
});

test('rejects invalid marks and missing marks', () => {
  assert.throws(() => validateMark(101), /0 to 100/);
  assert.throws(() => calculateResult({ id: 1 }, []), /No subject marks/);
});

test('calculates class summary', () => {
  const results = [
    calculateResult({ id: 1, name: 'Asha' }, [{ subject: 'Maths', mark: 90 }]),
    calculateResult({ id: 2, name: 'Ben' }, [{ subject: 'Maths', mark: 35 }])
  ];
  assert.deepEqual(calculateClassSummary(results), {
    totalStudents: 2,
    passedStudents: 1,
    failedStudents: 1,
    highestScorer: { student: { id: 1, name: 'Asha' }, percentage: 90, total: 90 },
    averageClassPercentage: 62.5
  });
});