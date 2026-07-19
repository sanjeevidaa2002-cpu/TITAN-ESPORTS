import React from 'react';
import { useGame } from '../context/GameContext';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';

interface SupportProps {
  onBack: () => void;
}

export const Support: React.FC<SupportProps> = ({ onBack }) => {
  const { supportSettings } = useGame();

  return (
    <div id="support_tab_root" className="space-y-6 pb-24 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 bg-[#111116] border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Help & Support Channels</h2>
      </div>

      <div className="bg-[#111116] border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col min-h-[400px] max-w-3xl mx-auto mt-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider font-display">Premium Support</h2>
          <p className="text-sm text-neutral-400 mt-2 font-sans">Reach out directly via our official channels.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
          {supportSettings?.whatsappStatus && supportSettings.whatsappLink && (
            <a href={supportSettings.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-gradient-to-b from-[#25D366]/10 to-transparent hover:from-[#25D366]/20 border border-[#25D366]/20 hover:border-[#25D366]/50 transition-all group">
              <div className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] group-hover:scale-110 transition-transform">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h4 className="text-white font-black text-xl uppercase tracking-wider">WhatsApp</h4>
                <p className="text-sm text-[#25D366] mt-1">Fastest Response</p>
              </div>
            </a>
          )}
          
          {supportSettings?.telegramStatus && supportSettings.telegramLink && (
            <a href={supportSettings.telegramLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-gradient-to-b from-[#0088cc]/10 to-transparent hover:from-[#0088cc]/20 border border-[#0088cc]/20 hover:border-[#0088cc]/50 transition-all group">
              <div className="w-16 h-16 rounded-full bg-[#0088cc] flex items-center justify-center shadow-[0_0_20px_rgba(0,136,204,0.4)] group-hover:scale-110 transition-transform">
                <Send className="w-8 h-8 text-white -ml-1" />
              </div>
              <div className="text-center">
                <h4 className="text-white font-black text-xl uppercase tracking-wider">Telegram</h4>
                <p className="text-sm text-[#0088cc] mt-1">Join our Community</p>
              </div>
            </a>
          )}
        </div>
        
        {(!supportSettings?.whatsappStatus && !supportSettings?.telegramStatus) && (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-neutral-500" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Support Channels Offline</h4>
                <p className="text-neutral-500 text-sm mt-1">Our support channels are currently being updated.</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
