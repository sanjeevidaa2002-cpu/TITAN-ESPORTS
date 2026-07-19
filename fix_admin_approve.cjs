const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

code = code.replace(
  /status:\s*'completed'/g,
  "status: 'completed'"
);

// We need to ensure that the balance is credited correctly.
// Let's check handleApproveTxn.
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
