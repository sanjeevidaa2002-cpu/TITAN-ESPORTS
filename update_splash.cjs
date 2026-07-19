const fs = require('fs');
let content = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

// Replace the single displayLogoUrl with three
content = content.replace(
  "const displayLogoUrl = brandingSettings?.loadingCenterLogo || brandingSettings?.loadingCenterLogoUrl || brandingSettings?.loadingMainLogo || brandingSettings?.splashLogo || brandingSettings?.loadingLogo || brandingSettings?.splashFallbackLogo;",
  `const logo1 = brandingSettings?.loadingMainLogo;
  const logo2 = brandingSettings?.loadingCenterLogo || brandingSettings?.loadingCenterLogoUrl || brandingSettings?.splashLogo || brandingSettings?.splashFallbackLogo;
  const logo3 = brandingSettings?.loadingLogo;
  const displayLogoUrl = logo2;`
);

// Add Logo 1 above Animated Orbits
content = content.replace(
  "{/* Animated Orbits & Titan Logo Container */}",
  `{/* Logo 1 - Top Position */}
        {logo1 && (
          <motion.div className="mb-6 h-16 flex items-center justify-center">
            <img src={getCacheBustedUrl(logo1)} alt="Loading Logo 1" className="h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          </motion.div>
        )}
        
        {/* Animated Orbits & Titan Logo Container */}`
);

// Add Logo 3 above Progress Bar
content = content.replace(
  "{/* Loading progress bar */}",
  `{/* Logo 3 - Bottom Position */}
        {logo3 && (
          <div className="mt-2 mb-6 h-12 flex items-center justify-center">
            <img src={getCacheBustedUrl(logo3)} alt="Loading Logo 3" className="h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          </div>
        )}
        
        {/* Loading progress bar */}`
);

fs.writeFileSync('src/components/SplashScreen.tsx', content);
