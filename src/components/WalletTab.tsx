/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../utils/imageUtils';
import { 
  Plus, 
  ArrowUpRight, 
  RefreshCw, 
  Info, 
  HelpCircle, 
  FileText, 
  ArrowRight, 
  QrCode, 
  Copy, 
  CheckCircle,
  Smartphone,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';

export const WalletTab: React.FC = () => {
  const { userProfile, transactions, depositMoney, withdrawMoney, refreshTransactions } = useGame();
  
  // Tab filters inside history
  const [historyTab, setHistoryTab] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Deposit input states
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [depositMethod, setDepositMethod] = useState<'UPI' | 'ZapUPI' | 'Paytm' | 'PhonePe' | 'GPay' | 'Razorpay' | 'Cashfree' | 'PayU' | 'Easebuzz'>('ZapUPI');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [userTxnRef, setUserTxnRef] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [depositStep, setDepositStep] = useState<1 | 2 | 3>(1); // 1: Select Amount, 2: Scan QR & Submit Ref, 3: Success Anim
  const [checkingStatusOrderId, setCheckingStatusOrderId] = useState<string | null>(null);
  const paymentWindowRef = React.useRef<Window | null>(null);
  const pollingStartTimeRef = React.useRef<number>(0);

  // Admin Payment Configuration state
  const [payConfig, setPayConfig] = useState<any>({
    upiId: 'titanesp@upi',
    qrCodeUrl: '',
    manualPaymentEnabled: true,
    paymentInstructions: '1. Scan the QR code or enter UPI ID.\n2. Enter the amount to transfer.\n3. Note down the 12-Digit Ref / UTR number from receipt.\n4. Submit it here to verify.',
    defaultGateway: 'zapupi',
    zapupiEnabled: true,
    paytmEnabled: true,
    phonepeEnabled: true,
    razorpayEnabled: true,
    cashfreeEnabled: false,
    payuEnabled: false,
    easebuzzEnabled: false
  });

  // Fetch payment gateways setup when tab mounts
  React.useEffect(() => {
    fetch('/api/payments/config')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setPayConfig(data);
          // Set initial deposit method to default gateway
          if (data.defaultGateway === 'zapupi' && data.zapupiEnabled !== false) {
            setDepositMethod('ZapUPI');
          } else if (data.defaultGateway === 'paytm' && data.paytmEnabled && !!data.paytmMerchantKey) {
            setDepositMethod('Paytm');
          } else if (data.defaultGateway === 'phonepe' && data.phonepeEnabled) {
            setDepositMethod('PhonePe');
          } else if (data.defaultGateway === 'razorpay' && data.razorpayEnabled) {
            setDepositMethod('Razorpay');
          } else if (data.defaultGateway === 'cashfree' && data.cashfreeEnabled) {
            setDepositMethod('Cashfree');
          } else if (data.defaultGateway === 'payu' && data.payuEnabled) {
            setDepositMethod('PayU');
          } else if (data.defaultGateway === 'easebuzz' && data.easebuzzEnabled) {
            setDepositMethod('Easebuzz');
          } else if (data.manualPaymentEnabled) {
            setDepositMethod('UPI');
          } else {
            setDepositMethod('ZapUPI');
          }
        }
      })
      .catch(err => console.warn("Could not fetch payment configs:", err));
  }, []);

  // Withdraw input states
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [userUpiId, setUserUpiId] = useState(userProfile?.upiId || '');

  // Keep UPI synced with profile
  React.useEffect(() => {
    if (userProfile?.upiId) {
      setUserUpiId(userProfile.upiId);
    }
  }, [userProfile?.upiId]);
  const [withdrawErr, setWithdrawErr] = useState<string | null>(null);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (checkingStatusOrderId) {
      pollingStartTimeRef.current = Date.now();
      
      intervalId = setInterval(async () => {
        try {
          // Check 60-second timeout
          if (Date.now() - pollingStartTimeRef.current > 60000) {
            clearInterval(intervalId);
            setCheckingStatusOrderId(null);
            setShowDepositModal(false);
            
            // Mark as failed in backend
            fetch(`/api/payments/status/${checkingStatusOrderId}/cancel`, { method: 'POST' });
            
            alert('Payment timeout. No amount has been added to your wallet.');
            refreshTransactions();
            return;
          }
          
          // Check if window is closed by user
          if (paymentWindowRef.current && paymentWindowRef.current.closed) {
            clearInterval(intervalId);
            setCheckingStatusOrderId(null);
            setShowDepositModal(false);
            
            // Mark as failed in backend
            fetch(`/api/payments/status/${checkingStatusOrderId}/cancel`, { method: 'POST' });
            
            alert('Payment was cancelled. No amount has been added to your wallet.');
            refreshTransactions();
            return;
          }

          const res = await fetch(`/api/payments/status/${checkingStatusOrderId}`);
          const data = await res.json();
          if (data.success && data.status !== 'pending') {
            clearInterval(intervalId);
            setCheckingStatusOrderId(null);
            setShowDepositModal(false);
            if (data.status === 'completed' || data.status === 'pending_verification') {
              alert('Payment is ' + (data.status === 'pending_verification' ? 'Pending Approval' : 'Successful') + '! It will be reflected in your wallet once verified.');
            } else {
              alert('Payment Failed or Cancelled.');
            }
            refreshTransactions();
          }
        } catch (e) {
          console.warn("Polling error:");
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkingStatusOrderId, refreshTransactions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTransactions();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    // Check min and max deposit limit restrictions set by administrator
    const minLimit = Number(payConfig.minDepositAmount || 10);
    const maxLimit = Number(payConfig.maxDepositAmount || 100000);
    if (depositAmount < minLimit || depositAmount > maxLimit) {
      alert(`Deposit restriction: Amount must be between ₹${minLimit} and ₹${maxLimit} per transfer.`);
      return;
    }
    
    const isAutoMethod = ['ZapUPI', 'Paytm', 'PhonePe', 'GPay', 'Razorpay', 'Cashfree', 'PayU', 'Easebuzz'].includes(depositMethod);
    
    if (depositStep === 1 && isAutoMethod) {
      try {
        const res = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: depositAmount,
            method: depositMethod,
            userId: userProfile?.uid,
            userEmail: userProfile?.email
          })
        });
        const data = await res.json();
        if (data.success && data.redirectUrl) {
          // Open automated checkout simulation screen directly
          paymentWindowRef.current = window.open(data.redirectUrl, '_blank');
          if (data.orderId) setCheckingStatusOrderId(data.orderId);
        } else {
          alert(data.message || "Failed to initiate automatic checkout gateway.");
        }
      } catch (err: any) {
        alert("Payment Gateway initiation failed: " + err.message);
      }
    } else if (depositStep === 1) {
      // Manual UPI/QR requires step 2
      setDepositStep(2);
    } else {
      // Step 2 submitted with manual UTR ref number and screenshot
      if (!userTxnRef.trim() || !screenshot) {
        alert("Please upload your payment screenshot and enter a valid UTR number before submitting your payment.");
        return;
      }
      
      const formData = new FormData();
      formData.append('amount', depositAmount.toString());
      formData.append('method', depositMethod);
      formData.append('utr', userTxnRef.trim());
      formData.append('screenshot', screenshot);
      formData.append('userId', userProfile?.uid || '');
      
      try {
        const res = await fetch('/api/payments/manual/submit', {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
           setDepositStep(3);
           refreshTransactions();
           // Optional: Reset state after some time or when user clicks done
        } else {
           const data = await res.json();
           alert(data.message || "Failed to submit payment request.");
        }
      } catch (err: any) {
        alert("Error submitting payment: " + err.message);
      }
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErr(null);
    setWithdrawSuccessMsg(null);

    if (!userUpiId.trim()) {
      setWithdrawErr("Please enter a valid UPI address (e.g., gamer@ybl).");
      return;
    }

    if (withdrawAmount < 50) {
      setWithdrawErr("Minimum withdrawal limit is ₹50.");
      return;
    }

    if (!userProfile || userProfile.winningBalance < withdrawAmount) {
      setWithdrawErr("Insufficient winnings balance.");
      return;
    }

    const res = await withdrawMoney(withdrawAmount, userUpiId.trim());
    if (res.success) {
      setWithdrawSuccessMsg(res.message);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg(null);
        setWithdrawAmount(50);
        setUserUpiId('');
      }, 2500);
    } else {
      setWithdrawErr(res.message);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    if (historyTab === 'deposits') {
      return t.type === 'deposit_success' || t.type === 'deposit_request' || t.type === 'deposit_bonus' || t.type === 'referral_bonus';
    }
    if (historyTab === 'withdrawals') {
      return t.type === 'withdraw_request' || t.type === 'withdraw_success';
    }
    return true; // all
  });

  const getTxnColor = (type: TransactionType) => {
    if (type.includes('success') || type === 'match_winnings' || type === 'referral_bonus' || type === 'bonus_coins' || type === 'deposit_bonus') return 'text-green-400';
    if (type.includes('fail')) return 'text-red-400';
    if (type.includes('request')) return 'text-yellow-400';
    return 'text-neutral-400'; // match fees
  };

  const getTxnLabel = (type: string) => {
    switch (type) {
      case 'deposit_success': return 'Deposit Cash Success';
      case 'deposit_request': return 'Deposit Pending Verify';
      case 'deposit_failed': return 'Deposit Failed';
      case 'withdraw_request': return 'UPI Withdrawal Processing';
      case 'withdraw_success': return 'UPI Withdrawal Transferred';
      case 'withdraw_failed': return 'Withdrawal Declined';
      case 'match_join_fee': return 'Room Join Entry Fee';
      case 'match_winnings': return 'Tournament Match Winnings';
      case 'referral_bonus': return 'Promo Reward Code Claimed';
      case 'bonus_coins': return 'Promotional Registration Bonus';
      case 'deposit_bonus': return 'Deposit Extra Bonus';
      default: return 'Transaction';
    }
  };

  return (
    <div id="wallet_tab_root" className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Wallet className="w-5.5 h-5.5 text-gold-400" />
          <span>My Wallet</span>
        </h2>
        <button 
          onClick={handleRefresh}
          className={`p-2 rounded-xl bg-[#111116] border border-white/5 text-neutral-400 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Responsive grid wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Balance & Actions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Massive Blue Gradient Balance Card - Replicating Image 5 */}
          <div className="bg-gradient-to-br from-[#0c244c] via-[#103d82] to-[#144f9c] rounded-3xl p-6 shadow-[0_12px_35px_rgba(16,61,130,0.4)] border border-blue-400/20 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-36 h-36 bg-blue-300/10 rounded-full blur-2xl" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold">TOTAL BALANCE</p>
                <h3 className="text-3xl font-black font-mono text-white tracking-wide mt-1 flex items-center">
                  <span className="mr-1">₹</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={(userProfile ? (userProfile.depositBalance + userProfile.winningBalance + userProfile.bonusBalance) : 0).toFixed(2)}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="inline-block"
                    >
                      {(userProfile ? (userProfile.depositBalance + userProfile.winningBalance + userProfile.bonusBalance) : 0).toFixed(2)}
                    </motion.span>
                  </AnimatePresence>
                </h3>
              </div>
              <button 
                onClick={handleRefresh}
                className={`p-1.5 rounded-lg text-blue-200 transition-all cursor-pointer ${isRefreshing ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Slit row: Deposit Balance vs Winnings */}
            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/10">
              <div>
                <p className="text-[9px] text-blue-200 uppercase tracking-wider flex items-center gap-1 font-semibold">
                  <span>DEPOSIT</span>
                  <Info className="w-3 h-3 text-blue-300 shrink-0" />
                </p>
                <p className="text-lg font-bold font-mono text-white mt-1 flex items-center">
                  <span className="mr-0.5">₹</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={(userProfile?.depositBalance || 0).toFixed(2)}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="inline-block"
                    >
                      {(userProfile?.depositBalance || 0).toFixed(2)}
                    </motion.span>
                  </AnimatePresence>
                </p>
              </div>

              <div className="border-l border-white/10 pl-4">
                <p className="text-[9px] text-blue-200 uppercase tracking-wider flex items-center gap-1 font-semibold">
                  <span>WINNINGS</span>
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                </p>
                <p className="text-lg font-bold font-mono text-green-400 mt-1 flex items-center">
                  <span className="mr-0.5">₹</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={(userProfile?.winningBalance || 0).toFixed(2)}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="inline-block"
                    >
                      {(userProfile?.winningBalance || 0).toFixed(2)}
                    </motion.span>
                  </AnimatePresence>
                </p>
              </div>
            </div>

            {/* Promo Bonus balance info */}
            {userProfile?.bonusBalance && userProfile.bonusBalance > 0 ? (
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-blue-200">
                <span>Promo Bonus Balance (Locked for matches):</span>
                <span className="font-bold font-mono text-amber-400">₹{userProfile.bonusBalance.toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          {/* Massive Add / Withdraw buttons row - exact replication */}
          <div className="grid grid-cols-2 gap-4">
            {/* Add Money (Green) */}
            <button 
              onClick={() => { setDepositStep(1); setShowDepositModal(true); }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-500/10 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3]" />
              <span>ADD MONEY</span>
            </button>

            {/* Withdraw (Orange) */}
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="w-full bg-[#f6911c] hover:bg-[#e48011] text-neutral-950 font-black py-3.5 px-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-[#f6911c]/10 cursor-pointer"
            >
              <ArrowUpRight className="w-4.5 h-4.5 stroke-[3]" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Right Column: Informational boxes */}
        <div className="lg:col-span-4 space-y-4">
          {/* Yellow informational box - exact replication of Screenshot 5 */}
          <div className="bg-[#1c1809]/80 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 shadow-[inset_0_1px_1px_rgba(234,179,8,0.05)]">
            <Info className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-yellow-200/90 leading-relaxed font-sans">
              <p className="font-semibold">ℹ️ Deposit 🔒 = Sirf matches khelne ke liye.</p>
              <p className="font-semibold">Winnings ✓ = Withdraw hota hai.</p>
            </div>
          </div>

          {/* Secure gateway badge */}
          <div className="bg-[#101016] border border-white/5 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-[10px] font-black text-gold-400 tracking-wider uppercase flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/10" />
              <span>100% Instant Transfers</span>
            </h4>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              We process automated UPI payouts 24/7. Your winnings reach your account directly within 5 minutes of hitting withdraw!
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Tabs */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
          Transaction History
        </h3>

        {/* Tabs Filter */}
        <div className="flex border-b border-white/5 text-xs font-semibold">
          <button 
            onClick={() => setHistoryTab('all')}
            className={`pb-2.5 px-4 tracking-wider uppercase ${historyTab === 'all' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-neutral-500 hover:text-white'}`}
          >
            All Activity
          </button>
          <button 
            onClick={() => setHistoryTab('deposits')}
            className={`pb-2.5 px-4 tracking-wider uppercase ${historyTab === 'deposits' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-neutral-500 hover:text-white'}`}
          >
            Deposits
          </button>
          <button 
            onClick={() => setHistoryTab('withdrawals')}
            className={`pb-2.5 px-4 tracking-wider uppercase ${historyTab === 'withdrawals' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-neutral-500 hover:text-white'}`}
          >
            Withdrawals
          </button>
        </div>

        {/* Transactions list */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            /* Match empty receipt layout in screenshot 5 */
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-600 mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                Koi history nahi mili abhi tak.
              </p>
            </div>
          ) : (
            filteredTransactions.map((t) => (
              <div 
                key={t.id} 
                className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-all"
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">
                    {getTxnLabel(t.type)}
                  </p>
                  <p className="text-[9px] text-neutral-500 font-mono">
                    {new Date(t.dateTime).toLocaleString()} | {t.paymentMethod}
                  </p>
                  {t.referenceNo ? (
                    <p className="text-[8px] text-neutral-600 font-mono">Ref: {t.referenceNo}</p>
                  ) : null}
                  {t.upiId ? (
                    <p className="text-[8px] text-neutral-600 font-mono">UPI ID: {t.upiId}</p>
                  ) : null}
                </div>

                  <div className="text-right space-y-1">
                    <p className={`text-sm font-bold font-mono ${getTxnColor(t.type)}`}>
                      {t.type.includes('withdraw') || t.type === 'match_join_fee' ? '-' : '+'}₹{t.amount.toFixed(2)}
                    </p>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${t.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/10' : t.status === 'failed' || t.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10'}`}>
                        {t.status === 'pending_verification' || t.status === 'pending' ? 'Pending Verification' : t.status === 'completed' ? 'Completed' : t.status === 'cancelled' ? 'Cancelled' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                      {t.status === 'completed' && t.type === 'deposit_request' && (
                        <div className="text-[7px] text-green-400 text-right leading-tight">
                          <p>✔ Verified by Admin</p>
                          <p>✔ Wallet Credited Successfully</p>
                        </div>
                      )}
                      {t.status === 'cancelled' && (
                        <div className="text-[7px] text-red-400 max-w-[120px] leading-tight text-right">
                          <p>Your payment request has been cancelled by the administrator.</p>
                          {t.cancellationReason && (
                            <p className="mt-0.5 truncate">Reason: {t.cancellationReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL 1: ADD MONEY (DEPOSIT) */}
      {showDepositModal ? (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="glass-card-gold rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col relative border border-gold-500/30 overflow-hidden">
            {/* Header - Fixed */}
            <div className="p-6 pb-2 shrink-0 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Deposit Funds</h3>
                <p className="text-[10px] text-neutral-400 mt-1">UPI, Paytm, PhonePe Instant Gateway</p>
              </div>
              <button 
                onClick={() => { setShowDepositModal(false); setDepositStep(1); }}
                className="text-neutral-500 hover:text-white transition-all font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-2">
              {checkingStatusOrderId ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                  <h3 className="text-white font-bold text-lg">Awaiting Payment...</h3>
                  <p className="text-neutral-400 text-xs">Please complete the payment on the opened page.<br/>We are automatically checking the status.</p>
                </div>
              ) : depositStep === 1 ? (
                /* Step 1: Input Amount & Select Gateway */
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Enter Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-gold-400">₹</span>
                      <input 
                        type="number"
                        required
                        min={10}
                        value={depositAmount}
                        onChange={e => setDepositAmount(Number(e.target.value))}
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm text-white font-mono font-semibold focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      {[20, 50, 100, 200].map(amt => (
                        <button 
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(amt)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${depositAmount === amt ? 'bg-gold-500 border-gold-500 text-neutral-950 shadow' : 'bg-transparent border-white/5 text-neutral-300 hover:bg-white/5'}`}
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Choose Payment Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {payConfig.zapupiEnabled !== false && (
                        <button 
                          type="button"
                          onClick={() => setDepositMethod('ZapUPI')}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between h-20 ${depositMethod === 'ZapUPI' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-gold-400 shrink-0 animate-pulse" />
                            <span className="truncate">ZapUPI Portal</span>
                          </div>
                          <span className="text-[8px] bg-gold-500/20 text-gold-300 px-1.5 py-0.5 rounded-full font-sans uppercase font-black tracking-wider self-start">⚡ Rec.</span>
                        </button>
                      )}
                      {payConfig.manualPaymentEnabled && (
                        <button 
                          type="button"
                          onClick={() => setDepositMethod('UPI')}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between h-20 ${depositMethod === 'UPI' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-neutral-400 shrink-0" />
                            <span>Direct UPI / QR</span>
                          </div>
                          <span className="text-[8px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded-full font-sans uppercase font-bold self-start">Manual</span>
                        </button>
                      )}
                      {payConfig.paytmEnabled && !!payConfig.paytmMerchantKey && (
                        <button 
                          type="button"
                          onClick={() => setDepositMethod('Paytm')}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 h-20 ${depositMethod === 'Paytm' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                        >
                          <Smartphone className="w-4 h-4 text-gold-500 shrink-0" />
                          <span>Paytm Merchant</span>
                        </button>
                      )}
                      {payConfig.phonepeEnabled && (
                        <button 
                          type="button"
                          onClick={() => setDepositMethod('PhonePe')}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 h-20 ${depositMethod === 'PhonePe' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                        >
                          <Smartphone className="w-4 h-4 text-gold-500 shrink-0" />
                          <span>PhonePe Web</span>
                        </button>
                      )}
                      {payConfig.razorpayEnabled && (
                        <>
                          <button 
                            type="button"
                            onClick={() => setDepositMethod('GPay')}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 h-20 ${depositMethod === 'GPay' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                          >
                            <Smartphone className="w-4 h-4 text-gold-500 shrink-0" />
                            <span>Google Pay</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDepositMethod('Razorpay')}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 h-20 ${depositMethod === 'Razorpay' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                          >
                            <Smartphone className="w-4 h-4 text-gold-500 shrink-0" />
                            <span>Razorpay Hub</span>
                          </button>
                        </>
                      )}
                      {payConfig.cashfreeEnabled && (
                        <button 
                          type="button"
                          onClick={() => setDepositMethod('Cashfree')}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 h-20 ${depositMethod === 'Cashfree' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                        >
                          <Smartphone className="w-4 h-4 text-gold-500 shrink-0" />
                          <span>Cashfree</span>
                        </button>
                      )}
                      {payConfig.payuEnabled && (
                        <button 
                          type="button"
                          onClick={() => setDepositMethod('PayU')}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 h-20 ${depositMethod === 'PayU' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                        >
                          <Smartphone className="w-4 h-4 text-gold-500 shrink-0" />
                          <span>PayU Biz</span>
                        </button>
                      )}
                      {payConfig.easebuzzEnabled && (
                        <button 
                          type="button"
                          onClick={() => setDepositMethod('Easebuzz')}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 h-20 ${depositMethod === 'Easebuzz' ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)]' : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/15'}`}
                        >
                          <Smartphone className="w-4 h-4 text-gold-500 shrink-0" />
                          <span>Easebuzz</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 font-black py-3 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-xs uppercase tracking-widest mt-4"
                  >
                    {depositMethod !== 'UPI' ? 'Instant Secure Checkout' : 'Proceed to Transfer'}
                  </button>
                </form>
              ) : depositStep === 2 ? (
                /* Step 2: Custom UPI manual scanner block */
                <form onSubmit={handleDepositSubmit} className="space-y-5">
                  <div className="flex flex-col items-center bg-[#0d0d11]/80 border border-white/5 p-4 rounded-2xl text-center space-y-3 relative overflow-hidden">
                    <img 
                      src={payConfig.qrCodeUrl || "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=250"} 
                      alt="Scan QR" 
                      className="w-32 h-32 object-contain p-2 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                    />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">SCAN WITH ANY UPI APP</p>
                      <p className="text-[10px] text-neutral-400 mt-1">BHIM, PhonePe, Paytm, GPay, AmazonPay</p>
                    </div>

                    {/* Copy UPI Address button */}
                    <div className="w-full bg-[#161622] border border-white/5 rounded-xl py-2 px-3 flex items-center justify-between text-xs mt-2">
                      <span className="font-mono text-[10px] text-gold-400">{payConfig.upiId}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(payConfig.upiId);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="text-[10px] font-bold text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedUpi ? <span className="text-green-400">Copied!</span> : <><Copy className="w-3 h-3" /><span>Copy ID</span></>}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Instructions & Submit Ref</label>
                    <div className="bg-neutral-900/60 border border-white/5 p-3 rounded-xl text-[9px] text-neutral-300 font-sans leading-relaxed whitespace-pre-line">
                      {payConfig.paymentInstructions}
                    </div>
                    
                    <div className="mt-3 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Submit 12-Digit UPI Ref / UTR No.</label>
                      <input 
                        type="text"
                        required
                        maxLength={12}
                        minLength={12}
                        value={userTxnRef}
                        onChange={e => setUserTxnRef(e.target.value)}
                        placeholder="e.g. 983021948501"
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-2.5 px-4 text-xs font-mono text-center tracking-widest text-white placeholder-neutral-600 focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    
                    <div className="mt-3 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Upload Payment Screenshot (JPG, PNG, WEBP, Max 5MB)</label>
                      <input
                        type="file"
                        required
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size > 5 * 1024 * 1024) {
                            alert("File size exceeds 5MB limit!");
                            e.target.value = '';
                            setScreenshot(null);
                            return;
                          }
                          if (file) {
                             try {
                               const compressed = await compressImage(file, 0.1, 512);
                               const base64Response = await fetch(compressed);
                               const blob = await base64Response.blob();
                               const fileToUpload = new File([blob], file.name, { type: 'image/jpeg' });
                               setScreenshot(fileToUpload);
                             } catch (err) {
                               console.error("Compression error:");
                               alert("Failed to process image");
                             }
                          } else {
                             setScreenshot(null);
                          }
                        }}
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sticky bottom-0 bg-[#161622] p-4 -mx-6 -mb-6 border-t border-white/10">
                    <button 
                      type="button" 
                      onClick={() => setDepositStep(1)}
                      className="py-2.5 rounded-xl bg-transparent border border-white/5 text-xs text-neutral-400 font-bold uppercase tracking-wider"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={!userTxnRef.trim() || !screenshot}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 font-black text-xs uppercase tracking-widest shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Transaction
                    </button>
                  </div>
                  {(!userTxnRef.trim() || !screenshot) && (
                    <p className="text-[10px] text-red-400 mt-2 text-center">
                      Please enter your UTR number and upload the payment screenshot.
                    </p>
                  )}
                </form>
              ) : (
                /* Step 3: Success Anim */
                <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Payment Request Submitted Successfully.</h3>
                    <p className="text-[10px] text-neutral-400 mt-2">Your payment has been sent for Admin Verification.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowDepositModal(false);
                      setDepositStep(1);
                      setUserTxnRef('');
                      setScreenshot(null);
                    }}
                    className="mt-6 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL 2: WITHDRAW FUNDS */}
      {showWithdrawModal ? (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="glass-card-purple rounded-3xl w-full max-w-sm p-6 space-y-6 relative border border-neon-purple/30">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">UPI Withdrawal</h3>
                <p className="text-[10px] text-neutral-400 mt-1">Instant payouts to your bank account</p>
              </div>
              <button 
                onClick={() => { setShowWithdrawModal(false); setWithdrawErr(null); setWithdrawSuccessMsg(null); }}
                className="text-neutral-500 hover:text-white transition-all font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {withdrawSuccessMsg ? (
              <div className="bg-green-950/40 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-400 shrink-0 animate-bounce" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-green-400">Withdrawal Success!</p>
                  <p className="text-[10px] text-neutral-300 leading-relaxed">{withdrawSuccessMsg}</p>
                </div>
              </div>
            ) : null}

            {withdrawErr ? (
              <div className="bg-red-950/40 border border-red-500/20 p-3 rounded-xl flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-xs text-red-200 leading-tight">{withdrawErr}</span>
              </div>
            ) : null}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-neutral-400 uppercase tracking-wider font-semibold">Withdrawal Amount (₹)</span>
                  <span className="text-green-400 font-mono font-bold">Winnings: ₹{(userProfile?.winningBalance || 0).toFixed(2)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-neon-purple">₹</span>
                  <input 
                    type="number"
                    required
                    min={50}
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(Number(e.target.value))}
                    className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm text-white font-mono font-semibold focus:outline-none focus:border-neon-purple"
                  />
                </div>
                <span className="text-[8px] text-neutral-500 block">Minimum withdrawal limit: ₹50. Maximum daily: ₹5,000.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Recipient UPI address / ID</label>
                <input 
                  type="text"
                  required
                  value={userUpiId}
                  onChange={e => setUserUpiId(e.target.value)}
                  placeholder="e.g. lokeshmeena@ybl"
                  className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-neon-purple"
                />
              </div>

              <button
                type="submit"
                disabled={!!withdrawSuccessMsg}
                className="w-full bg-gradient-to-r from-neon-purple to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-xs uppercase tracking-widest mt-4 flex items-center justify-center gap-1"
              >
                <span>Initiate Auto Transfer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
};
