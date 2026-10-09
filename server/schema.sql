-- QuizSphere database schema. This file creates tables only; it contains no
-- demo accounts, password hashes, or sample quiz data.

CREATE DATABASE IF NOT EXISTS quiz_system;
USE quiz_system;

CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','student') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
  quiz_id            INT AUTO_INCREMENT PRIMARY KEY,
  title              VARCHAR(150) NOT NULL,
  description        VARCHAR(255),
  category           VARCHAR(255) NOT NULL DEFAULT 'General',
  time_limit_minutes INT NOT NULL DEFAULT 10,
  max_attempts       INT NOT NULL DEFAULT 0,
  passing_percentage INT NOT NULL DEFAULT 50,
  created_by         INT NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE questions (
  question_id    INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id        INT NOT NULL,
  question_text  TEXT NOT NULL,
  option_a       VARCHAR(255) NOT NULL,
  option_b       VARCHAR(255) NOT NULL,
  option_c       VARCHAR(255) NOT NULL,
  option_d       VARCHAR(255) NOT NULL,
  correct_option ENUM('A','B','C','D') NOT NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

CREATE TABLE attempts (
  attempt_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  quiz_id         INT NOT NULL,
  score           INT NOT NULL,
  total_questions INT NOT NULL,
  percentage      DECIMAL(5,2) NOT NULL,
  attempted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

CREATE TABLE answers (
  answer_id          INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id         INT NOT NULL,
  question_id        INT NOT NULL,
  selected_option    ENUM('A','B','C','D') NULL,
  is_correct         TINYINT(1) NOT NULL,
  flagged_for_review TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (attempt_id) REFERENCES attempts (attempt_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions (question_id) ON DELETE CASCADE,
  UNIQUE (attempt_id, question_id)
);
