// Left menu. The menu items depend on the user's role.
export default function Sidebar({ user, page, go, logout }) {
  const isAdmin = user.role === 'admin';

  const items = isAdmin
    ? [
        ['dashboard', 'Dashboard'],
        ['manage', 'Manage Quizzes'],
        ['results', 'All Results'],
        ['leaderboard', 'Leaderboard']
      ]
    : [
        ['dashboard', 'Dashboard'],
        ['history', 'My History'],
        ['leaderboard', 'Leaderboard']
      ];

  // Highlight the right menu item even on sub-screens
  const active = page === 'editor' ? 'manage' : page === 'result' ? 'history' : page;

  return (
    <aside className="side">
      <div className="nav-logo">
        <span className="nav-logo-mark" aria-hidden="true">Q</span>
        <div className="nav-logo-text">Quiz<span>Sphere</span></div>
      </div>
      <small>{isAdmin ? 'ADMIN' : 'STUDENT'}</small>

      <nav>
        {items.map(([key, label]) => (
          <button key={key} className={active === key ? 'sel' : ''} onClick={() => go(key)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="profile">
        <b>{user.name.charAt(0).toUpperCase()}</b>
        <div>{user.name}<small>{user.role}</small></div>
      </div>
      <button className="logout" onClick={logout}>Logout</button>
    </aside>
  );
}
