const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

code = code.replace(
  /if \(txn\.type === 'deposit_request'\) \{/g,
  "if (txn.type === 'deposit_request' || txn.type === 'deposit_success') {"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
