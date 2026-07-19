/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Trophy, 
  Plus, 
  Send, 
  Instagram, 
  Megaphone, 
  RefreshCw, 
  Calendar, 
  CheckCircle, 
  Flame, 
  Play, 
  ArrowRight,
  Shield,
  Zap,
  Gift
} from 'lucide-react';
import { FF_BANNERS } from '../dataStore';
import { HomepageBannerSlider } from './HomepageBannerSlider';

interface HomeTabProps {
  onSwitchTab: (tab: string) => void;
  onSetMatchFilter: (status: 'all' | 'live' | 'open' | 'completed') => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onSwitchTab, onSetMatchFilter }) => {
  const { userProfile, tournaments } = useGame();

  const handleContestClick = (status: 'live' | 'open' | 'completed') => {
    onSetMatchFilter(status);
    onSwitchTab('matches');
  };

  // Find dynamic counts
  const liveCount = tournaments.filter(t => t.roomStatus === 'live').length;
  const upcomingCount = tournaments.filter(t => t.roomStatus === 'open' || t.roomStatus === 'locked').length;
  const completedCount = tournaments.filter(t => t.roomStatus === 'completed').length;

  return (
    <div id="home_tab_root" className="space-y-6 pb-24">
      <HomepageBannerSlider />
      
      {/* Top Header Section */}
      <div className="flex items-center justify-between bg-[#111116]/80 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-gold-400 overflow-hidden bg-neutral-800">
              <img 
                src={userProfile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0d0d11]" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 tracking-wider">Welcome,</p>
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              {userProfile?.nickname || 'lokesh meena'}
            </h2>
          </div>
        </div>

        {/* Balance badge with Add (+) button */}
        <div className="flex items-center bg-[#181822] border border-gold-500/20 rounded-full py-1.5 pl-4 pr-1">
          <span className="text-xs font-mono font-bold text-gold-400 mr-2">
            ₹{(userProfile ? (userProfile.depositBalance + userProfile.winningBalance) : 0).toFixed(2)}
          </span>
          <button 
            onClick={() => onSwitchTab('wallet')}
            className="w-7 h-7 rounded-full bg-gradient-to-r from-gold-500 to-amber-600 flex items-center justify-center text-neutral-950 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_10px_rgba(229,169,25,0.4)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Customer Support Banner (Visual replication of screenshot) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#800f2f] via-[#c9184a] to-[#ff4d6d] p-5 shadow-[0_10px_30px_rgba(201,24,74,0.3)] border border-pink-500/30">
        {/* Abstract background graphics */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400')] bg-cover bg-center opacity-25 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-white italic tracking-wide drop-shadow-md">
              CUSTOMER SUPPORT
            </h3>
            <p className="text-xs text-pink-100 font-medium tracking-wide mt-1 max-w-xs">
              Direct live chat with tournament moderators. Fast query resolution!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="https://t.me/PixelToAppOfficial" 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-2 backdrop-blur-sm transition-all"
            >
              <Send className="w-4 h-4 fill-white text-transparent" />
              <span>Telegram</span>
            </a>
            
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-2 backdrop-blur-sm transition-all"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>

      {/* Blue Megaphone Announcement Ticker */}
      <div className="bg-[#10192e] border border-blue-500/20 rounded-2xl py-3 px-4 flex items-center gap-3 shadow-[inset_0_1px_1px_rgba(59,130,246,0.1)] overflow-hidden">
        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 animate-bounce">
          <Megaphone className="w-4 h-4" />
        </div>
        <div className="w-full overflow-hidden text-xs text-blue-200 font-medium select-none relative h-5 flex items-center">
          <div className="marquee-text font-sans">
            🎮 Kisi prakar ka bhi Application, Website ya Bot banvana hai to ✉️ DM Kare 👇 t.me/PixelToAppOfficial | Complete auto-payment support live 24/7.
          </div>
        </div>
      </div>

      {/* Promos/Referral Banner */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          onClick={() => onSwitchTab('referral')}
          className="bg-gradient-to-br from-[#12101a] to-[#201538] border border-neon-purple/20 rounded-2xl p-4 flex flex-col justify-between h-28 relative cursor-pointer hover:border-neon-purple/40 transition-all group"
        >
          <div className="absolute right-3 top-3 opacity-25 group-hover:scale-110 transition-all">
            <Gift className="w-10 h-10 text-neon-purple" />
          </div>
          <span className="text-[9px] bg-neon-purple/20 text-purple-300 font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
            INVITE BONUS
          </span>
          <div>
            <h4 className="text-xs font-bold text-white">Refer & Earn</h4>
            <p className="text-[10px] text-neutral-400 mt-1">Get ₹15 for every signup</p>
          </div>
        </div>

        <div 
          onClick={() => onSwitchTab('support')}
          className="bg-gradient-to-br from-[#1c140d] to-[#2d1b09] border border-gold-500/20 rounded-2xl p-4 flex flex-col justify-between h-28 relative cursor-pointer hover:border-gold-500/40 transition-all group"
        >
          <div className="absolute right-3 top-3 opacity-25 group-hover:scale-110 transition-all">
            <Trophy className="w-10 h-10 text-gold-400" />
          </div>
          <span className="text-[9px] bg-gold-400/20 text-gold-400 font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
            LEADERBOARD
          </span>
          <div>
            <h4 className="text-xs font-bold text-white">Top Players</h4>
            <p className="text-[10px] text-neutral-400 mt-1">Win extra cash payouts</p>
          </div>
        </div>
      </div>

      {/* My Contests Section (Replication of Screenshot) */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            MY CONTESTS
          </h3>
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 flex items-center justify-center text-[7px] text-white font-bold font-mono">
            ✓
          </span>
        </div>
        <p className="text-[10px] text-neutral-500">Your Tournaments Journey</p>

        {/* Contests 3 Columns Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {/* LIVE MATCHES */}
          <div 
            onClick={() => handleContestClick('live')}
            className="bg-[#16161d]/80 border border-red-500/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#1a1a24] hover:border-red-500/30 transition-all h-28 relative group shadow-lg"
          >
            <div className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-105 transition-all mb-2 relative">
              <Flame className="w-5 h-5 text-red-500 fill-red-500/10 animate-pulse" />
              <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">LIVE</span>
            <span className="text-[9px] font-mono text-red-400 font-semibold mt-1">{liveCount} Matches</span>
          </div>

          {/* UPCOMING */}
          <div 
            onClick={() => handleContestClick('open')}
            className="bg-[#16161d]/80 border border-blue-500/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#1a1a24] hover:border-blue-500/30 transition-all h-28 relative group shadow-lg"
          >
            <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-all mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">UPCOMING</span>
            <span className="text-[9px] font-mono text-blue-400 font-semibold mt-1">{upcomingCount} Matches</span>
          </div>

          {/* COMPLETED */}
          <div 
            onClick={() => handleContestClick('completed')}
            className="bg-[#16161d]/80 border border-green-500/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#1a1a24] hover:border-green-500/30 transition-all h-28 relative group shadow-lg"
          >
            <div className="w-11 h-11 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-105 transition-all mb-2">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">COMPLETED</span>
            <span className="text-[9px] font-mono text-green-400 font-semibold mt-1">{completedCount} Finished</span>
          </div>
        </div>
      </div>

      {/* Exclusive Live Streaming Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              EXCLUSIVE TOURNAMENTS
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
          <button 
            onClick={() => onSwitchTab('matches')}
            className="text-[10px] font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1 hover:text-gold-500"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[10px] text-neutral-500">Big Winnings For All</p>

        {/* Live Banner Slider / Grid */}
        <div className="relative rounded-2xl overflow-hidden bg-[#16161d] border border-white/5 shadow-xl h-44 group">
          <img 
            src={FF_BANNERS[4]} 
            alt="Esports Battle" 
            className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-105 transition-all duration-700"
          />
          {/* Neon overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d11] via-transparent to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                LIVE NOW
              </span>
              <span className="text-[10px] text-neutral-300 font-semibold font-mono">
                Map: Bermuda S5
              </span>
            </div>
            
            <h4 className="text-sm font-bold text-white tracking-wide uppercase">
              Pro Solo Championship League
            </h4>
            
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gold-400 font-mono font-medium">
                Prize Pool: ₹2,500 | Entry: FREE
              </p>
              
              <button 
                onClick={() => handleContestClick('live')}
                className="px-3 py-1 rounded bg-gradient-to-r from-gold-500 to-amber-600 text-[#0d0d11] text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Watch Live</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety and Anti-cheat guarantee blocks */}
      <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-gold-400">
            <Shield className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Device Anti-Ban</span>
          </div>
          <p className="text-[9px] text-neutral-400 leading-relaxed">
            Automatic customized room scripts guarantee standard game settings and prevent mod files.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-neon-purple">
            <Zap className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Instant Payouts</span>
          </div>
          <p className="text-[9px] text-neutral-400 leading-relaxed">
            Auto withdraw APIs directly transfer your winnings to your registered UPI address within 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};
