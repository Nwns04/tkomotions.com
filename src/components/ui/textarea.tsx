import type { TextareaHTMLAttributes } from 'react';

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`site-input ${props.className ?? ''}`} {...props} />;
}