'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';

const projectSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  company: z.string().optional(),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().optional(),
  need: z.string().min(1, 'Choose a starting point.'),
  problem: z.string().trim().min(10, 'Add a little more detail about the problem.'),
  budget: z.string().optional(),
  timeline: z.string().optional(),
});

type ProjectValues = z.infer<typeof projectSchema>;

export function ProjectForm({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ProjectValues>({ resolver: zodResolver(projectSchema) });
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('need') !== 'ai-sales-demo') return;
    setValue('need', 'AI or automation');
    setValue('problem', 'I tried the TKO sales demo and would like a similar customer enquiry system for my business.');
  }, [setValue]);
  async function submit(values: ProjectValues) {
    setStatus('');
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (!response.ok) throw new Error('The message could not be sent. Please email hello@tkomotions.com.');
      setStatus('Thanks. Your project enquiry has been sent.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }
  return <form className={`site-contact-form ${className}`} onSubmit={handleSubmit(submit)} noValidate>
    <label className="site-field">Name<input className="site-input" autoComplete="name" {...register('name')} />{errors.name && <small className="site-field-error">{errors.name.message}</small>}</label>
    <label className="site-field">Company<input className="site-input" autoComplete="organization" {...register('company')} /></label>
    <div className={`site-form-pair ${className.includes('kh-project-form') ? 'kh-form-pair' : ''}`}><label className="site-field">Email<input className="site-input" type="email" autoComplete="email" {...register('email')} />{errors.email && <small className="site-field-error">{errors.email.message}</small>}</label><label className="site-field">Phone / WhatsApp<input className="site-input" type="tel" autoComplete="tel" {...register('phone')} /></label></div>
    <label className="site-field">What are you trying to build?<select className="site-input" defaultValue="" {...register('need')}><option value="" disabled>Choose a starting point</option><option>Software system</option><option>AI or automation</option><option>Digital product</option><option>Website or digital experience</option><option>Integration</option><option>Still defining the problem</option></select>{errors.need && <small className="site-field-error">{errors.need.message}</small>}</label>
    <label className="site-field">What problem are you solving?<textarea className="site-input" rows={4} {...register('problem')} />{errors.problem && <small className="site-field-error">{errors.problem.message}</small>}</label>
    <div className={`site-form-pair ${className.includes('kh-project-form') ? 'kh-form-pair' : ''}`}><label className="site-field">Budget<select className="site-input" defaultValue="" {...register('budget')}><option value="">Choose range</option><option>Under ₦500,000</option><option>₦500,000–₦2,000,000</option><option>₦2,000,000–₦5,000,000</option><option>₦5,000,000+</option><option>To be discussed</option></select></label><label className="site-field">Timeline<select className="site-input" defaultValue="" {...register('timeline')}><option value="">Choose timing</option><option>As soon as possible</option><option>1–3 months</option><option>3–6 months</option><option>Exploring</option></select></label></div>
    <button className="site-button site-button-primary" disabled={isSubmitting}>{isSubmitting ? 'SENDING…' : 'SEND PROJECT ENQUIRY'} <span aria-hidden="true">↗</span></button>
    {status && <p className="site-form-status" data-state={status.startsWith('Thanks') ? 'success' : 'error'} role="status">{status}</p>}
  </form>;
}