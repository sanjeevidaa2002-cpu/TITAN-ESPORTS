const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /const userUpdates = \{ depositBalance: newDepositWallet, bonusBalance: newUserBonusWallet \};/g,
  "const userUpdates: any = { depositBalance: newDepositWallet, bonusBalance: newUserBonusWallet };"
);

content = content.replace(
  /app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{/g,
  "app.listen(Number(PORT), \"0.0.0.0\", () => {"
);

fs.writeFileSync('server.ts', content);
