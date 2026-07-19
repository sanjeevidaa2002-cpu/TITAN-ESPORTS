const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /  \}\);\n\s*\n\s*\n\s*\}\n  \}\);\n/g;

content = content.replace(regex, '  });\n');
fs.writeFileSync(file, content);
