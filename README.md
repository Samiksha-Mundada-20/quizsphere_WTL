# QuizSphere - Online Quiz Management System

React (front end) + Node.js/Express (back end) + MySQL (database).
Web Technologies course project.

## Folder structure

```
quiz-management-system/
|-- server/                 Node.js + Express back end
|   |-- server.js           starts the server, connects the routes
|   |-- db.js               MySQL connection
|   |-- database.sql        creates the tables + demo accounts and quizzes
|   |-- migrate-features.sql upgrades an existing database for quiz settings and review flags
|   |-- migrate-answer-uniqueness.sql enforces one answer per question per attempt
|   |-- .env.example        settings template (copy to .env)
|   |-- middleware/         auth.js (login + role checks), errors.js
|   `-- routes/             auth, quizzes, attempts, leaderboard, admin
`-- client/                 React front end
    `-- src/
        |-- main.jsx        entry point
        |-- App.jsx         decides which screen to show
        |-- api.js          helper to call the server
        |-- style.css
        `-- components/     the 12 screens + Sidebar + ui helpers
```

## What you need installed

1. **Node.js** (LTS) - https://nodejs.org
2. **MySQL** - easiest is **XAMPP** (start "MySQL" in the XAMPP control panel)

## Setup (do this once)

### Step 1 - Create the database
1. Start MySQL in XAMPP.
2. Open http://localhost/phpmyadmin
3. Click the **SQL** tab, paste the whole content of `server/database.sql`, click **Go**.
   You should now see a database called `quiz_system` with 5 tables.

If you already have a `quiz_system` database, do **not** re-import `database.sql` because that file is for a fresh setup. Instead, select `quiz_system` in phpMyAdmin, open the **Import** tab, and import `server/migrate-features.sql` once. It adds subject tags, pass-score settings, attempt limits, and question review flags without deleting existing quizzes or results.

To enforce one answer row per question in each attempt on an existing database, import `server/migrate-answer-uniqueness.sql` once after `migrate-features.sql`. The migration requires that no duplicate `(attempt_id, question_id)` pairs already exist.

### Step 2 - Back end
```
cd server
copy .env.example .env        (Mac/Linux: cp .env.example .env)
npm install
npm start
```
Open `server/.env` and check `DB_USER` / `DB_PASSWORD` (XAMPP default: user `root`, empty password).
You should see:  `Quiz API running at http://localhost:5000`  and  `MySQL connected.`

### Step 3 - Front end (new terminal window)
```
cd client
npm install
npm run dev
```
Open **http://localhost:5173**

## Host the front end on GitHub Pages

The `main` branch deploys the React front end to GitHub Pages through the
workflow in `.github/workflows/deploy-pages.yml`. In repository **Settings >
Pages**, set the build and deployment source to **GitHub Actions**. After the
workflow succeeds, the site is available at:

https://samiksha-mundada-20.github.io/quizsphere_WTL/

GitHub Pages hosts static files only; it cannot run the Express API or MySQL.
The published front end shows an API configuration message until you deploy the
back end and database separately. Then add a repository Actions variable named
`VITE_API_URL` with the API base URL ending in `/api`, and configure the back
end's `CLIENT_URL` to the Pages URL. Use deployment-specific database
credentials and a unique random `JWT_SECRET` of at least 32 characters; do not
use the demo administrator account on a publicly reachable back end.

## Login details

| Role    | Email                  | Password |
|---------|------------------------|----------|
| Admin   | admin@quizsphere.com   | admin123 |
| Student | click "Sign Up" and create one | - |

The demo administrator account is for local demonstration only. Anyone who can
reach a back end initialized from the included demo database can sign in with
these public demo credentials.

Admins can assign comma-separated subject tags and a passing score when creating a quiz. Students can filter quizzes by tag, flag questions while taking a quiz, and print or save a completion certificate after passing.

## If something goes wrong

| Message / problem | Fix |
|---|---|
| `MySQL NOT connected yet` | MySQL is not running, or `DB_USER` / `DB_PASSWORD` in `server/.env` is wrong |
| `Cannot use the database...` in the browser | `database.sql` was not imported |
| `JWT_SECRET is missing` | You forgot to create `server/.env` from `.env.example` |
| `Cannot reach the server` in the browser | Back end is not running (Step 2) |
| Browser shows CORS error | Open the app at `http://localhost:5173` (not 127.0.0.1) |
