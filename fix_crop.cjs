const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const regex = /\/\/ Center Crop to Square feature.*?\}\s*\};\s*\};/s;
content = content.replace(regex, '');

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
