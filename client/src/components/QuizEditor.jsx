// Screen 11 - Create or edit a quiz and its questions (admin)
import { useEffect, useState } from 'react';
import { api } from '../api';
import { Notice } from './ui';

const emptyQuestion = () => ({
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A'
});

export default function QuizEditor({ quizId, go }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [minutes, setMinutes] = useState(10);
  const [maxAttempts, setMaxAttempts] = useState(0); // 0 = Unlimited
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // When editing, load existing quiz details
  useEffect(() => {
    if (!quizId) return;
    api('/quizzes/' + quizId)
      .then((quiz) => {
        setTitle(quiz.title);
        setDescription(quiz.description || '');
        setCategory(quiz.category || 'General');
        setMinutes(quiz.time_limit_minutes);
        setMaxAttempts(quiz.max_attempts || 0);
        setPassingPercentage(quiz.passing_percentage || 50);
        setQuestions(quiz.questions.length ? quiz.questions : [emptyQuestion()]);
      })
      .catch((err) => setError(err.message));
  }, [quizId]);

  // Change one field of one question
  function changeQuestion(i, field, value) {
    setQuestions(questions.map((q, n) => (n === i ? { ...q, [field]: value } : q)));
  }

  function removeQuestion(i) {
    if (questions.length === 1) return setError('A quiz needs at least one question.');
    setQuestions(questions.filter((q, n) => n !== i));
  }

  function moveUp(i) {
    if (i === 0) return;
    const updated = [...questions];
    const temp = updated[i - 1];
    updated[i - 1] = updated[i];
    updated[i] = temp;
    setQuestions(updated);
  }

  function moveDown(i) {
    if (i === questions.length - 1) return;
    const updated = [...questions];
    const temp = updated[i + 1];
    updated[i + 1] = updated[i];
    updated[i] = temp;
    setQuestions(updated);
  }

  function duplicateQuestion(i) {
    const qToCopy = questions[i];
    const copied = { ...qToCopy };
    delete copied.question_id;
    const updated = [...questions];
    updated.splice(i + 1, 0, copied);
    setQuestions(updated);
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    const body = {
      title,
      description,
      category,
      time_limit_minutes: Number(minutes),
      max_attempts: Number(maxAttempts),
      passing_percentage: Number(passingPercentage),
      questions
    };
    try {
      if (quizId) await api('/quizzes/' + quizId, { method: 'PUT', body });
      else await api('/quizzes', { method: 'POST', body });
      go('manage');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="editor">
      <div className="section">
        <div>
          <small className="label">{quizId ? 'EDIT QUIZ' : 'CREATE QUIZ'}</small>
          <h2>{quizId ? 'Edit Quiz' : 'Create New Quiz'}</h2>
        </div>
        <button className="outline" onClick={() => go('manage')}>Cancel</button>
      </div>

      <div className="editor-meta">
        <label className="field">
          Quiz Title *
          <input
            placeholder="e.g. JavaScript Fundamentals"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="field">
          Short Description (optional)
          <input
            placeholder="Brief overview of what this quiz covers"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="field">
          Subject Tags (comma-separated)
          <input
            placeholder="e.g. Web Development, JavaScript"
            maxLength="255"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>

        <div className="editor-settings">
          <label className="field">
            Time Limit (minutes) *
            <input
              type="number"
              min="1"
              max="300"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>

          <label className="field">
            Max Attempts Allowed (0 = Unlimited) *
            <input
              type="number"
              min="0"
              max="100"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
            />
          </label>

          <label className="field">
            Passing Score (%) *
            <input
              type="number"
              min="1"
              max="100"
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="section" style={{ marginTop: '30px' }}>
        <h2>Questions ({questions.length})</h2>
        <button type="button" className="outline" onClick={() => setQuestions([...questions, emptyQuestion()])}>
          + Add Question
        </button>
      </div>

      {questions.map((q, i) => (
        <div className="qedit" key={i}>
          <div className="qedit-header">
            <b>Question {i + 1}</b>
            <div className="qedit-tools">
              <button type="button" className="small" disabled={i === 0} onClick={() => moveUp(i)}>
                ↑ Move Up
              </button>
              <button type="button" className="small" disabled={i === questions.length - 1} onClick={() => moveDown(i)}>
                ↓ Move Down
              </button>
              <button type="button" className="small" onClick={() => duplicateQuestion(i)}>
                Duplicate
              </button>
              <button type="button" className="danger" onClick={() => removeQuestion(i)}>
                Delete
              </button>
            </div>
          </div>

          <input
            placeholder="Enter question text..."
            value={q.question_text}
            onChange={(e) => changeQuestion(i, 'question_text', e.target.value)}
          />

          <div className="options-grid">
            <input
              placeholder="Option A"
              value={q.option_a}
              onChange={(e) => changeQuestion(i, 'option_a', e.target.value)}
            />
            <input
              placeholder="Option B"
              value={q.option_b}
              onChange={(e) => changeQuestion(i, 'option_b', e.target.value)}
            />
            <input
              placeholder="Option C"
              value={q.option_c}
              onChange={(e) => changeQuestion(i, 'option_c', e.target.value)}
            />
            <input
              placeholder="Option D"
              value={q.option_d}
              onChange={(e) => changeQuestion(i, 'option_d', e.target.value)}
            />
          </div>

          <label className="field" style={{ marginTop: '10px' }}>
            Correct Option:
            <select value={q.correct_option} onChange={(e) => changeQuestion(i, 'correct_option', e.target.value)}>
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
          </label>
        </div>
      ))}

      <Notice>{error}</Notice>
      <div className="actions" style={{ marginTop: '20px' }}>
        <button className="primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving Quiz...' : 'Save Quiz ✓'}
        </button>
        <button className="outline" onClick={() => go('manage')}>Cancel</button>
      </div>
    </div>
  );
}
