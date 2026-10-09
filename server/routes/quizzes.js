// routes/quizzes.js - list, view, create, edit, delete quizzes and SUBMIT answers
const express = require('express');
const pool = require('../db');
const { verifyToken, adminOnly, studentOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();
const OPTIONS = ['A', 'B', 'C', 'D'];

// Checks a quiz sent by the admin form. Returns an error message, or null if everything is fine.
function checkQuiz(body) {
  const { title, time_limit_minutes, max_attempts, passing_percentage, category, questions } = body;
  if (!title || !title.trim()) return 'Quiz title is required.';

  const minutes = Number(time_limit_minutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 300) return 'Time limit must be between 1 and 300 minutes.';

  const attempts = Number(max_attempts ?? 0);
  if (!Number.isInteger(attempts) || attempts < 0 || attempts > 100) return 'Max attempts must be between 0 (unlimited) and 100.';

  const passingPercentage = Number(passing_percentage ?? 50);
  if (!Number.isInteger(passingPercentage) || passingPercentage < 1 || passingPercentage > 100) {
    return 'Passing percentage must be between 1 and 100.';
  }

  if (category != null && typeof category !== 'string') return 'Subject tags must be text.';
  const tags = (category || '').split(',').map((tag) => tag.trim()).filter(Boolean);
  if (tags.some((tag) => tag.length > 50) || tags.join(', ').length > 255) {
    return 'Subject tags must be 50 characters or fewer each and 255 characters or fewer in total.';
  }

  if (!Array.isArray(questions) || questions.length === 0) return 'Add at least one question.';

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const n = i + 1;
    if (!q.question_text || !q.question_text.trim()) return `Question ${n} is empty.`;
    for (const key of ['option_a', 'option_b', 'option_c', 'option_d']) {
      if (!q[key] || !String(q[key]).trim()) return `Question ${n}: all four options are required.`;
    }
    if (!OPTIONS.includes(q.correct_option)) return `Question ${n}: choose the correct option.`;
  }
  return null;
}

// Inserts one question row (used by create and edit).
function insertQuestion(conn, quizId, q) {
  return conn.execute(
    `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [quizId, q.question_text.trim(), q.option_a.trim(), q.option_b.trim(), q.option_c.trim(), q.option_d.trim(), q.correct_option]
  );
}

// GET /api/quizzes - all quizzes with question count and user attempt count
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [rows] = await pool.execute(
    `SELECT q.quiz_id, q.title, q.description, q.category, q.time_limit_minutes,
            COALESCE(q.max_attempts, 0) AS max_attempts, q.passing_percentage, q.created_at,
            COUNT(DISTINCT qs.question_id) AS question_count,
            (SELECT COUNT(*) FROM attempts a WHERE a.quiz_id = q.quiz_id AND a.user_id = ?) AS user_attempts
     FROM quizzes q
     LEFT JOIN questions qs ON qs.quiz_id = q.quiz_id
     GROUP BY q.quiz_id
     ORDER BY q.created_at DESC, q.quiz_id DESC`,
    [userId]
  );
  res.json(rows);
}));

// GET /api/quizzes/:id - one quiz with questions and student attempt info
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const quizId = Number(req.params.id);
  const userId = req.user.id;
  const [quizzes] = await pool.execute('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId]);
  if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz not found.' });

  const quiz = quizzes[0];
  quiz.max_attempts = quiz.max_attempts || 0;

  const [userAttemptRows] = await pool.execute(
    'SELECT COUNT(*) AS user_attempts FROM attempts WHERE quiz_id = ? AND user_id = ?',
    [quizId, userId]
  );
  quiz.user_attempts = userAttemptRows[0].user_attempts;

  const columns = req.user.role === 'admin'
    ? 'question_id, question_text, option_a, option_b, option_c, option_d, correct_option'
    : 'question_id, question_text, option_a, option_b, option_c, option_d';
  const [questions] = await pool.execute(
    `SELECT ${columns} FROM questions WHERE quiz_id = ? ORDER BY question_id`, [quizId]
  );
  res.json({ ...quiz, questions });
}));

// POST /api/quizzes - create a quiz (admin only)
router.post('/', verifyToken, adminOnly, asyncHandler(async (req, res) => {
  const problem = checkQuiz(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const { title, description, category, time_limit_minutes, max_attempts, passing_percentage, questions } = req.body;
  const subjectTags = (category || 'General').split(',').map((tag) => tag.trim()).filter(Boolean).join(', ') || 'General';
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `INSERT INTO quizzes (title, description, category, time_limit_minutes, max_attempts, passing_percentage, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), (description || '').trim().slice(0, 255), subjectTags, Number(time_limit_minutes),
        Number(max_attempts || 0), Number(passing_percentage ?? 50), req.user.id]
    );
    for (const q of questions) await insertQuestion(conn, result.insertId, q);
    await conn.commit();
    res.status(201).json({ quizId: result.insertId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// PUT /api/quizzes/:id - edit a quiz (admin only)
router.put('/:id', verifyToken, adminOnly, asyncHandler(async (req, res) => {
  const quizId = Number(req.params.id);
  const problem = checkQuiz(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const [found] = await pool.execute('SELECT quiz_id FROM quizzes WHERE quiz_id = ?', [quizId]);
  if (found.length === 0) return res.status(404).json({ message: 'Quiz not found.' });

  const { title, description, category, time_limit_minutes, max_attempts, passing_percentage, questions } = req.body;
  const subjectTags = (category || 'General').split(',').map((tag) => tag.trim()).filter(Boolean).join(', ') || 'General';
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE quizzes SET title = ?, description = ?, category = ?, time_limit_minutes = ?,
       max_attempts = ?, passing_percentage = ? WHERE quiz_id = ?`,
      [title.trim(), (description || '').trim().slice(0, 255), subjectTags, Number(time_limit_minutes),
        Number(max_attempts || 0), Number(passing_percentage ?? 50), quizId]
    );

    const [oldRows] = await conn.execute('SELECT question_id FROM questions WHERE quiz_id = ?', [quizId]);
    const oldIds = oldRows.map((r) => r.question_id);
    const keepIds = [];

    for (const q of questions) {
      if (q.question_id && oldIds.includes(q.question_id)) {
        await conn.execute(
          `UPDATE questions SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?
           WHERE question_id = ?`,
          [q.question_text.trim(), q.option_a.trim(), q.option_b.trim(), q.option_c.trim(), q.option_d.trim(), q.correct_option, q.question_id]
        );
        keepIds.push(q.question_id);
      } else {
        await insertQuestion(conn, quizId, q);
      }
    }
    for (const id of oldIds) {
      if (!keepIds.includes(id)) await conn.execute('DELETE FROM questions WHERE question_id = ?', [id]);
    }

    await conn.commit();
    res.json({ message: 'Quiz updated.' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// DELETE /api/quizzes/:id (admin only)
router.delete('/:id', verifyToken, adminOnly, asyncHandler(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM quizzes WHERE quiz_id = ?', [Number(req.params.id)]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Quiz not found.' });
  res.json({ message: 'Quiz deleted.' });
}));

// POST /api/quizzes/:id/submit - student submits answers
router.post('/:id/submit', verifyToken, studentOnly, asyncHandler(async (req, res) => {
  const quizId = Number(req.params.id);
  const userId = req.user.id;
  const submitted = req.body.answers || {};
  const flaggedQuestionIds = new Set(
    Array.isArray(req.body.flaggedQuestionIds)
      ? req.body.flaggedQuestionIds.map(Number).filter(Number.isInteger)
      : []
  );

  const [quizzes] = await pool.execute('SELECT max_attempts FROM quizzes WHERE quiz_id = ?', [quizId]);
  if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz not found.' });

  const maxAttempts = quizzes[0].max_attempts || 0;
  if (maxAttempts > 0) {
    const [attemptsCount] = await pool.execute(
      'SELECT COUNT(*) AS count FROM attempts WHERE quiz_id = ? AND user_id = ?',
      [quizId, userId]
    );
    if (attemptsCount[0].count >= maxAttempts) {
      return res.status(403).json({ message: `You have reached the maximum allowed attempts (${maxAttempts}) for this quiz.` });
    }
  }

  const [questions] = await pool.execute(
    'SELECT question_id, correct_option FROM questions WHERE quiz_id = ?', [quizId]
  );
  if (questions.length === 0) return res.status(404).json({ message: 'Quiz has no questions.' });

  let score = 0;
  const checked = questions.map((q) => {
    const chosen = OPTIONS.includes(submitted[q.question_id]) ? submitted[q.question_id] : null;
    const isCorrect = chosen === q.correct_option ? 1 : 0;
    score += isCorrect;
    return {
      questionId: q.question_id,
      chosen,
      isCorrect,
      flagged: flaggedQuestionIds.has(q.question_id) ? 1 : 0
    };
  });

  const total = questions.length;
  const percentage = Math.round((score / total) * 10000) / 100;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [attempt] = await conn.execute(
      'INSERT INTO attempts (user_id, quiz_id, score, total_questions, percentage) VALUES (?, ?, ?, ?, ?)',
      [userId, quizId, score, total, percentage]
    );
    for (const c of checked) {
      await conn.execute(
        `INSERT INTO answers (attempt_id, question_id, selected_option, is_correct, flagged_for_review)
         VALUES (?, ?, ?, ?, ?)`,
        [attempt.insertId, c.questionId, c.chosen, c.isCorrect, c.flagged]
      );
    }
    await conn.commit();
    res.status(201).json({ attemptId: attempt.insertId, score, total, percentage });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
