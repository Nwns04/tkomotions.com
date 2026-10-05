'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';

type HeroSlide = {
  theme: string;
  desktop: string;
  mobile: string;
  alt: string;
  position: string;
};

const slides: HeroSlide[] = [
  { theme: 'SOFTWARE SYSTEMS', desktop: '/images/hero/people-candidate.webp', mobile: '/images/hero/people-candidate.webp', alt: 'African software developers collaborating around a computer in a working studio.', position: '68% center' },
  { theme: 'AI SOLUTIONS', desktop: '/images/hero/compute-wide.webp', mobile: '/images/hero/compute-portrait.webp', alt: 'Server racks and network connections inside a data center.', position: 'center center' },
  { theme: 'BUSINESS AUTOMATION', desktop: '/images/hero/system-candidate.webp', mobile: '/images/hero/system-portrait.webp', alt: 'Industrial robotic arms working on a vehicle assembly line.', position: 'center center' },
  { theme: 'DIGITAL PRODUCTS', desktop: '/images/hero/build-candidate.webp', mobile: '/images/hero/build-portrait.webp', alt: 'Engineering plans and tools on a workbench as a design is developed.', position: 'center center' },
  { theme: 'SMARTER OPERATIONS', desktop: '/images/hero/movement-wide.webp', mobile: '/images/hero/movement-portrait.webp', alt: 'Aerial view of shipping containers and transport lanes at a cargo port.', position: 'center center' },
  { theme: 'NEW POSSIBILITIES', desktop: '/images/hero/city-lagos-wide.webp', mobile: '/images/hero/city-lagos-portrait.webp', alt: 'Lagos Island skyline across the lagoon at sunset, photographed from the waterfront.', position: 'center 48%' },
];

export function HeroCarousel() {
  const autoplay = useRef(Autoplay({ delay: 6500, stopOnInteraction: false, stopOnMouseEnter: false, stopOnFocusIn: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [autoplay.current]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return undefined;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) emblaApi.plugins().autoplay?.stop();
    else emblaApi.plugins().autoplay?.play();
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLElement && event.target.closest('button, a, input, select, textarea')) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      emblaApi?.scrollNext();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      emblaApi?.scrollPrev();
    }
  }

  return (
    <section
      className="kh-hero relative isolate overflow-hidden bg-white"
      aria-label="TKO Motions visual introduction"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 z-0 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {slides.map((slide, index) => (
            <div
              key={slide.theme}
              className="relative min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              <picture className="absolute inset-0">
                {slide.mobile !== slide.desktop && (
                  <source media="(max-width: 760px)" srcSet={slide.mobile} type="image/webp" />
                )}
                <Image
                  src={slide.desktop}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: slide.position }}
                />
              </picture>
            </div>
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden="true"
        style={{ background: 'linear-gradient(90deg, rgba(185,243,55,0.82) 0%, rgba(185,243,55,0.58) 32%, rgba(185,243,55,0.2) 62%, rgba(185,243,55,0.05) 100%)' }}
      />

      <div className="kh-hero-content kh-container relative z-20 flex flex-col justify-between pt-7 pb-5">
        <div className="flex justify-between gap-5 font-mono text-[8px] tracking-[0.08em] text-[#111]/80">
          <span>TKO MOTIONS</span>
          <span aria-live="polite">{String(selectedIndex + 1).padStart(2, '0')} / 06</span>
        </div>

        <div className="mx-auto w-full max-w-[1260px] py-14">
          <p className="mb-6 font-mono text-[10px] tracking-[0.08em] text-[#111]/75">{slides[selectedIndex].theme}</p>
          <h1 className="kh-hero-title grid max-w-full text-[clamp(64px,8vw,128px)] font-bold leading-[0.85] tracking-[-0.075em] text-[#111]">
            <span className="block whitespace-nowrap">WHAT</span>
            <span className="block whitespace-nowrap pl-[clamp(48px,8vw,132px)]">NEEDS</span>
            <span className="block whitespace-nowrap">TO MOVE<span className="text-[#00a651]">?</span></span>
          </h1>
          <p className="mt-5 text-[clamp(18px,2vw,25px)] font-semibold text-[#111]">Business Innovation &amp; Digital Solutions</p>
          <div className="mt-6 mb-4 h-0.5 w-[min(68%,760px)] bg-[#00a651]" />
          <div className="flex flex-wrap items-end justify-between gap-7">
            <p className="max-w-[460px] font-mono text-[13px] font-medium leading-relaxed text-[#20231e]">
              We identify the friction, build the system, and help businesses move forward.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/solutions/ai#sales-demo"
                className="group relative inline-flex min-h-10 items-center gap-3 overflow-hidden border border-white/40 bg-white/10 px-4 font-mono text-[9px] font-medium tracking-[0.055em] text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] backdrop-blur-[2px] transition-all duration-300 hover:bg-white/20 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)]"
                style={{ color: '#fff' }}
              >
                {/* shimmer sweep */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent [animation:shimmer_6s_ease-in-out_infinite]"
                />
                {/* top inner highlight */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                />
                {/* green accent edge */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[#14532d]/80" />

                <span className="relative">TRY THE SALES AGENT</span>
                <b className="relative grid h-7 w-7 place-items-center border border-white/50 text-[15px] font-normal transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </b>
              </a>
              <a href="#systems" className="group inline-flex items-center gap-3.5 font-mono text-[8px] font-medium tracking-[0.055em] text-white" style={{ color: '#fff' }}>
                <span className="relative">
                  EXPLORE WHAT WE BUILD
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
                </span>
                <b className="grid h-[30px] w-[30px] place-items-center border border-white text-[17px] font-normal transition-transform duration-300 group-hover:translate-x-0.5">
                  →
                </b>
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 border-t border-[#111]/50 pt-3">
          <div className="hidden max-w-[155px] font-mono text-[6px] leading-relaxed tracking-[0.025em] text-[#111]/65 md:block">
            {selectedIndex === 0 && (
              <a href="https://commons.wikimedia.org/wiki/File:Lagos-centre-from-executive-lounge-Continental-hotel-2026-IMG_7970.jpg" target="_blank" rel="noreferrer" className="hover:text-[#111] hover:underline">
                PHOTO: FRANK VAN ECK · CC BY-SA 4.0
              </a>
            )}
          </div>
          <div className="grid w-full grid-cols-6 gap-3 md:w-[min(810px,calc(100%-100px))]" aria-label="Choose a slide">
            {slides.map((slide, index) => (
              <button
                key={slide.theme}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={`Show slide ${index + 1}: ${slide.theme}`}
                aria-current={index === selectedIndex ? 'true' : undefined}
                className="grid grid-rows-[auto_3px] gap-1.5 text-left"
              >
                <span className={`font-mono text-[8px] ${index === selectedIndex ? 'text-[#111]' : 'text-[#111]/55'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <i className="relative block h-0.5 overflow-hidden bg-[#111]/25">
                  <b className={`block h-full w-full origin-left bg-[#b7ff00] transition-transform ${index === selectedIndex ? 'scale-x-100 duration-[6500ms] ease-linear' : 'scale-x-0 duration-200'}`} />
                </i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}