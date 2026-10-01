import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Logo } from './UI.jsx';

const links = [
  ['Dashboard', '/finance', '⌂'],
  ['Quotations', '/finance/quotations', '◇'],
  ['Invoices', '/finance/invoices', '▤'],
  ['Receipts', '/finance/receipts', '▥'],
  ['Clients', '/finance/clients', '◎'],
  ['AI & Catalog', '/finance/settings/ai', '✦'],
  ['Settings', '/finance/settings', '⚙'],
];

export default function FinanceLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const content = useRef(null);

  useEffect(() => {
    setOpen(false);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(content.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, [location.pathname]);

  return <div className="finance-shell">
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-top"><Logo /><button className="icon-button close-nav" onClick={() => setOpen(false)} aria-label="Close menu">×</button></div>
      <nav>{links.map(([label, to, icon]) => <NavLink key={to} to={to} end={to === '/finance'}><span>{icon}</span>{label}</NavLink>)}</nav>
      <div className="sidebar-user"><div className="avatar">{user?.name?.slice(0, 1) || 'T'}</div><div><strong>{user?.name}</strong><small>{user?.email}</small></div><button onClick={logout} title="Log out">↗</button></div>
    </aside>
    {open && <button className="nav-backdrop" onClick={() => setOpen(false)} aria-label="Close menu" />}
    <section className="finance-main">
      <div className="mobile-bar"><button className="icon-button" onClick={() => setOpen(true)} aria-label="Open menu">☰</button><Logo compact /><span /></div>
      <main ref={content} className="finance-content"><Outlet /></main>
    </section>
  </div>;
}
