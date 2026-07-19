const fs = require('fs');
const file = 'src/components/WalletTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state
content = content.replace(
  "const [depositStep, setDepositStep] = useState<1 | 2>(1); // 1: Select Amount, 2: Scan QR & Submit Ref",
  "const [depositStep, setDepositStep] = useState<1 | 2>(1); // 1: Select Amount, 2: Scan QR & Submit Ref\n  const [checkingStatusOrderId, setCheckingStatusOrderId] = useState<string | null>(null);"
);

// Add useEffect for polling
const pollingEffect = `
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (checkingStatusOrderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(\`/api/payments/status/\${checkingStatusOrderId}\`);
          const data = await res.json();
          if (data.success && data.status !== 'pending') {
            setCheckingStatusOrderId(null);
            setShowDepositModal(false);
            if (data.status === 'completed') {
              alert('Payment Successful! ₹' + data.amount + ' has been added to your wallet.');
            } else {
              alert('Payment Failed or Cancelled.');
            }
            refreshTransactions();
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkingStatusOrderId, refreshTransactions]);
`;

content = content.replace(
  "const handleRefresh = async () => {",
  pollingEffect + "\n  const handleRefresh = async () => {"
);

// Replace window.location.href
content = content.replace(
  "window.location.href = data.redirectUrl;",
  "window.open(data.redirectUrl, '_blank');\n          if (data.orderId) setCheckingStatusOrderId(data.orderId);"
);

fs.writeFileSync(file, content);
