// Screen 7 - All attempts of the logged-in student
import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHead, Notice, formatDate, percent, Badge } from './ui';

export default function History({ go }) {
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/attempts/mine').then(setAttempts).catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <PageHead label="MY HISTORY" title="Your Attempt History" text="Review every quiz you have submitted." />
      <Notice>{error}</Notice>
      {attempts.length === 0 && !error && <p className="muted">You have not attempted any quiz yet.</p>}

      {attempts.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Date &amp; Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const passingPercentage = Number(a.passing_percentage || 50);
                const isPassed = a.percentage >= passingPercentage;
                return (
                  <tr key={a.attempt_id}>
                    <td><strong>{a.quiz_title}</strong></td>
                    <td>{a.score} / {a.total_questions}</td>
                    <td>{percent(a.percentage)}</td>
                    <td>
                      <Badge type={isPassed ? 'success' : 'danger'}>
                        {isPassed ? 'Passed' : 'Needs Practice'} ({passingPercentage}%)
                      </Badge>
                    </td>
                    <td>{formatDate(a.attempted_at)}</td>
                    <td>
                      <button className="small" onClick={() => go('result', { attemptId: a.attempt_id })}>
                        View Details →
                      </button>
                    </td>
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
