/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { useGame } from '../context/GameContext';
import { Tournament } from '../types';
import { 
  Trophy, 
  MapPin, 
  Users, 
  Clock, 
  Search, 
  Filter, 
  Coins, 
  Play, 
  ExternalLink,
  ShieldAlert, 
  Sparkles, 
  Eye,
  Settings,
  HelpCircle,
  Gamepad2
} from 'lucide-react';

interface MatchesTabProps {
  initialFilter: 'all' | 'live' | 'open' | 'completed';
  onResetInitialFilter: () => void;
  onOpenDetailsModal: (tournament: Tournament) => void;
}

export const MatchesTab: React.FC<MatchesTabProps> = ({ 
  initialFilter, 
  onResetInitialFilter,
  onOpenDetailsModal 
}) => {
  const { tournaments, currentUser, simulateMatchCompletion, registrations, categories } = useGame();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'open' | 'completed' | 'my_matches'>(initialFilter || 'all');
  const [modeFilter, setModeFilter] = useState<'all' | 'Solo' | 'Duo' | 'Squad'>('all');
  const [feeFilter, setFeeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [ffCategoryFilter, setFfCategoryFilter] = useState<'all' | 'BR' | 'CS'>('BR');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Handle manual override from initial filter prop
  React.useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
      onResetInitialFilter();
    }
  }, [initialFilter, onResetInitialFilter]);

  const handleStatusChange = (status: 'all' | 'live' | 'open' | 'completed' | 'my_matches') => {
    setStatusFilter(status);
  };

  const getGameDisplayName = (gameCategory: string | undefined) => {
    const catId = gameCategory || 'free_fire';
    const foundCat = categories?.find(c => c.id === catId);
    return foundCat ? foundCat.name : (catId === 'free_fire' ? 'Free Fire' : catId);
  };

  const getCategoryIcon = (catId: string, catName: string) => {
    const name = catName.toLowerCase();
    if (name.includes('free fire')) return '🔥';
    if (name.includes('pubg')) return '🎯';
    if (name.includes('clash of clans') || name.includes('clash')) return '🏰';
    if (name.includes('free tournament') || name.includes('free_tournaments')) return '🆓';
    if (name.includes('free match') || catId === 'free_match') return '🆓';
    if (name.includes('hacker') || catId === 'hacker_match') return '🛡️';
    return '🎮';
  };

  // Filtered Tournaments
  const filteredTournaments = tournaments.filter((t) => {
    // Search
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.map.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status
    let matchesStatus = true;
    if (statusFilter === 'live') {
      matchesStatus = t.roomStatus === 'live';
    } else if (statusFilter === 'open') {
      matchesStatus = t.roomStatus === 'open' || t.roomStatus === 'locked';
    } else if (statusFilter === 'completed') {
      matchesStatus = t.roomStatus === 'completed';
    }

    // Mode
    const matchesMode = modeFilter === 'all' || t.mode === modeFilter;

    // Fee
    const matchesFee = feeFilter === 'all' || 
      (feeFilter === 'free' && t.isFreeMatch) || 
      (feeFilter === 'paid' && !t.isFreeMatch);

    // Category Filter
    let matchesCategory = true;
    let isTargetGame = false;
    if (selectedCategory !== 'all') {
      const activeCat = categories?.find(c => c.id === selectedCategory);
      if (activeCat) {
        const catNameLower = activeCat.name.toLowerCase();
        if (
          catNameLower.includes('free fire') || activeCat.id === 'free_fire' ||
          catNameLower.includes('pubg') || activeCat.id === 'pubg_mobile' ||
          catNameLower.includes('free match') || activeCat.id === 'free_match' ||
          catNameLower.includes('hacker') || activeCat.id === 'hacker_match'
        ) {
            isTargetGame = true;
        }
        if (catNameLower.includes('free tournament') || activeCat.id === 'free_tournaments') {
          // Display tournaments from ALL games where Entry Fee = 0
          matchesCategory = (t.entryFee === 0 || t.isFreeMatch);
        } else {
          // Match specific game category
          const tournamentCategory = t.gameCategory || 'free_fire';
          matchesCategory = (tournamentCategory.toLowerCase() === activeCat.id.toLowerCase() || 
                             tournamentCategory.toLowerCase() === activeCat.name.toLowerCase() ||
                             (activeCat.id === 'free_fire' && !t.gameCategory)); // fallback for old tournaments
        }
      }
    }

    let matchesFfCategory = true;
    if (matchesCategory && (isTargetGame || selectedCategory === 'all')) {
        // Only apply if it's actually a target game category
        const gameCat = (t.gameCategory || 'free_fire').toLowerCase();
        const isActuallyTarget = gameCat.includes('free fire') || gameCat === 'free_fire' ||
                                 gameCat.includes('pubg') || gameCat === 'pubg_mobile' ||
                                 gameCat.includes('free match') || gameCat === 'free_match' ||
                                 gameCat.includes('hacker') || gameCat === 'hacker_match';
        if (isActuallyTarget && ffCategoryFilter !== 'all') {
            matchesFfCategory = (t.matchCategory === ffCategoryFilter) || (!t.matchCategory && ffCategoryFilter === 'BR'); // Default old to BR
        }
    }

    return matchesSearch && matchesStatus && matchesMode && matchesFee && matchesCategory && matchesFfCategory;
  });

  if (statusFilter === 'my_matches') {
    const myRegistrations = registrations.filter(r => r.userId === currentUser?.uid);
    
    return (
      <div id="my_matches_tab" className="space-y-6 pb-24">
        {/* Header with search bar */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5.5 h-5.5 text-gold-400" />
            <span>Joined Tournaments</span>
          </h2>
          
          {/* Status Pills */}
          <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 overflow-x-auto gap-1">
            <button 
              onClick={() => handleStatusChange('open')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 text-neutral-400 hover:text-white"
            >
              New Updates
            </button>
            <button 
              onClick={() => handleStatusChange('my_matches')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 bg-green-600 text-white shadow font-black"
            >
              🟢 Joined
            </button>
            <button 
              onClick={() => handleStatusChange('completed')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 text-neutral-400 hover:text-purple-400"
            >
              Completed
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myRegistrations.length === 0 ? (
            <div className="bg-[#111116] border border-white/5 rounded-3xl p-8 text-center space-y-3">
              <Trophy className="w-10 h-10 text-neutral-600 mx-auto animate-bounce" />
              <p className="text-xs text-neutral-400 font-medium">You have not registered for any tournaments yet.</p>
              <button 
                onClick={() => setStatusFilter('all')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-widest shadow-md cursor-pointer"
              >
                Find Tournaments
              </button>
            </div>
          ) : (
            myRegistrations.map((reg) => {
              const t = tournaments.find(tour => tour.id === reg.tournamentId);
              const banner = t ? t.bannerUrl : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600';
              const status = t ? t.roomStatus : 'open';

              return (
                <div 
                  key={reg.id}
                  id={`my_match_${reg.id}`}
                  className="bg-[#12111d]/95 border border-purple-500/25 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(168,85,247,0.15)] hover:border-purple-500/40 transition-all font-sans"
                >
                  {/* Banner header */}
                  <div className="w-full aspect-video relative border-b border-white/5">
                    <img src={banner} alt={reg.tournamentName} className="w-full h-full object-cover brightness-[0.65] group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12111d] via-transparent to-transparent" />
                    
                    {/* Status Badge over Banner */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#0a0a0f]/80 border border-purple-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-purple-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${status === 'live' ? 'bg-red-500 animate-ping' : status === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
                      <span>{status === 'live' ? 'Live Stream' : status === 'completed' ? 'Completed' : 'Registered • Upcoming'}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 w-fit">
                          {t ? getGameDisplayName(t.gameCategory) : 'Free Fire'}
                        </span>
                        <h3 className="text-base font-extrabold text-white tracking-wide">{reg.tournamentName}</h3>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-semibold">Prize Pool</p>
                        <p className="text-sm font-black text-gold-400 font-mono">₹{reg.prizePool}</p>
                      </div>
                    </div>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-3 gap-2 bg-[#0d0c15] p-3 rounded-2xl border border-white/5 text-[10px] text-neutral-400 font-mono text-center items-center">
                      <div>
                        <span className="text-neutral-500 block text-[8px] uppercase font-bold tracking-wider mb-1">Mode</span>
                        <span className="text-purple-400 font-bold">{reg.matchType}</span>
                      </div>
                      <div className="border-x border-white/5 px-1">
                        <span className="text-neutral-500 block text-[8px] uppercase font-bold tracking-wider mb-1">Date & Time</span>
                        <span className="text-white font-bold leading-tight">
                          {new Date(reg.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}<br/>
                          {new Date(reg.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[8px] uppercase font-bold tracking-wider mb-1">Entry Fee</span>
                        <span className="text-green-400 font-bold">{t ? (t.isFreeMatch ? 'FREE' : `₹${t.entryFee}`) : 'FREE'}</span>
                      </div>
                    </div>

                    {/* Match Room Status Logic */}
                    {(() => {
                      const adminStatus = t?.matchRoomStatus;
                      
                      if (adminStatus === 'match_completed') {
                        return (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                            <span className="text-green-400 font-black tracking-widest uppercase text-sm">
                              ✅ Match Completed
                            </span>
                          </div>
                        );
                      }
                      
                      if (adminStatus === 'match_live') {
                        return (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3 text-xs font-sans">
                            <p className="font-bold text-red-400 uppercase tracking-wider text-center animate-pulse">
                              🔴 Match Live
                            </p>
                            <div className="flex flex-col gap-2 opacity-90">
                              <div className="flex justify-between items-center bg-[#111116] p-3 rounded-xl border border-red-500/10 group">
                                <span className="text-white font-extrabold font-mono tracking-widest">🎮 Room ID : {t?.roomID || '-'}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t?.roomID || ''); alert('Copied Successfully'); }} className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-red-500/30 transition-all active:scale-95 border border-red-500/30 shadow-md">Copy Room ID</button>
                              </div>
                              <div className="flex justify-between items-center bg-[#111116] p-3 rounded-xl border border-red-500/10 group">
                                <span className="text-gold-400 font-extrabold font-mono tracking-widest">🔑 Room Password : {t?.roomPassword || '-'}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t?.roomPassword || ''); alert('Copied Successfully'); }} className="text-[10px] bg-gold-500/20 text-gold-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-gold-500/30 transition-all active:scale-95 border border-gold-500/30 shadow-md">Copy Password</button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      if (adminStatus === 'room_available') {
                        return (
                          <div className="bg-[#121a2a]/40 border border-blue-500/20 rounded-2xl p-4 space-y-3 text-xs font-sans">
                            <p className="font-bold text-white uppercase tracking-wider text-center">
                              🟢 Room Available
                            </p>
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center bg-[#111116] p-3 rounded-xl border border-white/5 group">
                                <span className="text-white font-extrabold font-mono tracking-widest">🎮 Room ID : {t?.roomID || '-'}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t?.roomID || ''); alert('Copied Successfully'); }} className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-blue-500/30 transition-all active:scale-95 border border-blue-500/30 shadow-md">Copy Room ID</button>
                              </div>
                              <div className="flex justify-between items-center bg-[#111116] p-3 rounded-xl border border-white/5 group">
                                <span className="text-gold-400 font-extrabold font-mono tracking-widest">🔑 Room Password : {t?.roomPassword || '-'}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t?.roomPassword || ''); alert('Copied Successfully'); }} className="text-[10px] bg-gold-500/20 text-gold-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-gold-500/30 transition-all active:scale-95 border border-gold-500/30 shadow-md">Copy Password</button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Otherwise, time has NOT passed and admin hasn't set it to available/live
                      return (
                        <>
                          <div className="flex justify-center mb-1">
                            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                              🟡 Coming Soon
                            </span>
                          </div>
                          <CountdownTimer targetDate={reg.dateTime} status="coming_soon" />
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="matches_tab_root" className="space-y-6 pb-24">
      
      {/* Header with search bar */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-5.5 h-5.5 text-gold-400" />
          <span>Esports Tournaments</span>
        </h2>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tournament by title or map..."
            className="w-full bg-[#111116] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500 transition-all"
          />
        </div>

        {/* Game Categories */}
        <div id="game_categories_section" className="space-y-3 pt-2">
          <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="text-purple-500">❖</span>
            <span>Game Categories</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories?.filter(c => c.enabled !== false).map((cat) => {
              const isActive = selectedCategory === cat.id;
              
              // Cache bust dynamic URLs smartly
              const getVersionedUrl = (url: string, updatedAt?: number) => {
                if (!url) return '';
                if (url.startsWith('data:')) return url;
                const cleanUrl = url.split('?v=')[0].split('&v=')[0];
                if (!updatedAt) return cleanUrl; // Don't break caching if no update timestamp
                return `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}v=${updatedAt}`;
              };

              const isCustomIconUrl = cat.icon?.startsWith('http') || cat.icon?.startsWith('data:image');
              const iconUrl = isCustomIconUrl ? getVersionedUrl(cat.icon!, cat.updatedAt) : '';
              const isCustomEmoji = cat.icon && !isCustomIconUrl && cat.icon.trim().length > 0;
              const defaultIconEmoji = getCategoryIcon(cat.id, cat.name);

              return (
                <button
                  key={cat.id}
                  id={`category_tab_${cat.id}`}
                  onClick={() => setSelectedCategory(isActive ? 'all' : cat.id)}
                  className={`relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-b from-[#1c1236] to-[#0d071a] border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-[#111116] border-white/5 hover:border-purple-500/20 hover:bg-[#15151c]'
                  }`}
                >
                  {cat.banner && (
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                      <img src={cat.banner} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {isCustomIconUrl && !imgErrors[cat.id] ? (
                    <img
                      src={iconUrl}
                      alt=""
                      className="w-8 h-8 object-contain mb-1 relative z-10 group-hover:scale-110 transition-transform rounded"
                      referrerPolicy="no-referrer"
                      onError={() => setImgErrors(prev => ({ ...prev, [cat.id]: true }))}
                    />
                  ) : (
                    <span className="text-xl mb-1 relative z-10 group-hover:scale-110 transition-transform">
                      {isCustomEmoji ? cat.icon : defaultIconEmoji}
                    </span>
                  )}
                  <span className={`text-[9px] font-black uppercase tracking-wider text-center relative z-10 ${isActive ? 'text-purple-300' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                    {cat.name}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 inset-x-3 h-[2px] bg-gradient-to-r from-purple-500 via-gold-400 to-purple-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 overflow-x-auto gap-1">
          <button 
            onClick={() => handleStatusChange('open')}
            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${statusFilter === 'open' || statusFilter === 'all' ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'}`}
          >
            New Updates
          </button>
          <button 
            onClick={() => handleStatusChange('my_matches')}
            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${statusFilter === 'my_matches' ? 'bg-green-600 text-white shadow' : 'text-neutral-400 hover:text-green-400'}`}
          >
            🟢 Joined
          </button>
          <button 
            onClick={() => handleStatusChange('completed')}
            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${statusFilter === 'completed' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400 hover:text-purple-400'}`}
          >
            Completed
          </button>
        </div>

        {/* FF Category Selector */
        (() => {
          const activeCat = categories?.find(c => c.id === selectedCategory);
          const isTargetGame = selectedCategory === 'all' || (activeCat && (
            activeCat.id === 'free_fire' || activeCat.name.toLowerCase().includes('free fire') ||
            activeCat.id === 'pubg_mobile' || activeCat.name.toLowerCase().includes('pubg') ||
            activeCat.id === 'free_match' || activeCat.name.toLowerCase().includes('free match') ||
            activeCat.id === 'hacker_match' || activeCat.name.toLowerCase().includes('hacker')
          ));
          
          if (isTargetGame) {
            const getSubcategoryAllLabel = () => {
              if (selectedCategory === 'all') return 'All Matches';
              if (!activeCat) return 'All';
              const name = activeCat.name;
              if (name.toLowerCase().includes('free fire')) return 'All FF';
              if (name.toLowerCase().includes('pubg')) return 'All PUBG';
              if (name.toLowerCase().includes('free match')) return 'All Free';
              if (name.toLowerCase().includes('hacker')) return 'All Hacker';
              return `All ${name}`;
            };

            return (
              <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 overflow-x-auto gap-1 mb-2">
                <button 
                  onClick={() => setFfCategoryFilter('all')}
                  className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${ffCategoryFilter === 'all' ? 'bg-white/10 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                >
                  {getSubcategoryAllLabel()}
                </button>
                <button 
                  onClick={() => setFfCategoryFilter('BR')}
                  className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${ffCategoryFilter === 'BR' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                >
                  🎮 Battle Royale (BR)
                </button>
                <button 
                  onClick={() => setFfCategoryFilter('CS')}
                  className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${ffCategoryFilter === 'CS' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                >
                  ⚔️ Clash Squad (CS)
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* Dropdown Filters (Mode & Fee) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Mode Selector */}
          <div className="flex items-center bg-[#111116] border border-white/5 rounded-xl px-3 py-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
            <select 
              value={modeFilter} 
              onChange={e => setModeFilter(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-300 w-full focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111116] text-white">All Modes</option>
              <option value="Solo" className="bg-[#111116] text-white">Solo</option>
              <option value="Duo" className="bg-[#111116] text-white">Duo</option>
              <option value="Squad" className="bg-[#111116] text-white">Squad</option>
            </select>
          </div>

          {/* Fee Selector */}
          <div className="flex items-center bg-[#111116] border border-white/5 rounded-xl px-3 py-1.5">
            <Coins className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
            <select 
              value={feeFilter} 
              onChange={e => setFeeFilter(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-300 w-full focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111116] text-white">All Fees</option>
              <option value="free" className="bg-[#111116] text-white">Free Entry</option>
              <option value="paid" className="bg-[#111116] text-white">Paid Matches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournament Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTournaments.length === 0 ? (
          <div className="bg-[#111116] border border-white/5 rounded-2xl p-8 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-xs text-neutral-400">No tournaments match your filter criteria.</p>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setModeFilter('all'); setFeeFilter('all'); setSelectedCategory('all'); setFfCategoryFilter('all'); }}
              className="text-xs text-gold-400 font-semibold underline cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredTournaments.map((t) => {
            const joinedCount = t.joinedSlots.length;
            const percentage = Math.min(Math.round((joinedCount / t.totalSlots) * 100), 100);
            const isUserJoined = currentUser ? t.joinedSlots.includes(currentUser.uid) : false;

            return (
              <div 
                key={t.id} 
                className="glass-card rounded-2xl overflow-hidden border border-white/5 relative group hover:border-gold-500/20 transition-all shadow-lg"
              >
                {/* Banner Image Container */}
                <div className="w-full aspect-video relative overflow-hidden border-b border-white/5">
                  <img 
                    src={t.bannerUrl} 
                    alt={t.title} 
                    className="w-full h-full object-cover brightness-[0.65] group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Banner Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111116] to-transparent" />
                  
                  {/* Left Status Badge overlay */}
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    {t.roomStatus === 'live' ? (
                      <span className="bg-pink-600 text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 glow-purple">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>LIVE STREAM</span>
                      </span>
                    ) : t.roomStatus === 'completed' ? (
                      <span className="bg-green-600 text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        FINISHED
                      </span>
                    ) : joinedCount >= t.totalSlots || t.roomStatus === 'locked' ? (
                      <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>FULL</span>
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        REGISTRATION OPEN
                      </span>
                    )}

                    {t.isFreeMatch ? (
                      <span className="bg-emerald-500 text-[#0d0d11] text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 fill-current" />
                        <span>FREE</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Right Mode Badge overlay */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[#0d0d11]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-neutral-300 text-[9px] font-mono font-bold uppercase tracking-wider">
                    <Users className="w-3 h-3 text-gold-400" />
                    <span>{t.mode}</span>
                  </div>

                  {/* Logo overlay on lower bottom right */}
                  <div className="absolute bottom-3 right-4 z-10 w-11 h-11 rounded-lg border border-white/15 overflow-hidden bg-neutral-900 shadow-lg">
                    <img src={t.logoUrl} alt="Room Host" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wide group-hover:text-gold-400 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-mono flex items-center flex-wrap gap-3 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3 text-purple-400" />
                        {getGameDisplayName(t.gameCategory)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gold-500" />
                        {t.matchCategory || 'BR'} ({t.mode})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        {t.matchDate ? `${new Date(t.matchDate).toLocaleDateString()} @ ${t.matchTime}` : (t.dateTime ? `${new Date(t.dateTime).toLocaleDateString()} @ ${new Date(t.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'TBA')}
                      </span>
                    </p>
                  </div>

                  {/* Prize / Stats Grid */}
                  <div className="grid grid-cols-3 bg-[#0d0d11]/60 border border-white/5 rounded-xl p-3 text-center">
                    <div>
                      <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">PRIZE POOL</p>
                      <p className="text-xs font-black font-mono text-gold-400 mt-1">₹{t.prizePool}</p>
                    </div>
                    <div className="border-x border-white/5">
                      <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">ENTRY FEE</p>
                      <p className="text-xs font-black font-mono text-white mt-1">
                        {t.isFreeMatch ? 'FREE' : `₹${t.entryFee}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">PER KILL PRIZE</p>
                      <p className="text-xs font-black font-mono text-amber-500 mt-1">₹{t.perKillPrize}</p>
                    </div>
                  </div>

                  {/* Joined Slots Progress Bar (not needed for completed matches) */}
                  {t.roomStatus !== 'completed' ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-neutral-400 font-medium">Joined Players: <strong className="text-white font-mono">{joinedCount}/{t.totalSlots}</strong></span>
                        <span className="text-gold-400 font-bold font-mono">{percentage}%</span>
                      </div>
                      <div className="w-full bg-[#1c1c28] h-1.5 rounded-full p-[1px] overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-gold-500 to-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-neutral-500">
                        <span>Only {t.totalSlots - joinedCount} slots remaining!</span>
                        {isUserJoined ? <span className="text-green-400 font-bold">✓ YOU REGISTERED</span> : null}
                      </div>
                    </div>
                  ) : (
                    /* Show Winner Info for Completed Matches */
                    <div className="bg-[#122216]/20 border border-green-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <span className="text-neutral-400 font-medium">Highest Kills Winner:</span>
                      <span className="text-green-400 font-bold font-mono uppercase bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/10">
                        🏆 {t.maxKillsWinner || 'ViperFF (12 Kills)'}
                      </span>
                    </div>
                  )}

                  {/* Actions / Join Buttons Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
                    
                    {/* View Details clickable */}
                    <button 
                      onClick={() => onOpenDetailsModal(t)}
                      className="text-[10px] font-bold text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Rules</span>
                    </button>

                    {/* Join / Watch Button Logic */}
                    <div className="flex items-center gap-2">
                      {/* Live Demo Status Toggler (Extremely useful for review & sandbox interaction!) */}
                      <button 
                        onClick={() => simulateMatchCompletion(t.id)}
                        title="Simulate updating room status (sandbox tool)"
                        className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-gold-400 border border-white/10 flex items-center gap-1 transition-all"
                      >
                        <Settings className="w-3.5 h-3.5 animate-spin [animation-duration:12s]" />
                        <span className="text-[8px] font-mono uppercase">Status</span>
                      </button>

                      {t.roomStatus === 'live' ? (
                        <a 
                          href={t.liveUrl || 'https://youtube.com'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-[0.98] transition-all glow-purple"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Watch Stream</span>
                        </a>
                      ) : t.roomStatus === 'completed' ? (
                        <a 
                          href={t.liveUrl || 'https://youtube.com'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Stats Sheet</span>
                        </a>
                      ) : isUserJoined ? (
                        <button 
                          onClick={() => onOpenDetailsModal(t)}
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
                        >
                          <span>Room Locked</span>
                        </button>
                      ) : joinedCount >= t.totalSlots || t.roomStatus === 'locked' ? (
                        <div className="px-4 py-2 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-not-allowed">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span>Tournament Full</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => onOpenDetailsModal(t)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-500 text-neutral-950 text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(229,169,25,0.35)] hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer"
                        >
                          Join Battle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rules Notice and protection guidelines */}
      <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">HACK & TEAMING PROTECTION</h4>
          <p className="text-[9px] text-neutral-400 leading-relaxed">
            All players must record their match gameplay. Teaming, emulator bypass, or script modification triggers direct hardware detection bans. Winning balance will be frozen immediately.
          </p>
        </div>
      </div>

    </div>
  );
};
