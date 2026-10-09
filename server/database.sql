-- database.sql  -  QuizSphere (Online Quiz Management System)
-- Run this whole file once in phpMyAdmin (SQL tab) or MySQL Workbench.

CREATE DATABASE IF NOT EXISTS quiz_system;
USE quiz_system;

-- 1) users: admins and students
CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','student') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) quizzes: created by an admin
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

-- 3) questions: belong to a quiz (deleted automatically when the quiz is deleted)
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

-- 4) attempts: one row each time a student submits a quiz
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

-- 5) answers: the option chosen for every question of an attempt
CREATE TABLE answers (
  answer_id       INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id      INT NOT NULL,
  question_id     INT NOT NULL,
  selected_option ENUM('A','B','C','D') NULL,
  is_correct      TINYINT(1) NOT NULL,
  flagged_for_review TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (attempt_id)  REFERENCES attempts (attempt_id)   ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
  UNIQUE (attempt_id, question_id)
);

-- ---------------- Starting data ----------------

-- Admin account:   Email: admin@quizsphere.com     Password: admin123
-- Student account: Email: student@quizsphere.com   Password: student123
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@quizsphere.com', '$2a$10$pRnrtn/CLOAC8.3YKzwhN.ZCzems6/coG.ylweYDtBojO.dHlR5Rq', 'admin'),
('Student Demo', 'student@quizsphere.com', '$2a$10$4TvuCUZtyzXUUalkJ7PQY.smTfBX8rlsrLTnFdFWo538KcC.77ra.', 'student');

-- Sample quiz 1
INSERT INTO quizzes (title, description, category, time_limit_minutes, created_by)
VALUES ('Web Technology Basics', 'HTML, CSS, JavaScript and React fundamentals.', 'Web Development, HTML, CSS', 5, 1);

INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
(1, 'Which tag is used for the main heading?', '<p>', '<h1>', '<head>', '<title>', 'B'),
(1, 'Which CSS property creates a flexible layout?', 'display: flex', 'position: center', 'layout: flex', 'flex: true', 'A'),
(1, 'Which language adds interactivity to web pages?', 'HTML', 'CSS', 'JavaScript', 'SQL', 'C'),
(1, 'React is mainly used for building what?', 'Databases', 'User interfaces', 'Operating systems', 'Servers', 'B');

-- Sample quiz 2
INSERT INTO quizzes (title, description, category, time_limit_minutes, created_by)
VALUES ('JavaScript Essentials', 'Quick check of core JavaScript concepts.', 'JavaScript, Programming', 3, 1);

INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
(2, 'Which keyword declares a block-scoped variable?', 'var', 'let', 'define', 'value', 'B'),
(2, 'Which method converts a JSON string into an object?', 'JSON.parse()', 'JSON.object()', 'JSON.convert()', 'JSON.read()', 'A'),
(2, 'Which symbol is used for single-line comments in JavaScript?', '<!-- -->', '//', '#', '**', 'B');
