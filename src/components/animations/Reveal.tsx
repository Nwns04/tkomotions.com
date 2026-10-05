'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, y = 28, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from(ref.current, {
      y,
      autoAlpha: 0,
      duration: 0.7,
      delay,
      ease: 'power2.out',
      scrollTrigger: { trigger: ref.current, start: 'top 86%', once: true },
    });
  }, { scope: ref, dependencies: [delay, y] });

  return <div ref={ref} className={className}>{children}</div>;
}