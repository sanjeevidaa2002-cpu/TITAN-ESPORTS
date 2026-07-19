/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Trophy, 
  MapPin, 
  Users, 
  Clock, 
  User, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  Award,
  BookOpen
} from 'lucide-react';

interface PlayerFormState {
  nickname: string;
  uid: string;
  level?: string;
}

interface PlayerDetailsFormProps {
  onBackToMatches: () => void;
  onGoToMyMatches: () => void;
}

export const getPlayerCountFromMode = (mode: string): number => {
  if (!mode) return 1;
  const m = mode.trim().toLowerCase();
  if (m === 'solo') return 1;
  if (m === 'duo') return 2;
  if (m === 'squad') return 4;
  if (m === 'trio') return 3;
  const match = m.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return 1;
};

export const PlayerDetailsForm: React.FC<PlayerDetailsFormProps> = ({ 
  onBackToMatches,
  onGoToMyMatches
}) => {
  const { registeringTournament, tournaments, userProfile, submitRegistration, registrations } = useGame();
  
  const latestTournament = registeringTournament ? (tournaments.find(tour => tour.id === registeringTournament.id) || registeringTournament) : null;
  
  const [players, setPlayers] = useState<PlayerFormState[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTeamLeaderOnly, setIsTeamLeaderOnly] = useState(false);
  const [successData, setSuccessData] = useState<{
    registrationId: string;
    teamId?: string;
  } | null>(null);

  // Initialize the player forms based on the match type
  useEffect(() => {
    if (!latestTournament) return;
    
    const count = getPlayerCountFromMode(latestTournament.mode);

    const initialPlayers: PlayerFormState[] = [];
    
    // Autofill player 1 with the current user profile if available
    for (let i = 0; i < count; i++) {
      if (i === 0 && userProfile) {
        initialPlayers.push({
          nickname: userProfile.nickname || '',
          uid: userProfile.freefireUid || '',
          level: ''
        });
      } else {
        initialPlayers.push({ nickname: '', uid: '', level: '' });
      }
    }
    setPlayers(initialPlayers);
    setSuccessData(null);
    setErrors([]);
    setIsTeamLeaderOnly(false);
  }, [latestTournament?.mode, latestTournament?.id, userProfile]);

  if (!latestTournament) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">No active registration session</h3>
        <p className="text-xs text-neutral-400">Please join a tournament first.</p>
        <button 
          onClick={onBackToMatches}
          className="px-6 py-2.5 rounded-xl bg-gold-500 text-neutral-950 text-xs font-black uppercase tracking-widest"
        >
          Browse Matches
        </button>
      </div>
    );
  }

  const t = latestTournament;

  const handlePlayerChange = (index: number, field: keyof PlayerFormState, value: string) => {
    const updated = [...players];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setPlayers(updated);
  };

  const validateForm = (): boolean => {
    const errs: string[] = [];
    const uidsSeen = new Set<string>();

    const countToValidate = isTeamLeaderOnly ? 1 : players.length;

    for (let i = 0; i < countToValidate; i++) {
      const p = players[i];
      const playerNum = i + 1;

      if (!p.nickname.trim()) {
        errs.push(`Player ${playerNum}: Nickname is required.`);
      }
      
      if (!p.uid.trim()) {
        errs.push(`Player ${playerNum}: Free Fire UID is required.`);
      } else {
        // UID numeric check
        if (!/^\d+$/.test(p.uid.trim())) {
          errs.push(`Player ${playerNum}: Free Fire UID must contain only numbers.`);
        } else {
          // Duplicate team UID check
          if (uidsSeen.has(p.uid.trim())) {
            errs.push(`Player ${playerNum}: UID "${p.uid}" is duplicated inside your team.`);
          }
          uidsSeen.add(p.uid.trim());
        }
      }
    }

    // Check duplicate registrations overall
    const alreadyRegistered = registrations.some(r => r.tournamentId === t.id && r.status !== 'cancelled' && r.status !== 'cancelled');
    if (alreadyRegistered) {
      errs.push("You are already registered for this tournament!");
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Map other players as TBA if isTeamLeaderOnly is selected
      const finalPlayers = players.map((p, idx) => {
        if (idx === 0) return p;
        if (isTeamLeaderOnly) {
          return {
            nickname: `Slot ${idx + 1} TBA`,
            uid: `00000000${idx + 1}`,
            level: 'TBA'
          };
        }
        return p;
      });

      const res = await submitRegistration(finalPlayers);
      if (res.success && res.registrationId) {
        setSuccessData({
          registrationId: res.registrationId,
          teamId: res.teamId
        });
      } else {
        setErrors([res.message || "Failed to submit registration."]);
      }
    } catch (err: any) {
      setErrors([err.message || "An unexpected error occurred."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get formatted date string
  const formatMatchDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const formatMatchTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '18:00 IST';
    }
  };

  // Render Success Screen
  if (successData) {
    return (
      <div id="registration_success_root" className="space-y-6 max-w-lg mx-auto py-4">
        <div className="bg-gradient-to-b from-[#18112c] via-[#120a1c] to-[#0a0510] border border-purple-500/30 rounded-3xl p-6 text-center space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.25)] relative overflow-hidden">
          
          {/* Laser grids / glows */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
          
          {/* Glowing Check Sphere */}
          <div className="w-20 h-20 rounded-full bg-purple-600/10 border-2 border-purple-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-pulse">
            <CheckCircle className="w-10 h-10 text-purple-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-yellow-300 to-purple-400 uppercase tracking-wider">
              Registration Successful!
            </h2>
            <p className="text-xs text-neutral-400">
              Your slots have been successfully reserved and mapped under user account.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-[#12121a]/90 border border-purple-500/15 rounded-2xl p-4 space-y-3.5 text-left font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Tournament</span>
              <span className="text-xs font-black text-white">{t.title}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Registration ID</span>
              <span className="text-xs font-bold font-mono text-purple-400 select-all">{successData.registrationId}</span>
            </div>

            {successData.teamId && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Team ID</span>
                <span className="text-xs font-bold font-mono text-gold-400 select-all">{successData.teamId}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Match Type</span>
              <span className="text-xs font-bold text-white uppercase bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-lg text-[9px]">{t.mode}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Map Block</span>
              <span className="text-xs font-bold font-mono text-neutral-300">{t.map}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Match Schedule</span>
              <span className="text-xs font-semibold text-neutral-300">{formatMatchDate(t.dateTime)} @ {formatMatchTime(t.dateTime)}</span>
            </div>
          </div>

          {/* Quick Guidance Alert */}
          <div className="bg-purple-950/10 border border-purple-500/20 rounded-xl p-3 flex gap-2 text-left">
            <BookOpen className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[9px] font-black text-purple-300 uppercase tracking-wider">How to join custom room?</p>
              <p className="text-[9px] text-neutral-400 leading-relaxed">
                The Custom Room ID & Password will unlock exactly 15 minutes before the match start time on the matches tab. Open Free Fire, go to Custom Rooms, and join!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onBackToMatches}
              className="px-4 py-3 rounded-xl bg-transparent border border-white/10 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              Browse Matches
            </button>
            <button
              onClick={onGoToMyMatches}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:brightness-110 transition-all cursor-pointer"
            >
              My Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="player_details_form_root" className="space-y-6 pb-24 max-w-lg mx-auto">
      
      {/* Header back navigation */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onBackToMatches}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Tournament Player Details</h2>
          <p className="text-[10px] text-neutral-400">Complete the roster registration to unlock the custom room credentials.</p>
        </div>
      </div>

      {/* Verification errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold uppercase tracking-wider text-[10px]">Verification Failed</p>
            <ul className="list-disc pl-4 space-y-1 text-[10px] text-neutral-300">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tournament Info Header Capsule (Glassmorphism Gold/Purple) */}
      <div className="bg-gradient-to-br from-[#12111d] to-[#0a0a0f] border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
            <img src={t.bannerUrl} alt={t.title} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-500/25 text-purple-400 text-[8px] font-black uppercase tracking-widest">
                {t.mode}
              </span>
              <span className="text-[8px] text-neutral-500 font-mono">ID: {t.id}</span>
            </div>
            
            <h3 className="text-sm font-extrabold text-white tracking-wide">{t.title}</h3>
            
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5 text-[10px]">
              <div className="flex items-center gap-1 text-neutral-400">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-medium">Map: {t.map}</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-medium">{formatMatchDate(t.dateTime)}</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400 mt-0.5">
                <Users className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-medium">{formatMatchTime(t.dateTime)}</span>
              </div>
              <div className="flex items-center gap-1 text-gold-400 mt-0.5 font-bold font-mono">
                <Trophy className="w-3.5 h-3.5" />
                <span>Pool: ₹{t.prizePool}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger values line */}
        <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 uppercase tracking-wider font-semibold">Entry Fee:</span>
            <span className="text-gold-400 font-black font-mono bg-gold-500/5 px-2 py-0.5 rounded border border-gold-500/10">
              {t.isFreeMatch ? 'FREE' : `₹${t.entryFee}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-green-400 font-bold bg-green-500/5 border border-green-500/10 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            <span>Payment Verified</span>
          </div>
        </div>
      </div>

      {/* Dynamic Player Form Inputs */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="space-y-4">
          {t.mode !== 'Solo' && (
            <div className="bg-[#18122c]/40 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-inner">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white uppercase tracking-wide block">
                  Team Leader Only Registration
                </span>
                <span className="text-[10px] text-neutral-400 leading-relaxed block">
                  Only enter your details (Captain). Other {t.mode === 'Squad' ? '3' : '1'} slots will be reserved as TBA.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isTeamLeaderOnly}
                  onChange={(e) => setIsTeamLeaderOnly(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          )}

          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Player Roster ({isTeamLeaderOnly ? 'Team Leader Only' : `${players.length} Forms`})</span>
            </span>
            <span className="text-[9px] text-neutral-500">Provide genuine details for prize claims</span>
          </div>

          <div className="space-y-4">
            {players.slice(0, isTeamLeaderOnly ? 1 : players.length).map((player, idx) => (
              <div 
                key={idx} 
                className="bg-gradient-to-br from-[#111116] to-[#0e0e12] border border-white/5 rounded-2xl p-4.5 space-y-3 shadow-md relative"
              >
                {/* Accent neon line */}
                <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-purple-500/40 rounded-r-lg" />

                <div className="flex justify-between items-center pl-1">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>Player Slot {idx + 1} {idx === 0 ? '(Captain / You)' : ''}</span>
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">Slot verified</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Player Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">
                      Player Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={player.nickname}
                      onChange={(e) => handlePlayerChange(idx, 'nickname', e.target.value)}
                      placeholder="In-Game Name"
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium placeholder-neutral-600 shadow-inner"
                      required
                    />
                  </div>

                  {/* Free Fire UID */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">
                      Player UID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={player.uid}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          handlePlayerChange(idx, 'uid', val);
                        }
                      }}
                      placeholder="Numeric UID Only"
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium font-mono placeholder-neutral-600 shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* Optional level */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">
                    In-Game Level <span className="text-neutral-600">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={player.level}
                    onChange={(e) => handlePlayerChange(idx, 'level', e.target.value)}
                    placeholder="e.g. Level 65"
                    className="w-full bg-[#161622]/40 border border-white/5 rounded-xl px-3 py-1.5 text-[11px] text-neutral-300 focus:outline-none focus:border-purple-500 font-medium placeholder-neutral-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-[0_4px_25px_rgba(147,51,234,0.3)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Submitting Details...</span>
            ) : (
              <>
                <Flame className="w-4 h-4 animate-bounce" />
                <span>Submit Registration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
