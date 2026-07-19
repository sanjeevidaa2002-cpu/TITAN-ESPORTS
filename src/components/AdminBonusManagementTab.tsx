import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Award, Save, RefreshCw, Filter, Search, CheckCircle, XCircle } from 'lucide-react';
import { BonusSettings, BonusHistory } from '../types';

export const AdminBonusManagementTab: React.FC = () => {
  const { bonusSettings, triggerNotification } = useGame();
  
  // Local state for settings form
  const [settings, setSettings] = useState<BonusSettings>({
    depositBonusEnabled: false,
    depositBonusType: 'fixed',
    depositBonusValue: 0,
    minimumDeposit: 0,
    maximumDeposit: 0,
    maximumBonus: 0,
    referralBonusEnabled: false,
    referrerBonusAmount: 0,
    referredUserBonusAmount: 0,
    minimumReferralDeposit: 0,
    updatedAt: new Date().toISOString()
  });

  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<BonusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'deposit_bonus' | 'referral_bonus'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with context
  useEffect(() => {
    if (bonusSettings) {
      setSettings(bonusSettings);
    }
  }, [bonusSettings]);

  // Load history
  useEffect(() => {
    const q = query(collection(db, 'bonus_history'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data: BonusHistory[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as BonusHistory));
      setHistory(data);
      setLoadingHistory(false);
    }, (err) => console.warn('Bonus sync error.'));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appSettings', 'bonus'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      triggerNotification('Settings Saved ✅', 'Bonus settings have been successfully updated.', 'success');
    } catch (error: any) {
      triggerNotification('Save Failed ❌', error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (bonusSettings) {
      setSettings(bonusSettings);
    }
  };

  const filteredHistory = history.filter(h => {
    if (filterType !== 'all' && h.bonusType !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!h.userName?.toLowerCase().includes(q) && !h.userId?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-5 h-5 text-pink-500" />
          Bonus Management
        </h2>
        <p className="text-xs text-neutral-400">Configure deposit and referral bonus rules and track history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Bonus Settings */}
        <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              💰 Deposit Bonus Settings
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Enable</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={settings.depositBonusEnabled}
                  onChange={(e) => setSettings({...settings, depositBonusEnabled: e.target.checked})}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${settings.depositBonusEnabled ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.depositBonusEnabled ? 'left-6' : 'left-1'}`}></div>
              </div>
            </label>
          </div>

          <div className={`space-y-4 ${!settings.depositBonusEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Bonus Type</label>
                <select
                  value={settings.depositBonusType}
                  onChange={(e) => setSettings({...settings, depositBonusType: e.target.value as 'fixed' | 'percentage'})}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-amber-500 outline-none"
                >
                  <option value="fixed">Fixed Amount (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Bonus Value</label>
                <input
                  type="number"
                  value={settings.depositBonusValue}
                  onChange={(e) => setSettings({...settings, depositBonusValue: Number(e.target.value)})}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Min Deposit (₹)</label>
                <input
                  type="number"
                  value={settings.minimumDeposit}
                  onChange={(e) => setSettings({...settings, minimumDeposit: Number(e.target.value)})}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Max Deposit (₹, Optional)</label>
                <input
                  type="number"
                  value={settings.maximumDeposit}
                  onChange={(e) => setSettings({...settings, maximumDeposit: Number(e.target.value)})}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>
              {settings.depositBonusType === 'percentage' && (
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Max Bonus Limit (₹, Optional)</label>
                  <input
                    type="number"
                    value={settings.maximumBonus}
                    onChange={(e) => setSettings({...settings, maximumBonus: Number(e.target.value)})}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Referral Bonus Settings */}
        <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              👥 Referral Bonus Settings
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Enable</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={settings.referralBonusEnabled}
                  onChange={(e) => setSettings({...settings, referralBonusEnabled: e.target.checked})}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${settings.referralBonusEnabled ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.referralBonusEnabled ? 'left-6' : 'left-1'}`}></div>
              </div>
            </label>
          </div>

          <div className={`space-y-4 ${!settings.referralBonusEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Referrer Bonus (₹)</label>
                <input
                  type="number"
                  value={settings.referrerBonusAmount}
                  onChange={(e) => setSettings({...settings, referrerBonusAmount: Number(e.target.value)})}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">New User Bonus (₹)</label>
                <input
                  type="number"
                  value={settings.referredUserBonusAmount}
                  onChange={(e) => setSettings({...settings, referredUserBonusAmount: Number(e.target.value)})}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Min Deposit to Activate (₹)</label>
                <p className="text-[9px] text-neutral-500 mb-1">New user must deposit this amount for both to get referral bonus.</p>
                <input
                  type="number"
                  value={settings.minimumReferralDeposit}
                  onChange={(e) => setSettings({...settings, minimumReferralDeposit: Number(e.target.value)})}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-neutral-300 hover:bg-white/5 uppercase tracking-wider"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-gold-500 text-black text-xs font-black uppercase tracking-widest hover:brightness-110 flex items-center gap-2"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Bonus History Table */}
      <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            📊 Bonus History
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-300 outline-none focus:border-amber-500"
            >
              <option value="all">All Bonuses</option>
              <option value="deposit_bonus">Deposit Bonus</option>
              <option value="referral_bonus">Referral Bonus</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search User..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0f] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500 w-48"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-neutral-500">
                <th className="p-3 font-bold">Date</th>
                <th className="p-3 font-bold">User</th>
                <th className="p-3 font-bold">Type</th>
                <th className="p-3 font-bold">Trigger Amt</th>
                <th className="p-3 font-bold">Bonus Credited</th>
                <th className="p-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-white/5">
              {loadingHistory ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">Loading history...</td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">No bonus history found.</td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-neutral-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{item.userName}</div>
                      <div className="text-[9px] text-neutral-500">{item.userId}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        item.bonusType === 'deposit_bonus' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {item.bonusType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-neutral-300">
                      {item.depositAmount ? `₹${item.depositAmount}` : '-'}
                    </td>
                    <td className="p-3 font-mono font-bold text-green-400">
                      +₹{item.bonusAmount}
                    </td>
                    <td className="p-3">
                      {item.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-green-400 text-[10px] font-bold uppercase">
                          <CheckCircle className="w-3 h-3" /> Credited
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase">
                          <RefreshCw className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
