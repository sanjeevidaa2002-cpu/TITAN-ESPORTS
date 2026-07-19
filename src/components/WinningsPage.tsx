import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { TournamentWinner } from '../types';
import { 
  Trophy, 
  Search, 
  Calendar, 
  Award, 
  Target, 
  ArrowLeft,
  ChevronRight,
  Zap,
  Gamepad2
} from 'lucide-react';
import { motion } from 'motion/react';

interface WinningsPageProps {
  onBack: () => void;
}

export const WinningsPage: React.FC<WinningsPageProps> = ({ onBack }) => {
  const { winners } = useGame();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(10);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(10);
  };

  const handleTimeframeChange = (tf: 'today' | 'week' | 'month' | 'all') => {
    setSelectedTimeframe(tf);
    setVisibleCount(10);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setVisibleCount(10);
  };

  const isWithinDays = (dateStr: string, days: number) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days;
    } catch {
      return false;
    }
  };

  const isToday = (dateStr: string) => {
    try {
      const date = new Date(dateStr).toDateString();
      const today = new Date().toDateString();
      return date === today;
    } catch {
      return false;
    }
  };

  const filteredWinnings = useMemo(() => {
    return winners.filter(winner => {
      if (selectedCategory !== 'All' && winner.gameCategory !== selectedCategory) {
        return false;
      }
      if (selectedTimeframe === 'today' && !isToday(winner.winnerDate)) {
        return false;
      }
      if (selectedTimeframe === 'week' && !isWithinDays(winner.winnerDate, 7)) {
        return false;
      }
      if (selectedTimeframe === 'month' && !isWithinDays(winner.winnerDate, 30)) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const tourneyMatch = winner.tournamentName.toLowerCase().includes(query);
        const matchIdMatch = winner.id.toLowerCase().includes(query);
        return tourneyMatch || matchIdMatch;
      }
      return true;
    }).sort((a, b) => new Date(b.winnerDate).getTime() - new Date(a.winnerDate).getTime());
  }, [winners, searchQuery, selectedCategory, selectedTimeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2.5 bg-[#111116] border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs uppercase font-bold tracking-wider">Back</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f0a1c] via-[#120e24] to-[#080512] border border-white/5 p-6 shadow-[0_10px_40px_rgba(139,92,246,0.1)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-gold-400 font-bold uppercase tracking-wider text-[10px]">
            <Trophy className="w-4 h-4" />
            <span>Hall of Fame</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase">
            Tournament <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-amber-500 to-gold-400">Winnings</span>
          </h1>
          <p className="text-neutral-400 text-xs font-sans max-w-lg leading-relaxed font-semibold">
            View Tournament Winners and Prize History.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#111116] border border-white/5 p-4 rounded-2xl flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar w-full xl:w-auto">
          {['All', 'Free Fire', 'PUBG Mobile', 'Clash of Clans'].map((game) => (
            <button
              key={game}
              onClick={() => handleCategoryChange(game)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer border ${
                selectedCategory === game
                  ? 'bg-gold-500/15 border-gold-500/40 text-gold-400 shadow-[0_0_15px_rgba(229,169,25,0.15)]'
                  : 'bg-white/5 border-transparent text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {game}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5 w-full sm:w-auto overflow-x-auto hide-scrollbar">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleTimeframeChange(t.id as any)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  selectedTimeframe === t.id
                    ? 'bg-gold-500 text-neutral-950 shadow-[0_0_10px_rgba(229,169,25,0.25)]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text"
              placeholder="Search Matches..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#12121a] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-white placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/40 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Winnings List */}
      {filteredWinnings.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-[#0a0a0f] border border-white/5 rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Award className="w-10 h-10 text-neutral-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Winnings Found</h3>
          <p className="text-neutral-500 text-sm max-w-sm">
            {searchQuery 
              ? "We couldn't find any matches matching your search criteria. Try adjusting your filters."
              : "You haven't won any tournaments yet. Join a match and secure a victory!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWinnings.slice(0, visibleCount).map((winner) => (
              <motion.div
                key={winner.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative overflow-hidden rounded-2xl bg-[#0d0d14] border border-white/5 hover:border-gold-500/30 transition-all duration-300 flex flex-col"
              >
                {/* Top Banner Image Area */}
                <div className="h-32 relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-transparent to-transparent z-10" />
                  <img src={winner.tournamentBanner} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  
                  {/* Status Tag */}
                  <div className="absolute top-3 right-3 z-20 px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-[9px] font-black uppercase text-green-400 backdrop-blur-sm shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    Paid
                  </div>
                </div>

                {/* Content Panel */}
                <div className="p-4 flex-1 flex flex-col relative z-20 -mt-8">
                  {/* Rank Badge */}
                  <div className={`self-start w-12 h-12 rounded-full border-[3px] border-[#0d0d14] flex items-center justify-center font-black text-lg mb-2 shadow-lg ${
                    winner.rank === 1 ? 'bg-gradient-to-br from-gold-400 to-amber-600 text-neutral-950' : 
                    winner.rank === 2 ? 'bg-gradient-to-br from-neutral-200 to-neutral-400 text-neutral-900' : 
                    winner.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 
                    'bg-[#181824] text-neutral-300'
                  }`}>
                    #{winner.rank}
                  </div>

                  <h3 className="font-extrabold text-base text-white truncate pr-2">
                    {winner.tournamentName}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <div className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-black uppercase text-neutral-300">
                      {winner.gameCategory}
                    </div>
                    <span className="text-[9px] font-extrabold uppercase text-neutral-500 tracking-wider">
                      • {winner.matchType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] font-mono">
                    <div className="flex flex-col gap-1 text-neutral-400">
                      <span className="uppercase text-[8px] text-neutral-600">Player</span>
                      <span className="font-bold text-white truncate">{winner.name}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-neutral-400">
                      <span className="uppercase text-[8px] text-neutral-600">UID</span>
                      <span className="font-bold text-white truncate">{winner.uid}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-neutral-400">
                      <span className="uppercase text-[8px] text-neutral-600">Total Kills</span>
                      <div className="flex items-center gap-1 font-bold text-red-400">
                        <Target className="w-3 h-3" />
                        <span>{winner.kills}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-neutral-400">
                      <span className="uppercase text-[8px] text-neutral-600">Match Date</span>
                      <div className="flex items-center gap-1 font-bold text-neutral-300">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span>{winner.winnerDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prize / Action Row */}
                  <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500">Prize Won</span>
                        <span className="text-xl font-black text-gold-400">{formatCurrency(winner.prizeWon)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer">
                        View Match Result
                      </button>
                      <button className="flex-1 py-2 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer">
                        Tournament Details
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredWinnings.length > visibleCount && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="px-6 py-3 rounded-xl bg-gold-500/10 border border-gold-500/30 hover:bg-gold-500/20 text-gold-400 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 animate-pulse" />
                <span>Load More Winnings</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
