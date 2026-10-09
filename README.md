# QuizSphere - Online Quiz Management System

React (front end) + Node.js/Express (back end) + MySQL (database).
Web Technologies course project.

## Folder structure

```
quiz-management-system/
|-- server/                 Node.js + Express back end
|   |-- server.js           starts the server, connects the routes
|   |-- db.js               MySQL connection
|   |-- schema.sql          creates the tables without demo accounts or data
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
3. Click the **SQL** tab, paste the whole content of `server/schema.sql`, click **Go**.
   You should now see a database called `quiz_system` with 5 empty tables.
4. Start the app and create your student account using **Sign Up**. To grant
   administrator access, update only your own account directly in MySQL:
   `UPDATE quiz_system.users SET role = 'admin' WHERE email = 'your-email@example.com';`
   Do not expose this database operation through a public endpoint.

If you already have a `quiz_system` database, do **not** re-import `schema.sql`. Instead, select `quiz_system` in phpMyAdmin, open the **Import** tab, and import `server/migrate-features.sql` once. It adds subject tags, pass-score settings, attempt limits, and question review flags without deleting existing quizzes or results.

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
credentials and a unique random `JWT_SECRET` of at least 32 characters.

### Optional: Deploy the back end and MySQL on Railway

The backend and database are currently intended to run locally; Railway is not
required to run the app locally or publish its frontend on GitHub Pages. Follow
these steps only if you later decide to host the API and database.

1. Create a Railway project from this GitHub repository and add a **MySQL**
   service.
2. Add a service from the same repository for the API. In its settings, set
   **Root Directory** to `/server`; Railway uses `server/railway.json` to build,
   start, and health-check the API.
3. In the API service's variables, add `DB_HOST`, `DB_PORT`, `DB_USER`, and
   `DB_PASSWORD` as references to the MySQL service's `MYSQLHOST`, `MYSQLPORT`,
   `MYSQLUSER`, and `MYSQLPASSWORD` variables. Set `DB_NAME` to
   `quiz_system`. Set `JWT_SECRET` to a unique random value of at least 32
   characters and `CLIENT_URL` to
   `https://samiksha-mundada-20.github.io/quizsphere_WTL`.
   Generate a secret locally with
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
   Enter secrets only in Railway's private Variables UI; never commit or send
   them in chat.
4. In Railway's MySQL service, enable its TCP Proxy. Use its private connection
   details only from within Railway, or its proxy connection details from your
   own computer, to run `server/schema.sql` once using a MySQL client. That
   script creates an empty `quiz_system` database. Do not put the MySQL
   credentials in this repository. After deployment, register your own account
   and promote it to admin directly in the database as described above.
5. Generate a public domain for the API service. In GitHub, open **Settings >
   Secrets and variables > Actions > Variables**, add `VITE_API_URL` with the
   API's public URL followed by `/api`, and rerun the Pages workflow (or push a
   new commit). The API domain must allow requests from the Pages URL above.

## Login details

| Role    | How to create |
|---------|---------------|
| Admin   | Register your account, then promote it directly in the database as described above |
| Student | Click "Sign Up" and create an account |

No demo credentials or user accounts are included in the public schema. Existing
databases seeded from an earlier `database.sql` may still contain demo users;
change or remove those accounts before exposing that API publicly.

Admins can assign comma-separated subject tags and a passing score when creating a quiz. Students can filter quizzes by tag, flag questions while taking a quiz, and print or save a completion certificate after passing.

## If something goes wrong

| Message / problem | Fix |
|---|---|
| `MySQL NOT connected yet` | MySQL is not running, or `DB_USER` / `DB_PASSWORD` in `server/.env` is wrong |
| `Cannot use the database...` in the browser | `schema.sql` was not imported |
| `JWT_SECRET is missing` | You forgot to create `server/.env` from `.env.example` |
| `Cannot reach the server` in the browser | Back end is not running (Step 2) |
| Browser shows CORS error | Open the app at `http://localhost:5173` (not 127.0.0.1) |
