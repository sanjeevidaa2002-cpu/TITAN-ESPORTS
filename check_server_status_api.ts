import { doc, getDoc } from "firebase/firestore";
import { db } from "./src/db/firebase";

// Add this to server.ts
app.get("/api/payments/status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const txnRef = doc(db, "transactions", orderId);
    const txnSnap = await getDoc(txnRef);
    if (!txnSnap.exists()) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    const txnData = txnSnap.data();

    if (txnData.status !== "pending") {
      return res.json({ success: true, status: txnData.status, amount: txnData.amount });
    }

    // If still pending, try to check with the gateway using verifyZapUPIPaymentStatus
    if (txnData.gateway === "ZapUPI" || txnData.method === "ZapUPI") {
      let activeConfig = localAppSettings;
      try {
        const docRef = doc(db, "appSettings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          activeConfig = { ...localAppSettings, ...snap.data() };
        }
      } catch (e) {}
      
      const apiKey = activeConfig.zapupiApiKey;
      if (apiKey) {
        const verifyResult = await verifyZapUPIPaymentStatus(orderId, apiKey);
        if (verifyResult.status !== "pending") {
          const isSuccess = verifyResult.status === "completed";
          // Update transaction
          await setDoc(txnRef, {
            status: isSuccess ? "completed" : "failed",
            type: isSuccess ? "deposit_success" : "deposit_failed",
            description: isSuccess ? `Auto checked via ZapUPI API.` : `ZapUPI Payment failed.`
          }, { merge: true });

          if (isSuccess) {
            const userRef = doc(db, "users", txnData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const u = userSnap.data();
              await setDoc(userRef, { depositBalance: (u.depositBalance || 0) + Number(txnData.amount) }, { merge: true });
            }
          }
          return res.json({ success: true, status: isSuccess ? "completed" : "failed", amount: txnData.amount });
        }
      }
    }
    return res.json({ success: true, status: "pending" });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
