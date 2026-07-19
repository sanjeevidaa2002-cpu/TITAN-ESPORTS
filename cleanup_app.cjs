const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/function AdminAuthGuard[\s\S]*?function AdminApp\(\) \{[\s\S]*?\}\n/, "");
fs.writeFileSync('src/App.tsx', content);
