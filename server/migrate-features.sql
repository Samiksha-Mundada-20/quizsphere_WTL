-- Upgrade an existing QuizSphere database created before categories and review flags.
-- Run this once in phpMyAdmin after selecting quiz_system, or with the mysql CLI.

ALTER TABLE quizzes
  ADD COLUMN category VARCHAR(255) NOT NULL DEFAULT 'General' AFTER description,
  ADD COLUMN max_attempts INT NOT NULL DEFAULT 0 AFTER time_limit_minutes,
  ADD COLUMN passing_percentage INT NOT NULL DEFAULT 50 AFTER max_attempts;

ALTER TABLE answers
  ADD COLUMN flagged_for_review TINYINT(1) NOT NULL DEFAULT 0 AFTER is_correct;
