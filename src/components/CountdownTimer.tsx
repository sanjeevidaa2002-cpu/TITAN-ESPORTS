import React, { useState, useEffect } from 'react';

let globalServerOffset = 0;
let hasSyncedServerTime = false;

async function syncServerTime() {
  if (hasSyncedServerTime) return;
  try {
    const start = Date.now();
    const res = await fetch('/api/server-time');
    if (res.ok) {
      const data = await res.json();
      if (data && data.serverTime) {
        const latency = Math.floor((Date.now() - start) / 2);
        globalServerOffset = (data.serverTime + latency) - Date.now();
        hasSyncedServerTime = true;
      }
    }
  } catch {
    // Fallback gracefully to device clock
  }
}

export function calculateTargetIsoDate(
  matchDate?: string, 
  matchTime?: string, 
  timeZone?: string
): string {
  if (!matchDate) return '';
  const cleanTime = matchTime || '00:00';
  let offsetMinutes = 330; // Default IST (+5:30)

  const tz = (timeZone || '').toUpperCase();
  if (tz.includes('UTC') || tz.includes('GMT')) {
    if (tz.includes('+')) {
      const match = tz.match(/\+(\d+)(?::(\d+))?/);
      if (match) {
        offsetMinutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
      }
    } else if (tz.includes('-')) {
      const match = tz.match(/\-(\d+)(?::(\d+))?/);
      if (match) {
        offsetMinutes = -(parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0));
      }
    } else {
      offsetMinutes = 0;
    }
  } else if (tz.includes('IST') || tz.includes('KOLKATA') || tz.includes('INDIA')) {
    offsetMinutes = 330;
  } else if (tz.includes('EST') || tz.includes('NEW_YORK')) {
    offsetMinutes = -300;
  } else if (tz.includes('PST') || tz.includes('LOS_ANGELES')) {
    offsetMinutes = -480;
  } else if (tz.includes('CST')) {
    offsetMinutes = -360;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMinutes);
  const offsetHoursStr = pad(Math.floor(absMin / 60));
  const offsetMinsStr = pad(absMin % 60);
  const formattedOffset = `${sign}${offsetHoursStr}:${offsetMinsStr}`;

  const isoConstructed = `${matchDate}T${cleanTime}:00${formattedOffset}`;
  const parsedDate = new Date(isoConstructed);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  const fallbackDate = new Date(`${matchDate}T${cleanTime}:00`);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate.toISOString();
  }

  return '';
}

export function parseTargetTimestamp(
  targetDate?: string, 
  matchDate?: string, 
  matchTime?: string, 
  timeZone?: string
): number {
  if (targetDate) {
    const parsed = new Date(targetDate).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  if (matchDate) {
    const cleanTime = matchTime || '00:00';
    let offsetMinutes = 330; // Default IST (+5:30)

    const tz = (timeZone || '').toUpperCase();
    if (tz.includes('UTC') || tz.includes('GMT')) {
      if (tz.includes('+')) {
        const match = tz.match(/\+(\d+)(?::(\d+))?/);
        if (match) {
          offsetMinutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
        }
      } else if (tz.includes('-')) {
        const match = tz.match(/\-(\d+)(?::(\d+))?/);
        if (match) {
          offsetMinutes = -(parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0));
        }
      } else {
        offsetMinutes = 0;
      }
    } else if (tz.includes('IST') || tz.includes('KOLKATA') || tz.includes('INDIA')) {
      offsetMinutes = 330;
    } else if (tz.includes('EST') || tz.includes('NEW_YORK')) {
      offsetMinutes = -300;
    } else if (tz.includes('PST') || tz.includes('LOS_ANGELES')) {
      offsetMinutes = -480;
    } else if (tz.includes('CST')) {
      offsetMinutes = -360;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMinutes);
    const offsetHoursStr = pad(Math.floor(absMin / 60));
    const offsetMinsStr = pad(absMin % 60);
    const formattedOffset = `${sign}${offsetHoursStr}:${offsetMinsStr}`;

    const isoConstructed = `${matchDate}T${cleanTime}:00${formattedOffset}`;
    const parsed = new Date(isoConstructed).getTime();
    if (!isNaN(parsed)) return parsed;

    const fallbackParsed = new Date(`${matchDate}T${cleanTime}:00`).getTime();
    if (!isNaN(fallbackParsed)) return fallbackParsed;
  }

  return 0;
}

interface CountdownTimerProps {
  targetDate?: string;
  matchDate?: string;
  matchTime?: string;
  timeZone?: string;
  status?: string;
  matchRoomStatus?: string;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  matchDate, 
  matchTime, 
  timeZone, 
  status, 
  matchRoomStatus,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    syncServerTime();

    const targetMs = parseTargetTimestamp(targetDate, matchDate, matchTime, timeZone);

    const calculate = () => {
      if (!targetMs) {
        setTimeLeft(null);
        setIsEnded(false);
        return;
      }

      const synchronizedNow = Date.now() + globalServerOffset;
      const diff = targetMs - synchronizedNow;

      if (diff > 0) {
        setIsEnded(false);
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / (1000 * 60)) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
        setIsEnded(true);
      }
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate, matchDate, matchTime, timeZone]);

  const isLiveStatus = status === 'live' || status === 'match_live' || matchRoomStatus === 'match_live';
  const isCompletedStatus = status === 'completed' || status === 'match_completed' || matchRoomStatus === 'match_completed';

  if (isCompletedStatus) {
    return (
      <div className={`bg-[#121915] border border-green-500/20 rounded-2xl p-2.5 text-center mt-2 ${className}`}>
        <p className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Match Completed</span>
        </p>
      </div>
    );
  }

  if (isLiveStatus) {
    return (
      <div className={`bg-gradient-to-r from-red-950/40 via-red-900/20 to-red-950/40 border border-red-500/30 rounded-2xl p-3 text-center mt-2 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse ${className}`}>
        <p className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span>🔴 Live Now</span>
        </p>
      </div>
    );
  }

  if (isEnded || !timeLeft) {
    return (
      <div className={`bg-gradient-to-r from-amber-950/40 via-gold-900/20 to-amber-950/40 border border-gold-500/30 rounded-2xl p-3 text-center mt-2 shadow-[0_0_15px_rgba(234,179,8,0.15)] ${className}`}>
        <p className="text-xs font-black text-gold-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
          <span>🚀 Tournament Started</span>
        </p>
      </div>
    );
  }

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`bg-[#0b0c10]/90 border border-gold-500/20 rounded-2xl p-3 flex flex-col items-center justify-center space-y-2 mt-2 shadow-[0_0_15px_rgba(234,179,8,0.05)] relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          Starts In
        </span>
        {timeZone ? (
          <span className="text-[9px] text-gold-400 font-mono font-medium bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
            {timeZone}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-1 sm:gap-2.5 w-full text-center">
        {/* Days */}
        <div className="flex-1 bg-[#12131a] border border-white/5 rounded-xl py-2 px-1 flex flex-col items-center min-w-[58px]">
          <span className="text-sm sm:text-base font-black text-white font-mono tracking-wider transition-all">
            {pad(timeLeft.d)}
          </span>
          <span className="text-[8px] sm:text-[9px] text-neutral-400 font-medium flex items-center gap-0.5 mt-0.5">
            📅 Days
          </span>
        </div>

        <span className="text-gold-400 font-black text-sm sm:text-base">:</span>

        {/* Hours */}
        <div className="flex-1 bg-[#12131a] border border-white/5 rounded-xl py-2 px-1 flex flex-col items-center min-w-[58px]">
          <span className="text-sm sm:text-base font-black text-white font-mono tracking-wider transition-all">
            {pad(timeLeft.h)}
          </span>
          <span className="text-[8px] sm:text-[9px] text-neutral-400 font-medium flex items-center gap-0.5 mt-0.5">
            🕒 Hours
          </span>
        </div>

        <span className="text-gold-400 font-black text-sm sm:text-base">:</span>

        {/* Minutes */}
        <div className="flex-1 bg-[#12131a] border border-white/5 rounded-xl py-2 px-1 flex flex-col items-center min-w-[58px]">
          <span className="text-sm sm:text-base font-black text-white font-mono tracking-wider transition-all">
            {pad(timeLeft.m)}
          </span>
          <span className="text-[8px] sm:text-[9px] text-neutral-400 font-medium flex items-center gap-0.5 mt-0.5">
            ⏱ Minutes
          </span>
        </div>

        <span className="text-gold-400 font-black text-sm sm:text-base">:</span>

        {/* Seconds */}
        <div className="flex-1 bg-[#12131a] border border-gold-500/30 bg-gold-500/5 rounded-xl py-2 px-1 flex flex-col items-center min-w-[58px]">
          <span className="text-sm sm:text-base font-black text-gold-400 font-mono tracking-wider transition-all">
            {pad(timeLeft.s)}
          </span>
          <span className="text-[8px] sm:text-[9px] text-gold-400/80 font-medium flex items-center gap-0.5 mt-0.5">
            ⏲ Seconds
          </span>
        </div>
      </div>
    </div>
  );
};
