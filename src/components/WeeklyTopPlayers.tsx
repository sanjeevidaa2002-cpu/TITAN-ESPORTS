import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle, 
  Flame, 
  Award, 
  Target, 
  TrendingUp, 
  Gamepad2, 
  DollarSign, 
  Star 
} from 'lucide-react';
import { motion } from 'motion/react';

export const WeeklyTopPlayers: React.FC = () => {
  const { weeklyPlayers, weeklyLeaderboardConfig } = useGame();
  const [activeTimeframe, setActiveTimeframe] = useState<'this_week' | 'last_week' | 'this_month'>('this_week');
  const [activeGameFilter, setActiveGameFilter] = useState<string>('All');

  const timeframes = [
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'this_month', label: 'This Month' }
  ] as const;

  const games = ['All', 'Free Fire', 'PUBG Mobile', 'Clash of Clans'];

  // Filter and sort players
  const filtered = weeklyPlayers.filter(p => {
    const matchStatus = p.status === 'active';
    const matchTimeframe = p.timeframe === activeTimeframe;
    const matchGame = activeGameFilter === 'All' || p.gameCategory === activeGameFilter;
    return matchStatus && matchTimeframe && matchGame;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!weeklyLeaderboardConfig.autoRankingEnabled || weeklyLeaderboardConfig.rankingCriteria === 'manual') {
      return (a.rank || 999) - (b.rank || 999);
    }
    
    const crit = weeklyLeaderboardConfig.rankingCriteria;
    if (crit === 'weeklyPoints') return (b.weeklyPoints || 0) - (a.weeklyPoints || 0);
    if (crit === 'totalKills') return (b.kills || 0) - (a.kills || 0);
    if (crit === 'totalWins') return (b.wins || 0) - (a.wins || 0);
    if (crit === 'totalPrizeWon') return (b.prizeWon || 0) - (a.prizeWon || 0);
    if (crit === 'matchesPlayed') return (b.matchesPlayed || 0) - (a.matchesPlayed || 0);
    return 0;
  });

  const displayPlayers = sorted.map((player, idx) => ({
    ...player,
    rank: weeklyLeaderboardConfig.autoRankingEnabled ? idx + 1 : player.rank
  })).slice(0, 10);

  // Separate top 3 podium and others
  const top1 = displayPlayers.find(p => p.rank === 1);
  const top2 = displayPlayers.find(p => p.rank === 2);
  const top3 = displayPlayers.find(p => p.rank === 3);
  const runnersUp = displayPlayers.filter(p => p.rank > 3);

  return (
    <div id="weekly_leaderboard_section" className="space-y-6 bg-[#0a0a0f] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Timeframe toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-gold-500/20 to-amber-500/10 rounded-2xl border border-gold-500/30 text-gold-400">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">🏆 Weekly Top Players</h2>
              <span className="bg-red-600/20 border border-red-500/30 text-red-400 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase animate-pulse">
                LIVE UPDATING
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-wider">Compete weekly to claim direct cash bonuses and championship status</p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 self-start md:self-auto">
          {timeframes.map(tf => (
            <button
              key={tf.id}
              onClick={() => setActiveTimeframe(tf.id)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTimeframe === tf.id
                  ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 font-black shadow-md shadow-gold-500/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game Filters Tab */}
      <div className="flex flex-wrap gap-1.5">
        {games.map(game => (
          <button
            key={game}
            onClick={() => setActiveGameFilter(game)}
            className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              activeGameFilter === game
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-transparent text-neutral-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            {game}
          </button>
        ))}
      </div>

      {displayPlayers.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl bg-[#111116]/30">
          <Gamepad2 className="w-10 h-10 text-neutral-600 mx-auto stroke-[1.5] mb-2" />
          <p className="text-xs text-neutral-400 uppercase font-black tracking-wider">No active players ranked yet</p>
          <p className="text-[10px] text-neutral-500 mt-1 max-w-xs mx-auto">Admin can configure and add premium gamer cards inside the Weekly Top Players Manager tab.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Podium Representation (Top 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
            
            {/* Ranks 2 */}
            {top2 ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="order-2 md:order-1 bg-gradient-to-b from-[#181822] to-[#111116] border border-slate-500/20 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden group shadow-md"
              >
                <div className="absolute top-0 right-0 bg-slate-500/20 border-l border-b border-white/10 px-3 py-1 text-[10px] font-black text-slate-300 rounded-bl-xl uppercase tracking-wider">
                  RANK #2
                </div>
                
                <div className="relative mt-2">
                  <div className="w-16 h-16 rounded-full border-2 border-slate-400/50 p-0.5 overflow-hidden bg-neutral-800">
                    <img src={top2.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt={top2.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-slate-400 text-neutral-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111116]">
                    2
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[120px]">{top2.name}</span>
                    {top2.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-current" />}
                  </div>
                  <p className="text-[8px] text-neutral-500 font-mono tracking-wider mt-0.5">UID: {top2.uid}</p>
                  <p className="text-[8px] bg-slate-400/10 text-slate-300 border border-slate-400/20 px-2 py-0.5 rounded-full font-black uppercase inline-block mt-1 tracking-widest">{top2.gameCategory}</p>
                </div>

                {/* Badges */}
                <div className="flex gap-1 mt-2.5">
                  {top2.mvp && (
                    <span className="bg-amber-500 text-neutral-950 text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-0.5">
                      <Star className="w-2 h-2 fill-current" /> MVP
                    </span>
                  )}
                  <span className="bg-white/5 border border-white/10 text-neutral-300 text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                    WR {top2.winRate}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full mt-4 border-t border-white/5 pt-3.5">
                  <div className="text-center">
                    <p className="text-[8px] text-neutral-500 uppercase font-black">Points</p>
                    <p className="text-xs font-black text-gold-400 font-mono mt-0.5">{top2.weeklyPoints}</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-[8px] text-neutral-500 uppercase font-black">Kills</p>
                    <p className="text-xs font-black text-white font-mono mt-0.5">{top2.kills}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] text-neutral-500 uppercase font-black">Winnings</p>
                    <p className="text-xs font-black text-green-400 font-mono mt-0.5">₹{top2.prizeWon}</p>
                  </div>
                </div>
              </motion.div>
            ) : <div className="order-2 md:order-1" />}

            {/* Rank 1 Center Podium */}
            {top1 ? (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="order-1 md:order-2 bg-gradient-to-b from-[#241c10] to-[#111116] border border-gold-500/40 rounded-3xl p-5 flex flex-col items-center text-center relative overflow-hidden ring-2 ring-gold-500/20 shadow-xl shadow-gold-500/5 group"
              >
                {/* Crown graphic decorative */}
                <div className="absolute top-0 right-0 bg-gold-500/20 border-l border-b border-gold-500/40 px-4 py-1.5 text-[11px] font-black text-gold-300 rounded-bl-2xl uppercase tracking-widest flex items-center gap-1 shadow-inner">
                  <Star className="w-3.5 h-3.5 fill-current text-gold-400 animate-spin-slow" />
                  CHAMPION #1
                </div>

                <div className="relative mt-4">
                  <div className="w-20 h-20 rounded-full border-4 border-gold-400 p-0.5 overflow-hidden bg-neutral-800 shadow-lg shadow-gold-500/10">
                    <img src={top1.profileImage || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150"} alt={top1.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#111116] shadow-md shadow-gold-500/20 animate-bounce">
                    1
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm font-black text-white uppercase tracking-wider truncate max-w-[150px]">{top1.name}</span>
                    {top1.verified && <CheckCircle className="w-4 h-4 text-blue-400 fill-current" />}
                  </div>
                  <p className="text-[9px] text-neutral-400 font-mono tracking-wider mt-0.5">UID: {top1.uid}</p>
                  <p className="text-[9px] bg-gold-400/10 text-gold-400 border border-gold-500/30 px-3 py-0.5 rounded-full font-black uppercase inline-block mt-1.5 tracking-widest">{top1.gameCategory}</p>
                </div>

                {/* Badges */}
                <div className="flex gap-1.5 mt-3">
                  {top1.mvp && (
                    <span className="bg-gold-500 text-neutral-950 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-0.5 shadow-md shadow-gold-500/10">
                      <Star className="w-2.5 h-2.5 fill-current" /> MVP CHAMP
                    </span>
                  )}
                  <span className="bg-white/5 border border-white/10 text-neutral-300 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                    WR {top1.winRate}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full mt-5 border-t border-white/5 pt-4">
                  <div className="text-center">
                    <p className="text-[8px] text-neutral-400 uppercase font-black tracking-wider">Points</p>
                    <p className="text-sm font-black text-gold-400 font-mono mt-0.5">{top1.weeklyPoints}</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-[8px] text-neutral-400 uppercase font-black tracking-wider">Kills</p>
                    <p className="text-sm font-black text-white font-mono mt-0.5">{top1.kills}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] text-neutral-400 uppercase font-black tracking-wider">Winnings</p>
                    <p className="text-sm font-black text-green-400 font-mono mt-0.5">₹{top1.prizeWon}</p>
                  </div>
                </div>
              </motion.div>
            ) : <div className="order-1 md:order-2" />}

            {/* Rank 3 Podium */}
            {top3 ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="order-3 bg-gradient-to-b from-[#181822] to-[#111116] border border-amber-600/20 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden group shadow-md"
              >
                <div className="absolute top-0 right-0 bg-amber-600/20 border-l border-b border-white/10 px-3 py-1 text-[10px] font-black text-amber-500 rounded-bl-xl uppercase tracking-wider">
                  RANK #3
                </div>

                <div className="relative mt-2">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-700/50 p-0.5 overflow-hidden bg-neutral-800">
                    <img src={top3.profileImage || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150"} alt={top3.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-700 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111116]">
                    3
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[120px]">{top3.name}</span>
                    {top3.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-current" />}
                  </div>
                  <p className="text-[8px] text-neutral-500 font-mono tracking-wider mt-0.5">UID: {top3.uid}</p>
                  <p className="text-[8px] bg-amber-600/10 text-amber-500 border border-amber-600/20 px-2 py-0.5 rounded-full font-black uppercase inline-block mt-1 tracking-widest">{top3.gameCategory}</p>
                </div>

                {/* Badges */}
                <div className="flex gap-1 mt-2.5">
                  {top3.mvp && (
                    <span className="bg-amber-500 text-neutral-950 text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-0.5">
                      <Star className="w-2 h-2 fill-current" /> MVP
                    </span>
                  )}
                  <span className="bg-white/5 border border-white/10 text-neutral-300 text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                    WR {top3.winRate}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full mt-4 border-t border-white/5 pt-3.5">
                  <div className="text-center">
                    <p className="text-[8px] text-neutral-500 uppercase font-black">Points</p>
                    <p className="text-xs font-black text-gold-400 font-mono mt-0.5">{top3.weeklyPoints}</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-[8px] text-neutral-500 uppercase font-black">Kills</p>
                    <p className="text-xs font-black text-white font-mono mt-0.5">{top3.kills}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] text-neutral-500 uppercase font-black">Winnings</p>
                    <p className="text-xs font-black text-green-400 font-mono mt-0.5">₹{top3.prizeWon}</p>
                  </div>
                </div>
              </motion.div>
            ) : <div className="order-3" />}
          </div>

          {/* Runners up List (#4 to #10) */}
          {runnersUp.length > 0 && (
            <div className="bg-[#111116]/80 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#181822] text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                      <th className="py-3 px-4 text-center">Rank</th>
                      <th className="py-3 px-4">Player Details</th>
                      <th className="py-3 px-4">Game Category</th>
                      <th className="py-3 px-4 text-center">Matches</th>
                      <th className="py-3 px-4 text-center">Wins</th>
                      <th className="py-3 px-4 text-center">Kills</th>
                      <th className="py-3 px-4 text-center">Win Rate</th>
                      <th className="py-3 px-4 text-center">K/D</th>
                      <th className="py-3 px-4 text-right">Points</th>
                      <th className="py-3 px-4 text-right pr-6">Winnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-neutral-300">
                    {runnersUp.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400 text-xs">
                          #{p.rank}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-neutral-800 shrink-0">
                              <img src={p.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-white uppercase tracking-wider truncate max-w-[120px]">{p.name}</span>
                                {p.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-current shrink-0" />}
                                {p.mvp && (
                                  <span className="bg-amber-500 text-neutral-950 text-[7px] font-black px-1.5 py-0.2 rounded uppercase shrink-0">
                                    MVP
                                  </span>
                                )}
                              </div>
                              <p className="text-[8px] text-neutral-500 font-mono tracking-wider mt-0.5">UID: {p.uid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[9px] bg-white/5 border border-white/10 text-neutral-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            {p.gameCategory}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {p.matchesPlayed}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                          {p.wins}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                          {p.kills}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                          {p.winRate}%
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                          {p.kdRatio ?? 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-gold-400">
                          {p.weeklyPoints}
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6 font-mono font-black text-green-400">
                          ₹{p.prizeWon}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile ListView */}
              <div className="md:hidden divide-y divide-white/5">
                {runnersUp.map(p => (
                  <div key={p.id} className="p-4 space-y-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-black text-neutral-400 w-6">#{p.rank}</span>
                        <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-neutral-800 shrink-0">
                          <img src={p.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-xs uppercase tracking-wider truncate max-w-[100px]">{p.name}</span>
                            {p.verified && <CheckCircle className="w-3 h-3 text-blue-400 fill-current" />}
                            {p.mvp && (
                              <span className="bg-amber-500 text-neutral-950 text-[6px] font-black px-1 py-0.1 rounded uppercase">
                                MVP
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-neutral-500 font-mono tracking-wider">UID: {p.uid}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[8px] text-neutral-500 uppercase font-black">Points</p>
                        <p className="text-xs font-black text-gold-400 font-mono">{p.weeklyPoints}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[10px] bg-[#0d0d11] p-2 rounded-xl border border-white/5">
                      <div className="text-center">
                        <p className="text-[7px] text-neutral-500 uppercase font-black">Game</p>
                        <p className="font-bold text-neutral-300 mt-0.5 truncate">{p.gameCategory}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[7px] text-neutral-500 uppercase font-black">Kills</p>
                        <p className="font-mono font-bold text-neutral-300 mt-0.5">{p.kills}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[7px] text-neutral-500 uppercase font-black">Wins</p>
                        <p className="font-mono font-bold text-neutral-300 mt-0.5">{p.wins}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[7px] text-neutral-500 uppercase font-black">Won</p>
                        <p className="font-mono font-bold text-green-400 mt-0.5">₹{p.prizeWon}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
