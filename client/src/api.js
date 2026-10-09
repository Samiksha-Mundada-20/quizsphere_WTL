// api.js - one small helper used by every screen to talk to the Express server.

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

function requireApiUrl() {
  if (!API) {
    throw new Error('The QuizSphere API is not configured. Deploy the back end and set the VITE_API_URL repository variable.');
  }
  return API;
}

// Usage:  const quizzes = await api('/quizzes');
//         await api('/quizzes', { method: 'POST', body: { title: 'My quiz' } });
export async function api(path, options = {}) {
  const apiUrl = requireApiUrl();
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = 'Bearer ' + token;   // proves who we are

  let response;
  try {
    response = await fetch(apiUrl + path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (err) {
    throw new Error('Cannot reach the server. Is the back end running on port 5000?');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Token expired or invalid while logged in -> tell App.jsx to log the user out
    if (response.status === 401 && token) window.dispatchEvent(new Event('auth-expired'));
    throw new Error(data.message || 'Something went wrong.');
  }
  return data;
}

// Downloads the results CSV. We use fetch (not a plain link) because the request needs the token.
export async function downloadCsv() {
  const response = await fetch(requireApiUrl() + '/admin/results/export', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  if (!response.ok) throw new Error('Could not export the results.');

  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'quiz-results.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}
