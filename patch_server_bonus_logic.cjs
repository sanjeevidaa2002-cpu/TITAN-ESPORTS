const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetFunction = `  app.post("/api/admin/payments/complete", async (req, res) => {`;
const replaceWith = `  app.post("/api/admin/payments/complete", async (req, res) => {
    try {
      const { transactionId, admin } = req.body;
      if (!transactionId) {
        return res.status(400).json({ success: false, message: "Transaction ID is required." });
      }

      // Pre-fetch transaction and user to find referrer if needed
      const txnSnap_pre = await getDoc(doc(db, 'transactions', transactionId));
      if (!txnSnap_pre.exists()) {
        return res.status(404).json({ success: false, message: "Transaction not found." });
      }
      const txnData_pre = txnSnap_pre.data();
      const userSnap_pre = await getDoc(doc(db, 'users', txnData_pre.userId));
      const userData_pre = userSnap_pre.exists() ? userSnap_pre.data() : null;

      let referrerRef = null;
      let referrerData = null;
      if (userData_pre && userData_pre.referredBy && !userData_pre.referralBonusAwarded) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('referralCode', '==', userData_pre.referredBy));
        const qs = await getDocs(q);
        if (!qs.empty) {
          referrerRef = doc(db, 'users', qs.docs[0].id);
        }
      }

      const bonusSnap = await getDoc(doc(db, 'appSettings', 'bonus'));
      const bonusSettings = bonusSnap.exists() ? bonusSnap.data() : null;

      await runTransaction(db, async (t) => {
        const txnRef = doc(db, 'transactions', transactionId);
        const txnDoc = await t.get(txnRef);
        if (!txnDoc.exists()) throw new Error("Transaction not found.");
        const txnData = txnDoc.data();
        if (txnData.status !== 'pending_verification' && txnData.status !== 'pending') {
          throw new Error(\`Transaction is not pending. Current status: \${txnData.status}\`);
        }

        const userRef = doc(db, 'users', txnData.userId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found.");
        const userData = userDoc.data();

        let referrerDoc = null;
        if (referrerRef) {
          referrerDoc = await t.get(referrerRef);
        }

        const currentDepositWallet = userData.depositBalance || 0;
        const currentBonusWallet = userData.bonusBalance || 0;
        const amt = txnData.amount || 0;

        let depositBonus = 0;
        let refUserBonus = 0;
        let refReferrerBonus = 0;
        let isReferralAwarded = false;

        if (bonusSettings) {
          if (bonusSettings.depositBonusEnabled) {
            const minDep = bonusSettings.minimumDeposit || 0;
            const maxDep = bonusSettings.maximumDeposit || 0;
            if (amt >= minDep && (maxDep === 0 || amt <= maxDep)) {
              if (bonusSettings.depositBonusType === 'percentage') {
                let calc = (amt * (bonusSettings.depositBonusValue || 0)) / 100;
                if (bonusSettings.maximumBonus && calc > bonusSettings.maximumBonus) calc = bonusSettings.maximumBonus;
                depositBonus = calc;
              } else {
                depositBonus = bonusSettings.depositBonusValue || 0;
              }
            }
          }

          if (bonusSettings.referralBonusEnabled && userData.referredBy && !userData.referralBonusAwarded && referrerDoc && referrerDoc.exists()) {
            const minRefDep = bonusSettings.minimumReferralDeposit || 0;
            if (amt >= minRefDep) {
              refUserBonus = bonusSettings.referredUserBonusAmount || 0;
              refReferrerBonus = bonusSettings.referrerBonusAmount || 0;
              isReferralAwarded = true;
            }
          }
        }

        const newDepositWallet = currentDepositWallet + amt;
        const newUserBonusWallet = currentBonusWallet + depositBonus + refUserBonus;

        t.update(txnRef, {
          status: 'completed',
          completedBy: admin || 'Admin',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        const userUpdates = { depositBalance: newDepositWallet, bonusBalance: newUserBonusWallet };
        if (isReferralAwarded) userUpdates.referralBonusAwarded = true;
        t.update(userRef, userUpdates);

        const timestamp = new Date().toISOString();

        if (depositBonus > 0) {
          const dbId = \`bonus_\${Date.now()}_1\`;
          t.set(doc(db, 'bonus_history', dbId), {
            id: dbId, userId: txnData.userId, userName: userData.nickname || 'User',
            bonusType: 'deposit_bonus', depositAmount: amt, bonusAmount: depositBonus,
            status: 'completed', createdAt: timestamp
          });
          const txId = \`txn_\${Date.now()}_1\`;
          t.set(doc(db, 'transactions', txId), {
            id: txId, userId: txnData.userId, amount: depositBonus, type: 'deposit_bonus',
            paymentMethod: 'System', dateTime: timestamp, status: 'completed', description: 'Deposit Bonus Credited'
          });
        }

        if (isReferralAwarded) {
          const uRefId = \`bonus_\${Date.now()}_2\`;
          t.set(doc(db, 'bonus_history', uRefId), {
            id: uRefId, userId: txnData.userId, userName: userData.nickname || 'User',
            bonusType: 'referral_bonus', referralCode: userData.referredBy, bonusAmount: refUserBonus,
            status: 'completed', createdAt: timestamp
          });
          const txId2 = \`txn_\${Date.now()}_2\`;
          t.set(doc(db, 'transactions', txId2), {
            id: txId2, userId: txnData.userId, amount: refUserBonus, type: 'referral_bonus',
            paymentMethod: 'System', dateTime: timestamp, status: 'completed', description: 'Signup Referral Bonus'
          });

          const rRefId = \`bonus_\${Date.now()}_3\`;
          const rData = referrerDoc.data();
          t.set(doc(db, 'bonus_history', rRefId), {
            id: rRefId, userId: referrerDoc.id, userName: rData.nickname || 'User',
            bonusType: 'referral_bonus', referralCode: userData.referredBy, bonusAmount: refReferrerBonus,
            status: 'completed', createdAt: timestamp
          });
          const txId3 = \`txn_\${Date.now()}_3\`;
          t.set(doc(db, 'transactions', txId3), {
            id: txId3, userId: referrerDoc.id, amount: refReferrerBonus, type: 'referral_bonus',
            paymentMethod: 'System', dateTime: timestamp, status: 'completed', description: \`Referral Bonus (from \${userData.nickname || 'User'})\`
          });
          t.update(referrerRef, { bonusBalance: (rData.bonusBalance || 0) + refReferrerBonus });
        }

        const notifyId = \`not_\${Date.now()}\`;
        t.set(doc(db, "notifications", notifyId), {
          id: notifyId, userId: txnData.userId, title: "Payment Approved ✅",
          message: \`Your payment of ₹\${amt} has been verified and your wallet has been credited successfully.\`,
          type: "success", dateTime: timestamp, isRead: false
        });
      });

      res.json({ success: true, message: "Payment completed and wallet credited." });
    } catch (err: any) {
      console.error("Payment complete error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Old code backup boundary (delete everything until app.post("/api/admin/payments/cancel")`;

const oldEndpointRegex = /app\.post\("\/api\/admin\/payments\/complete"[\s\S]*?app\.post\("\/api\/admin\/payments\/cancel"/;
content = content.replace(oldEndpointRegex, replaceWith + '\n  app.post("/api/admin/payments/cancel"');

fs.writeFileSync('server.ts', content);
