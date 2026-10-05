import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiMessage } from '../../api/client.js';
import { Button, Logo, Notice } from '../components/UI.jsx';

export default function LoginPage() {
  const auth = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const panel = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.from(panel.current, { opacity: 0, y: 20, duration: 0.55, ease: 'power3.out' });
  }, []);
  if (!auth.loading && auth.authenticated) return <Navigate to="/finance" replace />;

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await auth.login(form);
      navigate(location.state?.from?.pathname || '/finance', { replace: true });
    } catch (requestError) { setError(requestError.response?.status >= 500 ? 'Finance is temporarily unavailable. Please try again once the service is restored.' : apiMessage(requestError)); }
    finally { setBusy(false); }
  }

  return <div className="login-page"><section className="login-story"><Logo /><div><span className="eyebrow">Private workspace</span><h1>Clear finances.<br />Confident motion.</h1><p>Create polished invoices, record payments, and issue receipts without the clutter of full accounting software.</p></div><small>TKO Motions · Internal use only</small></section><section className="login-panel"><form ref={panel} onSubmit={submit}><span className="eyebrow">TKO Finance</span><h2>Welcome back</h2><p>Sign in to manage your business documents.</p><Notice>{error || auth.serviceError}</Notice><label className="field"><span>Email address</span><input type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label className="field"><span>Password</span><input type="password" autoComplete="current-password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label><Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</Button><small className="secure-note">Protected by a secure, HTTP-only session.</small></form></section></div>;
}
