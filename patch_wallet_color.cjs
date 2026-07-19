const fs = require('fs');
let content = fs.readFileSync('src/components/WalletTab.tsx', 'utf8');

content = content.replace(
  /type === 'bonus_coins'\) return 'text-green-400';/,
  "type === 'bonus_coins' || type === 'deposit_bonus') return 'text-green-400';"
);

fs.writeFileSync('src/components/WalletTab.tsx', content);
