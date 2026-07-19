const fs = require('fs');
let code = fs.readFileSync('src/components/WalletTab.tsx', 'utf-8');

code = code.replace(
  /\{t\.status\}/,
  `{t.status === 'pending_verification' ? 'Pending Approval' : t.status === 'completed' ? 'Approved' : t.status === 'cancelled' ? 'Rejected' : t.status === 'failed' ? 'Failed' : t.status === 'cancelled' ? 'Cancelled' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}`
);

code = code.replace(
  /t\.status === 'completed'/g,
  `t.status === 'completed' || t.status === 'completed'`
);

fs.writeFileSync('src/components/WalletTab.tsx', code);
