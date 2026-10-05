import type { Metadata } from 'next';
import Link from 'next/link';
import { posts } from '../../../.velite';
import { Reveal } from '@/components/animations/Reveal';
import { FieldNotesList } from '@/components/field-notes/FieldNotesList';

export const metadata: Metadata = {
  title: 'Field Notes',
  description: 'Practical thinking on AI, software, business systems, Nigerian technology, and building products.',
  alternates: { canonical: '/field-notes' },
};

export default function FieldNotesPage() {
  const published = posts
    .filter((post) => !post.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>FIELD NOTES</span>
            <span className="text-right">THINKING IN THE OPEN</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            IDEAS FROM
            <br />
            THE <em className="not-italic text-kh-green">WORKSHOP.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            A place for practical thinking on AI, software, business systems, Nigerian technology, and building products.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <FieldNotesList posts={published} />
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-8">
              <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
                HAVE A PROBLEM WORTH WRITING ABOUT?
              </h2>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-green bg-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:bg-transparent hover:text-kh-green"
              >
                START A CONVERSATION
                <span aria-hidden="true" className="text-base">↗</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}