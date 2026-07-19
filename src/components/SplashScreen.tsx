/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';
import { TitanEsportsLogo } from './TitanEsportsLogo';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const { loadingScreenSettings } = useGame();
  const [logoFallback, setLogoFallback] = useState(false);

  useEffect(() => {
    setLogoFallback(false);
  }, [loadingScreenSettings]);

  // Track progress bar updates
  useEffect(() => {
    const intervalTime = 25; // ~2500ms total
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinished();
          }, 800);
          return 100;
        }
        const step = Math.floor(Math.random() * 8) + 2;
        return Math.min(prev + step, 100);
      });
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [onFinished]);

  const mainTitle = loadingScreenSettings?.loadingTitle || 'TITAN ESPORTS';
  const secondaryTitle = loadingScreenSettings?.loadingSubtitle || 'PREMIUM GAMING';
  const loadingText = loadingScreenSettings?.loadingText || 'INITIALIZING SYSTEM';

  // Determine active logo url dynamically with cache-busting parameter
  const getLogoUrl = () => {
    if (logoFallback) return null;
    const baseUrl = loadingScreenSettings?.loadingLogoUrl;
    if (baseUrl) {
      if (baseUrl.startsWith('data:')) return baseUrl;
      const version = loadingScreenSettings?.updatedAt || Date.now();
      const cleanUrl = baseUrl.split('?v=')[0].split('&v=')[0];
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}v=${version}`;
    }
    return null;
  };

  const activeLogoUrl = getLogoUrl();

  return (
    <div 
      id="splash_screen_root" 
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#08080c] z-50 overflow-hidden px-6"
    >
      <div className="relative flex flex-col items-center max-w-sm w-full text-center z-10">
        
        {/* Original Centered Logo Container */}
        <motion.div 
          className="relative w-48 h-48 mb-8 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {activeLogoUrl ? (
            <img 
              src={activeLogoUrl} 
              alt="Splash Logo" 
              className="w-full h-full object-contain"
              onError={() => setLogoFallback(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <TitanEsportsLogo className="w-full h-full object-contain" />
          )}
        </motion.div>

        {/* Text Logo Titles */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-widest text-[#e5a919] uppercase font-sans mb-2">
            {mainTitle}
          </h1>
          
          <p className="text-xs tracking-[0.3em] font-semibold uppercase text-neutral-400">
            {secondaryTitle}
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-4 overflow-hidden">
          <div 
            className="h-full rounded-full bg-[#e5a919] transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading Text Feedback */}
        <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-widest uppercase text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e5a919] animate-pulse" />
            <span>{loadingText}</span>
          </div>
          <span className="font-bold text-[#e5a919]">
            {progress}%
          </span>
        </div>

      </div>
    </div>
  );
};
