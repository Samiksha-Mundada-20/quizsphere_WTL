// Screen 1 - Landing page
export default function Landing({ go }) {
  return (
    <div className="landing">
      <header>
        <div className="logo"><b>Q</b>Quiz<span>Sphere</span></div>
        <button onClick={() => go('login')}>Login</button>
      </header>

      <div className="hero">
        <section>
          <small>ONLINE QUIZ MANAGEMENT SYSTEM</small>
          <h1>Create quizzes. <span>Test smarter.</span></h1>
          <p>
            QuizSphere replaces paper tests with a simple online platform: secure student login,
            timed quizzes, automatic scoring, and instant analytics.
          </p>
          <div>
            <button className="primary" onClick={() => go('register')}>Sign Up as Student</button>
            <button className="outline" onClick={() => go('login')}>Login</button>
          </div>
        </section>

        <aside>
          <i>Q</i>
          <h2>Everything in one place</h2>
          <p>Admins build quizzes and track results. Students attempt them and see their score immediately.</p>
          <div className="roles">
            <b>Timer<small>Timed quizzes</small></b>
            <b>Auto<small>Instant scoring</small></b>
            <b>Top<small>Leaderboard</small></b>
          </div>
        </aside>
      </div>
    </div>
  );
}
