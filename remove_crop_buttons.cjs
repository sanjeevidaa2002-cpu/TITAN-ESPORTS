const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

// For the logo map loop
content = content.replace(
  /<button\s*onClick=\{([^}]*)\}\s*className="px-1\.5 py-0\.5 bg-purple-950 text-purple-400 border border-purple-500\/20 text-\[9px\] font-extrabold uppercase rounded hover:bg-purple-900"\s*title="Crop image to standard square crop ratio automatically"\s*>\s*Crop Square\s*<\/button>/g,
  ''
);

// For the splashFallbackLogo
content = content.replace(
  /<button\s*type="button"\s*onClick=\{([^}]*)\}\s*className="px-1 py-0\.5 bg-purple-950 text-purple-400 border border-purple-500\/20 text-\[8px\] font-extrabold uppercase rounded hover:bg-purple-900"\s*title="Crop image to square"\s*>\s*Crop\s*<\/button>/g,
  ''
);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
