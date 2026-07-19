const fs = require('fs');
let code = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

code = code.replace(/\\\`loading_screens\/\$\\{Date\.now\(\)\}_\\\$\\{file\.name\\}\\\`/, 
  "\`loading_screens/\${Date.now()}_\${file.name}\`");

fs.writeFileSync('src/components/LoadingPageManager.tsx', code);
