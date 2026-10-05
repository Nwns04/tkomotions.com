import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectForm } from '@/components/contact/ProjectForm';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Tell TKO Motions what you are trying to build, improve, or automate.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>PROJECT INTAKE</span>
            <span className="text-right">START WITH THE PROBLEM</span>
          </p>
        </Reveal>

        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            WHAT SHOULD
            <br />
            <em className="not-italic text-kh-green">MOVE?</em>
          </h1>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted md:text-xl">
            Tell us what is not working, what you are trying to build, or what opportunity you are exploring.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal>
            <div className="border-t border-kh-rule pt-8">
              <p className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">CONTACT</p>
              <h2 className="mt-6 text-3xl font-medium tracking-[-0.04em] md:text-5xl">We would love to hear the context.</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-kh-muted">
                Share the challenge, the opportunity, or the idea, and we will help you clarify what kind of system, product, or process is worth building.
              </p>

              <div className="mt-8 space-y-4">
                <Link href="mailto:hello@tkomotions.com" className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.055em] text-kh-green">
                  HELLO@TKOMOTIONS.COM <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="rounded-none border border-kh-rule bg-kh-soft p-4 md:p-6">
              <ProjectForm className="kh-project-form" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
