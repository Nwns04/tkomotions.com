import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="kh-container flex min-h-[70vh] flex-col justify-center py-20">
      <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
        <span>404</span>
        <span className="text-right">NOT FOUND</span>
      </p>
      <h1 className="max-w-4xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
        THIS PAGE
        <br />
        <em className="not-italic text-kh-green">MOVED.</em>
      </h1>
      <p className="mt-8 max-w-xl text-lg leading-relaxed text-kh-muted">
        The page you&apos;re looking for isn&apos;t here. But the system is still moving.
      </p>
      <div className="mt-10 flex flex-wrap gap-6">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center gap-3 border border-kh-green bg-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:bg-transparent hover:text-kh-green"
        >
          BACK TO TKO MOTIONS
          <span aria-hidden="true" className="text-base">→</span>
        </Link>
        <Link
          href="/contact"
          className="inline-flex min-h-12 items-center gap-3 border border-kh-rule px-5 font-mono text-[9px] tracking-[0.055em] text-kh-ink transition-colors hover:border-kh-green hover:text-kh-green"
        >
          START A PROJECT
          <span aria-hidden="true" className="text-base">↗</span>
        </Link>
      </div>
    </section>
  );
}