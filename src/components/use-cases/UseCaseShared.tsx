import Link from 'next/link';
import type { ReactNode } from 'react';
import { assessmentHref } from '@/lib/use-cases';

export const headingClass = 'text-3xl font-medium leading-[1.08] tracking-[-0.045em] md:text-4xl';
export const copyClass = 'text-base leading-relaxed text-kh-muted';
export function UseCaseActions({ slug, dark = false }: { slug?: string; dark?: boolean }) {
  return <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
    <Link href={assessmentHref(slug)} className="inline-flex min-h-12 items-center justify-between gap-5 border border-kh-green bg-kh-green px-5 py-3 text-sm text-white! transition-colors hover:bg-kh-green-deep">Get a Free Business Assessment <span aria-hidden="true" className="text-kh-lime">↗</span></Link>
    <Link href="/solutions/ai" className={'inline-flex min-h-12 items-center justify-between gap-5 border px-5 py-3 text-sm transition-colors ' + (dark ? 'border-white/40 text-white hover:border-kh-lime' : 'border-kh-rule text-kh-green hover:border-kh-green')}>View AI Solutions <span aria-hidden="true">→</span></Link>
  </div>;
}
export function UseCaseSection({ id, number, label, title, children, soft = false }: { id: string; number: string; label: string; title: string; children: ReactNode; soft?: boolean }) {
  return <section id={id} className={'scroll-mt-24 py-12 md:py-16 ' + (soft ? 'bg-kh-soft' : '')} aria-labelledby={id + '-title'}>
    <div className="kh-container">
      <div className="grid gap-7 border-t border-kh-rule pt-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-16">
        <div><p className="kh-label">{number} / {label}</p><h2 id={id + '-title'} className={'mt-4 max-w-xl ' + headingClass}>{title}</h2></div>
        <div className="min-w-0 space-y-5">{children}</div>
      </div>
    </div>
  </section>;
}
export function Workflow({ steps }: { steps: readonly string[] }) {
  return <ol className="grid gap-0" aria-label="Customer journey">
    {steps.map((step, index) => <li key={step} className="relative grid min-h-16 grid-cols-[2.5rem_1fr] items-start gap-4 pb-6 last:pb-0">
      <span aria-hidden="true" className="relative z-10 flex h-9 w-9 items-center justify-center border border-kh-green bg-kh-soft font-mono text-xs text-kh-green">{String(index + 1).padStart(2, '0')}</span>
      {index < steps.length - 1 && <span aria-hidden="true" className="absolute top-9 bottom-0 left-[1.1rem] border-l border-kh-rule" />}
      <p className="pt-1 text-base leading-relaxed">{step}</p>
    </li>)}
  </ol>;
}
export function UseCaseFinalCTA({ slug }: { slug?: string }) {
  return <section className="bg-kh-green py-16 text-white md:py-20">
    <div className="kh-container"><p className="font-mono text-[10px] tracking-[0.08em] text-kh-lime">NEXT STEP / START WITH THE PROBLEM</p>
      <h2 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.05em] md:text-5xl">Not sure which solution fits your business?</h2>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80">Tell us what your business does, how customers currently contact you and where you’re losing time. We’ll recommend the simplest solution.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href={assessmentHref(slug)} className="inline-flex min-h-12 items-center justify-between gap-5 bg-kh-lime px-5 py-3 text-sm text-kh-green! hover:bg-white">Get a Free Business Assessment <span aria-hidden="true">↗</span></Link><Link href="/contact" className="inline-flex min-h-12 items-center justify-between gap-5 border border-white/40 px-5 py-3 text-sm hover:border-kh-lime">Talk to TKO Motions <span aria-hidden="true">→</span></Link></div>
    </div>
  </section>;
}
