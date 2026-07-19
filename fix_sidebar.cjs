const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The sidebar items use <span>...</span>. We need to wrap them in {!sidebarCollapsed && <span>...</span>}
const lines = content.split('\n');
let inSidebar = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5"')) {
    inSidebar = true;
  }
  if (inSidebar && lines[i].includes('</aside>')) {
    inSidebar = false;
  }

  if (inSidebar && lines[i].trim().startsWith('<span>') && lines[i].trim().endsWith('</span>')) {
    // Only wrap if it's not already wrapped
    if (!lines[i].includes('{!sidebarCollapsed &&')) {
       lines[i] = lines[i].replace(/<span>(.*?)<\/span>/, '{!sidebarCollapsed && <span>$1</span>}');
    }
  }
}

fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
