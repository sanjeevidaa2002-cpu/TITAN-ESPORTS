const fs = require('fs');
let content = fs.readFileSync('src/components/WalletTab.tsx', 'utf8');

if (!content.includes("case 'deposit_bonus':")) {
  content = content.replace(
    /case 'bonus_coins': return 'Promotional Registration Bonus';/,
    "case 'bonus_coins': return 'Promotional Registration Bonus';\n      case 'deposit_bonus': return 'Deposit Extra Bonus';"
  );
}

fs.writeFileSync('src/components/WalletTab.tsx', content);
