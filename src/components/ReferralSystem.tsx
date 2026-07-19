/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Gift, Copy, Share2, Users, Coins, HelpCircle, ArrowLeft } from 'lucide-react';

interface ReferralSystemProps {
  onBack: () => void;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ onBack }) => {
  const { userProfile, triggerNotification } = useGame();
  const [copied, setCopied] = useState(false);

  const refCode = userProfile?.referralCode || "VA-LOK88";

  const handleCopy = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    triggerNotification(
      "Code Copied! 📋",
      `Your unique referral code ${refCode} is copied. Share with your friends to earn ₹15 deposit cash on signup!`,
      "info"
    );
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="referral_tab_root" className="space-y-6 pb-24 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 bg-[#111116] border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Refer & Earn System</h2>
      </div>

      {/* Dual column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Invite Action Card & Stats */}
        <div className="lg:col-span-7 space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-[#1b113a] to-[#3a1c6a] rounded-3xl p-6 border border-neon-purple/20 text-center relative overflow-hidden space-y-4 shadow-xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-neon-purple/10 text-neon-purple flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Gift className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Invite Your Friends</h3>
              <p className="text-xs text-purple-200 max-w-xs mx-auto leading-relaxed">
                Get ₹15 Deposit Cash and ₹10 Bonus coins for every friend who registers with your unique referral link!
              </p>
            </div>

            {/* Copy code input capsule */}
            <div className="max-w-xs mx-auto bg-[#111116] border border-neon-purple/30 rounded-2xl p-2.5 flex items-center justify-between text-xs">
              <div className="pl-3">
                <p className="text-[8px] text-neutral-500 uppercase tracking-widest text-left">Your Invite Code</p>
                <p className="font-mono text-sm font-bold text-white uppercase tracking-wider mt-0.5">{refCode}</p>
              </div>

              <button 
                onClick={handleCopy}
                className="px-4 py-2 bg-gradient-to-r from-neon-purple to-purple-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 transition-all active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <span>Copied!</span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Invite stats overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 text-center space-y-1.5 shadow-md">
              <Users className="w-6 h-6 text-blue-400 mx-auto" />
              <h4 className="text-xl font-bold font-mono text-white">4</h4>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Friends Referred</p>
            </div>

            <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 text-center space-y-1.5 shadow-md">
              <Coins className="w-6 h-6 text-gold-400 mx-auto" />
              <h4 className="text-xl font-bold font-mono text-gold-400">₹60.00</h4>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Earned</p>
            </div>
          </div>
        </div>

        {/* Right Column: Three step guide */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">How It Works</h4>
          
          <div className="space-y-3">
            {[
              { step: '1', title: 'Share Your Referral Code', desc: 'Copy your unique invite code above and send it to your WhatsApp or Telegram groups.' },
              { step: '2', title: 'Friend Registers', desc: 'Your friend registers on TITAN ESP and inputs your code in the Referral Code field.' },
              { step: '3', title: 'Collect Cash Payout', desc: 'Your friend receives ₹15 deposit cash instantly. You receive ₹15 deposit cash + ₹10 promo coins!' }
            ].map((item) => (
              <div key={item.step} className="bg-[#111116]/80 border border-white/5 p-4 rounded-xl flex gap-3.5 items-start shadow-md">
                <span className="w-6 h-6 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-neon-purple font-bold font-mono text-xs flex items-center justify-center shrink-0">
                  {item.step}
                </span>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wide">{item.title}</h5>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
