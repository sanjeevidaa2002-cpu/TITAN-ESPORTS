const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const regex = /\/\/ Center Crop to Square feature.*?\}\s*\};\s*\/\/ Generic Field Handler/s;
content = content.replace(regex, '// Generic Field Handler');

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
