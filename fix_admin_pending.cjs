const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

code = code.replace(
  /const pendingDeposits = dbTransactions\.filter\(t => t\.type === 'deposit_request' && t\.status === 'pending'\);/,
  "const pendingDeposits = dbTransactions.filter(t => (t.type === 'deposit_request' || t.type === 'deposit_success') && (t.status === 'pending' || t.status === 'pending_verification'));"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
