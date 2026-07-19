const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

content = content.replace(
  /const customUrl = localSettings\.splashLogo \|\| localSettings\.splashFallbackLogo;/g,
  `const customUrl = localSettings.loadingCenterLogo || localSettings.splashLogo || localSettings.splashFallbackLogo;`
);

content = content.replace(
  /const logoType = localSettings\.splashLogoType \|\| \(localSettings\.splashFallbackLogo \|\| localSettings\.splashLogo \? 'custom' : 'titan'\);/g,
  `const logoType = localSettings.splashLogoType || (localSettings.loadingCenterLogo || localSettings.splashFallbackLogo || localSettings.splashLogo ? 'custom' : 'titan');`
);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
