const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

content = content.replace(
  /Displays in orbital center when no main custom logo file is uploaded\./g,
  'Displays in orbital center when no main custom logo is linked.'
);
content = content.replace(
  /\* Custom uploaded mascot takes priority over preset icons\./g,
  '* Custom linked mascot takes priority over preset icons.'
);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
