const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/res\.send\(\\\`/g, 'res.send(`');
code = code.replace(/\\\`\);/g, '`);');

fs.writeFileSync('server.ts', code);
