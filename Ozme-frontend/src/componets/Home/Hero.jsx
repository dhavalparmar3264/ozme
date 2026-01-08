import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import hero1 from '../../assets/image/hero1.png';
import hero2 from '../../assets/image/hero2.png';
import hero3 from '../../assets/image/hero3.png';


const HeroCarousel = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slides = [
    {
      image: hero1,
      tagline: 'LUXURY PERFUME COLLECTION 2025',
      title: 'The New',
      titleHighlight: 'Elegance',
      subtitle: 'Discover the captivating world of premium fragrances crafted for those who appreciate the finer things in life.',
      cta: 'SHOP NOW'
    },
    {
      image: hero2,
      tagline: 'LUXURY PERFUME COLLECTION 2025',
      title: 'Your Perfect',
      titleHighlight: 'Signature',
      subtitle: 'Experience timeless elegance with our exclusive collection. Each bottle tells a unique story of sophistication.',
      cta: 'EXPLORE NOW'
    },
    {
      image: hero3,
      tagline: 'LUXURY PERFUME COLLECTION 2025',
      title: 'Timeless',
      titleHighlight: 'Sophistication',
      subtitle: 'Indulge in our curated selection of rare and exclusive fragrances from around the world.',
      cta: 'DISCOVER MORE'
    }
  ];

  const nextSlide = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1));
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const prevSlide = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1));
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const goToSlide = (index) => {
    if (!isTransitioning && index !== currentIndex) {
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  // Auto-advance slides with delay
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [isTransitioning]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* Slides Container */}
      <div className="relative h-full w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              currentIndex === index
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image with Zoom Effect */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ease-out"
              style={{
                backgroundImage: `url(${slide.image})`,
                transform: currentIndex === index ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {/* Elegant Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center justify-center text-center px-3 md:px-4 z-20">
              <div className="max-w-4xl mt-15 mx-auto">
                {/* Tagline */}
                <div
                  className={`text-sm md:text-base lg:text-lg text-center px-3 leading-tight md:leading-normal tracking-[0.2em] md:tracking-[0.3em] lg:tracking-[0.4em] text-amber-300/90 mb-4 md:mb-6 lg:mb-8 font-light transition-all duration-700 delay-300 ${
                    currentIndex === index
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  {slide.tagline}
                </div>

                {/* Title with Highlight */}
                <h1 className="text-xl md:text-3xl lg:text-5xl mb-4 md:mb-5 lg:mb-6 leading-tight md:leading-normal">
                  <span
                    className={`block text-white font-light tracking-tight transition-all duration-700 delay-500 ${
                      currentIndex === index
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8'
                    }`}
                  >
                    {slide.title}
                  </span>
                  <span
                    className={`block font-serif italic text-amber-300 transition-all duration-700 delay-700 ${
                      currentIndex === index
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{
                      textShadow: '0 4px 20px rgba(252, 211, 77, 0.4)',
                    }}
                  >
                    {slide.titleHighlight}
                  </span>
                </h1>

                {/* Decorative Line */}
                <div className="flex justify-center mb-8">
                  <div
                    className={`h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent transition-all duration-700 delay-900 ${
                      currentIndex === index ? 'w-48 opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                </div>

                {/* Subtitle */}
                <p
                  className={`text-base md:text-lg lg:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed font-light transition-all duration-700 delay-1000 ${
                    currentIndex === index
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  {slide.subtitle}
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => navigate('/shop')}
                  className={`bg-white text-black px-12 py-4 text-xs tracking-[0.3em] font-semibold transition-all duration-700 delay-1100 hover:bg-amber-300 hover:shadow-2xl hover:shadow-amber-300/20 ${
                    currentIndex === index
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  {slide.cta}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {/* <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 backdrop-blur-sm text-white border border-white/20 rounded-full hover:bg-white/10 hover:border-amber-300/40 transition-all duration-300 z-30 flex items-center justify-center"
        aria-label="Previous slide"
        disabled={isTransitioning}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 backdrop-blur-sm text-white border border-white/20 rounded-full hover:bg-white/10 hover:border-amber-300/40 transition-all duration-300 z-30 flex items-center justify-center"
        aria-label="Next slide"
        disabled={isTransitioning}
      >
        <ChevronRight size={24} />
      </button> */}

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className={`h-px transition-all duration-500 ${
              currentIndex === index
                ? 'bg-amber-300 w-12'
                : 'bg-white/30 w-8 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroCarousel;