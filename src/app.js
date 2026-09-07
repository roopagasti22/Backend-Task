const express = require('express');
const pool = require('./db');
const { calculateResult, calculateClassSummary, validateMark } = require('./resultService');

const app = express();
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '..', 'public')));

function parseStudentId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Student id must be a positive integer.');
  return id;
}

async function fetchResult(studentId, connection = pool) {
  const [students] = await connection.execute('SELECT id, name, email FROM students WHERE id = ?', [studentId]);
  if (students.length === 0) {
    const error = new Error('Student not found.');
    error.status = 404;
    throw error;
  }
  const [marks] = await connection.execute(
    `SELECT subjects.name AS subject, marks.mark
     FROM marks JOIN subjects ON subjects.id = marks.subject_id
     WHERE marks.student_id = ? ORDER BY subjects.name`,
    [studentId]
  );
  return calculateResult(students[0], marks);
}

app.get('/health', (request, response) => response.json({ status: 'ok' }));

app.post('/api/students', async (request, response, next) => {
  const { name, email, subjects } = request.body;
  if (!name || !Array.isArray(subjects) || subjects.length === 0) {
    return response.status(400).json({ error: 'name and at least one subject mark are required.' });
  }
  const names = subjects.map((entry) => String(entry.name || '').trim());
  if (names.some((subject) => !subject) || new Set(names).size !== names.length) {
    return response.status(400).json({ error: 'Each subject must have a unique name.' });
  }
  try {
    subjects.forEach((entry) => validateMark(entry.mark));
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [student] = await connection.execute('INSERT INTO students (name, email) VALUES (?, ?)', [name.trim(), email || null]);
      for (let index = 0; index < subjects.length; index += 1) {
        const [subject] = await connection.execute('INSERT INTO subjects (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)', [names[index]]);
        await connection.execute('INSERT INTO marks (student_id, subject_id, mark) VALUES (?, ?, ?)', [student.insertId, subject.insertId, Number(subjects[index].mark)]);
      }
      await connection.commit();
      return response.status(201).json(await fetchResult(student.insertId, connection));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/students/:id/result', async (request, response, next) => {
  try {
    response.json(await fetchResult(parseStudentId(request.params.id)));
  } catch (error) {
    next(error);
  }
});

app.get('/api/summary', async (request, response, next) => {
  try {
    const [students] = await pool.execute('SELECT id, name, email FROM students ORDER BY id');
    const results = [];
    for (const student of students) {
      const [marks] = await pool.execute(
        `SELECT subjects.name AS subject, marks.mark FROM marks
         JOIN subjects ON subjects.id = marks.subject_id WHERE marks.student_id = ?`,
        [student.id]
      );
      if (marks.length > 0) results.push(calculateResult(student, marks));
    }
    response.json(calculateClassSummary(results));
  } catch (error) {
    next(error);
  }
});

app.use((error, request, response, next) => {
  if (error.message.includes('must be') || error.message.includes('No subject')) {
    return response.status(400).json({ error: error.message });
  }
  if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'Student email or subject mark already exists.' });
  if (['ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ECONNREFUSED'].includes(error.code)) {
    return response.status(503).json({ error: 'Database unavailable. Check DB_USER, DB_PASSWORD, DB_NAME, and run schema.sql.' });
  }
  response.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error.' });
});

module.exports = app;