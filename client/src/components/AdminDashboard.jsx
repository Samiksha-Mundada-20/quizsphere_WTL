// Screen 9 - Admin dashboard: total stats and recent student attempts
import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHead, Stat, Notice, formatDate, percent, Badge } from './ui';

export default function AdminDashboard({ go }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats').then(setStats).catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <PageHead label="ADMIN DASHBOARD" title="System Overview" text="A quick look at your quiz platform analytics." />
      <Notice>{error}</Notice>

      {stats && (
        <>
          <div className="stats">
            <Stat value={stats.totalStudents} label="Registered Students" />
            <Stat value={stats.totalQuizzes} label="Active Quizzes" />
            <Stat value={stats.totalAttempts} label="Total Attempts" />
            <Stat value={percent(stats.averagePercentage)} label="Average Score" />
          </div>

          <div className="section">
            <h2>Recent Attempts</h2>
            <div className="actions">
              <button className="primary" onClick={() => go('editor')}>+ Create Quiz</button>
              <button className="outline" onClick={() => go('results')}>View All Results</button>
            </div>
          </div>

          {stats.recent.length === 0 ? (
            <p className="muted">No attempts recorded yet.</p>
          ) : (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((a) => {
                    const passingPercentage = Number(a.passing_percentage || 50);
                    const isPassed = a.percentage >= passingPercentage;
                    return (
                      <tr key={a.attempt_id}>
                        <td><strong>{a.student_name}</strong></td>
                        <td>{a.quiz_title}</td>
                        <td>{a.score} / {a.total_questions}</td>
                        <td>{percent(a.percentage)}</td>
                        <td>
                          <Badge type={isPassed ? 'success' : 'danger'}>
                            {isPassed ? 'Passed' : 'Needs Practice'} ({passingPercentage}%)
                          </Badge>
                        </td>
                        <td>{formatDate(a.attempted_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
