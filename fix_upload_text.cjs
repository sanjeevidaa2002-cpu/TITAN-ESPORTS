const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');
content = content.replace(
  />Custom Image URL \/ File</g,
  '>Custom Image URL<'
);
content = content.replace(
  />Upload your own gaming logo, guild crest, or sponsor branding image\.</g,
  '>Link your own gaming logo, guild crest, or sponsor branding image.</'
);
content = content.replace(
  />Option B: Custom Mascot Upload</g,
  '>Option B: Custom Mascot URL<'
);
content = content.replace(
  /Upload Custom Mascot/g,
  'Link Custom Mascot'
);
fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
