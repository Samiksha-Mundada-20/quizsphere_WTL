// routes/admin.js - dashboard numbers, all results, CSV export (admin only)
const express = require('express');
const pool = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();
router.use(verifyToken, adminOnly);   // every route below needs a valid admin token

// Shared query: every attempt with student and quiz names
async function getAllResults() {
  const [rows] = await pool.execute(
    `SELECT a.attempt_id, u.name AS student_name, u.email, q.title AS quiz_title, q.passing_percentage,
            a.score, a.total_questions, a.percentage, a.attempted_at
     FROM attempts a
     JOIN users u ON u.user_id = a.user_id
     JOIN quizzes q ON q.quiz_id = a.quiz_id
     ORDER BY a.attempted_at DESC, a.attempt_id DESC`
  );
  return rows;
}

// GET /api/admin/stats - totals for the dashboard cards + 8 most recent attempts
router.get('/stats', asyncHandler(async (req, res) => {
  const [[students]] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'student'");
  const [[quizzes]] = await pool.execute('SELECT COUNT(*) AS total FROM quizzes');
  const [[attempts]] = await pool.execute('SELECT COUNT(*) AS total, AVG(percentage) AS average FROM attempts');
  const [recent] = await pool.execute(
    `SELECT a.attempt_id, u.name AS student_name, q.title AS quiz_title, q.passing_percentage,
            a.score, a.total_questions, a.percentage, a.attempted_at
     FROM attempts a
     JOIN users u ON u.user_id = a.user_id
     JOIN quizzes q ON q.quiz_id = a.quiz_id
     ORDER BY a.attempted_at DESC, a.attempt_id DESC
     LIMIT 8`
  );

  res.json({
    totalStudents: students.total,
    totalQuizzes: quizzes.total,
    totalAttempts: attempts.total,
    averagePercentage: attempts.average === null ? 0 : Math.round(attempts.average * 10) / 10,
    recent
  });
}));

// GET /api/admin/results - all attempts of all students
router.get('/results', asyncHandler(async (req, res) => {
  res.json(await getAllResults());
}));

// GET /api/admin/results/export - the same data as a downloadable CSV file
router.get('/results/export', asyncHandler(async (req, res) => {
  const rows = await getAllResults();

  // Wrap every value in quotes and double any quote inside it (CSV rule)
  const cell = (value) => '"' + String(value === null || value === undefined ? '' : value).replace(/"/g, '""') + '"';

  const header = ['Attempt ID', 'Student', 'Email', 'Quiz', 'Score', 'Total Questions', 'Percentage', 'Date'];
  const lines = [header.map(cell).join(',')];
  for (const r of rows) {
    lines.push([
      r.attempt_id, r.student_name, r.email, r.quiz_title, r.score, r.total_questions,
      r.percentage, new Date(r.attempted_at).toLocaleString('en-IN')
    ].map(cell).join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="quiz-results.csv"');
  res.send('\uFEFF' + lines.join('\r\n'));   // \uFEFF lets Excel read the file correctly
}));

module.exports = router;
