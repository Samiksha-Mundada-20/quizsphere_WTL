// App.jsx - the "main controller". It remembers who is logged in and which screen to show.
import { useState, useEffect } from 'react';

import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import StudentDashboard from './components/StudentDashboard';
import TakeQuiz from './components/TakeQuiz';
import Result from './components/Result';
import History from './components/History';
import Leaderboard from './components/Leaderboard';
import AdminDashboard from './components/AdminDashboard';
import ManageQuizzes from './components/ManageQuizzes';
import QuizEditor from './components/QuizEditor';
import AllResults from './components/AllResults';

export default function App() {
  // The logged-in user is kept in localStorage so a page refresh does not log us out
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  // "view" says which screen is open. Example: { page: 'take', quizId: 3 }
  const [view, setView] = useState({ page: user ? 'dashboard' : 'landing' });

  function go(page, extra = {}) {
    setView({ page, ...extra });
    window.scrollTo(0, 0);
  }

  function handleLogin(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    go('dashboard');
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    go('landing');
  }

  // api.js fires this event when the server says our token has expired
  useEffect(() => {
    window.addEventListener('auth-expired', logout);
    return () => window.removeEventListener('auth-expired', logout);
  }, []);

  // ---------- Not logged in: public screens ----------
  if (!user) {
    if (view.page === 'login') return <Login onSuccess={handleLogin} go={go} />;
    if (view.page === 'register') return <Register onSuccess={handleLogin} go={go} />;
    return <Landing go={go} />;
  }

  // ---------- Logged in ----------
  const isAdmin = user.role === 'admin';
  const adminScreens = ['manage', 'editor', 'results'];
  const studentScreens = ['take', 'result', 'history'];

  // Stop a student from opening admin screens (and the admin from student screens)
  let page = view.page;
  if (!isAdmin && adminScreens.includes(page)) page = 'dashboard';
  if (isAdmin && studentScreens.includes(page)) page = 'dashboard';

  // The quiz screen is full-screen (no sidebar), so it is returned early
  if (page === 'take') return <TakeQuiz quizId={view.quizId} go={go} />;

  let screen;
  if (page === 'history') screen = <History go={go} />;
  else if (page === 'result') screen = <Result attemptId={view.attemptId} go={go} />;
  else if (page === 'leaderboard') screen = <Leaderboard user={user} />;
  else if (page === 'manage') screen = <ManageQuizzes go={go} />;
  else if (page === 'editor') screen = <QuizEditor quizId={view.quizId} go={go} />;
  else if (page === 'results') screen = <AllResults />;
  else screen = isAdmin ? <AdminDashboard go={go} /> : <StudentDashboard user={user} go={go} />;

  return (
    <div className="layout">
      <Sidebar user={user} page={page} go={go} logout={logout} />
      <main>{screen}</main>
    </div>
  );
}
