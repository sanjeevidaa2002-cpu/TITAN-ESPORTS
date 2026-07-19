const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('accountStatus')) {
  content = content.replace("mobileNumber?: string;", "mobileNumber?: string;\n  accountStatus?: 'active' | 'disabled';\n  lastLogin?: string;");
  fs.writeFileSync('src/types.ts', content);
}
