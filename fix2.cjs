const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /  \}\n      \}\n  \}\);\n  \/\/ ==========================================\n  \/\/ API ENDPOINTS FOR YOUTUBE SYSTEM\n      \}\n  \}\);\n  \/\/ ==========================================/g;

const replacement = `  }
  // ==========================================
  // API ENDPOINTS FOR YOUTUBE SYSTEM
  // ==========================================`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
