// Screen 2 - Login (used by both admin and student; the server decides the role)
import { useState } from 'react';
import { api } from '../api';
import { Notice } from './ui';

export default function Login({ onSuccess, go }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  // Admin Demo Login
  async function handleAdminDemoLogin() {
    setError('');
    setLoading(true);
    try {
      let data;
      try {
        setEmail('admin@quizsphere.com');
        setPassword('admin123');
        data = await api('/auth/login', { method: 'POST', body: { email: 'admin@quizsphere.com', password: 'admin123' } });
      } catch (e1) {
        // Fallback for databases created with legacy email
        setEmail('admin@quizflow.com');
        data = await api('/auth/login', { method: 'POST', body: { email: 'admin@quizflow.com', password: 'admin123' } });
      }
      onSuccess(data);
    } catch (err) {
      setError('Cannot connect to server or database. Ensure backend & MySQL are running.');
    }
    setLoading(false);
  }

  // Student Demo Login (auto-registers if demo student does not exist yet in DB)
  async function handleStudentDemoLogin() {
    setError('');
    setLoading(true);
    const credentials = { email: 'student@quizsphere.com', password: 'student123' };
    setEmail(credentials.email);
    setPassword(credentials.password);
    try {
      let data;
      try {
        data = await api('/auth/login', { method: 'POST', body: credentials });
      } catch (e1) {
        // Auto-create student demo account if it doesn't exist yet
        try {
          data = await api('/auth/register', {
            method: 'POST',
            body: { name: 'Student Demo', email: credentials.email, password: credentials.password }
          });
        } catch (e2) {
          throw e1;
        }
      }
      onSuccess(data);
    } catch (err) {
      setError(err.message || 'Student login failed.');
    }
    setLoading(false);
  }

  return (
    <div className="auth">
      <button className="back" onClick={() => go('landing')}>&larr; Back</button>
      <div className="authbox">
        <div className="logo"><b>Q</b>Quiz<span>Sphere</span></div>
        <h1>Welcome back</h1>
        <p>Log in as admin or student.</p>

        <div className="demo-box">
          <small>QUICK DEMO LOGINS</small>
          <div className="demo-buttons">
            <button type="button" className="small" onClick={handleAdminDemoLogin}>
              Admin Demo
            </button>
            <button type="button" className="small" onClick={handleStudentDemoLogin}>
              Student Demo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Notice>{error}</Notice>
          <button className="primary full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <a onClick={() => go('register')}>New student? Create an account</a>
      </div>
    </div>
  );
}
