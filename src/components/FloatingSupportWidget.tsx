import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send } from 'lucide-react';

const OfficialWhatsAppLogo: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.451 5.416 1.453 5.485.002 9.948-4.461 9.95-9.95.002-2.66-1.033-5.161-2.908-7.04C17.228 1.776 14.73 .74 12.004.74 6.516.74 2.053 5.202 2.051 10.69c-.001 1.918.5 3.784 1.451 5.39l-.995 3.633 3.722-.975zm11.367-7.426c-.302-.15-1.785-.882-2.056-.98-.271-.1-.469-.15-.665.15-.196.3-.758.98-.93 1.18-.171.2-.343.224-.645.075-.302-.15-1.274-.469-2.427-1.496-.897-.8-1.502-1.788-1.678-2.088-.177-.3-.019-.462.132-.612.136-.135.302-.35.453-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.665-1.6-.91-2.187-.238-.57-.499-.491-.665-.5-.157-.007-.338-.008-.52-.008-.182 0-.478.068-.728.34-.25.271-.954.933-.954 2.274 0 1.341.975 2.637 1.111 2.82.136.183 1.918 2.929 4.646 4.108.649.28 1.156.447 1.55.572.652.207 1.246.177 1.715.107.523-.078 1.597-.653 1.821-1.282.224-.63.224-1.17.157-1.282-.068-.112-.25-.196-.552-.346z"/>
  </svg>
);

const OfficialTelegramLogo: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.53.26l.204-3.04 5.53-5.001c.24-.213-.054-.33-.373-.117L6.883 12.78l-2.94-.92c-.64-.201-.65-.64.135-.946l11.47-4.42c.53-.19.99.13.846.807z"/>
  </svg>
);

export const FloatingSupportWidget: React.FC = () => {
  const { contactWidgetSettings } = useGame();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  if (!contactWidgetSettings) return null;
  if (!contactWidgetSettings.widgetEnabled) return null;
  if (!contactWidgetSettings.whatsappLink && !contactWidgetSettings.telegramLink) return null;

  const isLeft = contactWidgetSettings.iconPosition === 'bottom-left';
  const positionClasses = isLeft 
    ? "left-4 bottom-[80px] md:left-5 md:bottom-[85px] lg:left-6 lg:bottom-[90px]"
    : "right-4 bottom-[80px] md:right-5 md:bottom-[85px] lg:right-6 lg:bottom-[90px]";

  const sizeMap = {
    small: { btn: '48px', icon: 'w-5 h-5' },
    medium: { btn: '56px', icon: 'w-6 h-6' },
    large: { btn: '64px', icon: 'w-7 h-7' }
  };
  const currentSize = sizeMap[contactWidgetSettings.iconSize || 'medium'] || sizeMap.medium;

  // Cache busting URL helper
  const getCacheBustedUrl = (url: string) => {
    if (!url) return '';
    const v = contactWidgetSettings.updatedAt || Date.now();
    return url.includes('?') ? `${url}&v=${v}` : `${url}?v=${v}`;
  };

  const whatsappIcon = contactWidgetSettings.whatsappIconUrl 
    ? getCacheBustedUrl(contactWidgetSettings.whatsappIconUrl) 
    : '';

  const telegramIcon = contactWidgetSettings.telegramIconUrl 
    ? getCacheBustedUrl(contactWidgetSettings.telegramIconUrl) 
    : '';

  return (
    <div className={`fixed z-[100] ${positionClasses}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`absolute bottom-[70px] ${isLeft ? 'left-0' : 'right-0'} w-[280px] sm:w-[320px] bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl`}
          >
            <div className="bg-gradient-to-r from-gold-600/20 to-purple-600/20 p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Premium Support</h3>
                <p className="text-[10px] text-neutral-400">Choose a platform to reach us</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {contactWidgetSettings.whatsappLink && (
                <a 
                  href={contactWidgetSettings.whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#25D366]/10 to-transparent hover:from-[#25D366]/20 border border-[#25D366]/20 hover:border-[#25D366]/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_0_15px_rgba(37,211,102,0.4)] group-hover:scale-110 transition-transform overflow-hidden">
                    {whatsappIcon ? (
                      <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-cover" />
                    ) : (
                      <OfficialWhatsAppLogo />
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">WhatsApp</h4>
                    <p className="text-[10px] text-[#25D366]">Fastest Response</p>
                  </div>
                </a>
              )}

              {contactWidgetSettings.telegramLink && (
                <a 
                  href={contactWidgetSettings.telegramLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#0088cc]/10 to-transparent hover:from-[#0088cc]/20 border border-[#0088cc]/20 hover:border-[#0088cc]/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center shadow-[0_0_15px_rgba(0,136,204,0.4)] group-hover:scale-110 transition-transform overflow-hidden">
                    {telegramIcon ? (
                      <img src={telegramIcon} alt="Telegram" className="w-full h-full object-cover" />
                    ) : (
                      <OfficialTelegramLogo />
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Telegram</h4>
                    <p className="text-[10px] text-[#0088cc]">Join our Community</p>
                  </div>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center font-bold outline-none border transition-colors backdrop-blur-md cursor-pointer rounded-full bg-[#0d0d14] border-gold-500/30 shadow-[0_8px_32px_rgba(229,169,25,0.2)]"
        style={{
          width: currentSize.btn,
          height: currentSize.btn,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        <div className="absolute inset-0 rounded-full blur-md opacity-50 pointer-events-none transition-opacity bg-gold-500/20" />
        {isOpen ? (
          <X className={`${currentSize.icon} text-gold-400 drop-shadow-[0_0_8px_rgba(229,169,25,0.8)] relative z-10`} />
        ) : (
          <MessageCircle className={`${currentSize.icon} text-gold-400 drop-shadow-[0_0_8px_rgba(229,169,25,0.8)] relative z-10`} />
        )}
      </motion.button>
    </div>
  );
};
