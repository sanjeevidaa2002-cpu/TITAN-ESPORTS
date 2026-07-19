const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const declarations = `
  const mainTitle = loadingScreenSettings?.loadingTitle || 'TITAN ESPORTS';
  const secondaryTitle = loadingScreenSettings?.loadingSubtitle || 'PREMIUM GAMING';
  const loadingText = loadingScreenSettings?.loadingText || 'INITIALIZING SYSTEM';
`;

code = code.replace(/const showAnimation = loadingScreenSettings\?.animationEnabled !== false;/, 
  "const showAnimation = loadingScreenSettings?.animationEnabled !== false;\n" + declarations);

fs.writeFileSync('src/components/SplashScreen.tsx', code);
