import Link from 'next/link';
import type { FieldNoteItem } from '@/types';

export function NoteCard({ note }: { note: FieldNoteItem }) {
  const date = note.date ? new Date(note.date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  return <Link className="site-note-card" href={note.url ?? `/field-notes/${note.slug ?? ''}`}><small>{note.category ?? ''}{date ? ` / ${date}` : ''}</small><div><h2>{note.title ?? 'Untitled field note'}</h2><p>{note.description ?? ''}</p></div><b aria-hidden="true">↗</b></Link>;
}