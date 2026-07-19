/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { WeeklyPlayer, WeeklyLeaderboardConfig } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  Award, 
  Trophy, 
  Zap, 
  ShieldCheck, 
  Check, 
  X, 
  Activity, 
  DollarSign, 
  Gamepad2, 
  Sparkles, 
  FileText, 
  RefreshCw,
  User,
  ToggleLeft,
  ToggleRight,
  ChevronDown
} from 'lucide-react';

export const WeeklyTopPlayersManager: React.FC = () => {
  const { 
    weeklyPlayers, 
    weeklyLeaderboardConfig, 
    saveWeeklyPlayerAdmin, 
    deleteWeeklyPlayerAdmin, 
    updateWeeklyLeaderboardConfigAdmin 
  } = useGame();

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<WeeklyPlayer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formUid, setFormUid] = useState('');
  const [formGame, setFormGame] = useState<'Free Fire' | 'PUBG Mobile' | 'Clash of Clans'>('Free Fire');
  const [formMatches, setFormMatches] = useState(0);
  const [formWins, setFormWins] = useState(0);
  const [formKills, setFormKills] = useState(0);
  const [formPrize, setFormPrize] = useState(0);
  const [formPoints, setFormPoints] = useState(0);
  const [formWinRate, setFormWinRate] = useState(0);
  const [formKd, setFormKd] = useState(0);
  const [formRank, setFormRank] = useState(1);
  const [formStatus, setFormStatus] = useState<'active' | 'disabled'>('active');
  const [formVerified, setFormVerified] = useState(false);
  const [formMvp, setFormMvp] = useState(false);
  const [formImage, setFormImage] = useState('');
  const [formTimeframe, setFormTimeframe] = useState<'this_week' | 'last_week' | 'this_month'>('this_week');

  // Trigger temporary success notification
  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Open Add/Edit Modal
  const openPlayerModal = (player?: WeeklyPlayer) => {
    if (player) {
      setEditingPlayer(player);
      setFormName(player.name);
      setFormUid(player.uid);
      setFormGame(player.gameCategory);
      setFormMatches(player.matchesPlayed);
      setFormWins(player.wins);
      setFormKills(player.kills);
      setFormPrize(player.prizeWon);
      setFormPoints(player.weeklyPoints);
      setFormWinRate(player.winRate);
      setFormKd(player.kdRatio || 0);
      setFormRank(player.rank);
      setFormStatus(player.status);
      setFormVerified(player.verified);
      setFormMvp(player.mvp);
      setFormImage(player.profileImage);
      setFormTimeframe(player.timeframe);
    } else {
      setEditingPlayer(null);
      setFormName('');
      setFormUid('');
      setFormGame('Free Fire');
      setFormMatches(0);
      setFormWins(0);
      setFormKills(0);
      setFormPrize(0);
      setFormPoints(0);
      setFormWinRate(0);
      setFormKd(0);
      setFormRank(weeklyPlayers.length + 1);
      setFormStatus('active');
      setFormVerified(false);
      setFormMvp(false);
      setFormImage('https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150');
      setFormTimeframe('this_week');
    }
    setIsModalOpen(true);
  };

  // Submit Player Form
  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const playerId = editingPlayer ? editingPlayer.id : 'wp_' + Date.now();
    const payload: WeeklyPlayer = {
      id: playerId,
      name: formName,
      uid: formUid,
      gameCategory: formGame,
      matchesPlayed: Number(formMatches),
      wins: Number(formWins),
      kills: Number(formKills),
      prizeWon: Number(formPrize),
      weeklyPoints: Number(formPoints),
      winRate: Number(formWinRate),
      kdRatio: Number(formKd),
      rank: Number(formRank),
      status: formStatus,
      verified: formVerified,
      mvp: formMvp,
      profileImage: formImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
      timeframe: formTimeframe,
      createdAt: editingPlayer?.createdAt || new Date().toISOString()
    };

    // Simulated fast save process
    setTimeout(async () => {
      try {
        await saveWeeklyPlayerAdmin(payload);
        setIsModalOpen(false);
        setIsSaving(false);
        showToast("Weekly Leaderboard Updated Successfully.");
      } catch (err) {
        console.error("An error occurred");
        setIsSaving(false);
      }
    }, 400); // realistic fast interaction
  };

  // Delete Player
  const handleDeletePlayer = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} from the weekly leaderboard?`)) {
      await deleteWeeklyPlayerAdmin(id);
      showToast("Weekly Leaderboard Updated Successfully.");
    }
  };

  // Toggle player active/disabled status instantly
  const handleToggleStatus = async (player: WeeklyPlayer) => {
    const updated: WeeklyPlayer = {
      ...player,
      status: player.status === 'active' ? 'disabled' : 'active'
    };
    await saveWeeklyPlayerAdmin(updated);
    showToast(`Player ${player.status === 'active' ? 'Disabled' : 'Enabled'} Successfully.`);
  };

  // Handle configuration changes
  const handleCriteriaChange = async (criteria: WeeklyLeaderboardConfig['rankingCriteria']) => {
    await updateWeeklyLeaderboardConfigAdmin({ rankingCriteria: criteria });
    showToast("Ranking Criteria Updated Successfully.");
  };

  const handleToggleAutoRanking = async () => {
    const nextVal = !weeklyLeaderboardConfig.autoRankingEnabled;
    await updateWeeklyLeaderboardConfigAdmin({ autoRankingEnabled: nextVal });
    showToast(`Auto Ranking ${nextVal ? 'Enabled' : 'Disabled'} Successfully.`);
  };

  // Computed Rankings based on criteria
  const rankedPlayers = useMemo(() => {
    // Group players by timeframe
    const timeframes: ('this_week' | 'last_week' | 'this_month')[] = ['this_week', 'last_week', 'this_month'];
    let allProcessed: WeeklyPlayer[] = [];

    timeframes.forEach(tf => {
      const playersInTf = weeklyPlayers.filter(p => p.timeframe === tf);
      
      if (weeklyLeaderboardConfig.autoRankingEnabled) {
        // Sort according to criteria
        const criteria = weeklyLeaderboardConfig.rankingCriteria;
        const sorted = [...playersInTf].sort((a, b) => {
          if (criteria === 'weeklyPoints') return b.weeklyPoints - a.weeklyPoints;
          if (criteria === 'totalKills') return b.kills - a.kills;
          if (criteria === 'totalWins') return b.wins - a.wins;
          if (criteria === 'totalPrizeWon') return b.prizeWon - a.prizeWon;
          if (criteria === 'matchesPlayed') return b.matchesPlayed - a.matchesPlayed;
          // fallback
          return b.weeklyPoints - a.weeklyPoints;
        });

        // Map computed rank
        const mapped = sorted.map((p, idx) => ({
          ...p,
          rank: idx + 1
        }));
        allProcessed = [...allProcessed, ...mapped];
      } else {
        // Manual rankings - sort by stored rank field ascending
        const sorted = [...playersInTf].sort((a, b) => a.rank - b.rank);
        allProcessed = [...allProcessed, ...sorted];
      }
    });

    return allProcessed;
  }, [weeklyPlayers, weeklyLeaderboardConfig]);

  // Filtered players list for rendering
  const filteredPlayers = useMemo(() => {
    return rankedPlayers.filter(p => {
      const matchesSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.uid.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.gameCategory.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGame = gameFilter === 'all' || p.gameCategory === gameFilter;
      const matchesTimeframe = timeframeFilter === 'all' || p.timeframe === timeframeFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesVerified = verifiedFilter === 'all' || 
        (verifiedFilter === 'verified' && p.verified) || 
        (verifiedFilter === 'unverified' && !p.verified);

      return matchesSearch && matchesGame && matchesTimeframe && matchesStatus && matchesVerified;
    });
  }, [rankedPlayers, searchQuery, gameFilter, timeframeFilter, statusFilter, verifiedFilter]);

  // General Statistics Counters
  const statistics = useMemo(() => {
    const active = weeklyPlayers.filter(p => p.status === 'active');
    const totalPlayers = weeklyPlayers.length;
    const totalWeeklyMatches = active.reduce((sum, p) => sum + (p.matchesPlayed || 0), 0);
    const totalWeeklyKills = active.reduce((sum, p) => sum + (p.kills || 0), 0);
    const totalWeeklyPrizeMoney = active.reduce((sum, p) => sum + (p.prizeWon || 0), 0);

    // Find top performers
    let topMvpName = 'None';
    let topWinnerName = 'None';
    let topKillerName = 'None';

    const mvpCandidates = active.filter(p => p.mvp);
    if (mvpCandidates.length > 0) {
      const sortedMvp = [...mvpCandidates].sort((a, b) => b.weeklyPoints - a.weeklyPoints);
      topMvpName = sortedMvp[0].name;
    } else if (active.length > 0) {
      const sortedPoints = [...active].sort((a, b) => b.weeklyPoints - a.weeklyPoints);
      topMvpName = sortedPoints[0].name;
    }

    if (active.length > 0) {
      const sortedWins = [...active].sort((a, b) => b.wins - a.wins);
      topWinnerName = sortedWins[0].name;

      const sortedKills = [...active].sort((a, b) => b.kills - a.kills);
      topKillerName = sortedKills[0].name;
    }

    return {
      totalPlayers,
      totalWeeklyMatches,
      totalWeeklyKills,
      totalWeeklyPrizeMoney,
      topMvpName,
      topWinnerName,
      topKillerName
    };
  }, [weeklyPlayers]);

  // Export functions
  const handleExportCSV = () => {
    let headers = ["Rank", "Name", "UID", "Game Category", "Matches", "Wins", "Kills", "Prize Won (INR)", "Weekly Points", "Win Rate %", "K/D", "Status", "Verified", "MVP", "Timeframe"];
    let csvRows = [headers.join(",")];

    filteredPlayers.forEach(p => {
      let row = [
        p.rank,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.uid}"`,
        `"${p.gameCategory}"`,
        p.matchesPlayed,
        p.wins,
        p.kills,
        p.prizeWon,
        p.weeklyPoints,
        p.winRate,
        p.kdRatio || 0,
        p.status,
        p.verified ? "Yes" : "No",
        p.mvp ? "Yes" : "No",
        p.timeframe
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Weekly_Top_Players_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    // Generate simple spreadsheet table in HTML block
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          table {border-collapse: collapse;}
          th {background-color: #ffd700; color: #000; font-weight: bold; border: 1px solid #ccc;}
          td {border: 1px solid #ccc; font-family: sans-serif; font-size: 11px;}
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>UID</th>
              <th>Game Category</th>
              <th>Matches</th>
              <th>Wins</th>
              <th>Kills</th>
              <th>Prize Won (INR)</th>
              <th>Points</th>
              <th>Win Rate %</th>
              <th>K/D Ratio</th>
              <th>Status</th>
              <th>Verified</th>
              <th>MVP</th>
              <th>Timeframe</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredPlayers.forEach(p => {
      html += `
        <tr>
          <td>${p.rank}</td>
          <td>${p.name}</td>
          <td>${p.uid}</td>
          <td>${p.gameCategory}</td>
          <td>${p.matchesPlayed}</td>
          <td>${p.wins}</td>
          <td>${p.kills}</td>
          <td>${p.prizeWon}</td>
          <td>${p.weeklyPoints}</td>
          <td>${p.winRate}%</td>
          <td>${p.kdRatio || 0}</td>
          <td>${p.status.toUpperCase()}</td>
          <td>${p.verified ? "YES" : "NO"}</td>
          <td>${p.mvp ? "YES" : "NO"}</td>
          <td>${p.timeframe}</td>
        </tr>
      `;
    });

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Weekly_Top_Players_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // Create an elegant print section or open native print dialogue focused on a tailored layout
    window.print();
  };

  return (
    <div id="weekly_players_manager" className="space-y-6">
      
      {/* SUCCESS TOAST */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-neutral-950 font-black px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-green-400 uppercase tracking-wider text-xs animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold-400" />
            <span>Weekly Top Players Manager</span>
          </h2>
          <p className="text-xs text-neutral-400">Control user nicknames, UIDs, matches, points, win rates, badges, and rankings.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openPlayerModal()}
            className="px-4 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Leaderboard Player</span>
          </button>
        </div>
      </div>

      {/* STATISTICS ANALYTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Total Players</p>
            <p className="text-xl font-black text-white tracking-tight mt-0.5">{statistics.totalPlayers}</p>
          </div>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Matches Played</p>
            <p className="text-xl font-black text-white tracking-tight mt-0.5">{statistics.totalWeeklyMatches}</p>
          </div>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Total Kills</p>
            <p className="text-xl font-black text-white tracking-tight mt-0.5">{statistics.totalWeeklyKills}</p>
          </div>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Winnings Paid</p>
            <p className="text-xl font-black text-white tracking-tight mt-0.5">₹{statistics.totalWeeklyPrizeMoney}</p>
          </div>
        </div>
      </div>

      {/* DETAILED LEADERS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-purple-400 uppercase font-bold tracking-widest">🎖️ Top MVP</p>
            <p className="text-sm font-black text-white mt-1 uppercase truncate max-w-[150px]">{statistics.topMvpName}</p>
          </div>
          <Award className="w-8 h-8 text-purple-500 opacity-80" />
        </div>

        <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-gold-400 uppercase font-bold tracking-widest">🏆 Top Winner</p>
            <p className="text-sm font-black text-white mt-1 uppercase truncate max-w-[150px]">{statistics.topWinnerName}</p>
          </div>
          <Trophy className="w-8 h-8 text-gold-400 opacity-80" />
        </div>

        <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-red-500 uppercase font-bold tracking-widest">🔥 Top Killer</p>
            <p className="text-sm font-black text-white mt-1 uppercase truncate max-w-[150px]">{statistics.topKillerName}</p>
          </div>
          <Zap className="w-8 h-8 text-red-500 opacity-80" />
        </div>
      </div>

      {/* SETTINGS CARD */}
      <div className="bg-[#101017]/80 border border-white/5 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-gold-400" />
            <span>Leaderboard Config & Ranking Rules</span>
          </h3>
          <p className="text-[10px] text-neutral-400 mt-0.5">Define ranking criteria. Instant dynamic updates on user device leaderboard.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wide block">Dynamic Ranking Criterion</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'weeklyPoints', label: 'Points' },
                { id: 'totalKills', label: 'Kills' },
                { id: 'totalWins', label: 'Wins' },
                { id: 'totalPrizeWon', label: 'Winnings' },
                { id: 'matchesPlayed', label: 'Matches' },
                { id: 'manual', label: 'Manual Overr.' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => handleCriteriaChange(c.id as any)}
                  className={`py-2 px-3 rounded-lg text-left text-[11px] font-bold border transition-all cursor-pointer ${
                    weeklyLeaderboardConfig.rankingCriteria === c.id
                      ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                      : 'bg-neutral-900/60 border-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center bg-neutral-900/40 rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Auto Recalculate Rankings</p>
                <p className="text-[9px] text-neutral-400 mt-0.5">Let rules sort, assign ranks, and balance entries automatically.</p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoRanking}
                className="text-neutral-300 hover:text-white cursor-pointer"
              >
                {weeklyLeaderboardConfig.autoRankingEnabled ? (
                  <ToggleRight className="w-9 h-9 text-gold-400" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-neutral-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* SEARCH FIELD */}
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by Player Name, UID or Game Category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/40 transition-all font-mono"
            />
          </div>

          {/* EXPORT OPTIONS */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 font-bold rounded-lg text-[10px] uppercase tracking-wider border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-blue-400 font-bold rounded-lg text-[10px] uppercase tracking-wider border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* RECTANGULAR QUICK FILTER SWITCHES */}
        <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Game:</span>
            <select
              value={gameFilter}
              onChange={e => setGameFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 text-white rounded-lg p-1.5 text-[11px] font-bold"
            >
              <option value="all">All Games</option>
              <option value="Free Fire">Free Fire</option>
              <option value="PUBG Mobile">PUBG Mobile</option>
              <option value="Clash of Clans">Clash of Clans</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Period:</span>
            <select
              value={timeframeFilter}
              onChange={e => setTimeframeFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 text-white rounded-lg p-1.5 text-[11px] font-bold"
            >
              <option value="all">All Periods</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 text-white rounded-lg p-1.5 text-[11px] font-bold"
            >
              <option value="all">All Players</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Verified:</span>
            <select
              value={verifiedFilter}
              onChange={e => setVerifiedFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 text-white rounded-lg p-1.5 text-[11px] font-bold"
            >
              <option value="all">All Profiles</option>
              <option value="verified">Verified Badge</option>
              <option value="unverified">Non-Verified</option>
            </select>
          </div>

          <div className="text-[10px] text-neutral-400 ml-auto font-mono">
            Filtered: {filteredPlayers.length} / {weeklyPlayers.length}
          </div>
        </div>
      </div>

      {/* LEADERBOARD PLAYERS LIST */}
      <div className="bg-[#101017] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-neutral-400">
            <thead className="bg-[#0b0b10] text-[10px] text-neutral-400 uppercase font-black tracking-widest border-b border-white/5">
              <tr>
                <th className="py-4 px-4 text-center">Rank</th>
                <th className="py-4 px-4">Player Nickname</th>
                <th className="py-4 px-4">Game Category</th>
                <th className="py-4 px-4">Matches</th>
                <th className="py-4 px-4">Wins / Kills</th>
                <th className="py-4 px-4">Win Rate %</th>
                <th className="py-4 px-4">Winnings / Points</th>
                <th className="py-4 px-4">Period</th>
                <th className="py-4 px-4 text-center">Badges</th>
                <th className="py-4 px-4 text-center">Visibility</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-500 font-bold uppercase tracking-wide">
                    No matching leaderboard records found.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(p => (
                  <tr key={p.id} className={`hover:bg-white/2 transition-colors ${p.status === 'disabled' ? 'opacity-40' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-black font-mono text-xs ${
                        p.rank === 1 ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' :
                        p.rank === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                        p.rank === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                        'bg-neutral-800 text-neutral-400'
                      }`}>
                        #{p.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.profileImage} 
                          alt={p.name} 
                          className="w-8 h-8 rounded-full border border-white/10 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150";
                          }}
                        />
                        <div>
                          <p className="font-extrabold text-white uppercase tracking-wide flex items-center gap-1">
                            <span>{p.name}</span>
                            {p.verified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-500/10 shrink-0" title="Verified Badge" />
                            )}
                            {p.mvp && (
                              <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0" title="MVP Badge" />
                            )}
                          </p>
                          <p className="text-[9px] text-neutral-500 font-mono mt-0.5">UID: {p.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-white/5 text-[9px] font-bold text-neutral-300 uppercase">
                        {p.gameCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {p.matchesPlayed}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div>
                        <span className="font-bold text-green-400">{p.wins} Wins</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {p.kills} Kills (K/D: {p.kdRatio || '0.00'})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-neutral-300">
                      {p.winRate}%
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div>
                        <span className="font-bold text-gold-400">₹{p.prizeWon}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {p.weeklyPoints} pts
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        p.timeframe === 'this_week' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        p.timeframe === 'last_week' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {p.timeframe.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${p.verified ? 'bg-blue-500' : 'bg-neutral-800'}`} title={p.verified ? 'Verified Badge: ON' : 'Verified Badge: OFF'} />
                        <span className={`w-2 h-2 rounded-full ${p.mvp ? 'bg-gold-500' : 'bg-neutral-800'}`} title={p.mvp ? 'MVP Badge: ON' : 'MVP Badge: OFF'} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase cursor-pointer ${
                          p.status === 'active' 
                            ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {p.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openPlayerModal(p)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-lg transition-all cursor-pointer border border-white/5"
                          title="Edit Player"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(p.id, p.name)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer border border-red-500/20"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT/ADD PLAYER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#101017] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0b0b10]">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-gold-400" />
                <span>{editingPlayer ? 'Edit Leaderboard Player' : 'Add Leaderboard Player'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePlayerSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* IMAGE & PROFILE NICKNAME ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase font-black tracking-wide block">Player Name / Nickname *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raistar_FF"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase font-black tracking-wide block">Player UID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 539128301"
                    value={formUid}
                    onChange={e => setFormUid(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* GAME CATEGORY & TIMEFRAME ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase font-black tracking-wide block">Game Category</label>
                  <select
                    value={formGame}
                    onChange={e => setFormGame(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="Free Fire">Free Fire</option>
                    <option value="PUBG Mobile">PUBG Mobile</option>
                    <option value="Clash of Clans">Clash of Clans</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase font-black tracking-wide block">Timeframe / Period</label>
                  <select
                    value={formTimeframe}
                    onChange={e => setFormTimeframe(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month">This Month</option>
                  </select>
                </div>
              </div>

              {/* PROFILE AVATAR IMAGE URL */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase font-black tracking-wide block">Profile Image URL</label>
                <input
                  type="url"
                  placeholder="Paste avatar URL or leave blank for default"
                  value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* STATS ROW 1: MATCHES, WINS, KILLS */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-neutral-400 uppercase font-black tracking-wide block">Matches</label>
                  <input
                    type="number"
                    min="0"
                    value={formMatches}
                    onChange={e => setFormMatches(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-white font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-neutral-400 uppercase font-black tracking-wide block">Wins</label>
                  <input
                    type="number"
                    min="0"
                    value={formWins}
                    onChange={e => setFormWins(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-white font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-neutral-400 uppercase font-black tracking-wide block">Kills</label>
                  <input
                    type="number"
                    min="0"
                    value={formKills}
                    onChange={e => setFormKills(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-white font-mono text-center"
                  />
                </div>
              </div>

              {/* STATS ROW 2: PRIZE WON, POINTS, WIN RATE */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-neutral-400 uppercase font-black tracking-wide block">Prize Won (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formPrize}
                    onChange={e => setFormPrize(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-white font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-neutral-400 uppercase font-black tracking-wide block">Points</label>
                  <input
                    type="number"
                    min="0"
                    value={formPoints}
                    onChange={e => setFormPoints(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-white font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-neutral-400 uppercase font-black tracking-wide block">Win Rate %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formWinRate}
                    onChange={e => setFormWinRate(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-white font-mono text-center"
                  />
                </div>
              </div>

              {/* STATS ROW 3: K/D Ratio, Rank (for Manual sorting) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase font-black tracking-wide block">K/D Ratio (e.g. 5.12)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formKd}
                    onChange={e => setFormKd(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase font-black tracking-wide block">Manual Rank Assignment</label>
                  <input
                    type="number"
                    min="1"
                    disabled={weeklyLeaderboardConfig.autoRankingEnabled}
                    value={formRank}
                    onChange={e => setFormRank(Number(e.target.value))}
                    className={`w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white font-mono ${
                      weeklyLeaderboardConfig.autoRankingEnabled ? 'opacity-40 text-neutral-500 cursor-not-allowed' : ''
                    }`}
                    placeholder="Enabled when Auto Ranking is OFF"
                  />
                  {weeklyLeaderboardConfig.autoRankingEnabled && (
                    <span className="text-[8px] text-gold-500 font-semibold uppercase">Rank auto-recalculated</span>
                  )}
                </div>
              </div>

              {/* TOGGLES: STATUS, VERIFIED, MVP */}
              <div className="bg-[#16161d] p-3 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                <div className="flex flex-col items-center text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-black">Verified Badge</span>
                  <button
                    type="button"
                    onClick={() => setFormVerified(!formVerified)}
                    className="mt-1.5 cursor-pointer"
                  >
                    {formVerified ? (
                      <ToggleRight className="w-8 h-8 text-blue-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-neutral-500" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col items-center text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-black">MVP Crown Badge</span>
                  <button
                    type="button"
                    onClick={() => setFormMvp(!formMvp)}
                    className="mt-1.5 cursor-pointer"
                  >
                    {formMvp ? (
                      <ToggleRight className="w-8 h-8 text-gold-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-neutral-500" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col items-center text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-black">Player Status</span>
                  <button
                    type="button"
                    onClick={() => setFormStatus(formStatus === 'active' ? 'disabled' : 'active')}
                    className="mt-1.5 cursor-pointer"
                  >
                    {formStatus === 'active' ? (
                      <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-black text-[9px] uppercase tracking-wide block">Active</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-black text-[9px] uppercase tracking-wide block">Disabled</span>
                    )}
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2.5 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-900 text-white font-extrabold uppercase rounded-xl hover:bg-neutral-800 transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 text-neutral-950 font-black uppercase rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Player Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
