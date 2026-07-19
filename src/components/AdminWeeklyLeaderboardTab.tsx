import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { WeeklyPlayer } from '../types';
import { 
  Users, 
  Target, 
  Trophy, 
  Coins, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Download, 
  Sliders, 
  Award, 
  Gamepad2, 
  Star, 
  CheckCircle,
  Eye,
  EyeOff,
  Flame
} from 'lucide-react';

export const AdminWeeklyLeaderboardTab: React.FC<{ showConfirm?: (title: string, message: string, onConfirm: () => void | Promise<void>) => void }> = ({ showConfirm }) => {
  const { 
    weeklyPlayers, 
    weeklyLeaderboardConfig, 
    saveWeeklyPlayerAdmin, 
    deleteWeeklyPlayerAdmin, 
    updateWeeklyLeaderboardConfigAdmin 
  } = useGame();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('All');
  const [timeframeFilter, setTimeframeFilter] = useState<'All' | 'this_week' | 'last_week' | 'this_month'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'disabled'>('All');
  const [verifiedFilter, setVerifiedFilter] = useState<'All' | 'yes' | 'no'>('All');

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<WeeklyPlayer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formUid, setFormUid] = useState('');
  const [formCategory, setFormCategory] = useState<'Free Fire' | 'PUBG Mobile' | 'Clash of Clans'>('Free Fire');
  const [formMatches, setFormMatches] = useState(0);
  const [formWins, setFormWins] = useState(0);
  const [formKills, setFormKills] = useState(0);
  const [formPrize, setFormPrize] = useState(0);
  const [formPoints, setFormPoints] = useState(0);
  const [formWinRate, setFormWinRate] = useState(0);
  const [formKdRatio, setFormKdRatio] = useState(0);
  const [formRank, setFormRank] = useState(1);
  const [formStatus, setFormStatus] = useState<'active' | 'disabled'>('active');
  const [formVerified, setFormVerified] = useState(false);
  const [formMvp, setFormMvp] = useState(false);
  const [formImage, setFormImage] = useState('');
  const [formTimeframe, setFormTimeframe] = useState<'this_week' | 'last_week' | 'this_month'>('this_week');

  // Config Form
  const [configCriteria, setConfigCriteria] = useState(weeklyLeaderboardConfig.rankingCriteria);
  const [configAutoRanking, setConfigAutoRanking] = useState(weeklyLeaderboardConfig.autoRankingEnabled);

  // Reset Form
  const resetForm = () => {
    setEditingPlayer(null);
    setFormName('');
    setFormUid('');
    setFormCategory('Free Fire');
    setFormMatches(0);
    setFormWins(0);
    setFormKills(0);
    setFormPrize(0);
    setFormPoints(0);
    setFormWinRate(0);
    setFormKdRatio(0);
    setFormRank(weeklyPlayers.length + 1);
    setFormStatus('active');
    setFormVerified(false);
    setFormMvp(false);
    setFormImage('');
    setFormTimeframe('this_week');
  };

  // Open Form for Add
  const handleAddClick = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Form for Edit
  const handleEditClick = (player: WeeklyPlayer) => {
    setEditingPlayer(player);
    setFormName(player.name);
    setFormUid(player.uid);
    setFormCategory(player.gameCategory);
    setFormMatches(player.matchesPlayed);
    setFormWins(player.wins);
    setFormKills(player.kills);
    setFormPrize(player.prizeWon);
    setFormPoints(player.weeklyPoints);
    setFormWinRate(player.winRate);
    setFormKdRatio(player.kdRatio || 0);
    setFormRank(player.rank);
    setFormStatus(player.status);
    setFormVerified(player.verified);
    setFormMvp(player.mvp);
    setFormImage(player.profileImage);
    setFormTimeframe(player.timeframe);
    setIsModalOpen(true);
  };

  // Handle Save Player
  const handleSavePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    const playerObj: WeeklyPlayer = {
      id: editingPlayer ? editingPlayer.id : `wp_${Date.now()}`,
      name: formName,
      uid: formUid,
      gameCategory: formCategory,
      matchesPlayed: Number(formMatches),
      wins: Number(formWins),
      kills: Number(formKills),
      prizeWon: Number(formPrize),
      weeklyPoints: Number(formPoints),
      winRate: Number(formWinRate),
      kdRatio: Number(formKdRatio),
      rank: Number(formRank),
      status: formStatus,
      verified: formVerified,
      mvp: formMvp,
      profileImage: formImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      timeframe: formTimeframe,
      createdAt: editingPlayer?.createdAt || new Date().toISOString()
    };

    // Simulate network latency (2-3 seconds)
    setTimeout(async () => {
      try {
        await saveWeeklyPlayerAdmin(playerObj);
        setSaveMessage('Weekly Leaderboard Updated Successfully.');
        setIsSaving(false);
        setTimeout(() => {
          setIsModalOpen(false);
          setSaveMessage(null);
          resetForm();
        }, 1500);
      } catch (err) {
        console.error("An error occurred");
        setIsSaving(false);
      }
    }, 2000);
  };

  // Toggle Player Status
  const handleToggleStatus = async (player: WeeklyPlayer) => {
    const updated = {
      ...player,
      status: player.status === 'active' ? 'disabled' as const : 'active' as const
    };
    await saveWeeklyPlayerAdmin(updated);
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setTimeout(async () => {
      try {
        await updateWeeklyLeaderboardConfigAdmin({
          rankingCriteria: configCriteria,
          autoRankingEnabled: configAutoRanking
        });
        alert('Weekly Leaderboard Config Updated Successfully.');
        setIsSaving(false);
      } catch (err) {
        console.error("An error occurred");
        setIsSaving(false);
      }
    }, 1500);
  };

  // Statistics Calculations
  const stats = useMemo(() => {
    const active = weeklyPlayers.filter(p => p.status === 'active');
    const totalPlayers = weeklyPlayers.length;
    const totalMatches = active.reduce((acc, p) => acc + (p.matchesPlayed || 0), 0);
    const totalKills = active.reduce((acc, p) => acc + (p.kills || 0), 0);
    const totalPrize = active.reduce((acc, p) => acc + (p.prizeWon || 0), 0);
    
    // Find top MVP
    const mvps = active.filter(p => p.mvp);
    const topMvpName = mvps.length > 0 ? mvps[0].name : 'N/A';

    // Find top winner by wins
    const topWinner = [...active].sort((a,b) => b.wins - a.wins)[0]?.name || 'N/A';

    // Find top killer
    const topKiller = [...active].sort((a,b) => b.kills - a.kills)[0]?.name || 'N/A';

    return {
      totalPlayers,
      totalMatches,
      totalKills,
      totalPrize,
      topMvpName,
      topWinner,
      topKiller
    };
  }, [weeklyPlayers]);

  // Export Tools
  const getFilteredExportData = () => {
    return weeklyPlayers.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.uid.includes(searchQuery) ||
                          p.gameCategory.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGame = gameFilter === 'All' || p.gameCategory === gameFilter;
      const matchTime = timeframeFilter === 'All' || p.timeframe === timeframeFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchVer = verifiedFilter === 'All' || 
                        (verifiedFilter === 'yes' ? p.verified : !p.verified);

      return matchSearch && matchGame && matchTime && matchStatus && matchVer;
    });
  };

  const handleExportCSV = () => {
    const data = getFilteredExportData();
    const headers = ['Rank', 'Name', 'UID', 'Game Category', 'Timeframe', 'Matches', 'Wins', 'Kills', 'Prize Won (INR)', 'Weekly Points', 'Win Rate (%)', 'K/D', 'Status', 'Verified', 'MVP'];
    const csvRows = [headers.join(',')];

    for (const p of data) {
      const row = [
        p.rank,
        `"${p.name.replace(/"/g, '""')}"`,
        p.uid,
        p.gameCategory,
        p.timeframe,
        p.matchesPlayed,
        p.wins,
        p.kills,
        p.prizeWon,
        p.weeklyPoints,
        p.winRate,
        p.kdRatio || 0,
        p.status,
        p.verified ? 'Yes' : 'No',
        p.mvp ? 'Yes' : 'No'
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Weekly_Top_Players_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    // Generate simple XML spreadsheet compatible with Excel
    const data = getFilteredExportData();
    let rowData = '';
    
    // Headers
    const headers = ['Rank', 'Name', 'UID', 'Game Category', 'Timeframe', 'Matches', 'Wins', 'Kills', 'Prize Won', 'Weekly Points', 'Win Rate', 'K/D', 'Status', 'Verified', 'MVP'];
    rowData += headers.join('\t') + '\n';

    for (const p of data) {
      rowData += [
        p.rank,
        p.name,
        p.uid,
        p.gameCategory,
        p.timeframe,
        p.matchesPlayed,
        p.wins,
        p.kills,
        p.prizeWon,
        p.weeklyPoints,
        p.winRate,
        p.kdRatio || 0,
        p.status,
        p.verified ? 'Yes' : 'No',
        p.mvp ? 'Yes' : 'No'
      ].join('\t') + '\n';
    }

    const blob = new Blob([rowData], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Weekly_Top_Players_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const data = getFilteredExportData();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Weekly Top Players Leaderboard Export</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #111; }
            h1 { text-align: center; margin-bottom: 5px; }
            h3 { text-align: center; color: #555; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>🏆 Esports Leaderboard Report</h1>
          <h3>Weekly Top Players Statistics - Generated on ${new Date().toLocaleDateString()}</h3>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player Name</th>
                <th>Game Category</th>
                <th>UID</th>
                <th>Timeframe</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Kills</th>
                <th>Prize Won</th>
                <th>Weekly Points</th>
                <th>Win Rate</th>
                <th>K/D</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(p => `
                <tr>
                  <td>#${p.rank}</td>
                  <td><b>${p.name}</b> ${p.verified ? '✓' : ''} ${p.mvp ? '(MVP)' : ''}</td>
                  <td>${p.gameCategory}</td>
                  <td>${p.uid}</td>
                  <td>${p.timeframe}</td>
                  <td>${p.matchesPlayed}</td>
                  <td>${p.wins}</td>
                  <td>${p.kills}</td>
                  <td>₹${p.prizeWon}</td>
                  <td>${p.weeklyPoints}</td>
                  <td>${p.winRate}%</td>
                  <td>${p.kdRatio || 0}</td>
                  <td>${p.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered Players for Table display
  const filteredPlayers = useMemo(() => {
    return weeklyPlayers.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.uid.includes(searchQuery) ||
                          p.gameCategory.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGame = gameFilter === 'All' || p.gameCategory === gameFilter;
      const matchTime = timeframeFilter === 'All' || p.timeframe === timeframeFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchVer = verifiedFilter === 'All' || 
                        (verifiedFilter === 'yes' ? p.verified : !p.verified);

      return matchSearch && matchGame && matchTime && matchStatus && matchVer;
    }).sort((a,b) => (a.rank || 999) - (b.rank || 999));
  }, [weeklyPlayers, searchQuery, gameFilter, timeframeFilter, statusFilter, verifiedFilter]);

  return (
    <div id="admin_weekly_leaderboard" className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111116]/80 p-5 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            🏆 Weekly Top Players Manager
          </h2>
          <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">
            Complete dynamic configuration, player statistics management, ranking criteria, and export reports
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-gold-500/5"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add New Player
          </button>
        </div>
      </div>

      {/* STATISTICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[#111116] border border-white/5 rounded-xl p-3.5 text-center">
          <Users className="w-4 h-4 text-purple-400 mx-auto mb-1.5" />
          <p className="text-[8px] text-neutral-500 uppercase font-black">Total Players</p>
          <p className="text-base font-black text-white mt-1 font-mono">{stats.totalPlayers}</p>
        </div>
        <div className="bg-[#111116] border border-white/5 rounded-xl p-3.5 text-center">
          <Gamepad2 className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
          <p className="text-[8px] text-neutral-500 uppercase font-black">Weekly Matches</p>
          <p className="text-base font-black text-white mt-1 font-mono">{stats.totalMatches}</p>
        </div>
        <div className="bg-[#111116] border border-white/5 rounded-xl p-3.5 text-center">
          <Target className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
          <p className="text-[8px] text-neutral-500 uppercase font-black">Weekly Kills</p>
          <p className="text-base font-black text-white mt-1 font-mono">{stats.totalKills}</p>
        </div>
        <div className="bg-[#111116] border border-white/5 rounded-xl p-3.5 text-center">
          <Coins className="w-4 h-4 text-green-400 mx-auto mb-1.5" />
          <p className="text-[8px] text-neutral-500 uppercase font-black">Weekly Prize</p>
          <p className="text-base font-black text-green-400 mt-1 font-mono">₹{stats.totalPrize}</p>
        </div>
        <div className="bg-[#111116] border border-white/5 rounded-xl p-3.5 text-center col-span-1">
          <Award className="w-4 h-4 text-yellow-400 mx-auto mb-1.5" />
          <p className="text-[8px] text-neutral-500 uppercase font-black">Top MVP</p>
          <p className="text-xs font-black text-yellow-400 mt-2 truncate">{stats.topMvpName}</p>
        </div>
        <div className="bg-[#111116] border border-white/5 rounded-xl p-3.5 text-center">
          <Trophy className="w-4 h-4 text-gold-400 mx-auto mb-1.5" />
          <p className="text-[8px] text-neutral-500 uppercase font-black">Top Winner</p>
          <p className="text-xs font-black text-gold-400 mt-2 truncate">{stats.topWinner}</p>
        </div>
        <div className="bg-[#111116] border border-white/5 rounded-xl p-3.5 text-center">
          <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1.5" />
          <p className="text-[8px] text-neutral-500 uppercase font-black">Top Killer</p>
          <p className="text-xs font-black text-orange-400 mt-2 truncate">{stats.topKiller}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEADERBOARD GLOBAL SETTINGS */}
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-5 space-y-4 lg:col-span-1 h-fit">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
            <Sliders className="w-4 h-4 text-gold-400" /> Settings & Ranking Engine
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Criteria */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 uppercase font-black">Sort Rankings By</label>
              <select
                value={configCriteria}
                onChange={(e) => setConfigCriteria(e.target.value as any)}
                className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold tracking-wider uppercase focus:border-gold-500 transition-colors cursor-pointer"
              >
                <option value="weeklyPoints">Weekly Points</option>
                <option value="totalKills">Total Kills</option>
                <option value="totalWins">Total Wins</option>
                <option value="totalPrizeWon">Total Prize Won</option>
                <option value="matchesPlayed">Matches Played</option>
                <option value="manual">Manual Ranking</option>
              </select>
            </div>

            {/* Auto Ranking Toggler */}
            <div className="bg-[#07070a] p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white uppercase font-black tracking-wider">Auto Recalculate</p>
                <p className="text-[8px] text-neutral-500 mt-0.5 leading-relaxed">Instantly recalculate #1-#10 ranks based on sorting criteria.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfigAutoRanking(!configAutoRanking)}
                className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${configAutoRanking ? 'bg-gold-500' : 'bg-neutral-800'}`}
              >
                <div className={`bg-neutral-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${configAutoRanking ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Save Config Button */}
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full py-2.5 bg-gradient-to-r from-gold-500/10 to-amber-500/10 hover:from-gold-500 hover:to-amber-600 hover:text-neutral-950 text-gold-400 border border-gold-500/30 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Synchronizing...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* PLAYERS MANAGEMENT LIST */}
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-5 space-y-4 lg:col-span-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Weekly Player Profiles
            </h3>

            {/* Export buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-neutral-500 font-bold uppercase mr-1">Export:</span>
              <button
                onClick={handleExportCSV}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-lg hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer border border-white/5"
              >
                <Download className="w-3 h-3 text-purple-400" /> CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-lg hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer border border-white/5"
              >
                <Download className="w-3 h-3 text-blue-400" /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-lg hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer border border-white/5"
              >
                <Download className="w-3 h-3 text-red-400" /> PDF
              </button>
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-[#07070a]/50 p-3 rounded-xl border border-white/5">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Name, UID, Game..."
                className="w-full bg-[#07070a] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-gold-500 transition-colors outline-none"
              />
            </div>

            {/* Game */}
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="bg-[#07070a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-neutral-300 cursor-pointer outline-none font-bold"
            >
              <option value="All">All Games</option>
              <option value="Free Fire">Free Fire</option>
              <option value="PUBG Mobile">PUBG Mobile</option>
              <option value="Clash of Clans">Clash of Clans</option>
            </select>

            {/* Timeframe */}
            <select
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value as any)}
              className="bg-[#07070a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-neutral-300 cursor-pointer outline-none font-bold"
            >
              <option value="All">All Weeks</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#07070a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-neutral-300 cursor-pointer outline-none font-bold"
            >
              <option value="All">All Status</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>

          {/* PLAYERS TABLE */}
          <div className="overflow-x-auto border border-white/5 rounded-xl bg-[#07070a]/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#181822]/40 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                  <th className="py-2.5 px-3 text-center">Rank</th>
                  <th className="py-2.5 px-3">Player Details</th>
                  <th className="py-2.5 px-3">Game Category</th>
                  <th className="py-2.5 px-3">Timeframe</th>
                  <th className="py-2.5 px-3 text-center">Matches</th>
                  <th className="py-2.5 px-3 text-center">Kills</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                  <th className="py-2.5 px-3 text-right">Winnings</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-neutral-300">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-neutral-500 font-bold uppercase tracking-wider">
                      No matching player profiles found
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map(p => (
                    <tr key={p.id} className={`hover:bg-white/5 transition-colors ${p.status === 'disabled' ? 'opacity-40' : ''}`}>
                      <td className="py-3 px-3 text-center font-mono font-black text-neutral-400">
                        #{p.rank}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img src={p.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt={p.name} className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white uppercase tracking-wider truncate max-w-[120px]">{p.name}</span>
                              {p.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-current shrink-0" />}
                              {p.mvp && <Star className="w-3.5 h-3.5 text-yellow-400 fill-current shrink-0" />}
                            </div>
                            <p className="text-[8px] text-neutral-500 font-mono tracking-wider">UID: {p.uid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[8px] bg-white/5 border border-white/10 text-neutral-300 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                          {p.gameCategory}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[10px] font-black uppercase text-neutral-400">
                        {p.timeframe.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {p.matchesPlayed}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {p.kills}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-gold-400">
                        {p.weeklyPoints}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-green-400">
                        ₹{p.prizeWon}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Toggle active status */}
                          <button
                            onClick={() => handleToggleStatus(p)}
                            title={p.status === 'active' ? 'Disable Player' : 'Enable Player'}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              p.status === 'active' 
                                ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' 
                                : 'bg-neutral-800 border-white/5 text-neutral-500 hover:bg-neutral-700 hover:text-white'
                            }`}
                          >
                            {p.status === 'active' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit player details */}
                          <button
                            onClick={() => handleEditClick(p)}
                            title="Edit Player details"
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Player */}
                          <button
                            onClick={() => {
                              const performDelete = async () => {
                                await deleteWeeklyPlayerAdmin(p.id);
                              };

                              if (showConfirm) {
                                showConfirm(
                                  "Confirm Deletion",
                                  `Are you sure you want to permanently delete ${p.name}? This action cannot be undone.`,
                                  performDelete
                                );
                              } else if (window.confirm(`Are you sure you want to delete ${p.name}?`)) {
                                performDelete();
                              }
                            }}
                            title="Delete Player profile"
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all cursor-pointer"
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
      </div>

      {/* ADD/EDIT PLAYER DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f14] border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-4">
              {editingPlayer ? '🏆 Edit Player Record' : '🏆 Add New Player Profile'}
            </h3>

            <form onSubmit={handleSavePlayerSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Image */}
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Profile Image URL</label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="Enter image URL or leave empty for fallback"
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Player Name / Nickname</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. GodL_Jonathan"
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* UID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Free Fire / PUBG / CoC UID</label>
                  <input
                    type="text"
                    required
                    value={formUid}
                    onChange={(e) => setFormUid(e.target.value)}
                    placeholder="e.g. 539128301"
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* Game Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Game Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none cursor-pointer"
                  >
                    <option value="Free Fire">Free Fire</option>
                    <option value="PUBG Mobile">PUBG Mobile</option>
                    <option value="Clash of Clans">Clash of Clans</option>
                  </select>
                </div>

                {/* Timeframe */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Leaderboard Timeframe</label>
                  <select
                    value={formTimeframe}
                    onChange={(e) => setFormTimeframe(e.target.value as any)}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none cursor-pointer"
                  >
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month">This Month</option>
                  </select>
                </div>

                {/* Matches Played */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Matches Played</label>
                  <input
                    type="number"
                    required
                    value={formMatches}
                    onChange={(e) => setFormMatches(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* Total Wins */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Total Wins</label>
                  <input
                    type="number"
                    required
                    value={formWins}
                    onChange={(e) => setFormWins(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* Total Kills */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Total Kills</label>
                  <input
                    type="number"
                    required
                    value={formKills}
                    onChange={(e) => setFormKills(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* Prize Won */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Prize Won (₹)</label>
                  <input
                    type="number"
                    required
                    value={formPrize}
                    onChange={(e) => setFormPrize(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* Weekly Points */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Weekly Points</label>
                  <input
                    type="number"
                    required
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* Win Rate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Win Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formWinRate}
                    onChange={(e) => setFormWinRate(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* K/D Ratio */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">K/D Ratio</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formKdRatio}
                    onChange={(e) => setFormKdRatio(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>

                {/* Rank (Manual Override) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-black">Manual Rank (If Auto-Rank Disabled)</label>
                  <input
                    type="number"
                    required
                    value={formRank}
                    onChange={(e) => setFormRank(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold-500 transition-colors outline-none"
                  />
                </div>
              </div>

              {/* Badges/Toggles */}
              <div className="grid grid-cols-3 gap-3 bg-[#07070a] p-3 rounded-xl border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formVerified}
                    onChange={(e) => setFormVerified(e.target.checked)}
                    className="rounded text-gold-500 bg-[#07070a] border-white/10 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-neutral-300 block text-[9px] uppercase tracking-wider">Verified Badge</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formMvp}
                    onChange={(e) => setFormMvp(e.target.checked)}
                    className="rounded text-gold-500 bg-[#07070a] border-white/10 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-neutral-300 block text-[9px] uppercase tracking-wider">MVP Badge</span>
                  </div>
                </label>

                <div className="space-y-1">
                  <label className="text-[8px] text-neutral-400 uppercase font-black tracking-wider block">Player Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="bg-[#07070a] border border-white/10 rounded-lg px-2 py-0.5 text-[9px] font-bold text-white cursor-pointer outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Status & Toast Message */}
              {saveMessage && (
                <div className="bg-green-500/15 border border-green-500/30 text-green-400 p-3 rounded-xl text-center font-bold font-mono tracking-wide animate-pulse">
                  {saveMessage}
                </div>
              )}

              {/* Save Process Spinner Simulation */}
              {isSaving && !saveMessage && (
                <div className="bg-gold-500/10 border border-gold-500/20 text-gold-400 p-3 rounded-xl text-center font-bold font-mono tracking-wide flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                  Saving player information to Cloud Firestore...
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : 'Save Player details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
