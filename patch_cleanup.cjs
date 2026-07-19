const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// The file has multiple status routes. Let's find all occurrences of app.get("/api/payments/status/:orderId" and remove them.
while(content.includes('app.get("/api/payments/status/:orderId"')) {
  let startIndex = content.indexOf('app.get("/api/payments/status/:orderId"');
  let endIndex = content.indexOf('});', startIndex);
  // Need to find the correct ending of the route. Usually ends with '});\n' and then some comment or route.
  let substring = content.substring(startIndex, endIndex + 3);
  // It might be longer because of try/catch. Let's use a regex or just replace the specific string blocks we inserted.
  content = content.substring(0, startIndex) + content.substring(content.indexOf('});', content.indexOf('catch (error', startIndex)) + 3);
}

// Now insert the right one before VITE
const correctRoute = `
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
            await processTransactionSafe(orderId, isSuccess, "ZapUPI", txnData.amount);
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
`;

content = content.replace('  if (process.env.NODE_ENV !== "production") {', correctRoute + '\n  if (process.env.NODE_ENV !== "production") {');
fs.writeFileSync(file, content);
