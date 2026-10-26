import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, Notice } from './UI.jsx';

export default function OutreachModal({ label, title, busy = false, onClose, error = '', message = '', onRefresh, children }) {
  const dialog = useRef(null);
  const errorBanner = useRef(null);
  const pointerOnBackdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    window.dispatchEvent(new CustomEvent('tko:modal-scroll-lock', { detail: { locked: true } }));
    // Keep native and smooth scrolling from moving the document behind the dialog.
    // Preserve existing inline settings so closing/unmounting restores the page.
    const saved = [document.documentElement, document.body].flatMap(node =>
      ['overflow-x', 'overflow-y'].map(property => ({ node, property,
        value: node.style.getPropertyValue(property), priority: node.style.getPropertyPriority(property) })));
    for (const { node, property } of saved) node.style.setProperty(property, 'hidden');
    element.showModal();
    return () => {
      if (element.open) element.close();
      for (const { node, property, value, priority } of saved) {
        if (value) node.style.setProperty(property, value, priority);
        else node.style.removeProperty(property);
      }
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
      window.dispatchEvent(new CustomEvent('tko:modal-scroll-lock', { detail: { locked: false } }));
    };
  }, []);
  useEffect(() => { if (error) errorBanner.current?.focus({ preventScroll: true }); }, [error]);
  function containFocus(event) {
    if (event.key !== 'Tab') return;
    const element = dialog.current;
    const controls = [...element.querySelectorAll('button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')]
      .filter(control => !control.matches(':disabled') && control.getClientRects().length > 0 && !control.closest('[inert]'));
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); element.focus(); return; }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !controls.includes(active))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (active === last || !controls.includes(active))) {
      event.preventDefault(); first.focus();
    }
  }
  function outside(event) {
    if (event.target !== dialog.current) return false;
    const rect = dialog.current.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }
  if (typeof document === 'undefined') return null;
  // Native top-layer rendering escapes the animated Finance content and traps focus.
  return createPortal(<dialog ref={dialog} className="outreach-settings-modal" aria-label={label} aria-modal="true" tabIndex={-1} data-lenis-prevent onKeyDown={containFocus}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onPointerDown={event => { pointerOnBackdrop.current = outside(event); }}
    onClick={event => { if (!busy && pointerOnBackdrop.current && outside(event)) onClose(); pointerOnBackdrop.current = false; }}>
    <header className="outreach-modal-header"><h2>{title}</h2><Button variant="secondary" disabled={busy} onClick={onClose}>Close</Button></header>
    {(error || message) && <div className="outreach-modal-feedback" data-lenis-prevent>
      {error && <div ref={errorBanner} tabIndex={-1}><Notice>{error}</Notice>{onRefresh && <Button variant="secondary" disabled={busy} onClick={onRefresh}>Refresh contacts</Button>}</div>}
      {!error && message && <Notice type="success">{message}</Notice>}
    </div>}
    <div className="outreach-modal-body" data-lenis-prevent>{children}</div>
  </dialog>, document.body);
}
