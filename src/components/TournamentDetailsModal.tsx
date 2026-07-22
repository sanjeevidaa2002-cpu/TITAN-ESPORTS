/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { Tournament } from '../types';
import { useGame } from '../context/GameContext';
import { 
  Trophy, 
  X, 
  MapPin, 
  Users, 
  Clock, 
  ShieldAlert, 
  Eye, 
  Lock, 
  Key, 
  ArrowRight, 
  CheckCircle, 
  Sparkles,
  Award,
  AlertTriangle,
  Info,
  User
} from 'lucide-react';

interface TournamentDetailsModalProps {
  tournament: Tournament;
  onClose: () => void;
  onSwitchTab: (tab: string) => void;
}

export const TournamentDetailsModal: React.FC<TournamentDetailsModalProps> = ({ 
  tournament, 
  onClose,
  onSwitchTab
}) => {
  const { userProfile, currentUser, initiateJoinTournament, processJoinPayment, submitRegistration } = useGame();
  const [isJoining, setIsJoining] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [pendingJoinFee, setPendingJoinFee] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [countdown, setCountdown] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [playersInputs, setPlayersInputs] = useState<{ name: string; uid: string }[]>([]);
  const [formError, setFormError] = useState('');

const matchStarted = tournament.roomStatus === 'live' || tournament.roomStatus === 'completed' || tournament.matchRoomStatus === 'match_live' || tournament.matchRoomStatus === 'match_completed';

  const isFormValid = () => {
    return playersInputs.length > 0 && playersInputs.every(p => p.name.trim() !== '' && p.uid.trim() !== '');
  };

  const handleJoinSubmit = async () => {
    setFormError('');
    setMessage(null);

    const finalPlayers = playersInputs.map(p => ({
      nickname: p.name.trim(),
      uid: p.uid.trim(),
      level: 'Level 50'
    }));

    // Validation
    for (let i = 0; i < finalPlayers.length; i++) {
      if (!finalPlayers[i].nickname) {
        setFormError(`Player Name at slot ${i + 1} is required.`);
        return;
      }
      if (finalPlayers[i].nickname.length < 2) {
        setFormError(`Player Name at slot ${i + 1} must be at least 2 characters.`);
        return;
      }
      if (!finalPlayers[i].uid) {
        setFormError(`Player UID at slot ${i + 1} is required.`);
        return;
      }
      if (!/^\d+$/.test(finalPlayers[i].uid)) {
        setFormError(`Player UID at slot ${i + 1} must contain only numbers.`);
        return;
      }
    }

    // Prevent duplicate UIDs within the same team
    const uids = finalPlayers.map(p => p.uid);
    const uniqueUids = new Set(uids);
    if (uniqueUids.size !== uids.length) {
      setFormError("Duplicate Player UIDs are not allowed within the same team.");
      return;
    }

    setIsJoining(true);
    try {
      const res = await initiateJoinTournament(tournament.id);
      if (!res.success) {
        if (res.redirectWallet) {
          setMessage({ type: 'error', text: res.message || "Insufficient balance. Redirecting to deposit..." });
          setTimeout(() => {
            onClose();
            onSwitchTab('wallet');
          }, 2000);
        } else {
          setMessage({ type: 'error', text: res.message || "Cannot join tournament." });
        }
      } else {
        if (res.requireConfirmation) {
          setPendingJoinFee(res.entryFee || 0);
          setShowPaymentConfirm(true);
        } else {
          // Free tournament - process payment and submit registration immediately
          await processJoinPayment(tournament.id);
          
          const regRes = await submitRegistration(finalPlayers);
          if (regRes.success) {
            setMessage({ 
              type: 'success', 
              text: `Successfully joined! Registration ID: ${regRes.registrationId}` 
            });
          } else {
            setMessage({ type: 'error', text: regRes.message || "Failed to submit registration details." });
          }
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "An error occurred." });
    } finally {
      setIsJoining(false);
    }
  };

  const handleConfirmPaymentAndDeduct = async () => {
    setIsJoining(true);
    try {
      const res = await processJoinPayment(tournament.id);
      if (res.success) {
        const finalPlayers = playersInputs.map(p => ({
          nickname: p.name.trim(),
          uid: p.uid.trim(),
          level: 'Level 50'
        }));

        const regRes = await submitRegistration(finalPlayers);
        if (regRes.success) {
          setShowPaymentConfirm(false);
          setMessage({ 
            type: 'success', 
            text: `Payment successful! Registration ID: ${regRes.registrationId}` 
          });
        } else {
          setMessage({ type: 'error', text: regRes.message || "Roster registration failed." });
        }
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Payment failed." });
    } finally {
      setIsJoining(false);
    }
  };

  const isUserJoined = currentUser ? tournament.joinedSlots.includes(currentUser.uid) : false;
  const isRoomFull = tournament.joinedSlots.length >= tournament.totalSlots;

  // Calculate Prize pool breakdown
  const firstPrize = Math.round(tournament.prizePool * 0.4);
  const secondPrize = Math.round(tournament.prizePool * 0.2);
  const thirdPrize = Math.round(tournament.prizePool * 0.1);
  const perKill = tournament.perKillPrize;

  const getPlayerCountFromMode = (mode: string): number => {
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

  // Pre-fill player details dynamically based on tournament mode and user profile
  useEffect(() => {
    const count = getPlayerCountFromMode(tournament.mode);
    const initial = Array.from({ length: count }, (_, i) => ({ name: '', uid: '' }));

    if (isUserJoined && tournament.joinedTeams && currentUser) {
      const myTeam = tournament.joinedTeams.find(t => t.userId === currentUser.uid);
      if (myTeam && myTeam.players) {
        for (let i = 0; i < count; i++) {
          if (myTeam.players[i]) {
            initial[i] = {
              name: myTeam.players[i].gameName || '',
              uid: myTeam.players[i].uid || ''
            };
          }
        }
      }
    } else if (userProfile && !isUserJoined) {
      initial[0] = {
        name: userProfile.nickname || '',
        uid: userProfile.freefireUid || ''
      };
    }
    setPlayersInputs(initial);
  }, [tournament, userProfile, isUserJoined, currentUser]);

  const handlePlayerFieldChange = (index: number, field: 'name' | 'uid', value: string) => {
    setPlayersInputs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (formError) setFormError('');
  };

  // Live countdown timer logic
  useEffect(() => {
    const startMs = new Date(tournament.dateTime).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = startMs - now;

      if (diff <= 0) {
        setCountdown('Match Started / Live');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (3600 * 1000));
        const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);
        
        setCountdown(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament.dateTime]);

  // Check if credentials are ready based on matchRoomStatus
  const showCredentials = isUserJoined && (
    tournament.matchRoomStatus === 'room_available' || 
    tournament.matchRoomStatus === 'match_live'
  );

  return (
    <div id="details_modal_root" className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card-gold rounded-3xl w-full max-w-lg overflow-hidden border border-gold-500/25 max-h-[90vh] flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Banner header inside Modal */}
        <div className="h-44 shrink-0 relative overflow-hidden">
          <img 
            src={tournament.bannerUrl} 
            alt={tournament.title} 
            className="w-full h-full object-cover brightness-[0.45]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121219] to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
            <span className="bg-gold-500 text-neutral-950 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {tournament.mode} | MAP: {tournament.map}
            </span>
            <h3 className="text-base font-black text-white uppercase tracking-wide drop-shadow-md">
              {tournament.title}
            </h3>
          </div>
        </div>

        {/* Modal Scrollable Contents */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          
          {/* Display Messages */}
          {message ? (
            <div className={`p-4 rounded-2xl flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-950/40 border-green-500/30 text-green-400' : 'bg-red-950/40 border-red-500/20 text-red-400'}`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-400 animate-bounce" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              )}
              <div className="text-xs">
                <p className="font-bold">{message.type === 'success' ? 'Registration Complete!' : 'Joining Denied'}</p>
                <p className="text-[10px] text-neutral-300 mt-0.5 leading-relaxed">{message.text}</p>
              </div>
            </div>
          ) : null}

          {showPaymentConfirm && (
            <div id="payment_confirm_notice" className="p-4 bg-purple-950/20 border border-purple-500/25 rounded-2xl flex items-start gap-3 text-purple-400 font-sans shadow-lg shadow-purple-500/5 animate-pulse">
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-purple-400" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-gold-400 uppercase tracking-wider">Confirm Match Entry Fee Deduction</p>
                <p className="text-[10px] text-neutral-300 leading-relaxed">
                  You are about to join <span className="font-bold text-white">{tournament.title}</span>. An entry fee of <span className="font-black text-white font-mono bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 rounded">₹{pendingJoinFee}</span> will be debited from your wallet.
                </p>
                <p className="text-[9px] text-neutral-400 italic">
                  After payment, you will proceed to the "Tournament Player Details" page to enter player nickname(s) and UID(s).
                </p>
              </div>
            </div>
          )}

            <>
              {/* Room ID and Password Reveal Block */}
              {isUserJoined ? (
                <div className="bg-[#121a2a]/90 border border-blue-500/20 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Custom Room Credentials</span>
                    </div>
                    <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {showCredentials ? 'Active' : (tournament.matchRoomStatus === 'coming_soon' || !tournament.matchRoomStatus) ? 'Coming Soon' : 'Closed'}
                    </span>
                  </div>

                  {showCredentials ? (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-[#111116] border border-white/5 p-3 rounded-xl text-center space-y-1">
                        <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-semibold">ROOM ID</p>
                        <p className="text-sm font-black font-mono text-white select-all">{tournament.roomID || 'FF-8846392'}</p>
                      </div>
                      <div className="bg-[#111116] border border-white/5 p-3 rounded-xl text-center space-y-1">
                        <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-semibold">PASSWORD</p>
                        <p className="text-sm font-black font-mono text-gold-400 select-all">{tournament.roomPassword || 'vault_gold_99'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 space-y-1.5">
                      <p className="text-xs font-semibold text-neutral-300 font-mono">
                        Please wait. The Admin will reveal Room details when it's time.
                      </p>
                      <p className="text-[9px] text-neutral-500">
                        Once unlocked, open your Free Fire App &gt; Custom Rooms &gt; Input ID and Password to enter.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Quick Info Parameters */}
              <div className="grid grid-cols-3 bg-[#111116]/80 border border-white/5 rounded-2xl p-4 text-center divide-x divide-white/5">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Entry Fee</p>
                  <p className="text-sm font-black font-mono text-gold-400">
                    {tournament.isFreeMatch ? 'FREE' : `₹${tournament.entryFee}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Prize Pool</p>
                  <p className="text-sm font-black font-mono text-white">₹{tournament.prizePool}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Per Kill Payout</p>
                  <p className="text-sm font-black font-mono text-amber-500">₹{tournament.perKillPrize}</p>
                </div>
              </div>

              {/* Tournament Real-Time Countdown Timer */}
              <CountdownTimer 
                targetDate={tournament.dateTime} 
                matchDate={tournament.matchDate} 
                matchTime={tournament.matchTime} 
                timeZone={tournament.timeZone} 
                status={tournament.roomStatus} 
                matchRoomStatus={tournament.matchRoomStatus} 
              />

              {/* Prize Pool Distribution Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-gold-400" />
                  <span>Prize Distribution</span>
                </h4>
                
                <div className="bg-[#111116] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 text-xs">
                  <div className="p-3 flex justify-between items-center bg-[#161622]/40 font-bold text-neutral-400">
                    <span>Rank Position</span>
                    <span>Reward Payout</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="font-bold text-white flex items-center gap-1.5">🏆 1st (Booyah!)</span>
                    <span className="font-mono font-bold text-gold-400">₹{firstPrize}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="font-semibold text-neutral-300">🥈 2nd Rank</span>
                    <span className="font-mono font-bold text-white">₹{secondPrize}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="font-semibold text-neutral-300">🥉 3rd Rank</span>
                    <span className="font-mono font-bold text-neutral-300">₹{thirdPrize}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-400">🏅 Per Kill Reward (Unlimited)</span>
                    <span className="font-mono font-bold text-amber-500">₹{perKill} per kill</span>
                  </div>
                </div>
              </div>

              {/* Registration Form / GAME DETAIL (Clean responsive box UI replacing Match Constraints) */}
              <div className="bg-[#120f24] border border-purple-500/30 rounded-2xl p-5 space-y-4 shadow-[0_0_25px_rgba(147,51,234,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {isUserJoined ? "YOUR SQUAD REGISTRATION" : "GAME DETAIL"}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {playersInputs.map((player, idx) => (
                    <div key={idx} className="bg-[#161426] border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                          Player Slot {idx + 1} {idx === 0 ? '(Captain)' : ''}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">
                            Player Name <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text"
                            placeholder="Enter Player Name"
                            value={player.name}
                            onChange={(e) => handlePlayerFieldChange(idx, 'name', e.target.value)}
                            className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-gold-500 transition-all font-sans"
                            required
                            disabled={isJoining || showPaymentConfirm || isUserJoined}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">
                            Player UID <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text"
                            placeholder="Enter Player Numeric UID"
                            value={player.uid}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) {
                                handlePlayerFieldChange(idx, 'uid', val);
                              }
                            }}
                            className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-gold-500 transition-all font-mono font-semibold"
                            required
                            disabled={isJoining || showPaymentConfirm || isUserJoined}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formError && (
                    <p className="text-[10px] font-bold text-red-400 font-sans">{formError}</p>
                  )}

                  {/* Done button below these fields */}
                  {!isUserJoined && (
                    <button
                      type="button"
                      onClick={handleJoinSubmit}
                      disabled={isJoining || showPaymentConfirm || !isFormValid() || matchStarted}
                      className={`w-full py-3 rounded-xl text-neutral-950 text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isFormValid() 
                          ? 'bg-gradient-to-r from-gold-500 to-amber-600 hover:brightness-110 active:scale-98 glow-purple' 
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5 shadow-none'
                      }`}
                    >
                      {isJoining ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <span>{matchStarted ? 'Match Started - Joins Disabled' : 'Done'}</span>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}

                  {isUserJoined && (
                    <div className="bg-green-950/20 border border-green-500/30 p-3.5 rounded-xl text-center">
                      <p className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Registered Successfully</span>
                      </p>
                      <p className="text-[9px] text-neutral-400 mt-1">
                        Your squad is officially added to the tournament slate below.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Core competitive Rules list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>Teaming & Hack Rules</span>
                </h4>
                <ul className="space-y-2 text-[10px] text-neutral-400 leading-relaxed font-sans list-disc pl-4">
                  <li>Teaming up with opponent squads is strictly prohibited. Mod telemetry active.</li>
                  <li>Hacks, scripts, aimbots, or third-party modified files trigger direct hardware ID bans.</li>
                  <li>All registered players must verify their Free Fire Player UID in their profile.</li>
                  <li>Always record your match play. Moderators will ask for proof on doubt.</li>
                </ul>
              </div>

              {/* Tournament slot section (Always displayed below the form) */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gold-400" />
                      <span>Joined Players</span>
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-mono mt-1">
                      Total Joined Players: <strong className="text-white">{tournament.joinedSlots.length}</strong> | Remaining Slots: <strong className="text-gold-400">{tournament.totalSlots - tournament.joinedSlots.length}</strong>
                    </p>
                  </div>
                  
                  {/* Live search input */}
                  <div className="relative">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search player or UID..."
                      className="w-full sm:w-48 bg-[#161622] border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-purple-500 placeholder-neutral-600 shadow-inner"
                    />
                  </div>
                </div>

                {/* Gorgeous Roster Table Grid */}
                <div className="border border-white/5 bg-[#100c18] rounded-2xl overflow-hidden shadow-2xl">
                  <div className="max-h-64 overflow-y-auto p-4">
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const query = searchQuery.trim().toLowerCase();
                        let allPlayers = [];
                        (tournament.joinedTeams || []).forEach(team => {
                          team.players.forEach(p => {
                            allPlayers.push(p);
                          });
                        });
                        
                        // Also get players from joinedSlots if joinedTeams isn't fully populated
                        const uidSet = new Set(allPlayers.map(p => p.uid));
                        tournament.joinedSlots.forEach((uid) => {
                          if (!uidSet.has(uid)) {
                            allPlayers.push({
                              gameName: tournament.joinedNicknames[uid] || 'Unknown Player',
                              uid: uid
                            });
                          }
                        });

                        const filteredPlayers = allPlayers.filter(p => {
                          if (!query) return true;
                          return p.gameName.toLowerCase().includes(query) || p.uid.includes(query);
                        });

                        if (filteredPlayers.length === 0) {
                          return (
                            <div className="text-center text-neutral-500 font-medium py-4 text-xs">
                              {allPlayers.length === 0 ? "No players joined yet. Be the first to join!" : `No players found matching "${searchQuery}"`}
                            </div>
                          );
                        }

                        return filteredPlayers.map((p, idx) => (
                          <div key={idx} className="flex flex-col gap-2 p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl border border-white/5 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-500 w-24">Player Name</span>
                              <span className="text-neutral-600">:</span>
                              <span className="font-extrabold tracking-wide text-white">{p.gameName || (p as any).nickname || 'Unknown Player'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-500 w-24">Game UID</span>
                              <span className="text-neutral-600">:</span>
                              <span className="font-mono font-bold text-purple-400">{p.uid}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-500 w-24">Entry Fee</span>
                              <span className="text-neutral-600">:</span>
                              <span className="font-black text-green-400">{tournament.isFreeMatch ? 'FREE' : `₹${tournament.entryFee}`}</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-[#111116] border-t border-white/5 flex items-center justify-between gap-4 shrink-0">
          <div className="space-y-0.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Wallet Balance</span>
            <span className="text-xs font-bold font-mono text-gold-400">
              ₹{(userProfile ? (userProfile.depositBalance + userProfile.winningBalance) : 0).toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2">
            {showPaymentConfirm ? (
              <button 
                onClick={() => setShowPaymentConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-transparent border border-white/5 text-xs text-neutral-400 font-bold uppercase tracking-wider hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-transparent border border-white/5 text-xs text-neutral-400 font-bold uppercase tracking-wider hover:text-white transition-all cursor-pointer"
              >
                Back
              </button>
            )}

            {tournament.roomStatus === 'live' ? (
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer glow-purple"
              >
                <span>Watch Stream</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : tournament.roomStatus === 'completed' ? (
              <button 
                disabled
                className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
              >
                Match Completed
              </button>
            ) : isUserJoined ? (
              <button 
                disabled
                className="px-5 py-2.5 rounded-xl bg-green-950 text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-not-allowed border border-green-500/20"
              >
                <span>Room Joined</span>
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            ) : isRoomFull ? (
              <button 
                disabled
                className="px-5 py-2.5 rounded-xl bg-red-950 text-red-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-red-500/10 flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Tournament Full
              </button>
            ) : showPaymentConfirm ? (
              <button 
                onClick={handleConfirmPaymentAndDeduct}
                disabled={isJoining}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {isJoining ? 'Processing...' : `Confirm & Pay ₹${pendingJoinFee}`}
              </button>
            ) : (
              <button 
                onClick={handleJoinSubmit}
                disabled={isJoining || !isFormValid()}
                className={`px-6 py-3 rounded-xl text-neutral-950 text-xs font-black uppercase tracking-widest shadow-lg transition-all cursor-pointer ${
                  isFormValid()
                    ? 'bg-gradient-to-r from-gold-500 to-amber-600 hover:brightness-110 active:scale-95'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isJoining ? 'Joining...' : 'Done'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
