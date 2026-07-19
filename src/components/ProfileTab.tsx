/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { WinningsPage } from './WinningsPage';
import { 
  User, 
  Mail, 
  Gamepad2, 
  Edit2, X, 
  Bell, 
  Wallet, 
  Trophy, 
  Award,
  Gift, 
  Users, 
  LifeBuoy, 
  LogOut, 
  ChevronRight, 
  Hash,
  Activity,
  Check,
  Shield
} from 'lucide-react';

interface ProfileTabProps {
  onSwitchTab: (tab: string) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onSwitchTab }) => {
  const { userProfile, updateProfile, logout, notificationSettings } = useGame();
  
  const [activeSubTab, setActiveSubTab] = useState<'main' | 'winnings'>('main');

  // Toggle switches
  const [pushEnabled, setPushEnabled] = useState(userProfile?.isNotificationEnabled ?? true);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    avatarUrl: userProfile?.avatarUrl ?? '',
    fullName: userProfile?.fullName ?? '',
    nickname: userProfile?.nickname ?? '',
    freefireUid: userProfile?.freefireUid ?? '',
    primaryGame: userProfile?.primaryGame ?? 'Free Fire',
    mobileNumber: userProfile?.mobileNumber ?? '',
    altMobileNumber: userProfile?.altMobileNumber ?? '',
    upiId: userProfile?.upiId ?? '',
    accountHolderName: userProfile?.accountHolderName ?? '',
    state: userProfile?.state ?? '',
    country: userProfile?.country ?? ''
  });
  
  const [editSuccess, setEditSuccess] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.nickname.trim() || !editForm.freefireUid.trim()) return;
    
    await updateProfile(editForm);
    setEditSuccess(true);
    setTimeout(() => {
      setIsEditing(false);
      setEditSuccess(false);
    }, 1500);
  };

  const getInitials = (name: string) => {
    if (!name) return "LO";
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (activeSubTab === 'winnings') {
    return <WinningsPage onBack={() => setActiveSubTab('main')} />;
  }

  return (
    <div id="profile_tab_root" className="space-y-6 pb-24">
      
      {/* Top Title Bar */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Profile</h2>
      </div>

      {/* Dual column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile Card, Stats, Balance, Notifications */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Profile Info Capsule - Exact replication of Screenshot 1 */}
          <div className="bg-[#121929]/90 border border-blue-500/10 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Abstract cyber backdrop */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar circle with glowing blue ring and green online dot */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-[3px] border-blue-400 flex items-center justify-center bg-gradient-to-tr from-[#13131a] to-[#252538] shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    {userProfile?.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt="Gamer Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-lg font-black font-mono text-blue-300">
                        {getInitials(userProfile?.nickname || 'lokesh meena')}
                      </span>
                    )}
                  </div>
                  {/* Green online dot */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#121929] animate-pulse" />
                </div>

                {/* Profile fields */}
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white tracking-wide uppercase">
                    {userProfile?.nickname || 'lokesh meena'}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {userProfile?.mobileNumber || 'No Mobile Linked'}
                  </p>

                  {/* Sub labels row: Controller Badge & UID Badge */}
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    {/* Controller name */}
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-950/40 border border-blue-500/20 text-blue-300 rounded-full text-[9px] font-bold">
                      <Gamepad2 className="w-3 h-3 text-blue-400" />
                      <span>{userProfile?.nickname || 'Lkehw'}</span>
                    </div>

                    {/* Game UID Badge */}
                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-950/30 border border-amber-500/30 text-amber-400 rounded-full text-[9px] font-bold font-mono">
                      <span>UID: {userProfile?.freefireUid || 'Game'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button 
                onClick={() => {
                  setEditForm({
                    avatarUrl: userProfile?.avatarUrl ?? '',
                    fullName: userProfile?.fullName ?? '',
                    nickname: userProfile?.nickname ?? '',
                    freefireUid: userProfile?.freefireUid ?? '',
                    primaryGame: userProfile?.primaryGame ?? 'Free Fire',
                    mobileNumber: userProfile?.mobileNumber ?? '',
                    altMobileNumber: userProfile?.altMobileNumber ?? '',
                    upiId: userProfile?.upiId ?? '',
                    accountHolderName: userProfile?.accountHolderName ?? '',
                    state: userProfile?.state ?? '',
                    country: userProfile?.country ?? ''
                  });
                  setIsEditing(true);
                }}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3-Column Stats Row - Exact replication of Screenshot 1 */}
          <div className="bg-[#111116] border border-white/5 rounded-2xl py-4 grid grid-cols-3 text-center shadow-lg">
            <div>
              <h4 className="text-xl font-black font-mono text-white">
                {userProfile?.totalMatches ?? 0}
              </h4>
              <p className="text-[10px] text-neutral-400 tracking-wide mt-1 uppercase font-semibold">Matches</p>
            </div>
            
            <div className="border-x border-white/5">
              <h4 className="text-xl font-black font-mono text-white">
                {userProfile?.totalKills ?? 0}
              </h4>
              <p className="text-[10px] text-neutral-400 tracking-wide mt-1 uppercase font-semibold">Kills</p>
            </div>

            <div>
              <h4 className="text-xl font-black font-mono text-gold-400">
                ₹{(userProfile?.totalEarnings ?? 0).toFixed(2)}
              </h4>
              <p className="text-[10px] text-neutral-400 tracking-wide mt-1 uppercase font-semibold">₹ Won</p>
            </div>
          </div>

          {/* Wallet balance capsule item - exact replication */}
          <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">TOTAL BALANCE</p>
              <p className="text-lg font-black font-mono text-white">
                ₹{(userProfile ? (userProfile.depositBalance + userProfile.winningBalance + userProfile.bonusBalance) : 0).toFixed(2)}
              </p>
            </div>

            <button 
              onClick={() => onSwitchTab('wallet')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </button>
          </div>

          {notificationSettings?.notificationsEnabled !== false && (
            <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Push Notification</span>
              </div>

              {/* Custom Toggle switch */}
              <button 
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`w-12 h-6.5 rounded-full p-1 transition-all relative flex items-center cursor-pointer ${pushEnabled ? 'bg-neon-purple' : 'bg-neutral-800'}`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all shadow-md absolute ${pushEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Navigation options (My Activity) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">
            MY ACTIVITY
          </h3>

          {/* Navigation list items */}
          <div className="bg-[#111116] border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-lg">
            
            {/* Wallet Activator */}
            <div 
              onClick={() => onSwitchTab('wallet')}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-neutral-200">My Wallet & History</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </div>

            {/* Referral Activator */}
            <div 
              onClick={() => onSwitchTab('referral')}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neon-purple/10 text-purple-400 flex items-center justify-center">
                  <Gift className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-neutral-200">Refer & Earn System</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </div>

            {/* My Winnings Activator */}
            <div 
              onClick={() => setActiveSubTab('winnings')}
              className="p-4 flex items-center justify-between hover:bg-gold-500/5 transition-all cursor-pointer border-l border-transparent hover:border-gold-500/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-gold-400">🏆 Tournament Winning</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gold-600" />
            </div>

            {/* Leaderboards Activator */}
            <div 
              onClick={() => onSwitchTab('leaderboard')}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Trophy className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-neutral-200">Global Leaderboards</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </div>

            {/* Help & Support */}
            <div 
              onClick={() => onSwitchTab('support')}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c9184a]/10 text-[#ff4d6d] flex items-center justify-center">
                  <LifeBuoy className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-neutral-200">Moderator Support Channels</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </div>



            {/* Log Out */}
            <div 
              onClick={logout}
              className="p-4 flex items-center justify-between hover:bg-red-950/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:bg-red-500/20">
                  <LogOut className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-red-400">Log Out Session</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-950" />
            </div>

          </div>
        </div>
      </div>


      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101017] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-[#101017]/95 backdrop-blur-xl border-b border-white/10 p-5 flex justify-between items-center z-10">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Edit Profile</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-8">
              {/* Profile Photo */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Profile Photo</h4>
                <input 
                  type="text" 
                  value={editForm.avatarUrl}
                  onChange={e => setEditForm({...editForm, avatarUrl: e.target.value})}
                  placeholder="Enter Image URL"
                  className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Personal Details */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Personal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.fullName}
                      onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Mobile Number</label>
                    <input 
                      type="text" 
                      value={userProfile?.mobileNumber ?? ''}
                      readOnly
                      className="w-full bg-[#161622]/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">State</label>
                    <input 
                      type="text" 
                      value={editForm.state}
                      onChange={e => setEditForm({...editForm, state: e.target.value})}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Country</label>
                    <input 
                      type="text" 
                      value={editForm.country}
                      onChange={e => setEditForm({...editForm, country: e.target.value})}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Game Details */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Game Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Primary Game</label>
                    <select 
                      value={editForm.primaryGame}
                      onChange={e => setEditForm({...editForm, primaryGame: e.target.value})}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="Free Fire">Free Fire</option>
                      <option value="PUBG Mobile">PUBG Mobile</option>
                      <option value="Clash of Clans">Clash of Clans</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Nickname</label>
                    <input 
                      type="text" 
                      required
                      value={editForm.nickname}
                      onChange={e => setEditForm({...editForm, nickname: e.target.value})}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Game UID</label>
                    <input 
                      type="text" 
                      required
                      value={editForm.freefireUid}
                      onChange={e => setEditForm({...editForm, freefireUid: e.target.value})}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Withdrawal Details */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Withdrawal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">UPI ID</label>
                    <input 
                      type="text" 
                      value={editForm.upiId}
                      onChange={e => setEditForm({...editForm, upiId: e.target.value})}
                      placeholder="e.g. username@upi"
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Account Holder Name (Optional)</label>
                    <input 
                      type="text" 
                      value={editForm.accountHolderName}
                      onChange={e => setEditForm({...editForm, accountHolderName: e.target.value})}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Contact Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Mobile Number</label>
                    <input 
                      type="tel" 
                      value={editForm.mobileNumber}
                      onChange={e => setEditForm({...editForm, mobileNumber: e.target.value})}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Alternate Contact Number (Optional)</label>
                    <input 
                      type="tel" 
                      value={editForm.altMobileNumber}
                      onChange={e => setEditForm({...editForm, altMobileNumber: e.target.value})}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-[#101017] p-2 border-t border-white/5">
                {editSuccess ? (
                  <div className="w-full py-4 bg-green-500/20 text-green-400 rounded-xl text-sm font-bold uppercase tracking-wider text-center border border-green-500/30">
                    Profile Updated Successfully
                  </div>
                ) : (
                  <button 
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all active:scale-[0.98]"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
