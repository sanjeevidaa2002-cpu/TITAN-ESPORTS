const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStatus = `            const isSuccess = verifyResult.status === "completed";
            await setDoc(txnRef, {
              status: isSuccess ? "completed" : "failed",
              type: isSuccess ? "deposit_success" : "deposit_failed",
              description: isSuccess ? \`Auto checked via ZapUPI API.\` : \`ZapUPI Payment failed.\`
            }, { merge: true });
            if (isSuccess) {
              const userRef = doc(db, "users", txnData.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const u = userSnap.data();
                await setDoc(userRef, { depositBalance: (u.depositBalance || 0) + Number(txnData.amount) }, { merge: true });
              }
            }`;

const replacementStatus = `            const isSuccess = verifyResult.status === "completed";
            await processTransactionSafe(orderId, isSuccess, "ZapUPI", txnData.amount);`;

content = content.replace(targetStatus, replacementStatus);
fs.writeFileSync(file, content);
