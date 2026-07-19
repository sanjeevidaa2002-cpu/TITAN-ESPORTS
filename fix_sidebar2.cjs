const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const lines = content.split('\n');
let inSidebar = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<aside')) {
    inSidebar = true;
  }
  if (inSidebar && lines[i].includes('</aside>')) {
    inSidebar = false;
  }

  if (inSidebar && lines[i].includes('<span>') && lines[i].includes('</span>')) {
    if (!lines[i].includes('{!sidebarCollapsed &&')) {
       lines[i] = lines[i].replace(/<span>(.*?)<\/span>/, '{!sidebarCollapsed && <span>$1</span>}');
    }
  }
}

fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
