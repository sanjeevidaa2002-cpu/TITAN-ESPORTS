const fs = require('fs');
let code = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

// Add LoadingScreenSettings to GameContextType
code = code.replace(/brandingSettings: BrandingSettings;/g, "brandingSettings: BrandingSettings;\n  loadingScreenSettings: LoadingScreenSettings;\n  updateLoadingScreenSettings: (updates: Partial<LoadingScreenSettings>) => Promise<void>;");

// Add import
code = code.replace(/BrandingSettings, SplashBadge/g, "BrandingSettings, SplashBadge, LoadingScreenSettings");

fs.writeFileSync('src/context/GameContext.tsx', code);
