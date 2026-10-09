// middleware/errors.js

// Express does not catch errors thrown inside async functions by itself.
// asyncHandler wraps a route so any error is passed on to errorHandler below.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Last middleware in server.js: turns any error into a JSON reply.
function errorHandler(err, req, res, next) {
  console.error(err);
  const dbProblems = ['ECONNREFUSED', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE'];
  if (dbProblems.includes(err.code)) {
    return res.status(500).json({
      message: 'Cannot use the database. Check that MySQL is running, database.sql was imported, and server/.env is correct.'
    });
  }
  res.status(500).json({ message: 'Server error. Please try again.' });
}

module.exports = { asyncHandler, errorHandler };
