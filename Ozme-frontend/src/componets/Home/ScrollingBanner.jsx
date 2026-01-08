import React, { useState, useEffect } from 'react';

const ScrollingBanner = () => {
  const messages = [
    "✨ Free Delivery on All Orders",
    "🎉 First-Time Shopper? Apply Code FIRST15 & Save 15% Instantly",
    "🌸 Crafted with Premium Ingredients for a Signature Scent",
    "🚀 Lightning-Fast Delivery with End-to-End Order Tracking"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const showNextMessage = () => {
      setIsScrolling(true);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        
        setTimeout(() => {
          setIsScrolling(false);
        }, 50);
      }, 600);
    };

    const timer = setTimeout(showNextMessage, 4000);
    return () => clearTimeout(timer);
  }, [currentIndex, messages.length]);

  return (
    <div className="relative bg-black text-white overflow-hidden ">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-70"></div>
      
      {/* Gold accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>
      
      <div className="relative h-10 flex items-center justify-center overflow-hidden">
        {/* Current message */}
        <div 
          className={`absolute w-full text-center transition-all duration-600 ease-in-out ${
            isScrolling 
              ? 'opacity-0 -translate-y-8 scale-95' 
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <p className="text-xs md:text-sm font-light tracking-[0.15em] text-white/90 px-4">
            {messages[currentIndex]}
          </p>
        </div>
        
        {/* Next message (sliding up from below) */}
        <div 
          className={`absolute w-full text-center transition-all duration-600 ease-in-out ${
            isScrolling 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          <p className="text-xs md:text-sm font-light tracking-[0.15em] text-white/90 px-4">
            {messages[(currentIndex + 1) % messages.length]}
          </p>
        </div>
      </div>
      
      {/* Subtle side decorations */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
    </div>
  );
};

export default ScrollingBanner;