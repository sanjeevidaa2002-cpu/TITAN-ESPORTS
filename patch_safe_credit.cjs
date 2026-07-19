const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const safeCreditFunc = `
async function processTransactionSafe(orderId, isSuccess, method, amount) {
  try {
    const txnRef = doc(db, "transactions", orderId);
    await runTransaction(db, async (transaction) => {
      const txnSnap = await transaction.get(txnRef);
      if (!txnSnap.exists()) return;
      const txnData = txnSnap.data();
      
      if (txnData.status !== "pending") {
        return; // Already processed
      }

      transaction.update(txnRef, {
        status: isSuccess ? "completed" : "failed",
        type: isSuccess ? "deposit_success" : "deposit_failed",
        description: isSuccess ? \`Auto processed via \${method} API.\` : \`\${method} Payment failed.\`
      });

      if (isSuccess && txnData.userId) {
        const userRef = doc(db, "users", txnData.userId);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          transaction.update(userRef, { depositBalance: (u.depositBalance || 0) + Number(amount) });
        }
      }
    });
    return true;
  } catch (error) {
    console.error("Error in safe transaction processing:", error);
    return false;
  }
}
`;

if (!content.includes('processTransactionSafe')) {
  // insert before ZapUPI Webhook
  content = content.replace(
    '  // ZapUPI API Webhook handling (Auto Callback support with signature validation)',
    safeCreditFunc + '\n  // ZapUPI API Webhook handling (Auto Callback support with signature validation)'
  );
  fs.writeFileSync(file, content);
}
