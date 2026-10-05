import Link from 'next/link';
import { Mark } from './Mark';

const primaryNav = [
  { number: '01', label: 'WORK', href: '/work' },
  { number: '02', label: 'CAPABILITIES', href: '/capabilities' },
  { number: '03', label: 'ABOUT', href: '/about' },
  { number: '04', label: 'FIELD NOTES', href: '/field-notes' },
  { number: '05', label: 'CONTACT', href: '/contact' },
];

const secondaryNav = [
  { label: 'AI SOLUTIONS', href: '/solutions/ai' },
  { label: 'USE CASES', href: '/use-cases' },
  { label: 'PRODUCTS', href: '/products' },
  { label: 'PROCESS', href: '/process' },
  { label: 'CAREERS', href: '/careers' },
  { label: 'PARTNERS', href: '/partners' },
  { label: 'FUTURE INNOVATORS', href: '/future-innovators' },
  { label: 'FAQ', href: '/faq' },
];

const legalNav = [
  { label: 'PRIVACY', href: '/privacy' },
  { label: 'TERMS', href: '/terms' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-kh-green-deep text-white">
      <div className="kh-container pt-7 pb-4">
        <div className="grid min-h-18.75 grid-cols-1 items-center gap-6 border-b border-white/25 pb-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:pb-0">
          <Mark footer />
          <span className="hidden font-mono text-[7px] leading-relaxed text-white/75 md:block">INNOVATE. BUILD. MOVE.</span>
          <span className="hidden font-mono text-[7px] leading-relaxed text-white/75 md:block">BUSINESS INNOVATION<br />&amp; DIGITAL SOLUTIONS</span>
          <Link href="/" className="font-mono text-[8px] tracking-[0.055em] text-kh-lime">BACK TO TOP ↑</Link>
        </div>

        <div className="flex flex-col gap-2 border-b border-white/25 py-4 text-xs sm:flex-row sm:flex-wrap sm:gap-x-6">
          <a href="mailto:temitopekehinde@tkomotions.com" className="break-all">temitopekehinde@tkomotions.com</a>
          <a href="tel:+2347040739828">+234 704 073 9828</a>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3 border-b border-white/25 py-4" aria-label="Footer primary navigation">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className="flex gap-2 font-mono text-[7px] tracking-[0.055em] text-white/80 transition-colors hover:text-kh-lime">
              <span className="text-kh-lime">{item.number}</span>{item.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-wrap gap-x-6 gap-y-3 border-b border-white/25 py-4" aria-label="Footer secondary and legal navigation">
          {[...secondaryNav, ...legalNav].map((item) => (
            <Link key={item.href} href={item.href} className="font-mono text-[7px] tracking-[0.055em] text-white/65 transition-colors hover:text-kh-lime">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 pt-3 font-mono text-[7px] tracking-[0.03em] text-white/60 md:flex-row md:items-center md:justify-between">
          <span>© {year} TKO MOTIONS LTD · RC 8976551</span>
          <span>NIGERIA</span>
          <Link href="/contact" className="text-kh-lime">START A PROJECT ↗</Link>
        </div>
      </div>
    </footer>
  );
}