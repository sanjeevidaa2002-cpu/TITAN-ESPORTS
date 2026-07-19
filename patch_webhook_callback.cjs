const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const targetWebhook = `      const isSuccess = status === "SUCCESS" || status === "success" || status === "COMPLETED";
      const txnRef = doc(db, "transactions", orderId);
      const txnSnap = await getDoc(txnRef);

      if (txnSnap.exists()) {
        const txnData = txnSnap.data();
        if (txnData.status === "pending") {
          // Update transaction state
          await setDoc(txnRef, {
            status: isSuccess ? "completed" : "failed",
            type: isSuccess ? "deposit_success" : "deposit_failed",
            description: isSuccess ? \`Auto Checkout completed via ZapUPI Gateway.\` : \`ZapUPI payment failed.\`
          }, { merge: true });

          if (isSuccess) {
            // Auto credit wallet balance
            const userRef = doc(db, "users", txnData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const u = userSnap.data();
              await setDoc(userRef, { depositBalance: (u.depositBalance || 0) + Number(amount) }, { merge: true });
            }

            // Real-time user app notification
            const notifyId = \`not_\${Date.now()}\`;
            await setDoc(doc(db, "notifications", notifyId), {
              id: notifyId,
              title: "ZapUPI Auto Credit Success! ⚡",
              message: \`₹\${amount} has been added automatically to your account balance.\`,
              type: "info",
              dateTime: new Date().toISOString(),
              isRead: false
            });
          }
        }
      }
      return res.json({ success: true, message: "Webhook processed successfully." });`;

const replacementWebhook = `      const isSuccess = status === "SUCCESS" || status === "success" || status === "COMPLETED";
      await processTransactionSafe(orderId, isSuccess, "ZapUPI", amount);
      return res.json({ success: true, message: "Webhook processed successfully." });`;

content = content.replace(targetWebhook, replacementWebhook);

const targetCallback = `        if (calculatedSignature === signature) {
          const txnRef = doc(db, "transactions", orderId as string);
          const txnSnap = await getDoc(txnRef);
          if (txnSnap.exists()) {
            const txnData = txnSnap.data();
            if (txnData.status === "pending") {
              await setDoc(txnRef, {
                status: isSuccess ? "completed" : "failed",
                type: isSuccess ? "deposit_success" : "deposit_failed",
                description: isSuccess ? \`Callback processed via ZapUPI Redirect.\` : \`ZapUPI Payment failed.\`
              }, { merge: true });

              if (isSuccess) {
                const userRef = doc(db, "users", txnData.userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const u = userSnap.data();
                  await setDoc(userRef, { depositBalance: (u.depositBalance || 0) + Number(amount) }, { merge: true });
                }

                const notifyId = \`not_\${Date.now()}\`;
                await setDoc(doc(db, "notifications", notifyId), {
                  id: notifyId,
                  title: "ZapUPI Payment Successful! 🌟",
                  message: \`₹\${amount} added automatically via Instant Gateway.\`,
                  type: "info",
                  dateTime: new Date().toISOString(),
                  isRead: false
                });
              }
            }
          }
        }`;

const replacementCallback = `        if (calculatedSignature === signature) {
          await processTransactionSafe(orderId as string, isSuccess, "ZapUPI", amount as string);
        }`;

content = content.replace(targetCallback, replacementCallback);
fs.writeFileSync(file, content);
