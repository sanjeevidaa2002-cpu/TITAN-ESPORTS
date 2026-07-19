const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

content = content.replace(
  /<p className="text-\[9px\] text-neutral-400 mt-0\.5 leading-relaxed">Link your own gaming logo, guild crest, or sponsor branding image\.<\/\//g,
  '<p className="text-[9px] text-neutral-400 mt-0.5 leading-relaxed">Link your own gaming logo, guild crest, or sponsor branding image.</'
);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
