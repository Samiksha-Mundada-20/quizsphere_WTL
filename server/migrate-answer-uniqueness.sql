-- Enforce one answer record per question in each attempt.
-- Check for duplicate pairs before running; duplicates must be resolved first.

ALTER TABLE answers
  ADD CONSTRAINT uq_answers_attempt_question UNIQUE (attempt_id, question_id);
