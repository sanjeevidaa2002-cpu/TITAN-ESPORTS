const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

code = code.replace(
  /const handleApproveTxn = async \(txn: Transaction\) => \{/,
  `const handleApproveTxn = async (txn: Transaction) => {
    if (txn.status === 'completed' || txn.status === 'completed' || txn.status === 'cancelled' || txn.status === 'failed' || txn.status === 'cancelled') {
      alert("This transaction has already been processed!");
      return;
    }`
);

code = code.replace(
  /const handleRejectTxn = async \(txn: Transaction\) => \{/,
  `const handleRejectTxn = async (txn: Transaction) => {
    if (txn.status === 'completed' || txn.status === 'completed' || txn.status === 'cancelled' || txn.status === 'failed' || txn.status === 'cancelled') {
      alert("This transaction has already been processed!");
      return;
    }`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
