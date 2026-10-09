import { categoryTags, formatDate, percent } from './ui';

export default function Certificate({ attempt }) {
  return (
    <section className="certificate-shell" aria-label="Certificate of completion">
      <div className="certificate">
        <div className="certificate-inner">
          <div className="certificate-brand"><span>Q</span> QuizSphere</div>
          <div className="certificate-seal" aria-hidden="true">✦</div>
          <p className="certificate-kicker">CERTIFICATE OF COMPLETION</p>
          <h2>This certificate is proudly presented to</h2>
          <p className="certificate-student">{attempt.student_name}</p>
          <p className="certificate-copy">
            for successfully completing <strong>{attempt.quiz_title}</strong>
          </p>
          <div className="certificate-tags">
            {categoryTags(attempt.category).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <div className="certificate-score">
            <div><strong>{percent(attempt.percentage)}</strong><span>Final score</span></div>
            <div><strong>{attempt.score}/{attempt.total_questions}</strong><span>Correct answers</span></div>
            <div><strong>{attempt.passing_percentage}%</strong><span>Passing score</span></div>
          </div>
          <div className="certificate-footer">
            <div><strong>{formatDate(attempt.attempted_at)}</strong><span>Date awarded</span></div>
            <div className="certificate-signature"><strong>QuizSphere</strong><span>Online Learning</span></div>
            <div><strong>QS-{String(attempt.attempt_id).padStart(6, '0')}</strong><span>Certificate ID</span></div>
          </div>
        </div>
      </div>
      <div className="certificate-actions">
        <p>Well done! Your certificate is ready to print or save as a PDF.</p>
        <button className="primary" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>
    </section>
  );
}
