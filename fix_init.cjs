const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const imgUrl = 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png';

const targetEffect = `  // Sync state if backend updates
  useEffect(() => {
    if (brandingSettings) {
      setLocalSettings(prev => ({
        ...prev,
        ...brandingSettings
      }));
    }
  }, [brandingSettings]);`;

const replacementEffect = `  // Sync state if backend updates
  useEffect(() => {
    if (brandingSettings) {
      const merged = { ...brandingSettings };
      
      // Enforce the requested default image link
      const imgUrl = 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png';
      if (!merged.loadingMainLogo) merged.loadingMainLogo = imgUrl;
      if (!merged.loadingCenterLogo) merged.loadingCenterLogo = imgUrl;
      if (!merged.splashFallbackLogo) merged.splashFallbackLogo = imgUrl;

      setLocalSettings(prev => ({
        ...prev,
        ...merged
      }));
    }
  }, [brandingSettings]);`;

content = content.replace(targetEffect, replacementEffect);
fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
