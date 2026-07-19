import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const HomepageBannerSlider: React.FC = () => {
  const { homepageBanners } = useGame();
  const activeBanners = homepageBanners.filter(b => b.enabled).sort((a, b) => a.displayOrder - b.displayOrder);
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleBannerClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevSlide();
    } else if (info.offset.x < -threshold) {
      nextSlide();
    }
  };

  return (
    <div className="w-full relative overflow-hidden group border-b border-white/5 bg-[#0a0a0f]">
      <div className="relative w-full aspect-[16/9] md:aspect-[3/1] xl:aspect-[16/5] max-h-[500px] overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => handleBannerClick(activeBanners[currentIndex].redirectUrl)}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
          >
            <img
              src={activeBanners[currentIndex].imageUrl}
              alt={activeBanners[currentIndex].title}
              className="w-full h-full object-cover pointer-events-none"
              loading={currentIndex === 0 ? "eager" : "lazy"}
              fetchPriority={currentIndex === 0 ? "high" : "auto"}
            />
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-80 pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {activeBanners.length > 1 && (
          <>
            {/* Navigation Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/50 hover:bg-gold-500/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg cursor-pointer hidden md:flex"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/50 hover:bg-gold-500/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg cursor-pointer hidden md:flex"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={`transition-all duration-300 cursor-pointer rounded-full ${
                    index === currentIndex 
                      ? 'w-6 h-1.5 bg-gold-400 shadow-[0_0_10px_rgba(229,169,25,0.8)]' 
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                  }`}
                  title={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
