export type HeroSlideData = { image: string; alt: string; eyebrow: string; title: string };

export function HeroSlide({ slide }: { slide: HeroSlideData }) {
  return <article className="site-hero-slide"><img src={slide.image} alt={slide.alt} /><div><small>{slide.eyebrow}</small><h1>{slide.title}</h1></div></article>;
}