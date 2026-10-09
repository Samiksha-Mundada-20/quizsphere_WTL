// routes/leaderboard.js - best score of every student (optionally for one quiz)
const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

// GET /api/leaderboard            -> best result of each student in each quiz
// GET /api/leaderboard?quizId=3   -> only quiz number 3
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const quizId = Number(req.query.quizId) || null;

  const where = quizId ? 'WHERE a.quiz_id = ?' : '';
  const params = quizId ? [quizId] : [];

  // GROUP BY gives one row per (student, quiz); MAX() picks the best percentage.
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.name, a.quiz_id, q.title AS quiz_title, q.passing_percentage,
            MAX(a.percentage) AS best_percentage, COUNT(*) AS attempts
     FROM attempts a
     JOIN users u ON u.user_id = a.user_id
     JOIN quizzes q ON q.quiz_id = a.quiz_id
     ${where}
     GROUP BY u.user_id, u.name, a.quiz_id, q.title, q.passing_percentage
     ORDER BY best_percentage DESC, attempts ASC, u.name ASC
     LIMIT 20`,
    params
  );
  res.json(rows);
}));

module.exports = router;
