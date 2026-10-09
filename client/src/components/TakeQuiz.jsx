// Screen 5 - Attempt a quiz (with countdown timer & question navigation)
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { Notice, ConfirmDialog } from './ui';

export default function TakeQuiz({ quizId, go }) {
  const [quiz, setQuiz] = useState(null);
  const [index, setIndex] = useState(0);            // current question index
  const [answers, setAnswers] = useState({});       // { questionId: 'A' }
  const [flagged, setFlagged] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const alreadySubmitted = useRef(false);           // stops double submission

  // 1) Load the quiz and set the timer
  useEffect(() => {
    api('/quizzes/' + quizId)
      .then((data) => {
        setQuiz(data);
        setSecondsLeft(data.time_limit_minutes * 60);
      })
      .catch((err) => setError(err.message));
  }, [quizId]);

  // 2) Countdown timer
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      submitQuiz();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // 3) Send answers to backend
  async function submitQuiz() {
    if (alreadySubmitted.current) return;
    alreadySubmitted.current = true;
    setSubmitting(true);
    try {
      const flaggedQuestionIds = Object.keys(flagged)
        .filter((questionId) => flagged[questionId])
        .map(Number);
      const result = await api(`/quizzes/${quizId}/submit`, {
        method: 'POST',
        body: { answers, flaggedQuestionIds }
      });
      go('result', { attemptId: result.attemptId });
    } catch (err) {
      alreadySubmitted.current = false;
      setSubmitting(false);
      setError(err.message);
    }
  }

  function handleSubmitClick() {
    const unanswered = quiz.questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      setConfirmation({
        title: 'Submit this quiz?',
        message: `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. You can submit now or go back and review them.`,
        confirmLabel: 'Submit quiz',
        onConfirm: submitQuiz
      });
      return;
    }
    submitQuiz();
  }

  function handleQuit() {
    setConfirmation({
      title: 'Leave this quiz?',
      message: 'Your answers and review flags will not be saved if you leave now.',
      confirmLabel: 'Leave quiz',
      danger: true,
      onConfirm: () => go('dashboard')
    });
  }

  const confirmationDialog = confirmation && (
    <ConfirmDialog
      {...confirmation}
      onConfirm={() => {
        const action = confirmation.onConfirm;
        setConfirmation(null);
        action();
      }}
      onCancel={() => setConfirmation(null)}
    />
  );

  function toggleFlag() {
    setFlagged((current) => ({ ...current, [q.question_id]: !current[q.question_id] }));
  }

  // ---------- Screen ----------
  if (!quiz) {
    return (
      <div className="take">
        {confirmationDialog}
        <div className="takebar">
          <div className="logo"><b>Q</b>Quiz<span>Sphere</span></div>
        </div>
        <Notice>{error}</Notice>
        {error ? (
          <button className="outline" onClick={() => go('dashboard')}>Back to Dashboard</button>
        ) : (
          <p className="muted" style={{ textAlign: 'center', marginTop: '40px' }}>Loading quiz questions...</p>
        )}
      </div>
    );
  }

  const questions = quiz.questions;
  const q = questions[index];
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const progress = ((index + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="take">
      {confirmationDialog}
      <div className="takebar">
        <div className="logo"><b>Q</b>Quiz<span>Sphere</span></div>
        <div className={secondsLeft <= 60 ? 'timer low' : 'timer'}>
          {minutes}:{seconds}
        </div>
        <button className="outline" onClick={handleQuit}>Quit Quiz</button>
      </div>

      <div className="bar"><i style={{ width: progress + '%' }} /></div>

      <section>
        <div className="qheader">
          <small>{quiz.title.toUpperCase()} &middot; QUESTION {index + 1} OF {questions.length}</small>
          <small className="answered-status">{answeredCount} of {questions.length} Answered</small>
        </div>

        <h1>{q.question_text}</h1>

        <button
          type="button"
          className={flagged[q.question_id] ? 'flag-toggle selected' : 'flag-toggle'}
          aria-pressed={Boolean(flagged[q.question_id])}
          onClick={toggleFlag}
        >
          {flagged[q.question_id] ? 'Flagged for review' : 'Flag question for review'}
        </button>

        <div className="options-list">
          {[['A', q.option_a], ['B', q.option_b], ['C', q.option_c], ['D', q.option_d]].map(([letter, text]) => (
            <button
              key={letter}
              type="button"
              className={answers[q.question_id] === letter ? 'option-btn chosen' : 'option-btn'}
              onClick={() => setAnswers({ ...answers, [q.question_id]: letter })}
            >
              <b>{letter}</b>
              <span>{text}</span>
            </button>
          ))}
        </div>

        <Notice>{error}</Notice>

        <div className="qnav-title">
          <small>QUESTION NAVIGATION</small>
          <span className="muted">{Object.values(flagged).filter(Boolean).length} flagged for review</span>
        </div>
        <div className="qnav">
          {questions.map((item, i) => {
            const isCurrent = i === index;
            const isAnswered = !!answers[item.question_id];
            const isFlagged = !!flagged[item.question_id];
            return (
              <button
                key={item.question_id}
                type="button"
                className={['now', 'done', 'flagged'].filter((className) => (
                  className === 'now' ? isCurrent : className === 'done' ? isAnswered : isFlagged
                )).join(' ')}
                aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ', unanswered'}${isFlagged ? ', flagged for review' : ''}`}
                onClick={() => setIndex(i)}
              >
                {i + 1}{isFlagged && <span className="flag-mark" aria-label="Flagged">F</span>}
              </button>
            );
          })}
        </div>

        <div className="navrow">
          <button className="outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            ← Previous
          </button>
          {index < questions.length - 1 ? (
            <button className="primary" onClick={() => setIndex(index + 1)}>
              Next Question →
            </button>
          ) : (
            <button className="primary" disabled={submitting} onClick={handleSubmitClick}>
              {submitting ? 'Submitting...' : 'Submit Quiz ✓'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
