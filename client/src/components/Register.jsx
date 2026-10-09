// Screen 3 - Student registration
import { useState } from 'react';
import { api } from '../api';
import { Notice } from './ui';

export default function Register({ onSuccess, go }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Updates one field of the form, e.g. update('email', 'a@b.com')
  const update = (field, value) => setForm({ ...form, [field]: value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/register', { method: 'POST', body: form });
      onSuccess(data);           // the new student is logged in straight away
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
        <h1>Create account</h1>
        <p>Student registration.</p>

        <form onSubmit={handleSubmit}>
          <input placeholder="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          <input type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          <Notice>{error}</Notice>
          <button className="primary full" disabled={loading}>{loading ? 'Creating...' : 'Sign Up'}</button>
        </form>

        <a onClick={() => go('login')}>Already have an account? Login</a>
      </div>
    </div>
  );
}
