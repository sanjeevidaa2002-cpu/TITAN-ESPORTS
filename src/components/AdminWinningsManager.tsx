/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { TournamentWinner, UserProfile } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  Award, 
  Trophy, 
  Zap, 
  Check, 
  X, 
  Activity, 
  DollarSign, 
  Gamepad2, 
  Sparkles, 
  FileText, 
  RefreshCw,
  User,
  Star,
  Calendar,
  Layers,
  Printer,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';

export const AdminWinningsManager: React.FC<{ 
  showConfirm?: (title: string, message: string, onConfirm: () => void | Promise<void>) => void 
}> = ({ showConfirm }) => {
  const { 
    winners, 
    saveWinnerAdmin, 
    deleteWinnerAdmin,
    tournaments
  } = useGame();

  // Real-time Users State from Firestore
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    // Read all registered users directly from Firebase Firestore real-time listener
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({
          uid: doc.id,
          ...doc.data()
        } as any);
      }, (err) => console.warn('Users sync error.'));
      setDbUsers(list);
      setLoadingUsers(false);
    }, (err) => {
      console.warn("Could not retrieve users real-time stream in AdminWinningsManager:");
      setLoadingUsers(false);
    });
    return () => unsub();
  }, []);

  // Safe helper to extract user details supporting various naming formats
  const getUserDetails = (u: any) => {
    const userId = u.uid || u.userId || '';
    const username = u.username || u.nickname || u.fullName || 'Unknown User';
    const gameName = u.gameName || u.nickname || 'Unknown IGN';
    const gameUid = u.gameUid || u.freefireUid || u.uid || '';
    const profilePhoto = u.profilePhoto || u.avatarUrl || u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    const phoneNumber = u.phoneNumber || u.mobileNumber || '';
    const registeredDate = u.joinedAt || u.createdAt || '';
    return { userId, username, gameName, gameUid, profilePhoto, phoneNumber, registeredDate };
  };

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [pinnedFilter, setPinnedFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Multi-dimensional Advanced Filters
  const [filterUsername, setFilterUsername] = useState('');
  const [filterGameName, setFilterGameName] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterGameUid, setFilterGameUid] = useState('');
  const [filterTournament, setFilterTournament] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all', 'BR', 'CS'
  const [filterMatchType, setFilterMatchType] = useState('all'); // 'all', 'Solo', 'Duo', 'Squad'
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWinner, setEditingWinner] = useState<TournamentWinner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Form Field States
  const [formName, setFormName] = useState('');
  const [formUid, setFormUid] = useState('');
  const [formGame, setFormGame] = useState<'Free Fire' | 'PUBG Mobile' | 'Clash of Clans'>('Free Fire');
  const [formTournament, setFormTournament] = useState('');
  const [formMatchType, setFormMatchType] = useState('Squad');
  const [formBanner, setFormBanner] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formRank, setFormRank] = useState(1);
  const [formPrize, setFormPrize] = useState(0);
  const [formKills, setFormKills] = useState(0);
  const [formMatches, setFormMatches] = useState(0);
  const [formMvp, setFormMvp] = useState(false);
  const [formVerified, setFormVerified] = useState(false);
  const [formPinned, setFormPinned] = useState(false);
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formImage, setFormImage] = useState('');

  // Newly specified database fields
  const [formTournamentId, setFormTournamentId] = useState('');
  const [formGameName, setFormGameName] = useState('');
  const [formGameUid, setFormGameUid] = useState('');
  const [formProfilePhoto, setFormProfilePhoto] = useState('');
  const [formUserId, setFormUserId] = useState('');

  // Real-time Player Selection Search
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerSearchType, setPlayerSearchType] = useState<string>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Trigger toast
  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Open Form Modal
  const openWinnerModal = (winner?: TournamentWinner) => {
    if (winner) {
      setEditingWinner(winner);
      setFormName(winner.name || winner.username || '');
      setFormUid(winner.uid || winner.gameUid || '');
      setFormGame(winner.gameCategory);
      setFormTournament(winner.tournamentName);
      setFormMatchType(winner.matchType);
      setFormBanner(winner.tournamentBanner);
      setFormDate(winner.winnerDate);
      setFormRank(winner.rank);
      setFormPrize(winner.prizeWon);
      setFormKills(winner.kills);
      setFormMatches(winner.matchesPlayed);
      setFormMvp(winner.mvp);
      setFormVerified(winner.verified);
      setFormPinned(winner.pinned);
      setFormDisplayOrder(winner.displayOrder);
      setFormImage(winner.profileImage);

      // New database fields mapping
      setFormTournamentId(winner.tournamentId || '');
      setFormGameName(winner.gameName || '');
      setFormGameUid(winner.gameUid || '');
      setFormProfilePhoto(winner.profilePhoto || '');
      setFormUserId(winner.userId || '');

      // Try to find matching user object
      const matched = dbUsers.find(u => u.uid === winner.userId || u.uid === winner.uid);
      setSelectedUser(matched || null);
      setPlayerSearchQuery('');
    } else {
      setEditingWinner(null);
      setFormName('');
      setFormUid('');
      setFormGame('Free Fire');
      setFormTournament('');
      setFormMatchType('Squad');
      setFormBanner('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormRank(1);
      setFormPrize(1000);
      setFormKills(5);
      setFormMatches(1);
      setFormMvp(false);
      setFormVerified(true);
      setFormPinned(false);
      setFormDisplayOrder(winners.length + 1);
      setFormImage('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');

      // New database fields
      setFormTournamentId('');
      setFormGameName('');
      setFormGameUid('');
      setFormProfilePhoto('');
      setFormUserId('');
      setSelectedUser(null);
      setPlayerSearchQuery('');
    }
    setShowDropdown(false);
    setIsModalOpen(true);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUid.trim() || !formTournament.trim()) {
      alert("Please fill in Player Name, Player UID, and Tournament Name!");
      return;
    }

    setIsSaving(true);
    const winnerId = editingWinner ? editingWinner.id : 'w_' + Date.now();

    const payload: TournamentWinner = {
      id: winnerId,
      name: formName.trim(), // username
      uid: formUserId || formUid.trim(), // userId
      gameCategory: formGame,
      tournamentName: formTournament.trim(),
      matchType: formMatchType,
      tournamentBanner: formBanner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      winnerDate: formDate || new Date().toISOString().split('T')[0],
      rank: Number(formRank),
      prizeWon: Number(formPrize),
      kills: Number(formKills),
      matchesPlayed: Number(formMatches),
      mvp: formMvp,
      verified: formVerified,
      pinned: formPinned,
      displayOrder: Number(formDisplayOrder),
      profileImage: formProfilePhoto || formImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      createdAt: editingWinner?.createdAt || new Date().toISOString(),

      // Database fields explicitly matching user request
      winnerId: winnerId,
      tournamentId: formTournamentId || '',
      position: String(formRank),
      prizeAmount: Number(formPrize),
      userId: formUserId || formUid.trim(),
      username: formName.trim(),
      gameName: formGameName.trim() || formName.trim(),
      gameUid: formGameUid.trim() || formUid.trim(),
      profilePhoto: formProfilePhoto || formImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    };

    try {
      await saveWinnerAdmin(payload);
      showToast(editingWinner ? "Tournament winner updated successfully! 🎉" : "New tournament winner registered! 🏆");
      setIsModalOpen(false);
    } catch (err) {
      console.error("An error occurred");
      alert("Failed to save winner!");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      try {
        await deleteWinnerAdmin(id);
        showToast("Winner record deleted successfully.");
      } catch (err) {
        console.error("An error occurred");
        alert("Failed to delete winner record.");
      }
    };

    if (showConfirm) {
      showConfirm(
        "Confirm Deletion",
        "Are you absolutely sure you want to permanently delete this winner record? This cannot be undone.",
        performDelete
      );
    } else if (window.confirm("Are you absolutely sure you want to delete this winner record? This cannot be undone.")) {
      await performDelete();
    }
  };

  // Pin/Unpin Toggle
  const handleTogglePin = async (winner: TournamentWinner) => {
    const updated = { ...winner, pinned: !winner.pinned };
    await saveWinnerAdmin(updated);
    showToast(updated.pinned ? `${winner.name} pinned to Top Featured Podium!` : `${winner.name} unpinned.`);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterUsername('');
    setFilterGameName('');
    setFilterUserId('');
    setFilterGameUid('');
    setFilterTournament('all');
    setFilterCategory('all');
    setFilterMatchType('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setGameFilter('all');
    setPinnedFilter('all');
    setSearchQuery('');
  };

  // Filter and Search Logic
  const filteredWinners = useMemo(() => {
    return winners.filter(w => {
      // Main Game Category Filter
      if (gameFilter !== 'all' && w.gameCategory !== gameFilter) return false;

      // Pinned / Featured Filter
      if (pinnedFilter === 'pinned' && !w.pinned) return false;
      if (pinnedFilter === 'unpinned' && w.pinned) return false;

      // 1. Search by User Name
      if (filterUsername.trim() !== '') {
        const q = filterUsername.toLowerCase().trim();
        const usernameVal = (w.username || w.name || '').toLowerCase();
        if (!usernameVal.includes(q)) return false;
      }

      // 2. Search by Game Name
      if (filterGameName.trim() !== '') {
        const q = filterGameName.toLowerCase().trim();
        const gameNameVal = (w.gameName || w.name || '').toLowerCase();
        if (!gameNameVal.includes(q)) return false;
      }

      // 3. Search by User ID
      if (filterUserId.trim() !== '') {
        const q = filterUserId.toLowerCase().trim();
        const userIdVal = (w.userId || w.uid || '').toLowerCase();
        if (!userIdVal.includes(q)) return false;
      }

      // 4. Search by Game UID
      if (filterGameUid.trim() !== '') {
        const q = filterGameUid.toLowerCase().trim();
        const gameUidVal = (w.gameUid || w.uid || '').toLowerCase();
        if (!gameUidVal.includes(q)) return false;
      }

      // 5. Tournament Filter
      if (filterTournament !== 'all') {
        const selectedT = tournaments.find(t => t.id === filterTournament);
        if (selectedT) {
          if (w.tournamentId !== filterTournament && w.tournamentName !== selectedT.title) return false;
        } else {
          if (!w.tournamentName.toLowerCase().includes(filterTournament.toLowerCase())) return false;
        }
      }

      // 6. Tournament Category (BR / CS)
      if (filterCategory !== 'all') {
        const content = `${w.tournamentName} ${w.matchType} ${w.gameCategory}`.toLowerCase();
        if (filterCategory === 'BR') {
          const isBr = content.includes('br') || content.includes('battle royale') || content.includes('bermuda') || content.includes('purgatory');
          if (!isBr) return false;
        }
        if (filterCategory === 'CS') {
          const isCs = content.includes('cs') || content.includes('clash squad') || content.includes('clashsquad');
          if (!isCs) return false;
        }
      }

      // 7. Match Type (Solo / Duo / Squad)
      if (filterMatchType !== 'all') {
        const content = `${w.matchType} ${w.tournamentName}`.toLowerCase();
        if (!content.includes(filterMatchType.toLowerCase())) return false;
      }

      // 8. Date Range
      if (filterStartDate) {
        if (w.winnerDate && w.winnerDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        if (w.winnerDate && w.winnerDate > filterEndDate) return false;
      }

      // Legacy Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        return (
          w.name.toLowerCase().includes(query) ||
          w.uid.toLowerCase().includes(query) ||
          w.tournamentName.toLowerCase().includes(query) ||
          (w.username || '').toLowerCase().includes(query) ||
          (w.gameName || '').toLowerCase().includes(query) ||
          (w.gameUid || '').toLowerCase().includes(query)
        );
      }

      return true;
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.displayOrder - b.displayOrder;
    });
  }, [
    winners,
    gameFilter,
    pinnedFilter,
    searchQuery,
    filterUsername,
    filterGameName,
    filterUserId,
    filterGameUid,
    filterTournament,
    filterCategory,
    filterMatchType,
    filterStartDate,
    filterEndDate,
    tournaments
  ]);

  // Player suggestion filter in Modal
  const matchingPlayers = useMemo(() => {
    if (!playerSearchQuery.trim()) return [];
    const query = playerSearchQuery.toLowerCase().trim();

    return dbUsers.filter(u => {
      const details = getUserDetails(u);
      
      if (playerSearchType === 'username') {
        return details.username.toLowerCase().includes(query);
      }
      if (playerSearchType === 'gamename') {
        return details.gameName.toLowerCase().includes(query);
      }
      if (playerSearchType === 'userid') {
        return details.userId.toLowerCase().includes(query);
      }
      if (playerSearchType === 'gameuid') {
        return details.gameUid.toLowerCase().includes(query);
      }

      // Default: Search all fields
      return (
        details.username.toLowerCase().includes(query) ||
        details.gameName.toLowerCase().includes(query) ||
        details.userId.toLowerCase().includes(query) ||
        details.gameUid.toLowerCase().includes(query)
      );
    });
  }, [dbUsers, playerSearchQuery, playerSearchType]);

  const handleSelectPlayer = (player: UserProfile) => {
    const details = getUserDetails(player);
    setSelectedUser(player);
    setFormName(details.username);
    setFormUid(details.gameUid || details.userId);
    setFormGameName(details.gameName);
    setFormGameUid(details.gameUid);
    setFormProfilePhoto(details.profilePhoto);
    setFormUserId(details.userId);
    setFormImage(details.profilePhoto);
    setShowDropdown(false);
    showToast(`Successfully selected ${details.username}! 👤`);
  };

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalWinners = filteredWinners.length;
    const totalPrizes = filteredWinners.reduce((sum, w) => sum + w.prizeWon, 0);
    const ffCount = filteredWinners.filter(w => w.gameCategory === 'Free Fire').length;
    const pubgCount = filteredWinners.filter(w => w.gameCategory === 'PUBG Mobile').length;
    const cocCount = filteredWinners.filter(w => w.gameCategory === 'Clash of Clans').length;
    const ffPrize = filteredWinners.filter(w => w.gameCategory === 'Free Fire').reduce((sum, w) => sum + w.prizeWon, 0);
    const pubgPrize = filteredWinners.filter(w => w.gameCategory === 'PUBG Mobile').reduce((sum, w) => sum + w.prizeWon, 0);
    const cocPrize = filteredWinners.filter(w => w.gameCategory === 'Clash of Clans').reduce((sum, w) => sum + w.prizeWon, 0);
    const pinnedCount = filteredWinners.filter(w => w.pinned).length;

    return {
      totalWinners,
      totalPrizes,
      ffCount,
      pubgCount,
      cocCount,
      ffPrize,
      pubgPrize,
      cocPrize,
      pinnedCount
    };
  }, [filteredWinners]);

  // Export functions
  const exportToCSV = () => {
    const headers = ['ID', 'Player Name', 'Player UID', 'Game Category', 'Tournament Name', 'Match Type', 'Rank', 'Prize Won (INR)', 'Kills', 'Matches Played', 'Winner Date', 'MVP', 'Verified', 'Pinned', 'Display Order'];
    const rows = filteredWinners.map(w => [
      w.id,
      `"${w.name.replace(/"/g, '""')}"`,
      `"${w.uid}"`,
      `"${w.gameCategory}"`,
      `"${w.tournamentName.replace(/"/g, '""')}"`,
      `"${w.matchType}"`,
      w.rank,
      w.prizeWon,
      w.kills,
      w.matchesPlayed,
      w.winnerDate,
      w.mvp ? 'Yes' : 'No',
      w.verified ? 'Yes' : 'No',
      w.pinned ? 'Yes' : 'No',
      w.displayOrder
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tournament_winners_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const headers = ['ID', 'Player Name', 'Player UID', 'Game Category', 'Tournament Name', 'Match Type', 'Rank', 'Prize Won (INR)', 'Kills', 'Matches Played', 'Winner Date', 'MVP', 'Verified', 'Pinned', 'Display Order'];
    const rows = filteredWinners.map(w => [
      w.id,
      w.name,
      w.uid,
      w.gameCategory,
      w.tournamentName,
      w.matchType,
      w.rank,
      w.prizeWon,
      w.kills,
      w.matchesPlayed,
      w.winnerDate,
      w.mvp ? 'Yes' : 'No',
      w.verified ? 'Yes' : 'No',
      w.pinned ? 'Yes' : 'No',
      w.displayOrder
    ]);

    let tabContent = headers.join('\t') + '\n';
    rows.forEach(r => {
      tabContent += r.join('\t') + '\n';
    });

    const blob = new Blob([tabContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `tournament_winners_excel_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printWinnersPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Tournament Winners Export - Hall of Fame</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #111; }
            h1 { font-size: 24px; color: #1d1d24; border-bottom: 2px solid #ddd; padding-bottom: 8px; margin-bottom: 5px; }
            p { font-size: 12px; color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background-color: #f5f5f7; border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; }
            td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            tr:nth-child(even) { background-color: #fbfbfd; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
            .badge-ff { color: #e05200; background-color: #ffebe0; }
            .badge-pubg { color: #8a6d00; background-color: #fffde0; }
            .badge-coc { color: #0060a3; background-color: #e0f4ff; }
            .badge-mvp { background-color: #ffe0e0; color: #c00000; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>🏆 Tournament Winners Registry</h1>
          <p>Export Date: ${new Date().toLocaleDateString()} | Total Records: ${filteredWinners.length} | Total Prize Paid: INR ${stats.totalPrizes.toLocaleString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player Nickname</th>
                <th>Player UID</th>
                <th>Game Category</th>
                <th>Tournament Name</th>
                <th>Match Type</th>
                <th>Date</th>
                <th class="right">Kills</th>
                <th class="right">Prize Won</th>
                <th>Badges</th>
              </tr>
            </thead>
            <tbody>
              ${filteredWinners.map(w => `
                <tr>
                  <td>#${w.rank}</td>
                  <td><strong>${w.name}</strong></td>
                  <td><code>${w.uid}</code></td>
                  <td><span class="badge ${w.gameCategory === 'Free Fire' ? 'badge-ff' : w.gameCategory === 'PUBG Mobile' ? 'badge-pubg' : 'badge-coc'}">${w.gameCategory}</span></td>
                  <td>${w.tournamentName}</td>
                  <td>${w.matchType}</td>
                  <td>${w.winnerDate}</td>
                  <td class="right">${w.kills}</td>
                  <td class="right"><strong>INR ${w.prizeWon.toLocaleString()}</strong></td>
                  <td>
                    ${w.mvp ? '<span class="badge badge-mvp">MVP</span>' : ''}
                    ${w.verified ? '<span class="badge" style="background:#e0ffe0; color:#007000;">VERIFIED</span>' : ''}
                    ${w.pinned ? '<span class="badge" style="background:#fff2cc; color:#b45f06;">FEATURED</span>' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 animate-[slide-up_0.2s_ease-out]">
          <Check className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider">{successToast}</span>
        </div>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gold-400" />
            <span>Winnings & Champions Manager</span>
          </h2>
          <p className="text-neutral-400 text-xs mt-0.5">
            Add, update, pin, and audit tournament prize winners using the powerful live-search player selection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Winner Button */}
          <button 
            onClick={() => openWinnerModal()}
            className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg hover:shadow-gold-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Winner</span>
          </button>
        </div>
      </div>

      {/* ADMIN STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest">Total Winners</span>
            <p className="text-2xl font-black text-white">{stats.totalWinners}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/5 text-neutral-300">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gold-400 font-extrabold uppercase tracking-widest">Total Prizes Paid</span>
            <p className="text-2xl font-black text-gold-400">₹{stats.totalPrizes.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-gold-500/10 text-gold-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-widest">Free Fire Prizes</span>
            <p className="text-2xl font-black text-orange-400">₹{stats.ffPrize.toLocaleString()}</p>
            <p className="text-[9px] text-neutral-500">{stats.ffCount} Champions Registered</p>
          </div>
          <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-widest">PUBG & CoC Prizes</span>
            <p className="text-2xl font-black text-sky-400">₹{(stats.pubgPrize + stats.cocPrize).toLocaleString()}</p>
            <p className="text-[9px] text-neutral-500">{stats.pubgCount + stats.cocCount} Champions Registered</p>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Game Select */}
            <select 
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="bg-[#12121a] border border-white/10 text-xs font-bold text-white uppercase px-3 py-2 rounded-lg focus:outline-none focus:border-gold-500"
            >
              <option value="all">🎮 All Games</option>
              <option value="Free Fire">Free Fire</option>
              <option value="PUBG Mobile">PUBG Mobile</option>
              <option value="Clash of Clans">Clash of Clans</option>
            </select>

            {/* Pinned Filter */}
            <select 
              value={pinnedFilter}
              onChange={(e) => setPinnedFilter(e.target.value)}
              className="bg-[#12121a] border border-white/10 text-xs font-bold text-white uppercase px-3 py-2 rounded-lg focus:outline-none focus:border-gold-500"
            >
              <option value="all">⭐ All Records</option>
              <option value="pinned">Pinned / Featured Podium</option>
              <option value="unpinned">Standard List Only</option>
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-bold uppercase flex items-center gap-1.5 transition-all"
            >
              <Filter className="w-3.5 h-3.5 text-gold-400" />
              <span>{showAdvancedFilters ? 'Hide Advanced' : 'Advanced Filters'}</span>
              {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase transition-all"
            >
              Reset Filters
            </button>
          </div>

          {/* Unified search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Instant Unified Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#12121a] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            {/* Search by User Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Search by User Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Enter User Name..."
                  value={filterUsername}
                  onChange={(e) => setFilterUsername(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* Search by Game Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Search by Game Name (IGN)</label>
              <div className="relative">
                <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Enter IGN..."
                  value={filterGameName}
                  onChange={(e) => setFilterGameName(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* Search by User ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Search by User ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Enter User ID..."
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* Search by Game UID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Search by Game UID</label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Enter Game UID..."
                  value={filterGameUid}
                  onChange={(e) => setFilterGameUid(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* Select Tournament */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tournament</label>
              <select
                value={filterTournament}
                onChange={(e) => setFilterTournament(e.target.value)}
                className="w-full bg-[#12121a] border border-white/10 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-gold-500"
              >
                <option value="all">🏆 All Tournaments</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Tournament Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Category Format</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-[#12121a] border border-white/10 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-gold-500"
              >
                <option value="all">🔥 All Formats</option>
                <option value="BR">Battle Royale (BR)</option>
                <option value="CS">Clash Squad (CS)</option>
              </select>
            </div>

            {/* Match Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Match Type</label>
              <select
                value={filterMatchType}
                onChange={(e) => setFilterMatchType(e.target.value)}
                className="w-full bg-[#12121a] border border-white/10 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-gold-500"
              >
                <option value="all">👥 All Modes</option>
                <option value="Solo">Solo</option>
                <option value="Duo">Duo</option>
                <option value="Squad">Squad</option>
              </select>
            </div>

            {/* Date Range Fields */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Date Range</label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-[#12121a] border border-white/10 text-[10px] text-white p-1 rounded focus:outline-none focus:border-gold-500 w-1/2"
                />
                <span className="text-neutral-500 text-xs">to</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-[#12121a] border border-white/10 text-[10px] text-white p-1 rounded focus:outline-none focus:border-gold-500 w-1/2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Export and Print actions */}
        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-neutral-400 text-xs">
          <div>
            Showing <span className="font-extrabold text-white">{filteredWinners.length}</span> of <span className="text-neutral-300">{winners.length}</span> records
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={exportToCSV}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button 
              onClick={exportToExcel}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button 
              onClick={printWinnersPDF}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE DATA LIST */}
      <div className="bg-[#0a0a0f] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
                <th className="py-3 px-4">Podium Pinned</th>
                <th className="py-3 px-4">Rank / Order</th>
                <th className="py-3 px-4">Winner Details</th>
                <th className="py-3 px-4">Game / Match</th>
                <th className="py-3 px-4">Tournament Name</th>
                <th className="py-3 px-4 text-right">Prize Won</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredWinners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-500">
                    No winner records match your criteria. Try adjusting your advanced filters!
                  </td>
                </tr>
              ) : (
                filteredWinners.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition-all">
                    {/* Pin toggle */}
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleTogglePin(w)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                          w.pinned 
                            ? 'bg-gold-500/20 text-gold-400 hover:bg-gold-500/30' 
                            : 'bg-white/5 text-neutral-600 hover:text-white hover:bg-white/10'
                        }`}
                        title={w.pinned ? "Pinned to Featured Podium!" : "Pin to Featured Podium"}
                      >
                        <Star className={`w-4 h-4 ${w.pinned ? 'fill-gold-400' : ''}`} />
                      </button>
                    </td>

                    {/* Rank / Order */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="font-extrabold text-white">Rank #{w.rank}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">Order: {w.displayOrder}</div>
                    </td>

                    {/* Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={w.profilePhoto || w.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                          alt={w.username || w.name} 
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                          }}
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-extrabold text-white flex items-center gap-1">
                            <span>{w.username || w.name}</span>
                            {w.verified && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Verified Player" />}
                            {w.mvp && <span className="text-[8px] bg-red-500/20 border border-red-500/40 text-red-400 font-bold px-1 rounded">MVP</span>}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">UID: {w.gameUid || w.uid}</div>
                          {w.userId && w.userId !== w.gameUid && (
                            <div className="text-[9px] text-neutral-600 font-mono">User ID: {w.userId}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Game / Match Type */}
                    <td className="py-3 px-4 space-y-0.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold uppercase text-neutral-300">
                        {w.gameCategory}
                      </span>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-wider">{w.matchType}</div>
                    </td>

                    {/* Tournament */}
                    <td className="py-3 px-4 max-w-[200px] truncate">
                      <div className="font-medium text-neutral-300 truncate">{w.tournamentName}</div>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{w.winnerDate}</span>
                      </div>
                    </td>

                    {/* Prize */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-black text-gold-400">₹{w.prizeWon.toLocaleString()}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{w.kills} KILLS</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => openWinnerModal(w)}
                          className="p-1.5 rounded bg-white/5 hover:bg-gold-500 hover:text-neutral-950 text-neutral-400 transition-all cursor-pointer"
                          title="Edit Winner"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(w.id)}
                          className="p-1.5 rounded bg-white/5 hover:bg-red-500 hover:text-white text-neutral-400 transition-all cursor-pointer"
                          title="Delete Winner"
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

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-[#0c0c14] border border-white/10 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-[zoom-in_0.2s_ease-out]">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-black text-sm uppercase text-white tracking-widest flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-400" />
                <span>{editingWinner ? 'Update Champion Record' : 'Register New Winner'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded bg-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* REAL-TIME PLAYER LIVE SEARCH & SELECT SECTION */}
            {!editingWinner && (
              <div className="bg-[#11111a] border border-white/5 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gold-400" />
                    <span>Real-Time Registered User Search</span>
                  </h4>
                  {selectedUser && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                      <Check className="w-3 h-3" /> Player Connected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Query Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Type name, IGN, User ID or game UID..."
                      value={playerSearchQuery}
                      onChange={(e) => {
                        setPlayerSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      className="w-full bg-[#08080c] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Search Type Filter */}
                  <div className="flex gap-2">
                    <select
                      value={playerSearchType}
                      onChange={(e) => setPlayerSearchType(e.target.value)}
                      className="bg-[#08080c] border border-white/10 text-[11px] font-bold text-neutral-300 uppercase px-3 py-2 rounded-xl focus:outline-none focus:border-gold-500 flex-1"
                    >
                      <option value="all">🔍 Search All Fields</option>
                      <option value="username">👤 User Name</option>
                      <option value="gamename">🎮 Game Name (IGN)</option>
                      <option value="userid">🆔 User ID</option>
                      <option value="gameuid">⚡ Game UID</option>
                    </select>
                    
                    {playerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlayerSearchQuery('');
                          setShowDropdown(false);
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Suggested drop-down result block */}
                {showDropdown && playerSearchQuery.trim().length > 0 && (
                  <div className="border border-white/10 bg-[#08080c] rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto relative divide-y divide-white/5 z-20">
                    {loadingUsers ? (
                      <div className="p-4 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-gold-500" />
                        <span>Searching registered users stream...</span>
                      </div>
                    ) : matchingPlayers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-neutral-500 font-mono">
                        No players match search queries. Double-check details!
                      </div>
                    ) : (
                      matchingPlayers.map(player => {
                        const details = getUserDetails(player);
                        return (
                          <div
                            key={details.userId}
                            onClick={() => handleSelectPlayer(player)}
                            className="p-3 hover:bg-gold-500/10 cursor-pointer transition-all flex items-center justify-between gap-3 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={details.profilePhoto}
                                alt={details.username}
                                className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                }}
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <div className="font-extrabold text-white flex items-center gap-1 text-xs">
                                  <span>{details.username}</span>
                                  {details.phoneNumber && (
                                    <span className="text-[9px] text-neutral-500">({details.phoneNumber})</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-0.5 text-[9px] text-neutral-400 font-mono">
                                  <div>IGN: <span className="text-gold-400 font-bold">{details.gameName}</span></div>
                                  <div>UID: <span className="text-sky-400 font-bold">{details.gameUid}</span></div>
                                  <div className="col-span-2 text-neutral-600">ID: {details.userId}</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 text-right flex-shrink-0">
                              <span className="text-[8px] text-neutral-500 uppercase font-black tracking-wider">
                                Joined {details.registeredDate ? new Date(details.registeredDate).toLocaleDateString() : 'N/A'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/30 text-gold-400 font-bold text-[9px] uppercase tracking-wider">
                                Select
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Selected User Showcase Box */}
                {selectedUser && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <img
                        src={getUserDetails(selectedUser).profilePhoto}
                        alt={getUserDetails(selectedUser).username}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-[8px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Selected Connected Account
                        </div>
                        <div className="text-xs font-extrabold text-white mt-0.5">
                          {getUserDetails(selectedUser).username} <span className="text-neutral-500 font-mono">({getUserDetails(selectedUser).userId})</span>
                        </div>
                        <div className="flex gap-3 text-[9px] text-neutral-300 font-mono mt-0.5">
                          <div>Game Name: <span className="text-gold-400">{getUserDetails(selectedUser).gameName}</span></div>
                          <div>Game UID: <span className="text-sky-400">{getUserDetails(selectedUser).gameUid}</span></div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setFormName('');
                        setFormUid('');
                        setFormGameName('');
                        setFormGameUid('');
                        setFormProfilePhoto('');
                        setFormUserId('');
                        setPlayerSearchQuery('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* SELECT TOURNAMENT DROPDOWN OR MANUAL */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider">Tournament Connection *</label>
                    <span className="text-[9px] text-neutral-500">Matches published database</span>
                  </div>
                  
                  <select
                    value={formTournamentId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setFormTournamentId(selectedId);
                      const selectedT = tournaments.find(t => t.id === selectedId);
                      if (selectedT) {
                        setFormTournament(selectedT.title);
                        setFormBanner(selectedT.bannerUrl || '');
                        setFormGame(selectedT.gameCategory as any || 'Free Fire');
                        setFormMatchType(selectedT.mode || 'Squad');
                      }
                    }}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="">-- Choose Published Tournament --</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.mode || 'CS/BR'})</option>
                    ))}
                    <option value="custom">✍️ Type Custom / Manual Tournament Name</option>
                  </select>
                </div>

                {/* Manually custom tournament override */}
                {(formTournamentId === 'custom' || formTournamentId === '') && (
                  <div className="space-y-1 sm:col-span-2 animate-fade-in">
                    <label className="text-[10px] uppercase font-bold text-neutral-400">Custom Tournament Name *</label>
                    <input
                      type="text"
                      required
                      value={formTournament}
                      onChange={(e) => setFormTournament(e.target.value)}
                      placeholder="Enter full tournament name..."
                      className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                )}

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Player Nickname *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. ViperFF"
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Player UID */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Player UID *</label>
                  <input
                    type="text"
                    required
                    value={formUid}
                    onChange={(e) => setFormUid(e.target.value)}
                    placeholder="e.g. 827463920"
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Game Category */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Game Category</label>
                  <select
                    value={formGame}
                    onChange={(e) => setFormGame(e.target.value as any)}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="Free Fire">Free Fire</option>
                    <option value="PUBG Mobile">PUBG Mobile</option>
                    <option value="Clash of Clans">Clash of Clans</option>
                  </select>
                </div>

                {/* Match Type */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Match Type</label>
                  <input
                    type="text"
                    value={formMatchType}
                    onChange={(e) => setFormMatchType(e.target.value)}
                    placeholder="e.g. Squad, Solo, Duo, CS Match"
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Custom input fields specifically for db mapping */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">In-Game IGN (Game Name)</label>
                  <input
                    type="text"
                    value={formGameName}
                    onChange={(e) => setFormGameName(e.target.value)}
                    placeholder="Enter IGN name..."
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">In-Game Player UID (Game UID)</label>
                  <input
                    type="text"
                    value={formGameUid}
                    onChange={(e) => setFormGameUid(e.target.value)}
                    placeholder="Enter UID..."
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Banner URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Tournament Banner Image URL</label>
                  <input
                    type="text"
                    value={formBanner}
                    onChange={(e) => setFormBanner(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Profile Image */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Player Profile Avatar URL</label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => {
                      setFormImage(e.target.value);
                      setFormProfilePhoto(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Winner Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-sans text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Rank */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Rank Position (#)</label>
                  <input
                    type="number"
                    min={1}
                    value={formRank}
                    onChange={(e) => setFormRank(Number(e.target.value))}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Prize Money */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Prize Won (INR ₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formPrize}
                    onChange={(e) => setFormPrize(Number(e.target.value))}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Kills */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Total Kills</label>
                  <input
                    type="number"
                    min={0}
                    value={formKills}
                    onChange={(e) => setFormKills(Number(e.target.value))}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Matches */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Matches Played</label>
                  <input
                    type="number"
                    min={0}
                    value={formMatches}
                    onChange={(e) => setFormMatches(Number(e.target.value))}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Display Order */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Display Order (Sorting)</label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

              </div>

              {/* Badges Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <label className="flex items-center gap-3 bg-[#12121a] border border-white/10 px-4 py-3 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formMvp}
                    onChange={(e) => setFormMvp(e.target.checked)}
                    className="w-4 h-4 accent-gold-500"
                  />
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-extrabold text-white">MVP Champion</div>
                    <div className="text-[9px] text-neutral-500 font-sans">Displays MVP badge</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 bg-[#12121a] border border-white/10 px-4 py-3 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formVerified}
                    onChange={(e) => setFormVerified(e.target.checked)}
                    className="w-4 h-4 accent-gold-500"
                  />
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-extrabold text-white">Verified Badge</div>
                    <div className="text-[9px] text-neutral-500 font-sans">Displays blue check</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 bg-[#12121a] border border-white/10 px-4 py-3 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPinned}
                    onChange={(e) => setFormPinned(e.target.checked)}
                    className="w-4 h-4 accent-gold-500"
                  />
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-extrabold text-gold-400">Pin to Podium</div>
                    <div className="text-[9px] text-neutral-500 font-sans">Elevates to Top 3 Featured</div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingWinner ? 'Update Record' : 'Register Winner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWinningsManager;
