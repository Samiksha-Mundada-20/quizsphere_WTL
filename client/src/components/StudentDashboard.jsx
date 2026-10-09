// Screen 4 - Student dashboard: summary numbers + search + list of quizzes
import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHead, Stat, Notice, percent, Badge, categoryTags } from './ui';

export default function StudentDashboard({ user, go }) {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');

  // Runs once when the screen opens: fetch quizzes and this student's attempts
  useEffect(() => {
    Promise.all([api('/quizzes'), api('/attempts/mine')])
      .then(([quizList, attemptList]) => {
        setQuizzes(quizList);
        setAttempts(attemptList);
      })
      .catch((err) => setError(err.message));
  }, []);

  const best = attempts.length ? Math.max(...attempts.map((a) => a.percentage)) : 0;
  const passedCount = attempts.filter((a) => a.percentage >= Number(a.passing_percentage || 50)).length;
  const categories = [...new Set(quizzes.flatMap((quiz) => categoryTags(quiz.category)))].sort();

  const filteredQuizzes = quizzes.filter((q) => {
    const term = search.toLowerCase();
    const tags = categoryTags(q.category);
    const matchesSearch = q.title.toLowerCase().includes(term)
      || (q.description && q.description.toLowerCase().includes(term))
      || tags.join(' ').toLowerCase().includes(term);
    return matchesSearch && (!selectedCategory || tags.includes(selectedCategory));
  });

  return (
    <>
      <PageHead label="STUDENT DASHBOARD" title={`Welcome, ${user.name.split(' ')[0]}`} text="Pick a quiz and start when you are ready." />
      <Notice>{error}</Notice>

      <div className="stats">
        <Stat value={quizzes.length} label="Available Quizzes" />
        <Stat value={attempts.length} label="Attempts Made" />
        <Stat value={passedCount} label="Quizzes Passed (≥50%)" />
        <Stat value={percent(best)} label="Best Score" />
      </div>

      <div className="section">
        <h2>Available Quizzes</h2>
        <div className="quiz-filters">
          <input
            className="filter"
            placeholder="Search quizzes or subject tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="category-filter"
            aria-label="Filter quizzes by subject tag"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All subject tags</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
      </div>

      {filteredQuizzes.length === 0 && !error && (
        <p className="muted">
          {search ? 'No quizzes match your search.' : 'No quizzes yet. Please check back later.'}
        </p>
      )}

      <div className="cards">
        {filteredQuizzes.map((quiz) => {
          const userAttempts = quiz.user_attempts || 0;
          const maxAttempts = quiz.max_attempts || 0;
          const isLimitReached = maxAttempts > 0 && userAttempts >= maxAttempts;

          return (
            <article key={quiz.quiz_id}>
              <div className="qicon">Q</div>
              <h3>{quiz.title}</h3>
              <p>{quiz.description || 'No description provided.'}</p>

              <div className="badge-group">
                {categoryTags(quiz.category).map((tag) => <Badge key={tag} type="info">{tag}</Badge>)}
                <Badge type="neutral">{quiz.time_limit_minutes} min</Badge>
                <Badge type="info">{quiz.question_count} questions</Badge>
                <Badge type="neutral">Pass: {quiz.passing_percentage || 50}%</Badge>
                {maxAttempts > 0 ? (
                  <Badge type={isLimitReached ? 'danger' : 'warning'}>
                    Attempts: {userAttempts} / {maxAttempts}
                  </Badge>
                ) : (
                  <Badge type="neutral">Unlimited attempts ({userAttempts} made)</Badge>
                )}
              </div>

              <div className="actions">
                <button
                  className="primary"
                  disabled={quiz.question_count === 0 || isLimitReached}
                  onClick={() => go('take', { quizId: quiz.quiz_id })}
                >
                  {quiz.question_count === 0
                    ? 'No Questions Yet'
                    : isLimitReached
                    ? `Attempt Limit Reached (${userAttempts}/${maxAttempts})`
                    : 'Start Quiz →'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
