import React, { useState, useEffect } from 'react';

export const CountdownTimer: React.FC<{ targetDate: string, status: string }> = ({ targetDate, status }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - Date.now();
      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (status === 'match_completed' || status === 'completed') {
    return null; // Handled by parent
  }

  if (status === 'match_live' || status === 'live' || !timeLeft) {
    return (
      <div className="bg-[#121a2a]/40 border border-blue-500/20 rounded-2xl p-3.5 space-y-2 text-[10px] font-sans animate-pulse mt-2">
         <p className="font-bold text-white uppercase tracking-wider flex justify-between items-center text-center w-full">
          <span className="flex items-center gap-1 mx-auto text-blue-400">🟢 Room Available / 🔴 Match Live</span>
        </p>
        <p className="text-center text-[9px] text-neutral-400">Waiting for Admin to reveal Room ID & Password...</p>
      </div>
    );
  }

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="bg-[#0f0f15] border border-white/10 rounded-xl p-3 flex flex-col items-center mt-2">
      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-2">Starts In:</span>
      <div className="flex gap-4 text-center">
        <div>
          <p className="text-xl font-black text-white font-mono">{pad(timeLeft.d)}</p>
          <p className="text-[8px] text-neutral-500 uppercase tracking-widest">Days</p>
        </div>
        <div>
          <p className="text-xl font-black text-white font-mono">{pad(timeLeft.h)}</p>
          <p className="text-[8px] text-neutral-500 uppercase tracking-widest">Hours</p>
        </div>
        <div>
          <p className="text-xl font-black text-white font-mono">{pad(timeLeft.m)}</p>
          <p className="text-[8px] text-neutral-500 uppercase tracking-widest">Minutes</p>
        </div>
        <div>
          <p className="text-xl font-black text-gold-400 font-mono">{pad(timeLeft.s)}</p>
          <p className="text-[8px] text-neutral-500 uppercase tracking-widest">Seconds</p>
        </div>
      </div>
    </div>
  );
};
