// routes/attempts.js - a student's history and the detailed result of one attempt
const express = require('express');
const pool = require('../db');
const { verifyToken, studentOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

// GET /api/attempts/mine - all attempts of the logged-in student (newest first)
// NOTE: this route must stay ABOVE "/:id", otherwise "mine" would be treated as an id.
router.get('/mine', verifyToken, studentOnly, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT a.attempt_id, a.quiz_id, q.title AS quiz_title, q.category, q.passing_percentage,
            a.score, a.total_questions, a.percentage, a.attempted_at
     FROM attempts a
     JOIN quizzes q ON q.quiz_id = a.quiz_id
     WHERE a.user_id = ?
     ORDER BY a.attempted_at DESC, a.attempt_id DESC`,
    [req.user.id]
  );
  res.json(rows);
}));

// GET /api/attempts/:id - result of one attempt with a question-by-question review.
// Allowed for the student who made it, or for an admin.
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const attemptId = Number(req.params.id);

  const [rows] = await pool.execute(
    `SELECT a.attempt_id, a.user_id, u.name AS student_name, q.title AS quiz_title,
            q.category, q.passing_percentage,
            a.score, a.total_questions, a.percentage, a.attempted_at
     FROM attempts a
     JOIN users u ON u.user_id = a.user_id
     JOIN quizzes q ON q.quiz_id = a.quiz_id
     WHERE a.attempt_id = ?`,
    [attemptId]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Attempt not found.' });

  const attempt = rows[0];
  if (req.user.role !== 'admin' && attempt.user_id !== req.user.id) {
    return res.status(403).json({ message: 'You cannot view this attempt.' });
  }

  const [review] = await pool.execute(
    `SELECT qs.question_text, qs.option_a, qs.option_b, qs.option_c, qs.option_d,
            qs.correct_option, ans.selected_option, ans.is_correct, ans.flagged_for_review
     FROM answers ans
     JOIN questions qs ON qs.question_id = ans.question_id
     WHERE ans.attempt_id = ?
     ORDER BY qs.question_id`,
    [attemptId]
  );

  res.json({ attempt, review });
}));

module.exports = router;
