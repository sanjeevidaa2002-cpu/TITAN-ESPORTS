const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

// Replace the static preview logo logic with the new 3-logo logic
content = content.replace(
  "{/* Orbital mascot and ring */}",
  `{/* Website Name */}
                {localSettings.splashWebsiteName && (
                  <div className="mb-4 text-xs tracking-[0.3em] font-black uppercase text-white/50">
                    {localSettings.splashWebsiteName}
                  </div>
                )}
                
                {/* Logo 1 - Top Position */}
                {localSettings.loadingMainLogo && (
                  <motion.div className="mb-6 h-16 flex items-center justify-center">
                    <img src={localSettings.loadingMainLogo} alt="Loading Logo 1" className="h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                  </motion.div>
                )}
                
                {/* Orbital mascot and ring */}`
);

// We need to fix the title words rendering as well in the preview
const titlePreviewTarget = `                {/* Text Layout */}
                <motion.div 
                  className="mb-6"
                  {...getTextAnimationProps()}
                >
                  <div className="flex flex-wrap items-center justify-center gap-2 font-extrabold tracking-widest text-3xl md:text-4xl drop-shadow-lg mb-1.5 uppercase font-sans">
                    <span style={{ color: localSettings.splashMainTitleColor || '#e5a919' }}>
                      {localSettings.loadingTitle ? localSettings.loadingTitle.split(' ')[0] : (localSettings.splashMainTitle || 'TITAN')}
                    </span>
                    <span style={{ color: localSettings.splashSecondaryTitleColor || '#ffffff' }}>
                      {localSettings.loadingTitle ? localSettings.loadingTitle.split(' ').slice(1).join(' ') : (localSettings.splashSecondaryTitle || 'ESP')}
                    </span>
                  </div>`;

const titlePreviewReplacement = `                {/* Text Layout */}
                <motion.div 
                  className="mb-6"
                  {...getTextAnimationProps()}
                >
                  <div className="flex flex-wrap items-center justify-center gap-2 font-extrabold tracking-widest text-3xl md:text-4xl drop-shadow-lg mb-1.5 uppercase font-sans">
                    <span style={{ color: localSettings.splashMainTitleColor || '#e5a919' }}>
                      {localSettings.splashMainTitle || localSettings.loadingTitle || 'TITAN'}
                    </span>
                    <span style={{ color: localSettings.splashSecondaryTitleColor || '#ffffff' }}>
                      {localSettings.splashSecondaryTitle || 'ESP'}
                    </span>
                  </div>`;
content = content.replace(titlePreviewTarget, titlePreviewReplacement);

const logo3PreviewTarget = `{/* Loading Text and Percentage Indicator */}`;
const logo3PreviewReplacement = `{/* Logo 3 - Bottom Position */}
                {localSettings.loadingLogo && (
                  <div className="mt-2 mb-6 h-12 flex items-center justify-center">
                    <img src={localSettings.loadingLogo} alt="Loading Logo 3" className="h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                  </div>
                )}
                
                {/* Loading Text and Percentage Indicator */}`;
content = content.replace(logo3PreviewTarget, logo3PreviewReplacement);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
