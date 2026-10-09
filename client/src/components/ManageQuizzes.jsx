// Screen 10 - List of quizzes with Edit, Delete and Search (admin)
import { useEffect, useState } from 'react';
import { api } from '../api';
import { Notice, Badge, categoryTags, ConfirmDialog } from './ui';

export default function ManageQuizzes({ go }) {
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadQuizzes = () => api('/quizzes').then(setQuizzes).catch((err) => setError(err.message));
  useEffect(() => { loadQuizzes(); }, []);

  async function confirmDelete() {
    if (!quizToDelete || deleting) return;
    setDeleting(true);
    try {
      await api('/quizzes/' + quizToDelete.quiz_id, { method: 'DELETE' });
      setQuizzes((current) => current.filter((quiz) => quiz.quiz_id !== quizToDelete.quiz_id));
      setQuizToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const categories = [...new Set(quizzes.flatMap((quiz) => categoryTags(quiz.category)))].sort();
  const filtered = quizzes.filter((q) => {
    const term = search.toLowerCase();
    const tags = categoryTags(q.category);
    const matchesSearch = q.title.toLowerCase().includes(term)
      || (q.description && q.description.toLowerCase().includes(term))
      || tags.join(' ').toLowerCase().includes(term);
    return matchesSearch && (!selectedCategory || tags.includes(selectedCategory));
  });

  return (
    <>
      {quizToDelete && (
        <ConfirmDialog
          title={`Delete "${quizToDelete.title}"?`}
          message="This will permanently remove the quiz, its questions, and all associated student attempts."
          confirmLabel="Delete quiz"
          danger
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setQuizToDelete(null)}
        />
      )}
      <div className="section">
        <div>
          <small className="label">MANAGE QUIZZES</small>
          <h2>All Quizzes ({quizzes.length})</h2>
        </div>
        <button className="primary" onClick={() => go('editor')}>+ Create New Quiz</button>
      </div>

      <Notice>{error}</Notice>

      <div className="toolbar quiz-filters">
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

      {filtered.length === 0 && !error && (
        <p className="muted">{search ? 'No quizzes match your search.' : 'No quizzes yet. Create your first quiz.'}</p>
      )}

      <div className="cards">
        {filtered.map((quiz) => (
          <article key={quiz.quiz_id}>
            <div className="qicon">Q</div>
            <h3>{quiz.title}</h3>
            <p>{quiz.description || 'No description provided.'}</p>
            <div className="badge-group">
              {categoryTags(quiz.category).map((tag) => <Badge key={tag} type="info">{tag}</Badge>)}
              <Badge type="neutral">{quiz.time_limit_minutes} min</Badge>
              <Badge type="info">{quiz.question_count} questions</Badge>
              <Badge type="neutral">Pass: {quiz.passing_percentage || 50}%</Badge>
              <Badge type="warning">
                {quiz.max_attempts > 0 ? `Max ${quiz.max_attempts} attempts` : 'Unlimited attempts'}
              </Badge>
            </div>
            <div className="actions">
              <button className="outline" onClick={() => go('editor', { quizId: quiz.quiz_id })}>Edit</button>
              <button className="danger" onClick={() => setQuizToDelete(quiz)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
