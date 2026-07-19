const fs = require('fs');
const content = fs.readFileSync('src/components/FloatingSupportWidget.tsx', 'utf8');

const newContent = `import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, HelpCircle, Phone, HeadphonesIcon, LifeBuoy } from 'lucide-react';

const IconMap: any = {
  'message-circle': MessageCircle,
  'help-circle': HelpCircle,
  'phone': Phone,
  'headphones': HeadphonesIcon,
  'life-buoy': LifeBuoy
};

export const FloatingSupportWidget: React.FC = () => {
  const { supportSettings, currentUser } = useGame();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Screen size check
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Auto close timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && supportSettings?.floatingAutoCloseTimer && supportSettings.floatingAutoCloseTimer > 0) {
      timer = setTimeout(() => {
        setIsOpen(false);
      }, supportSettings.floatingAutoCloseTimer * 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, supportSettings?.floatingAutoCloseTimer]);

  if (!supportSettings) return null;
  if (!supportSettings.widgetEnabled) return null;
  if (!supportSettings.whatsappEnabled && !supportSettings.telegramEnabled) return null;

  const size = deviceType === 'mobile' ? supportSettings.floatingSizeMobile : supportSettings.floatingSizeDesktop;
  const iconSize = deviceType === 'mobile' ? supportSettings.iconSizeMobile : supportSettings.iconSizeDesktop;

  const handleClick = (e: React.MouseEvent) => {
    setIsOpen(!isOpen);
  };

  // Fixed at bottom right
  const menuOrigin = 'bottom right';
  const menuPosition = {
    bottom: size + 16,
    right: 0
  };

  // Parse animations from strings (for simplicity)
  const openAnimMap: any = {
    'bounce': { y: [20, -10, 0], opacity: [0, 1] },
    'fade': { opacity: [0, 1] },
    'slide': { y: [50, 0], opacity: [0, 1] },
    'scale': { scale: [0, 1], opacity: [0, 1] }
  };

  const closeAnimMap: any = {
    'fade': { opacity: 0 },
    'slide': { y: 50, opacity: 0 },
    'scale': { scale: 0, opacity: 0 }
  };

  const menuVariants = {
    hidden: closeAnimMap[supportSettings.floatingCloseAnimation] || { opacity: 0, scale: 0.8 },
    visible: openAnimMap[supportSettings.floatingOpenAnimation] || { opacity: 1, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } }
  };
  
  const floatingAnim = supportSettings.floatingAnimation && !isOpen
    ? { y: [-5, 5] }
    : {};
    
  const currentScale = (supportSettings.hoverAnimation && isHovered) ? 1.05 : 1;

  return (
    <div 
      className="fixed z-[100] right-4 bottom-[80px] md:right-5 md:bottom-[85px] lg:right-6 lg:bottom-[90px]"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants}
            className="absolute w-64 md:w-72 flex flex-col gap-3"
            style={{
              ...menuPosition,
              transformOrigin: menuOrigin
            }}
          >
            {supportSettings.whatsappEnabled && (
              <a 
                href={supportSettings.whatsappGroupLink || supportSettings.whatsappCommunityLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 hover:border-green-500/50 shadow-2xl hover:shadow-green-500/20 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0 bg-green-500/10 flex items-center justify-center p-2 group-hover:bg-green-500/20 transition-colors">
                  {supportSettings.whatsappCustomLogo ? (
                     <img src={supportSettings.whatsappCustomLogo} alt="WhatsApp" className="w-full h-full object-contain" />
                  ) : (
                     <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-full h-full object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider truncate">{supportSettings.whatsappButtonTitle}</h4>
                  <p className="text-neutral-400 text-[10px] uppercase truncate mt-0.5">{supportSettings.whatsappButtonDescription}</p>
                </div>
              </a>
            )}

            {supportSettings.telegramEnabled && (
              <a 
                href={supportSettings.telegramGroupLink || supportSettings.telegramChannelLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 shadow-2xl hover:shadow-blue-500/20 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0 bg-blue-500/10 flex items-center justify-center p-2 group-hover:bg-blue-500/20 transition-colors">
                  {supportSettings.telegramCustomLogo ? (
                     <img src={supportSettings.telegramCustomLogo} alt="Telegram" className="w-full h-full object-contain" />
                  ) : (
                     <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-full h-full object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider truncate">{supportSettings.telegramButtonTitle}</h4>
                  <p className="text-neutral-400 text-[10px] uppercase truncate mt-0.5">{supportSettings.telegramButtonDescription}</p>
                </div>
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={floatingAnim}
        transition={{
          y: {
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }
        }}
        className="relative flex items-center justify-center font-bold outline-none border transition-colors backdrop-blur-md cursor-pointer"
        style={{
          width: \`\${size}px\`,
          height: \`\${size}px\`,
          borderRadius: \`\${supportSettings.floatingBorderRadius}%\`,
          backgroundColor: supportSettings.floatingBgColor,
          borderColor: supportSettings.floatingBorderColor,
          boxShadow: supportSettings.floatingShadow,
          opacity: supportSettings.floatingOpacity,
          transform: \`scale(\${currentScale})\`
        }}
      >
        {/* Pulse effect */}
        {supportSettings.pulseAnimation && !isOpen && (
           <div 
             className="absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none" 
             style={{ 
               backgroundColor: supportSettings.floatingBgColor,
              animationDuration: '3s'
            }}
            />
        )}
        
        {/* Glow effect */}
        {supportSettings.floatingGlowEffect && (
          <div 
             className="absolute inset-0 rounded-full blur-md opacity-50 pointer-events-none transition-opacity" 
             style={{ 
               backgroundColor: supportSettings.floatingBgColor,
              opacity: isHovered || isOpen ? 0.8 : 0.5
            }}
            />
        )}
        
        {isOpen ? (
          <X style={{ width: iconSize, height: iconSize }} className="text-gold-400 drop-shadow-[0_0_8px_rgba(229,169,25,0.8)] relative z-10" />
        ) : (
          (() => {
            const IconComponent = IconMap[supportSettings.floatingIcon] || MessageCircle;
            return <IconComponent style={{ width: iconSize, height: iconSize }} className="text-gold-400 drop-shadow-[0_0_8px_rgba(229,169,25,0.8)] relative z-10" />;
          })()
        )}
      </motion.button>
    </div>
  );
};
`;

fs.writeFileSync('src/components/FloatingSupportWidget.tsx', newContent);
