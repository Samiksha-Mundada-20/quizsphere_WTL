// middleware/auth.js - decides WHO is calling the API and WHAT they may do.
const jwt = require('jsonwebtoken');

// 1) verifyToken: the browser sends "Authorization: Bearer <token>".
//    If the token is valid, we store the user's id, name and role in req.user.
function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in first.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}

// 2) adminOnly: allow only users whose role is "admin".
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only.' });
  next();
}

// 3) studentOnly: allow only students (admins do not attempt quizzes).
function studentOnly(req, res, next) {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only.' });
  next();
}

module.exports = { verifyToken, adminOnly, studentOnly };
