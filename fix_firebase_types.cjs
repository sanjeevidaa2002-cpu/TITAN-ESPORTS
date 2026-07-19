const fs = require('fs');
let content = fs.readFileSync('src/firebase.ts', 'utf8');
content = '/// <reference types="vite/client" />\n' + content;
fs.writeFileSync('src/firebase.ts', content);
