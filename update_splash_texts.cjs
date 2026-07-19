const fs = require('fs');
let content = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

// Add Website Name display
content = content.replace(
  "{/* Logo 1 - Top Position */}",
  `{/* Website Name */}
        {brandingSettings?.splashWebsiteName && (
          <div className="mb-4 text-xs tracking-[0.3em] font-black uppercase text-white/50">
            {brandingSettings.splashWebsiteName}
          </div>
        )}
        
        {/* Logo 1 - Top Position */}`
);

// Fix title logic to prioritize individual titles if available, or just render what we have.
// Right now it says `const fullTitle = brandingSettings?.loadingTitle || ...`
// Let's modify it to be exactly what Admin Panel sets.
content = content.replace(
  "const fullTitle = brandingSettings?.loadingTitle || `${brandingSettings?.splashMainTitle || 'TITAN'} ${brandingSettings?.splashSecondaryTitle || 'ESP'}`;",
  `const mainTitle = brandingSettings?.splashMainTitle || brandingSettings?.loadingTitle || 'TITAN';
  const secondaryTitle = brandingSettings?.splashSecondaryTitle || 'ESP';`
);

content = content.replace(
  "const titleWords = fullTitle.trim().split(' ');",
  `// titleWords logic removed`
);
content = content.replace(
  "const mainTitle = titleWords[0] || 'TITAN';",
  `// mainTitle declared above`
);
content = content.replace(
  "const secondaryTitle = titleWords.slice(1).join(' ') || '';",
  `// secondaryTitle declared above`
);

fs.writeFileSync('src/components/SplashScreen.tsx', content);
