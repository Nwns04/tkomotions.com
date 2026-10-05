import type { InputHTMLAttributes } from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`site-input ${props.className ?? ''}`} {...props} />;
}