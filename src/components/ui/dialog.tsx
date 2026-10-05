'use client';

import { useEffect, type ReactNode } from 'react';

export function Dialog({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return <div className="site-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="site-dialog" role="dialog" aria-modal="true" aria-label={label}>{children}</section></div>;
}