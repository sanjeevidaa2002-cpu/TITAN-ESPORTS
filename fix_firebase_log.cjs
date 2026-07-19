const fs = require('fs');
let content = fs.readFileSync('src/firebase.ts', 'utf8');
content = content.replace(/setLogLevel\('error'\);/, "setLogLevel('silent');");
fs.writeFileSync('src/firebase.ts', content);
