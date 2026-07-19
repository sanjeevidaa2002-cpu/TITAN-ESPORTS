const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileTab.tsx', 'utf8');

const regex = /\s*\{\/\* Admin Command Console \*\/\}\s*<div[\s\S]*?onClick=\{\(\) => onSwitchTab\('admin'\)\}[\s\S]*?<\/div>\s*<\/div>\s*<ChevronRight[\s\S]*?<\/div>/;
content = content.replace(regex, "");

fs.writeFileSync('src/components/ProfileTab.tsx', content);
