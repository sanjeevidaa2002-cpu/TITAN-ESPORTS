/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const { leaderboard } = useGame();
  const [metric, setMetric] = useState<'earnings' | 'kills' | 'wins'>('earnings');

  // Sort base on metric
  const sortedLeaderboard = [...leaderboard].sort((a,b) => {
    if (metric === 'kills') return b.totalKills - a.totalKills;
    if (metric === 'wins') return b.totalWins - a.totalWins;
    return b.totalEarnings - a.totalEarnings;
  });

  const getMetricValue = (entry: any) => {
    if (metric === 'kills') return `${entry.totalKills} Kills`;
    if (metric === 'wins') return `${entry.totalWins} Wins`;
    return `₹${entry.totalEarnings.toFixed(2)}`;
  };

  const top3 = sortedLeaderboard.slice(0, 3);
  const remaining = sortedLeaderboard.slice(3);

  return (
    <div id="leaderboard_tab_root" className="space-y-6 pb-24 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 bg-[#111116] border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Battle Leaderboards</h2>
      </div>

      {/* Top Players Cash Payout Promo Banner */}
      <div className="bg-gradient-to-r from-gold-500/10 via-amber-500/15 to-gold-500/10 border border-gold-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg shadow-gold-500/5">
        <div className="p-2.5 bg-gold-500/20 rounded-xl border border-gold-500/30 text-gold-400 animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">SEASON CHAMPIONSHIP</p>
          <p className="text-xs font-black text-white uppercase tracking-wider mt-0.5">
            Top Players Win <span className="text-gold-400 font-extrabold text-sm font-sans tracking-wide">Extra Cash Payouts!</span>
          </p>
        </div>
      </div>

      {/* Tabs / Metric switch */}
      <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5">
        <button 
          onClick={() => setMetric('earnings')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${metric === 'earnings' ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-[#0d0d11] shadow' : 'text-neutral-400 hover:text-white'}`}
        >
          Top Earners
        </button>
        <button 
          onClick={() => setMetric('kills')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${metric === 'kills' ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-[#0d0d11] shadow' : 'text-neutral-400 hover:text-white'}`}
        >
          Top Killers
        </button>
        <button 
          onClick={() => setMetric('wins')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${metric === 'wins' ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-[#0d0d11] shadow' : 'text-neutral-400 hover:text-white'}`}
        >
          Top Winners
        </button>
      </div>

      {/* Top 3 Podium Layout */}
      {top3.length >= 3 ? (
        <div className="flex items-end justify-center gap-2 pt-6 pb-2 relative">
          
          {/* 2nd Place */}
          <div className="flex flex-col items-center w-24 space-y-2 translate-y-3 z-10">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-neutral-300 overflow-hidden bg-neutral-800">
                <img src={top3[1].avatarUrl} alt="2nd" className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-neutral-300 text-neutral-900 text-[10px] font-black rounded-full border-2 border-[#0d0d11] flex items-center justify-center font-mono">
                2
              </span>
            </div>
            <div className="text-center">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider truncate w-20">{top3[1].nickname}</h4>
              <p className="text-[9px] font-mono font-bold text-neutral-300 mt-0.5">{getMetricValue(top3[1])}</p>
            </div>
            <div className="w-full bg-gradient-to-t from-neutral-300/5 to-neutral-300/10 h-16 rounded-t-xl border-t border-x border-neutral-300/20 flex items-center justify-center">
              <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">🥈 Silver</span>
            </div>
          </div>

          {/* 1st Place (Center Podium) */}
          <div className="flex flex-col items-center w-28 space-y-2 z-20">
            <div className="relative">
              <div className="w-18 h-18 rounded-full border-[3px] border-gold-400 overflow-hidden bg-neutral-800 shadow-[0_0_20px_rgba(229,169,25,0.3)]">
                <img src={top3[0].avatarUrl} alt="1st" className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold-400 text-[#0d0d11] text-xs font-black rounded-full border-2 border-[#0d0d11] flex items-center justify-center font-mono glow-gold">
                1
              </span>
            </div>
            <div className="text-center">
              <h4 className="text-xs font-black text-gold-400 uppercase tracking-wider truncate w-24">{top3[0].nickname}</h4>
              <p className="text-[10px] font-mono font-bold text-gold-400 mt-0.5">{getMetricValue(top3[0])}</p>
            </div>
            <div className="w-full bg-gradient-to-t from-gold-500/10 to-gold-500/20 h-24 rounded-t-2xl border-t border-x border-gold-400/30 flex flex-col items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-gold-400 animate-bounce" />
              <span className="text-[9px] font-black text-gold-400 uppercase tracking-widest">🏆 Champion</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center w-24 space-y-2 translate-y-5 z-10">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-amber-600 overflow-hidden bg-neutral-800">
                <img src={top3[2].avatarUrl} alt="3rd" className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-600 text-white text-[10px] font-black rounded-full border-2 border-[#0d0d11] flex items-center justify-center font-mono">
                3
              </span>
            </div>
            <div className="text-center">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider truncate w-20">{top3[2].nickname}</h4>
              <p className="text-[9px] font-mono font-bold text-amber-500 mt-0.5">{getMetricValue(top3[2])}</p>
            </div>
            <div className="w-full bg-gradient-to-t from-amber-600/5 to-amber-600/10 h-12 rounded-t-xl border-t border-x border-amber-600/20 flex items-center justify-center">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">🥉 Bronze</span>
            </div>
          </div>

        </div>
      ) : null}

      {/* Remaining List Grid */}
      <div className="space-y-2 pt-6">
        {remaining.map((entry, idx) => (
          <div 
            key={entry.userId}
            className="bg-[#111116]/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Rank Index */}
              <span className="text-xs font-black font-mono text-neutral-500 w-4">
                {idx + 4}
              </span>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800 border border-white/5 shrink-0">
                <img src={entry.avatarUrl} alt="Player" className="w-full h-full object-cover" />
              </div>

              {/* User UID and Nickname */}
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wide">
                  {entry.nickname}
                </h5>
                <p className="text-[8px] text-neutral-500 font-mono">UID: {entry.freefireUid}</p>
              </div>
            </div>

            {/* Score */}
            <span className="text-xs font-bold font-mono text-gold-400 bg-gold-400/5 border border-gold-400/10 rounded-xl px-3 py-1">
              {getMetricValue(entry)}
            </span>
          </div>
        ))}
      </div>

      {/* Fair play compliance guidelines */}
      <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-gold-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1 text-[10px] text-neutral-400 leading-relaxed">
          <p className="font-bold text-white uppercase tracking-wider">FAIR PLAY COMPLIANCE GUARANTEE</p>
          <p>We review match play recording logs of all top players. Any use of bypass emulators, teaming, or third-party file injections triggers immediate hardware block, zero-refund payout freeze, and leaderboard ban.</p>
        </div>
      </div>
    </div>
  );
};
