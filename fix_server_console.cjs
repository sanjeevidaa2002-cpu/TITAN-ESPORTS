const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/console\.\(\);/g, 'console.error("An error occurred");');

fs.writeFileSync(filePath, content);
