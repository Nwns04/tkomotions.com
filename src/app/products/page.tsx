import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Products and experiments developed by TKO Motions — distinct from client systems.',
  alternates: { canonical: '/products' },
};

const clientSystems = [
  {
    number: '001',
    name: 'LEAD SYSTEM',
    description: 'A business lead discovery and outreach system designed to help identify potential opportunities and organize business development workflows.',
    href: '/work/lead-system',
    liveUrl: 'https://leaddemo.onrender.com/work/',
    preview: '/images/hero/people-candidate.webp',
  },
  {
    number: '002',
    name: 'TKO MOTIONS',
    description: 'The TKO Motions digital platform and company system.',
    href: '/work/tko-motions',
    liveUrl: 'https://tkomotions.com',
    preview: '/images/hero/city-lagos-wide.webp',
  },
];

const tkoProducts = [
  {
    name: 'TAXBOT NAIJA',
    description: 'A WhatsApp-first Nigerian tax assistant combining tax information, calculations and AI-assisted guidance.',
    href: '/work/taxbot-naija',
    liveUrl: 'https://taxbotnaija.com',
    preview: '/images/hero/people-candidate.webp',
  },
];

export default function ProductsPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>PRODUCTS</span>
            <span className="text-right">TKO BUILDS</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            SYSTEMS
            <br />
            WE <em className="not-italic text-kh-green">BUILT.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            Two categories: systems built for clients, and products owned and developed by TKO Motions.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <Reveal>
          <p className="kh-label mb-8 flex justify-between border-b border-kh-rule pb-3">
            <span>CLIENT SYSTEMS</span>
            <span className="text-right">BUILT FOR BUSINESSES</span>
          </p>
        </Reveal>
        <div className="grid gap-12 md:grid-cols-2">
          {clientSystems.map((item, index) => (
            <Reveal key={item.number} delay={index * 0.05}>
              <article className="group">
                <Link href={item.href} className="relative block aspect-[16/10] overflow-hidden bg-kh-soft">
                  <Image
                    src={item.preview}
                    alt={`${item.name} preview`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </Link>
                <div className="mt-6 border-t border-kh-rule pt-5">
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">BUILD / {item.number}</span>
                  <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em] transition-colors group-hover:text-kh-green">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-kh-muted">{item.description}</p>
                  <div className="mt-5 flex gap-5 font-mono text-[9px] tracking-[0.055em]">
                    <a href={item.liveUrl} target="_blank" rel="noreferrer" className="text-kh-green">
                      VIEW LIVE ↗
                    </a>
                    <Link href={item.href} className="text-kh-muted hover:text-kh-green">
                      CASE STUDY →
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-8 flex justify-between border-b border-kh-rule pb-3">
              <span>TKO PRODUCTS</span>
              <span className="text-right">OWNED &amp; DEVELOPED</span>
            </p>
          </Reveal>
          <div className="grid gap-12 md:grid-cols-2">
            {tkoProducts.map((item) => (
              <Reveal key={item.name}>
                <article className="group">
                  <Link href={item.href} className="relative block aspect-[16/10] overflow-hidden bg-white">
                    <Image
                      src={item.preview}
                      alt={`${item.name} preview`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </Link>
                  <div className="mt-6 border-t border-kh-rule pt-5">
                    <span className="font-mono text-[9px] tracking-[0.055em] text-kh-green">TKO PRODUCT</span>
                    <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em] transition-colors group-hover:text-kh-green">
                      {item.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-kh-muted">{item.description}</p>
                    <div className="mt-5 flex gap-5 font-mono text-[9px] tracking-[0.055em]">
                      <a href={item.liveUrl} target="_blank" rel="noreferrer" className="text-kh-green">
                        EXPLORE ↗
                      </a>
                      <Link href={item.href} className="text-kh-muted hover:text-kh-green">
                        DETAILS →
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}

            <Reveal delay={0.1}>
              <div className="border border-dashed border-kh-rule p-10">
                <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">EXPERIMENTS</span>
                <h3 className="mt-3 text-xl font-medium tracking-[-0.03em] text-kh-muted">
                  EARLY IDEAS &amp; PROTOTYPES
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-kh-muted">
                  Experiments appear here as they become real. Nothing invented to fill the space.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="kh-container py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
              WANT ONE OF THESE FOR YOUR BUSINESS?
            </h2>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center gap-3 border border-kh-green bg-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:bg-transparent hover:text-kh-green"
            >
              START A PROJECT
              <span aria-hidden="true" className="text-base">↗</span>
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
