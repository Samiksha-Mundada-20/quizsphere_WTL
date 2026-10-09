// Screen 6 - Result of one attempt, with detailed question breakdown & status badge
import { useEffect, useState } from 'react';
import { api } from '../api';
import { Notice, percent, Badge } from './ui';
import Certificate from './Certificate';

export default function Result({ attemptId, go }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/attempts/' + attemptId).then(setData).catch((err) => setError(err.message));
  }, [attemptId]);

  if (error) return <Notice>{error}</Notice>;
  if (!data) return <p className="muted" style={{ padding: '40px 0', textAlign: 'center' }}>Loading your results...</p>;

  const { attempt, review } = data;
  const passingPercentage = Number(attempt.passing_percentage || 50);
  const isPassed = attempt.percentage >= passingPercentage;

  const correctCount = review.filter((r) => r.is_correct).length;
  const skippedCount = review.filter((r) => !r.selected_option).length;
  const wrongCount = review.length - correctCount - skippedCount;

  const message = attempt.percentage >= 80
    ? 'Outstanding performance. You mastered this quiz.'
    : isPassed
    ? 'Good job. You passed the quiz.'
    : 'Keep learning and try again to improve your score.';

  return (
    <div className="resultbox">
      <section className="resultcard">
        <small>QUIZ COMPLETED</small>

        <div
          className={`ring ${isPassed ? 'passed' : 'needs-practice'}`}
          style={{ '--score': `${attempt.percentage}%` }}
        >
          <span>{percent(attempt.percentage)}</span>
        </div>

        <div style={{ margin: '10px 0' }}>
          <Badge type={isPassed ? 'success' : 'danger'}>
            {isPassed ? 'PASSED ✓' : 'NEEDS PRACTICE ✗'}
          </Badge>
        </div>

        <h1>{attempt.score} / {attempt.total_questions} Correct</h1>
        <p>{attempt.quiz_title} &middot; {message}</p>
        <p className="passing-note">Passing score: {passingPercentage}%</p>

        <div className="result-stats-row">
          <div className="mini-stat">
            <b>{correctCount}</b>
            <span>Correct</span>
          </div>
          <div className="mini-stat">
            <b>{wrongCount}</b>
            <span>Wrong</span>
          </div>
          <div className="mini-stat">
            <b>{skippedCount}</b>
            <span>Skipped</span>
          </div>
        </div>

        <div className="actions center">
          <button className="primary" onClick={() => go('dashboard')}>Back to Dashboard</button>
          <button className="outline" onClick={() => go('leaderboard')}>View Leaderboard</button>
        </div>
      </section>

      {isPassed && <Certificate attempt={{ ...attempt, passing_percentage: passingPercentage }} />}

      <div className="section">
        <h2>Detailed Answer Review</h2>
      </div>

      {review.map((item, i) => (
        <div key={i} className={'review ' + (item.is_correct ? 'right' : 'wrong')}>
          <div className="review-header">
            <b>Q{i + 1}. {item.question_text}</b>
            <div className="badge-group">
              {item.flagged_for_review === 1 && <Badge type="warning">Flagged</Badge>}
              <Badge type={item.is_correct ? 'success' : item.selected_option ? 'danger' : 'warning'}>
                {item.is_correct ? 'Correct (+1)' : item.selected_option ? 'Incorrect' : 'Skipped'}
              </Badge>
            </div>
          </div>

          <div className="review-options">
            {['A', 'B', 'C', 'D'].map((letter) => {
              const text = item['option_' + letter.toLowerCase()];
              let mark = '';
              if (letter === item.correct_option) mark = 'is-correct';
              else if (letter === item.selected_option) mark = 'is-wrong';

              return (
                <div key={letter} className={'opt ' + mark}>
                  <b>{letter}.</b> {text}
                  {letter === item.selected_option && <span className="opt-tag"> (Your choice)</span>}
                  {letter === item.correct_option && <span className="opt-tag correct"> (Correct answer)</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
