// Screen 12 - All results of all students + CSV export (admin)
import { useEffect, useState } from 'react';
import { api, downloadCsv } from '../api';
import { PageHead, Notice, formatDate, percent, Badge } from './ui';

export default function AllResults() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api('/admin/results').then(setRows).catch((err) => setError(err.message));
  }, []);

  const text = search.trim().toLowerCase();
  const shown = rows.filter((r) =>
    r.student_name.toLowerCase().includes(text) || r.quiz_title.toLowerCase().includes(text) || r.email.toLowerCase().includes(text)
  );

  async function handleExport() {
    setError('');
    setExporting(true);
    try {
      await downloadCsv();
    } catch (err) {
      setError(err.message);
    }
    setExporting(false);
  }

  return (
    <>
      <PageHead label="ALL RESULTS" title="Student Results" text="Complete log of quiz attempts across all students." />
      <Notice>{error}</Notice>

      <div className="toolbar">
        <input
          className="filter"
          placeholder="Search by student, email, or quiz..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="primary" disabled={exporting || rows.length === 0} onClick={handleExport}>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {shown.length === 0 && !error && (
        <p className="muted">{search ? 'No results match your search.' : 'No student attempts recorded yet.'}</p>
      )}

      {shown.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Quiz</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const passingPercentage = Number(r.passing_percentage || 50);
                const isPassed = r.percentage >= passingPercentage;
                return (
                  <tr key={r.attempt_id}>
                    <td><strong>{r.student_name}</strong></td>
                    <td>{r.email}</td>
                    <td>{r.quiz_title}</td>
                    <td>{r.score} / {r.total_questions}</td>
                    <td>{percent(r.percentage)}</td>
                    <td>
                      <Badge type={isPassed ? 'success' : 'danger'}>
                        {isPassed ? 'Passed' : 'Needs Practice'} ({passingPercentage}%)
                      </Badge>
                    </td>
                    <td>{formatDate(r.attempted_at)}</td>
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
