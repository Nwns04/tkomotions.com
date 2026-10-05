'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Mark } from './Mark';

const navItems = [
  { number: '01', label: 'WORK', href: '/work' },
  { number: '02', label: 'CAPABILITIES', href: '/capabilities' },
  { number: '03', label: 'AI SOLUTIONS', href: '/solutions/ai' },
  { number: '04', label: 'ABOUT', href: '/about' },
  { number: '05', label: 'FIELD NOTES', href: '/field-notes' },
  { number: '06', label: 'CONTACT', href: '/contact' },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 min-h-[74px] border-b border-kh-rule bg-white/95 backdrop-blur-sm">
      <div className="kh-container flex h-[74px] items-center justify-between gap-6">
        <Mark />

        <nav className="hidden items-center gap-[18px] md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center gap-[7px] font-mono text-[8px] tracking-[0.055em] transition-colors ${isActive(item.href) ? 'text-kh-green' : 'text-[#666b63] hover:text-kh-green'}`}
            >
              <span className={isActive(item.href) ? 'text-kh-green' : 'text-[#9ba097]'}>{item.number}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-1 inline-flex min-h-[39px] items-center gap-2 border border-kh-green px-3 font-mono text-[8px] tracking-[0.055em] text-kh-green transition-colors hover:bg-kh-green hover:text-white"
          >
            START A PROJECT <span aria-hidden="true" className="text-base leading-none">↗</span>
          </Link>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="flex h-[38px] w-[38px] flex-col items-center justify-center gap-1.5 border border-kh-rule md:hidden"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
          >
            <span className="h-px w-5 bg-kh-green" />
            <span className="h-px w-5 bg-kh-green" />
          </SheetTrigger>
          <SheetContent side="right" aria-describedby={undefined}>
            <SheetHeader>
              <SheetTitle className="text-left font-mono text-[10px] tracking-[0.08em] text-kh-muted">
                NAVIGATION
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 grid" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 border-b border-kh-rule font-mono text-[9px] tracking-[0.055em] ${isActive(item.href) ? 'text-kh-green' : 'text-[#666b63]'}`}
                >
                  <span className="text-[8px] text-[#9ba097]">{item.number}</span>
                  {item.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="mt-4 inline-flex min-h-11 items-center justify-between border border-kh-green px-4 font-mono text-[9px] tracking-[0.055em] text-kh-green"
              >
                START A PROJECT <span aria-hidden="true">↗</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}