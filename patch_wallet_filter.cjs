const fs = require('fs');
let content = fs.readFileSync('src/components/WalletTab.tsx', 'utf8');

content = content.replace(
  /return t\.type === 'deposit_success' \|\| t\.type === 'deposit_request';/,
  "return t.type === 'deposit_success' || t.type === 'deposit_request' || t.type === 'deposit_bonus' || t.type === 'referral_bonus';"
);

fs.writeFileSync('src/components/WalletTab.tsx', content);
