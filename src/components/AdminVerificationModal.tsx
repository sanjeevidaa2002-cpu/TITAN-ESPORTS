import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldAlert, X, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface AdminVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminVerificationModal: React.FC<AdminVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userProfile, triggerNotification } = useGame();
  
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim() || !password.trim()) {
      setError('Both Admin ID and Password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: adminId.trim(),
          password: password,
          userUid: userProfile?.uid || 'unknown'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerified(true);
        triggerNotification(
          "Admin Verification Success 🛡️", 
          "Second factor credentials verified. Access granted.", 
          "system"
        );
        
        // Save verification in session storage
        sessionStorage.setItem('admin_2fa_verified', 'true');
        sessionStorage.setItem('admin_2fa_time', Date.now().toString());

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(data.message || 'Invalid Admin ID or Password.');
        triggerNotification(
          "Verification Failed 🚨", 
          "Invalid administrative credentials submitted.", 
          "alert"
        );
      }
    } catch (err: any) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 cursor-default"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="w-full max-w-md bg-[#0d0d15]/98 border border-gold-500/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(229,169,25,0.1)] overflow-hidden relative backdrop-blur-xl z-10"
        >
          {/* Top Gold Indicator line */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-gold-500 to-yellow-500 w-full" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-all cursor-pointer p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            {/* Verification Success Layout */}
            {verified ? (
              <div className="flex flex-col items-center text-center py-8 space-y-4">
                <motion.div 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                >
                  <CheckCircle className="w-8 h-8" />
                </motion.div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black tracking-widest text-emerald-400 uppercase">ACCESS GRANTED</h3>
                  <p className="text-xs text-neutral-400">Loading protected Administrative Settings...</p>
                </div>
              </div>
            ) : (
              /* Verification Form Layout */
              <>
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center border border-gold-500/30 shadow-[0_0_20px_rgba(229,169,25,0.15)] mb-4">
                    <Lock className="w-6 h-6 text-gold-400" />
                  </div>
                  <h2 className="text-lg font-black tracking-widest text-white uppercase">Admin Gatekeepers</h2>
                  <p className="text-[10px] text-neutral-400 font-mono mt-1.5 uppercase tracking-wider">Multi-Factor Identity Validation</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2.5"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-400 mb-1.5">Admin Security ID</label>
                    <input
                      type="text"
                      required
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="Enter administrative ID"
                      disabled={loading}
                      className="w-full bg-neutral-900/80 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-400 mb-1.5">Admin Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={loading}
                        className="w-full bg-neutral-900/80 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-all"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-gold-500 to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(229,169,25,0.2)] hover:shadow-[0_0_30px_rgba(229,169,25,0.4)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Identity...</span>
                        </>
                      ) : (
                        <span>Verify & Unlock</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
