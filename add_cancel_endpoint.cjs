const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const endpointCode = `
  app.post("/api/payments/status/:orderId/cancel", async (req, res) => {
    try {
      const { orderId } = req.params;
      const txnRef = doc(db, "transactions", orderId);
      const txnSnap = await getDoc(txnRef);
      if (txnSnap.exists()) {
        const txnData = txnSnap.data();
        if (txnData.status === "pending") {
          await setDoc(txnRef, {
            status: "failed",
            type: "deposit_failed",
            description: "Payment was cancelled or abandoned by the user."
          }, { merge: true });
        }
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace(
  /app\.get\("\/api\/payments\/status\/:orderId",/g,
  endpointCode + '\n  app.get("/api/payments/status/:orderId",'
);

fs.writeFileSync('server.ts', code);
