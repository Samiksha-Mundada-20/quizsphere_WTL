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

  return (
    <div className="auth">
      <button className="back" onClick={() => go('landing')}>&larr; Back</button>
      <div className="authbox">
        <div className="logo"><b>Q</b>Quiz<span>Sphere</span></div>
        <h1>Welcome back</h1>
        <p>Log in as admin or student.</p>

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
