'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1600&q=80',
    title: 'BUY AND SELL ART\nWITH 0% COMMISSION',
    subtitle: 'India\'s largest art portal — discover original paintings & digital prints',
    cta: { label: 'Explore Gallery', href: '/art-gallery' },
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1600&q=80',
    title: 'CURATORS\' PICKS\nHAND-SELECTED FOR YOU',
    subtitle: 'Exceptional artwork chosen by our team of art experts',
    cta: { label: 'View Curators\' Picks', href: '/art-gallery?collection=curators-picks' },
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1600&q=80',
    title: 'SUPPORT INDEPENDENT\nARTISTS DIRECTLY',
    subtitle: 'Every purchase goes directly to the artist — no middlemen',
    cta: { label: 'Meet the Artists', href: '/artists' },
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent((index + slides.length) % slides.length);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative w-full h-[480px] md:h-[560px] lg:h-[640px] overflow-hidden bg-gray-900">
      {/* Background Images */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/70" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-16 px-6 lg:px-20 max-w-[1280px] mx-auto">
        <div
          key={current}
          className="animate-[fadeInUp_0.6s_ease_forwards]"
        >
          <h1 className="font-playfair text-white text-3xl md:text-5xl lg:text-6xl font-bold leading-tight whitespace-pre-line mb-4 drop-shadow-sm">
            {slide.title}
          </h1>
          <p className="text-white/80 text-sm md:text-base mb-6 max-w-md">
            {slide.subtitle}
          </p>
          <Link href={slide.cta.href} className="btn-primary">
            {slide.cta.label}
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-6 lg:left-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? 'bg-[#e63329] w-6 h-2'
                : 'bg-white/60 w-2 h-2 hover:bg-white'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrow Controls */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
