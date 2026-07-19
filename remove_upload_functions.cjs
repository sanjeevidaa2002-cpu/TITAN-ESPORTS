const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const regex = /\/\/ Canvas-based image compression.*?\};\s*\/\/ Center Crop to Square feature/s;
content = content.replace(regex, '// Center Crop to Square feature');

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
