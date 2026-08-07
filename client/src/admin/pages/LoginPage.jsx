import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { t } from '../../locales/index.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const tt = t.admin.login;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      const dest = location.state?.from || '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message === 'Invalid credentials' ? tt.invalid_credentials : tt.generic_error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-admin-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <div
          className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-white font-extrabold text-xl mx-auto"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #4A6CF7)' }}
        >
          {t.meta.brand_initials}
        </div>
        <h1 className="text-2xl font-extrabold text-admin-heading text-center mb-1">{tt.title}</h1>
        <p className="text-admin-body text-center text-sm mb-6">{tt.subtitle}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tt.email_placeholder}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-admin-heading focus:outline-none focus:border-accent"
            style={{ fontSize: 15 }}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tt.password_placeholder}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-admin-heading focus:outline-none focus:border-accent"
            style={{ fontSize: 15 }}
          />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--color-primary, #4A6CF7), #7C3AED)' }}
          >
            {busy ? tt.submitting : tt.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
