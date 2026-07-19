const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Reverse the bad replacement
content = content.replace(
  /\{\!sidebarCollapsed && <span(.*?)>([\s\S]*?)<\/span>\}/g,
  '<span$1>$2</span>'
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
