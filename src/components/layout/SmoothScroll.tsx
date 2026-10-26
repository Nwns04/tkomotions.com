'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;

    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      respectReducedMotion: true,
    });
    // A modal must also stop an animation that was already in progress.
    // Counting locks avoids resuming while another modal still needs the lock.
    let modalLocks = 0;
    let resumeAfterModal = false;
    const handleModalScrollLock = (event: Event) => {
      const locked = (event as CustomEvent<{ locked?: boolean }>).detail?.locked;
      if (locked === true) {
        if (modalLocks === 0) {
          resumeAfterModal = !lenis.isStopped;
          lenis.stop();
        }
        modalLocks++;
      } else if (locked === false && modalLocks > 0) {
        modalLocks--;
        if (modalLocks === 0 && resumeAfterModal) lenis.start();
      }
    };
    window.addEventListener('tko:modal-scroll-lock', handleModalScrollLock);
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener('tko:modal-scroll-lock', handleModalScrollLock);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return children;
}