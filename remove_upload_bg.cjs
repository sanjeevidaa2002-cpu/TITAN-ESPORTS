const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');
content = content.replace(
  /<span className="text-\[10px\] text-neutral-500 font-black text-center uppercase">OR<\/span>\s*<label className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1">\s*<Upload className="w-4 h-4" \/>\s*Upload Background Image File\s*<input\s*type="file"\s*accept="image\/\*"\s*onChange=\{e => handleImageUpload\(e, 'splashBgImage'\)\}\s*className="hidden"\s*\/>\s*<\/label>/g,
  ''
);
fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
