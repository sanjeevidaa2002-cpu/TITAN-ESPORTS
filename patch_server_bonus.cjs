const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const completeRegex = /const currentDepositWallet = userData\.depositBalance \|\| 0;\s*const newDepositWallet = currentDepositWallet \+ \(txnData\.amount \|\| 0\);/;

const bonusLogic = `        const currentDepositWallet = userData.depositBalance || 0;
        const newDepositWallet = currentDepositWallet + (txnData.amount || 0);

        // -- BONUS CALCULATION START --
        let depositBonus = 0;
        let referralBonusTriggered = false;
        let referrerBonus = 0;
        let referredUserBonus = 0;
        let referrerId = null;

        const bonusRef = doc(db, 'appSettings', 'bonus');
        const bonusDoc = await t.get(bonusRef);
        const bonusSettings = bonusDoc.exists() ? bonusDoc.data() : null;

        if (bonusSettings) {
          // Deposit Bonus
          if (bonusSettings.depositBonusEnabled) {
            const minDep = bonusSettings.minimumDeposit || 0;
            const maxDep = bonusSettings.maximumDeposit || 0;
            const amt = txnData.amount || 0;

            if (amt >= minDep && (maxDep === 0 || amt <= maxDep)) {
              if (bonusSettings.depositBonusType === 'percentage') {
                let calc = (amt * (bonusSettings.depositBonusValue || 0)) / 100;
                if (bonusSettings.maximumBonus && calc > bonusSettings.maximumBonus) {
                  calc = bonusSettings.maximumBonus;
                }
                depositBonus = calc;
              } else {
                depositBonus = bonusSettings.depositBonusValue || 0;
              }
            }
          }

          // Referral Bonus
          if (bonusSettings.referralBonusEnabled && userData.referredBy && !userData.referralBonusAwarded) {
            const minRefDep = bonusSettings.minimumReferralDeposit || 0;
            if ((txnData.amount || 0) >= minRefDep) {
              // Find the referrer by referralCode
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('referralCode', '==', userData.referredBy));
              const querySnapshot = await getDocs(q); // Inside transaction, but we can't easily query inside transaction with t.get(query). Wait, in Firebase Admin Node.js, we can do t.get(query). But we imported 'firebase/firestore' which is the client SDK. Let's do it outside or just use getDocs. 
              // Using getDocs outside transaction context is fine for this lookup.
            }
          }
        }
`;

// Wait, I need to restructure the patch because I'm mixing client SDK transactions and standard async logic.
