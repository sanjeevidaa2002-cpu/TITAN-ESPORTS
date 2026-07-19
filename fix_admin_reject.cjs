const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const rejectLogic = `  const handleRejectTxn = async (txn: Transaction) => {
    try {
      const reason = prompt("Enter rejection reason:");
      if (reason === null) return; // cancelled
      
      await updateDoc(doc(db, 'transactions', txn.id), {
        status: 'cancelled',
        rejectionReason: reason || "No reason provided",
        cancelledBy: "Admin",
        cancelledAt: new Date().toISOString()
      });
      addAuditLog(\`Rejected request \${txn.id} for reason: \${reason}\`);
    } catch (err: any) {
      alert("Error rejecting: " + err.message);
    }
  };`;

code = code.replace(/const handleRejectTxn = async \(txn: Transaction\) => \{[\s\S]*?\};\n/m, rejectLogic + '\n');

const approveUpdate = `await updateDoc(doc(db, 'transactions', txn.id), {
          status: 'completed',
          completedBy: 'Admin',
          completedAt: new Date().toISOString()
        });`;

code = code.replace(/await updateDoc\(doc\(db, 'transactions', txn\.id\), \{\s*status: 'completed'\s*\}\);/g, approveUpdate);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
