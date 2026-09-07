function validateMark(mark) {
  const numericMark = Number(mark);
  if (!Number.isFinite(numericMark) || numericMark < 0 || numericMark > 100) {
    throw new Error('Each mark must be a number from 0 to 100.');
  }
  return numericMark;
}

function gradeFor(average) {
  if (average >= 80) return 'A';
  if (average >= 70) return 'B';
  if (average >= 60) return 'C';
  if (average >= 50) return 'D';
  return 'F';
}

function calculateResult(student, subjectMarks) {
  if (!Array.isArray(subjectMarks) || subjectMarks.length === 0) {
    throw new Error('No subject marks found for this student.');
  }

  let total = 0;
  let highest = { subject: '', mark: -Infinity };
  let lowest = { subject: '', mark: Infinity };
  const subjects = subjectMarks.map((entry) => {
    const mark = validateMark(entry.mark);
    total += mark;
    if (mark > highest.mark) highest = { subject: entry.subject, mark };
    if (mark < lowest.mark) lowest = { subject: entry.subject, mark };
    return { subject: entry.subject, mark };
  });

  const average = total / subjects.length;
  const percentage = (total / (subjects.length * 100)) * 100;
  const passed = subjects.every((entry) => entry.mark >= 40);

  return {
    student,
    subjects,
    total,
    average: Number(average.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
    grade: gradeFor(average),
    status: passed ? 'PASS' : 'FAIL',
    highest,
    lowest
  };
}

function calculateClassSummary(results) {
  if (results.length === 0) {
    return {
      totalStudents: 0,
      passedStudents: 0,
      failedStudents: 0,
      highestScorer: null,
      averageClassPercentage: 0
    };
  }

  let passedStudents = 0;
  let highestScorer = results[0];
  let percentageTotal = 0;
  for (const result of results) {
    if (result.status === 'PASS') passedStudents += 1;
    if (result.percentage > highestScorer.percentage) highestScorer = result;
    percentageTotal += result.percentage;
  }

  return {
    totalStudents: results.length,
    passedStudents,
    failedStudents: results.length - passedStudents,
    highestScorer: {
      student: highestScorer.student,
      percentage: highestScorer.percentage,
      total: highestScorer.total
    },
    averageClassPercentage: Number((percentageTotal / results.length).toFixed(2))
  };
}

module.exports = { calculateResult, calculateClassSummary, validateMark };