const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

// For the logo map loop
content = content.replace(
  /<span className="text-\[10px\] text-neutral-500 font-bold uppercase">OR<\/span>\s*<label className="px-2\.5 py-1\.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-\[10px\] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center gap-1">\s*<Upload className="w-3 h-3" \/>\s*Upload File\s*<input\s*type="file"\s*accept="image\/\*"\s*onChange=\{e => handleImageUpload\(e, item\.key as any\)\}\s*className="hidden"\s*\/>\s*<\/label>/g,
  ''
);

// For the fallback logo
content = content.replace(
  /<label className="w-full py-1\.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-\[10px\] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 border border-white\/5">\s*<Upload className="w-3\.5 h-3\.5" \/>\s*Upload Custom Mascot\s*<input\s*type="file"\s*accept="image\/\*"\s*onChange=\{e => handleImageUpload\(e, 'splashFallbackLogo'\)\}\s*className="hidden"\s*\/>\s*<\/label>/g,
  ''
);

// For the background image
content = content.replace(
  /<span className="text-xs text-neutral-500 font-bold uppercase">OR<\/span>\s*<label className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1">\s*<Upload className="w-4 h-4" \/>\s*Upload Background Image\s*<input\s*type="file"\s*accept="image\/\*"\s*onChange=\{e => handleImageUpload\(e, 'splashBgImage'\)\}\s*className="hidden"\s*\/>\s*<\/label>/g,
  ''
);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
