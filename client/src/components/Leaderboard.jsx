// Screen 8 - Leaderboard (best score of each student, optional quiz filter)
import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHead, Notice, percent, Badge } from './ui';

export default function Leaderboard({ user }) {
  const [quizzes, setQuizzes] = useState([]);
  const [quizId, setQuizId] = useState('');       // '' means "all quizzes"
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  // Load the quiz list once (for the filter drop-down)
  useEffect(() => {
    api('/quizzes').then(setQuizzes).catch((err) => setError(err.message));
  }, []);

  // Load leaderboard rows whenever quizId filter changes
  useEffect(() => {
    api('/leaderboard' + (quizId ? '?quizId=' + quizId : ''))
      .then(setRows)
      .catch((err) => setError(err.message));
  }, [quizId]);

  function getRankBadge(rank) {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `#${rank}`;
  }

  return (
    <>
      <PageHead label="LEADERBOARD" title="Top Performers" text="Best score recorded for each student." />
      <Notice>{error}</Notice>

      <div className="toolbar">
        <select className="filter" value={quizId} onChange={(e) => setQuizId(e.target.value)}>
          <option value="">All Quizzes</option>
          {quizzes.map((q) => (
            <option key={q.quiz_id} value={q.quiz_id}>{q.title}</option>
          ))}
        </select>
      </div>

      {rows.length === 0 && !error && <p className="muted">No attempts recorded yet for this view.</p>}

      {rows.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Quiz</th>
                <th>Best Score</th>
                <th>Attempts Made</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rank = i + 1;
                const isUser = r.user_id === user.id;
                return (
                  <tr key={r.user_id + '-' + r.quiz_id} className={isUser ? 'me' : ''}>
                    <td>
                      <b className={rank <= 3 ? `rank rank-${rank}` : ''}>
                        {getRankBadge(rank)}
                      </b>
                    </td>
                    <td>
                      <strong>{r.name}</strong> {isUser && <Badge type="info">You</Badge>}
                    </td>
                    <td>{r.quiz_title}</td>
                    <td>
                      <Badge type={r.best_percentage >= Number(r.passing_percentage || 50) ? 'success' : 'danger'}>
                        {percent(r.best_percentage)}
                      </Badge>
                    </td>
                    <td>{r.attempts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
