import { Link } from 'react-router-dom';

export function Logo({ compact = false }) {
  return <div className="brand-lockup"><span className="brand-mark">TKO</span>{!compact && <span><b>TKO</b> Finance<small>Internal tools</small></span>}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="heading-actions">{actions}</div>}</header>;
}

export function Button({ as: Component = 'button', variant = 'primary', className = '', ...props }) {
  return <Component className={`button button-${variant} ${className}`} {...props} />;
}

export function LinkButton({ to, children, variant = 'primary', ...props }) {
  return <Button as={Link} to={to} variant={variant} {...props}>{children}</Button>;
}

export function EmptyState({ title, body, action, to }) {
  return <div className="empty-state"><div className="empty-icon">↗</div><h3>{title}</h3><p>{body}</p>{action && <LinkButton to={to}>{action}</LinkButton>}</div>;
}

export function StatusBadge({ status }) {
  return <span className={`status status-${String(status).toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

export function Notice({ type = 'error', children }) {
  return children ? <div className={`notice notice-${type}`} role="alert">{children}</div> : null;
}

export function Field({ label, error, children, hint }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}{error && <small className="field-error">{error}</small>}</label>;
}

export function LoadingBlock() { return <div className="loading-block" role="status" aria-live="polite"><span className="sr-only">Loading…</span><span /><span /><span /></div>; }
